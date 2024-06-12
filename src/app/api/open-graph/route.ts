import * as cheerio from 'cheerio'
import { AxiomRequest, withAxiom } from 'next-axiom'

const temp = 'https://scruffypodcasters.podbean.com/e/ep-250-3-quid-each/'

const readMT = (el: any, name: string) => {
	var prop = el.attr('name') || el.attr('property')
	return prop == name ? el.attr('content') : null
}

export const GET = withAxiom(async (req: AxiomRequest) => {
	const { searchParams } = new URL(req.url)
	const scrape = searchParams.get('scrape')
	// const scrape = temp

	if (!scrape) {
		return Response.json({ message: 'No URL provided' }, { status: 400 })
	}

	try {
		// const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 15 })
		const res = await fetch(scrape, {
			method: 'GET',
			next: { revalidate: 300 },
		})
		const data = await res.text()

		const $ = cheerio.load(data)

		// const pageTitle = $('h1').text().trim()
		// log.info(`TITLE: ${pageTitle}`)

		const og: any = {},
			meta: any = {},
			images: any[] = []

		const title = $('title')
		if (title) meta.title = title.text().trim()

		const canonical = $('link[rel=canonical]')
		if (canonical) {
			meta.url = canonical.attr('href')
		}

		const metas = $('meta')

		for (let i = 0; i < metas.length; i++) {
			const el = metas[i]
			// const prop = $(el).attr('property') || $(el).attr('name')
			// console.log({ prop })

			;['title', 'description', 'image'].forEach(s => {
				const val = readMT($(el), s)
				if (val) meta[s] = val
			})
			;['og:title', 'og:description', 'og:image', 'og:url', 'og:site_name', 'og:type'].forEach(s => {
				const val = readMT($(el), s)
				if (val) og[s.split(':')[1]] = val
			})
		}

		$('img').each((_i, el) => {
			let src = $(el).attr('src')
			if (src) {
				src = new URL(src, scrape).href
				const width = parseInt($(el).attr('width') || '') || undefined
				const height = parseInt($(el).attr('height') || '') || undefined
				images.push({ src, width, height })
			}
		})

		return Response.json({ meta, og, images })
	} catch (error) {
		console.error(error)
		return Response.json({ error }, { status: 500 })
	}
})
