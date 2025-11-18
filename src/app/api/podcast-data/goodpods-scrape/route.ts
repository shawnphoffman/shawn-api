import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

import { KvPrefix } from '@/utils/kv'

import type { GoodpodsAward, Podcast } from './goodpodsData'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodGoodpods}:${url}`
	try {
		const cachedResponse = (await kv.get(kvUrl)) as string | null
		if (cachedResponse) {
			console.log('cachedResponse', cachedResponse)
			// @ts-expect-error xxx
			return NextResponse.json({ ...cachedResponse, url, cached: true })
		}
	} catch (error) {
		console.error('Error getting cached response', error)
	}

	const browser = await puppeteer.connect({
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

		// const collectedResponses: any[] = []

		// Track challenge redirects to detect loops
		let challengeRedirectCount = 0
		const maxChallengeRedirects = 3
		let directApiAttempted = false

		// Set up response listener BEFORE navigation to catch API calls
		const responsePromise = new Promise((resolve, reject) => {
			let resolved = false
			const timeout = setTimeout(() => {
				if (!resolved) {
					resolved = true
					reject(new Error('Timeout waiting for API response - Cloudflare challenge may be blocking'))
				}
			}, 120000) // 120 second timeout (increased for Cloudflare challenges)

			page.on('response', async response => {
				if (resolved) return
				const respUrl = response.url()
				console.log('response.url()', respUrl)

				// Track challenge redirects
				if (respUrl.includes('challenge-platform') || respUrl.includes('challenges.cloudflare.com')) {
					challengeRedirectCount++
					console.log(`Challenge redirect detected (${challengeRedirectCount}/${maxChallengeRedirects})`)

					// If we're stuck in a loop, try direct API call (only once)
					if (challengeRedirectCount >= maxChallengeRedirects && !directApiAttempted) {
						directApiAttempted = true
						console.log('Detected challenge loop, attempting direct API call with browser cookies...')

						// Extract podcast ID from URL
						const podcastIdMatch = url.match(/-(\d+)$/)
						if (podcastIdMatch && podcastIdMatch[1]) {
							const podcastId = podcastIdMatch[1]
							try {
								// Get cookies from the browser session
								const cookies = await page.cookies()
								const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')

								const directApiUrl = `https://v2.goodpods.com/podcast/details?podcastId=${podcastId}`
								console.log(`Attempting direct API call: ${directApiUrl}`)

								const apiResponse = await fetch(directApiUrl, {
									headers: {
										'User-Agent':
											'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
										Accept: 'application/json',
										'Accept-Language': 'en-US,en;q=0.9',
										'Accept-Encoding': 'gzip, deflate, br',
										Referer: url,
										Origin: 'https://goodpods.com',
										Cookie: cookieString,
										'Sec-Fetch-Dest': 'empty',
										'Sec-Fetch-Mode': 'cors',
										'Sec-Fetch-Site': 'same-site',
									},
								})

								if (apiResponse.ok) {
									const respJson = await apiResponse.json()
									console.log('✅ Direct API call succeeded', respJson)
									if (!resolved) {
										resolved = true
										clearTimeout(timeout)
										resolve(respJson)
										return
									}
								} else {
									const errorText = await apiResponse.text().catch(() => '')
									console.log(`Direct API call failed with status: ${apiResponse.status}`, errorText.substring(0, 200))
								}
							} catch (directApiError) {
								console.error('Direct API call error:', directApiError)
							}
						}
					}
				}

				const method = response.request().method().toUpperCase()
				const isOptions = method === 'OPTIONS'
				if (!isOptions && respUrl?.startsWith('https://v2.goodpods.com/podcast/details')) {
					try {
						const respJson = await response?.json()
						console.log('✅', respJson)
						if (!resolved) {
							resolved = true
							clearTimeout(timeout)
							resolve(respJson)
						}
					} catch (error) {
						console.error('Error parsing response JSON:', error)
						// Don't reject here, keep waiting for another response
					}
				}
			})
		})

		// Don't block resources - PerimeterX needs them for fingerprinting
		// Only block non-essential resources to speed things up
		page.setRequestInterception(true)

		page.on('request', request => {
			const url = request.url()
			console.log('request.url()', url)
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
				// Wait for Cloudflare challenge elements to disappear (including Turnstile)
				page.waitForFunction(
					() => {
						const cfChallenge = document.querySelector(
							'#challenge-form, .cf-browser-verification, #cf-wrapper, iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]'
						)
						const isCloudflare =
							document.title.includes('Just a moment') ||
							document.title.includes('Checking your browser') ||
							document.title.includes('Please wait')
						const challengeVisible = cfChallenge ? (cfChallenge as HTMLElement).offsetParent !== null : false
						// Also check if Turnstile widget is present
						const turnstileWidget = document.querySelector('[data-sitekey], .cf-turnstile')
						return !isCloudflare && (!cfChallenge || !challengeVisible) && !turnstileWidget
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

		// Wait for page to be fully loaded to ensure API calls can be made
		try {
			await Promise.race([
				page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }),
				new Promise(resolve => setTimeout(resolve, 5000)), // Fallback timeout
			])
			// Additional wait for any delayed JavaScript execution
			await new Promise(resolve => setTimeout(resolve, 2000))
		} catch (error) {
			// Continue if wait fails
			console.log('Page load wait completed or timed out')
		}

		// Simulate more realistic human-like behavior
		try {
			// Move mouse around
			await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500))
			await new Promise(resolve => setTimeout(resolve, 100 + Math.floor(Math.random() * 200)))

			// Scroll a bit - this might trigger lazy-loaded API calls
			await page.evaluate(() => {
				window.scrollTo(0, Math.floor(Math.random() * 500))
			})
			await new Promise(resolve => setTimeout(resolve, 200 + Math.floor(Math.random() * 300)))

			// Scroll more to trigger any scroll-based API calls
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight / 2)
			})
			await new Promise(resolve => setTimeout(resolve, 500))

			// Move mouse again
			await page.mouse.move(Math.floor(Math.random() * 500) + 500, Math.floor(Math.random() * 500) + 500)
			await new Promise(resolve => setTimeout(resolve, 1000 + Math.floor(Math.random() * 200)))
		} catch (error) {
			// Ignore interaction errors
		}

		// Wait for the API response (listener was set up before navigation)
		let podData
		try {
			podData = await responsePromise
		} catch (error) {
			console.error('Failed to get API response:', error)
			throw new Error('Unable to fetch podcast data - Cloudflare challenge may be blocking the request')
		}

		const vals: Podcast = JSON.parse(JSON.stringify(podData))

		console.log('vals', vals)

		const review_average = vals?.review_average
		const total_reviews = vals?.total_reviews

		const awards: Array<GoodpodsAward> = vals?.leaderboard_info_list.map(leaderboard => {
			const award = {
				imageHeight: 77,
				imageWidth: 250,
				category: leaderboard.category_tag,
			} as GoodpodsAward

			if (leaderboard.period_type === 'alltime') {
				award.frequency = 'All-Time'
			} else if (leaderboard.period_type === 'month') {
				award.frequency = 'Monthly'
			} else {
				award.frequency = 'Weekly'
			}

			let slug = ''
			if (leaderboard.url_slug.includes('/')) {
				slug = leaderboard.url_slug
			} else {
				slug = `${leaderboard.url_slug}/all-${leaderboard.url_slug}`
			}

			award.linkUrl = `https://goodpods.com/leaderboard/top-100-shows-by-category/${slug}?indie=${leaderboard.indie_only}&period=${leaderboard.period_type}#${leaderboard.leaderboard_id}`

			let position = 100
			if (leaderboard.current_position === 1) {
				position = 1
			} else if (leaderboard.current_position === 2) {
				position = 2
			} else if (leaderboard.current_position === 3) {
				position = 3
			} else if (leaderboard.current_position <= 5) {
				position = 5
			} else if (leaderboard.current_position <= 10) {
				position = 10
				// } else if (leaderboard.current_position <= 20) {
				// 	position = 20
			} else if (leaderboard.current_position <= 50) {
				position = 50
			}

			let period = ''
			if (leaderboard.period_type === 'month') {
				period = '_month'
			} else if (leaderboard.period_type === 'week') {
				period = '_week'
			}

			award.imageUrl = `https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/${slug.replace(
				'/',
				'_'
			)}_top${position}${period}.png`

			return award
		})

		if (awards.length > 0) {
			kv.set(
				kvUrl,
				JSON.stringify({
					awards,
					review_average,
					total_reviews,
				}),
				{
					ex: 60 * 60 * 24 * 3,
				}
			)
		}

		return NextResponse.json({ awards, url, review_average, total_reviews })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}

/**
"leaderboard_info_list": [
{
"leaderboard_id": 47389848,
"category_tag": "animation & manga",
"period_type": "month",
"indie_only": true,
"current_position": 1,
"last_position": 2,
"episode_id": null,
"podcast_id": 277737,
"user_id": null,
"user_leaderboard_type": null,
"url_slug": "leisure/animation-and-manga",
"keyword_slug": "animation-and-manga"
},
 */
