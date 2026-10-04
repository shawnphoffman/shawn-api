import puppeteer, { Browser, Page } from 'puppeteer'

import { applyStealth } from './stealth'

export type ScrapeResult = {
	title?: string
	description?: string
	price?: string
	currency?: string
	imageUrls: string[]
	siteName?: string
	finalUrl?: string
}

export type ScrapeErrorCode = 'invalid_url' | 'browser_unavailable' | 'timeout' | 'navigation_failed' | 'bot_block' | 'no_content'

export class ScrapeError extends Error {
	readonly code: ScrapeErrorCode
	readonly status: number
	constructor(code: ScrapeErrorCode, status: number, message: string) {
		super(message)
		this.name = 'ScrapeError'
		this.code = code
		this.status = status
	}
}

const CONNECT_TIMEOUT_MS = 10_000
const GOTO_TIMEOUT_MS = 20_000
const CHALLENGE_WAIT_MS = 8_000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Some sites (Akamai, PerimeterX) reload the page once after their check,
// which kills an in-flight evaluate. Retry once the new document settles.
async function evaluateStable<T>(page: Page, fn: () => T): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return (await page.evaluate(fn)) as T
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			if (attempt >= 2 || !/context was destroyed|Cannot find context|detached/i.test(message)) throw error
			await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {})
		}
	}
}

// The browser runs on the home network, so refuse anything that is not a
// public http(s) URL. Literal checks only: the browser does its own DNS.
export function assertPublicUrl(raw: string): URL {
	let parsed: URL
	try {
		parsed = new URL(raw)
	} catch {
		throw new ScrapeError('invalid_url', 400, 'url is not a valid URL')
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new ScrapeError('invalid_url', 400, 'url must be http or https')
	}
	const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
	const isPrivateName = host === 'localhost' || !host.includes('.') || /\.(local|lan|internal|home|localhost)$/.test(host)
	const isPrivateV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(host)
	const isV6 = host.includes(':')
	if (isPrivateName || isPrivateV4 || isV6) {
		throw new ScrapeError('invalid_url', 400, 'url must be a public host')
	}
	return parsed
}

async function connect(): Promise<Browser> {
	if (!process.env.PUPPETEER_WSS) {
		throw new ScrapeError('browser_unavailable', 503, 'PUPPETEER_WSS is not configured')
	}
	const pending = puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&headless=false`,
	})
	let timer: NodeJS.Timeout | undefined
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new ScrapeError('browser_unavailable', 503, `browser connect timed out after ${CONNECT_TIMEOUT_MS}ms`)),
			CONNECT_TIMEOUT_MS
		)
	})
	try {
		return await Promise.race([pending, timeout])
	} catch (error) {
		// If the connect lands after we gave up, do not leak the session.
		pending.then(browser => browser.close()).catch(() => {})
		if (error instanceof ScrapeError) throw error
		throw new ScrapeError('browser_unavailable', 503, `browser connect failed: ${error instanceof Error ? error.message : String(error)}`)
	} finally {
		clearTimeout(timer)
	}
}

// Serialized into the page. Returns the reason the page looks like a bot
// challenge or block page, or null when it looks like real content.
function detectBlock(): string | null {
	const title = (document.title || '').trim()
	const blockedTitles = [
		'Access Denied',
		'Access to this page has been denied',
		'Just a moment',
		'Checking your browser',
		'Attention Required',
		'Robot Check',
		'Robot or human',
		'Pardon Our Interruption',
		'Are you a human',
		'px-captcha',
	]
	const hit = blockedTitles.find(t => title.toLowerCase().includes(t.toLowerCase()))
	if (hit) return `title "${title}"`
	if (document.querySelector('#px-captcha, .px-captcha, [data-px-captcha]')) return 'PerimeterX captcha'
	if (document.querySelector('form[action*="validateCaptcha"]')) return 'Amazon captcha'
	const cf = document.querySelector('#challenge-form, .cf-browser-verification, #cf-wrapper') as HTMLElement | null
	if (cf && cf.offsetParent !== null) return 'Cloudflare challenge'
	return null
}

// Serialized into the page.
function extract(): ScrapeResult {
	const clean = (value: string | null | undefined) => {
		const trimmed = (value || '').replace(/\s+/g, ' ').trim()
		return trimmed || undefined
	}
	const meta = (...keys: string[]) => {
		for (const key of keys) {
			const el = document.querySelector(`meta[property="${key}"], meta[name="${key}"], meta[itemprop="${key}"]`)
			const content = clean(el?.getAttribute('content'))
			if (content) return content
		}
		return undefined
	}

	// JSON-LD Product, if the page has one.
	let product: any
	const visit = (node: any) => {
		if (!node || typeof node !== 'object' || product) return
		if (Array.isArray(node)) return node.forEach(visit)
		const type = node['@type']
		if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
			product = node
			return
		}
		if (node['@graph']) visit(node['@graph'])
	}
	document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
		try {
			visit(JSON.parse(script.textContent || ''))
		} catch {
			// Malformed JSON-LD is common; skip it.
		}
	})
	const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers
	const ldPrice = offer?.price ?? offer?.lowPrice ?? offer?.priceSpecification?.price
	const ldCurrency = offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency

	const itempropPrice = document.querySelector('[itemprop="price"]')
	const price =
		meta('og:price:amount', 'product:price:amount', 'product:sale_price:amount') ||
		clean(ldPrice != null ? String(ldPrice) : undefined) ||
		clean(itempropPrice?.getAttribute('content') || itempropPrice?.textContent)
	const currency =
		meta('og:price:currency', 'product:price:currency', 'product:sale_price:currency', 'priceCurrency') ||
		clean(typeof ldCurrency === 'string' ? ldCurrency : undefined)

	const imageUrls: string[] = []
	const addImage = (raw: unknown) => {
		if (typeof raw !== 'string' || !raw.trim() || raw.startsWith('data:')) return
		try {
			const abs = new URL(raw.trim(), window.location.href)
			if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return
			if (!imageUrls.includes(abs.href)) imageUrls.push(abs.href)
		} catch {
			// Not a usable URL.
		}
	}
	document
		.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]')
		.forEach(el => addImage(el.getAttribute('content')))
	const ldImages = Array.isArray(product?.image) ? product.image : [product?.image]
	ldImages.forEach((image: any) => addImage(typeof image === 'string' ? image : image?.url))
	// Page images, largest first, so product shots beat sprites and pixels.
	const pageImages: { src: string; area: number }[] = []
	document.querySelectorAll('img').forEach(img => {
		const src = img.currentSrc || img.getAttribute('src') || ''
		const lower = src.toLowerCase()
		if (['.svg', '.gif', 'beacon', 'sprite', 'uedata', 'pixel'].some(skip => lower.includes(skip))) return
		if (img.naturalWidth && (img.naturalWidth < 100 || img.naturalHeight < 100)) return
		pageImages.push({ src, area: img.naturalWidth * img.naturalHeight })
	})
	pageImages.sort((a, b) => b.area - a.area).forEach(image => addImage(image.src))

	return {
		title: meta('og:title', 'twitter:title') || clean(product?.name) || clean(document.title) || meta('title'),
		description: meta('og:description', 'description', 'twitter:description') || clean(product?.description),
		price,
		currency,
		imageUrls: imageUrls.slice(0, 25),
		siteName: meta('og:site_name', 'application-name'),
		finalUrl: window.location.href,
	}
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
	const target = assertPublicUrl(url)
	const browser = await connect()
	try {
		const page = await browser.newPage()

		await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
		await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
		await page.evaluateOnNewDocument(applyStealth)

		// Skip stylesheets and fonts to speed things up. Everything else loads,
		// since bot-protection scripts need their own resources.
		await page.setRequestInterception(true)
		page.on('request', request => {
			const requestUrl = request.url()
			const isSecurity = ['px-captcha', 'perimeterx', 'security', 'captcha'].some(s => requestUrl.includes(s))
			if (!isSecurity && ['stylesheet', 'font'].includes(request.resourceType())) {
				request.respond({ status: 200, body: '' }).catch(() => {})
			} else {
				request.continue().catch(() => {})
			}
		})

		let status: number | undefined
		try {
			const response = await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT_MS })
			status = response?.status()
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			if (/timeout/i.test(message)) throw new ScrapeError('timeout', 504, `navigation timed out after ${GOTO_TIMEOUT_MS}ms`)
			throw new ScrapeError('navigation_failed', 502, message)
		}

		// Give a JS challenge (Cloudflare, PerimeterX) a short window to clear.
		// Real pages pass this immediately.
		await page.waitForFunction(`(${detectBlock.toString()})() === null`, { timeout: CHALLENGE_WAIT_MS }).catch(() => {})

		// A little human-looking activity, which also lets late meta tags land.
		try {
			await page.mouse.move(100 + Math.floor(Math.random() * 400), 100 + Math.floor(Math.random() * 400))
			await page.evaluate(() => window.scrollTo(0, Math.floor(Math.random() * 500)))
			await sleep(500 + Math.floor(Math.random() * 500))
		} catch {
			// Ignore interaction errors
		}

		const blockReason = await evaluateStable(page, detectBlock)
		if (blockReason) {
			throw new ScrapeError('bot_block', 502, `blocked by the site (${blockReason})`)
		}
		if (status === 403 || status === 429) {
			throw new ScrapeError('bot_block', 502, `blocked by the site (HTTP ${status})`)
		}
		if (status && status >= 400) {
			throw new ScrapeError('navigation_failed', 502, `site returned HTTP ${status}`)
		}

		const result = await evaluateStable(page, extract)
		if (!result.title) {
			throw new ScrapeError('no_content', 502, 'page had no title')
		}
		// JSON round trip drops undefined keys.
		return JSON.parse(JSON.stringify(result))
	} finally {
		await browser.close().catch(() => {})
	}
}
