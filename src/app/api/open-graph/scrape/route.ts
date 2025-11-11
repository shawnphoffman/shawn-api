import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

import { KvPrefix } from '@/utils/kv'

// TODO - Cache the response in case it fucks up

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.Scrape}:${url}`

	const cachedResponse = (await kv.get(kvUrl)) as string | null
	if (cachedResponse) {
		console.log('cachedResponse', cachedResponse)
		return NextResponse.json({ ...(cachedResponse as any), cached: true })
	}

	const browser = await puppeteer.connect({
		// browserWSEndpoint: `${process.env.PUPPETEER_WSS}&stealth=true&headless=false`,
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&headless=false`,
	})
	try {
		const page = await browser.newPage()

		// Set realistic viewport
		await page.setViewport({
			width: 1920,
			height: 1080,
			deviceScaleFactor: 1,
		})

		// Set realistic user agent and headers to appear more like a real browser
		// Using setExtraHTTPHeaders instead of deprecated setUserAgent
		await page.setExtraHTTPHeaders({
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			Connection: 'keep-alive',
			'Upgrade-Insecure-Requests': '1',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'none',
			'Sec-Fetch-User': '?1',
			'Cache-Control': 'max-age=0',
		})

		// Comprehensive anti-detection for PerimeterX and other bot protection
		await page.evaluateOnNewDocument(() => {
			// Remove webdriver flag (critical for PerimeterX)
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false,
			})

			// Override languages
			Object.defineProperty(navigator, 'languages', {
				get: () => ['en-US', 'en'],
			})

			// Override chrome runtime (common detection point)
			// @ts-ignore
			window.chrome = {
				runtime: {},
				loadTimes: function () {},
				csi: function () {},
				app: {},
			}

			// Override permissions
			const originalQuery = window.navigator.permissions.query
			window.navigator.permissions.query = parameters =>
				parameters.name === 'notifications'
					? Promise.resolve({ state: Notification.permission } as PermissionStatus)
					: originalQuery(parameters)

			// Override platform to appear more realistic
			Object.defineProperty(navigator, 'platform', {
				get: () => 'MacIntel',
			})

			// Override hardwareConcurrency (common fingerprinting)
			Object.defineProperty(navigator, 'hardwareConcurrency', {
				get: () => 8,
			})

			// Override deviceMemory
			Object.defineProperty(navigator, 'deviceMemory', {
				get: () => 8,
			})

			// Override maxTouchPoints (mobile detection)
			Object.defineProperty(navigator, 'maxTouchPoints', {
				get: () => 0,
			})

			// Override plugins to appear realistic
			Object.defineProperty(navigator, 'plugins', {
				get: () => {
					return [
						{
							0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
							description: 'Portable Document Format',
							filename: 'internal-pdf-viewer',
							length: 1,
							name: 'Chrome PDF Plugin',
						},
						{
							0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
							description: '',
							filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
							length: 1,
							name: 'Chrome PDF Viewer',
						},
						{
							0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
							1: { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
							description: '',
							filename: 'internal-nacl-plugin',
							length: 2,
							name: 'Native Client',
						},
					] as any
				},
			})

			// Override mimeTypes
			Object.defineProperty(navigator, 'mimeTypes', {
				get: () => {
					return [
						{
							type: 'application/pdf',
							suffixes: 'pdf',
							description: 'Portable Document Format',
							enabledPlugin: {},
						},
						{
							type: 'application/x-google-chrome-pdf',
							suffixes: 'pdf',
							description: 'Portable Document Format',
							enabledPlugin: {},
						},
					] as any
				},
			})

			// Canvas fingerprinting protection - add noise to canvas
			const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
			HTMLCanvasElement.prototype.toDataURL = function (type) {
				const context = this.getContext('2d')
				if (context) {
					const imageData = context.getImageData(0, 0, this.width, this.height)
					for (let i = 0; i < imageData.data.length; i += 4) {
						imageData.data[i] += Math.floor(Math.random() * 10) - 5
					}
					context.putImageData(imageData, 0, 0)
				}
				return originalToDataURL.apply(this, arguments as any)
			}

			// WebGL fingerprinting protection
			const getParameter = WebGLRenderingContext.prototype.getParameter
			WebGLRenderingContext.prototype.getParameter = function (parameter) {
				if (parameter === 37445) {
					return 'Intel Inc.'
				}
				if (parameter === 37446) {
					return 'Intel Iris OpenGL Engine'
				}
				return getParameter.apply(this, arguments as any)
			}

			// Override getBattery if it exists
			// @ts-ignore
			if (navigator.getBattery) {
				// @ts-ignore
				Object.defineProperty(navigator, 'getBattery', {
					get: () => {
						return () =>
							Promise.resolve({
								charging: true,
								chargingTime: 0,
								dischargingTime: Infinity,
								level: 1,
							})
					},
				})
			}

			// Override connection if it exists
			// @ts-ignore
			if (navigator.connection) {
				// @ts-ignore
				Object.defineProperty(navigator, 'connection', {
					get: () => ({
						effectiveType: '4g',
						rtt: 50,
						downlink: 10,
						saveData: false,
					}),
				})
			}

			// Override vendor
			Object.defineProperty(navigator, 'vendor', {
				get: () => 'Google Inc.',
			})

			// Override appVersion
			Object.defineProperty(navigator, 'appVersion', {
				get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			})
		})

		// Don't block resources - PerimeterX needs them for fingerprinting
		// Only block non-essential resources to speed things up
		page.setRequestInterception(true)

		page.on('request', request => {
			const url = request.url()
			// Don't block PerimeterX or security scripts
			if (url.includes('px-captcha') || url.includes('perimeterx') || url.includes('security') || url.includes('captcha')) {
				request.continue()
			} else if (['stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
				// Block stylesheets and fonts to speed up, but allow everything else
				request.respond({ status: 200, body: 'aborted' })
			} else {
				request.continue()
			}
		})

		// Use 'domcontentloaded' instead of 'networkidle0' - less bot-like
		// Add timeout to prevent hanging (increased for PerimeterX/Cloudflare challenges)
		await page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: 90000, // Increased timeout for PerimeterX
		})

		// Wait for PerimeterX/Cloudflare challenges to complete
		try {
			// Wait for either challenge to complete or page to load
			await Promise.race([
				// Wait for PerimeterX challenge to complete
				page.waitForFunction(
					() => {
						const title = document.querySelector('title')
						const titleText = title?.textContent || ''
						// Check if we're past PerimeterX challenge
						const isPerimeterX = titleText.includes('Access to this page has been denied') || titleText.includes('px-captcha')
						const pxChallenge = document.querySelector('#px-captcha, .px-captcha, [data-px-captcha]')
						return !isPerimeterX && !pxChallenge
					},
					{ timeout: 45000 }
				),
				// Wait for Cloudflare challenge elements to disappear
				page.waitForFunction(
					() => {
						const cfChallenge = document.querySelector('#challenge-form, .cf-browser-verification, #cf-wrapper')
						const isCloudflare = document.title.includes('Just a moment') || document.title.includes('Checking your browser')
						const challengeVisible = cfChallenge ? (cfChallenge as HTMLElement).offsetParent !== null : false
						return !isCloudflare && (!cfChallenge || !challengeVisible)
					},
					{ timeout: 45000 }
				),
				// Or wait for actual content to appear (title tag with content)
				page.waitForFunction(
					() => {
						const title = document.querySelector('title')
						const titleText = title?.textContent || ''
						return (
							titleText &&
							!titleText.includes('Just a moment') &&
							!titleText.includes('Checking') &&
							!titleText.includes('Access to this page has been denied') &&
							!titleText.includes('px-captcha')
						)
					},
					{ timeout: 45000 }
				),
			])
		} catch (error) {
			// If waiting fails, continue anyway - might not be a challenge page
			console.log('Challenge wait timeout or not applicable:', error)
		}

		// Add a longer delay for PerimeterX to complete its checks
		await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000))

		// Simulate more realistic human-like behavior
		try {
			// Move mouse around
			await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500))
			await new Promise(resolve => setTimeout(resolve, 100 + Math.floor(Math.random() * 200)))

			// Scroll a bit
			await page.evaluate(() => {
				window.scrollTo(0, Math.floor(Math.random() * 500))
			})
			await new Promise(resolve => setTimeout(resolve, 200 + Math.floor(Math.random() * 300)))

			// Move mouse again
			await page.mouse.move(Math.floor(Math.random() * 500) + 500, Math.floor(Math.random() * 500) + 500)
			await new Promise(resolve => setTimeout(resolve, 1000 + Math.floor(Math.random() * 200)))
		} catch (error) {
			// Ignore interaction errors
		}

		const metaData = await page.evaluate(() => {
			const data: { meta: Record<string, string>; og: Record<string, string>; images: { src: string }[] } = {
				meta: {},
				og: {},
				images: [],
			}

			// Function to add meta tag to the result object
			function addMetaTag(type, key, content) {
				if (content) {
					data[type][key] = content
				}
			}

			// Get all meta tags
			const metas = document.querySelectorAll('meta')

			metas.forEach(meta => {
				const name = meta.getAttribute('name')
				const property = meta.getAttribute('property')
				const content = meta.getAttribute('content')

				// Standard meta tags
				if (name) {
					if (name === 'description' || name === 'title') {
						addMetaTag('meta', name, content)
					}
					if (name?.startsWith('twitter:')) {
						addMetaTag('meta', name, content) // Assuming Twitter tags under 'meta'
					}
				}

				// Open Graph meta tags (og:*)
				if (property && property?.startsWith('og:')) {
					addMetaTag('og', property, content)
				}
			})

			// Add URL and title if available
			const title = document.querySelector('title')?.innerText
			if (title) {
				data.meta.title = title
			}
			data.meta.url = window.location.href

			// Collect all image sources
			const images = document.querySelectorAll('img')
			images.forEach(img => {
				const src = img.getAttribute('src')
				if (src) {
					if (src?.startsWith('data:') || src.includes('.svg') || src.includes('.gif') || src.includes('beacon')) {
						return
					}
					data.images.push({ src })
				}
			})

			return data
		})

		const daFuq = JSON.parse(JSON.stringify(metaData))

		if (daFuq.meta.title) {
			kv.set(kvUrl, JSON.stringify(daFuq), {
				ex: 60 * 10,
			})
		}

		return NextResponse.json(daFuq)
		// return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}
