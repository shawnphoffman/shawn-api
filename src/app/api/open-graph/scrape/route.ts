import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const launchArgs = JSON.stringify({ stealth: true })
	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&launch=${launchArgs}`,
	})
	try {
		const page = await browser.newPage()
		await page.goto(url, { waitUntil: 'domcontentloaded' })

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
					if (name.startsWith('twitter:')) {
						addMetaTag('meta', name, content) // Assuming Twitter tags under 'meta'
					}
				}

				// Open Graph meta tags (og:*)
				if (property && property.startsWith('og:')) {
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
					data.images.push({ src })
				}
			})

			return data
		})

		return NextResponse.json(metaData)
		// return NextResponse.json({ ...response, url })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}