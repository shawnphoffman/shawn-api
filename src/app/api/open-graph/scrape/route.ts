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
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&stealth=true&headless=true`,
	})
	try {
		const page = await browser.newPage()

		page.setRequestInterception(true)

		page.on('request', request => {
			if (['stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
				// request.abort();
				request.respond({ status: 200, body: 'aborted' })
			} else {
				request.continue()
			}
		})

		await page.goto(url, { waitUntil: 'networkidle0' })

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
