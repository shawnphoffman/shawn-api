import * as cheerio from 'cheerio'
import { log } from 'next-axiom'
import sharp from 'sharp'

// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'

const POST_IMG_MAX = {
	width: 600,
	height: 320,
	size: 1000000,
}

export const fetchRemoteImageBuffer = async imgUrl => {
	// FETCH
	const options = {
		method: 'GET',
	}
	const fimg = await fetch(imgUrl, options)
	const fimgb = await fimg.arrayBuffer()

	// SHARP RESIZE
	// @ts-expect-error TODO
	const resized = await new sharp(fimgb)
		.resize(POST_IMG_MAX.width, POST_IMG_MAX.height, {
			fit: sharp.fit.inside,
			withoutEnlargement: true,
		})
		.toBuffer()

	// COMPOSITE BLURRY BOI
	// @ts-expect-error TODO
	return await new sharp(fimgb)
		.resize(POST_IMG_MAX.width, POST_IMG_MAX.height)
		.modulate({ brightness: 0.5 })
		.blur(10)
		.composite([{ input: resized }])
		.jpeg({
			quality: 80,
		})
		.toBuffer()
}

const getCleanUrl = url => {
	const lastDotIndex = url.lastIndexOf('.')
	const nextSlashIndex = url.indexOf('/', lastDotIndex)
	if (lastDotIndex !== -1 && nextSlashIndex !== -1) {
		return url.substring(0, nextSlashIndex)
	}
	return url
}

export const getContentType = filename => {
	const suffix = filename.split('.').pop().toLowerCase()
	let mimetype = 'application/octet-stream'
	if (['png'].includes(suffix)) {
		mimetype = 'image/png'
	} else if (['jpeg', 'jpg'].includes(suffix)) {
		mimetype = 'image/jpeg'
	} else if (['webp'].includes(suffix)) {
		mimetype = 'image/webp'
	}
	return mimetype
}

export const getOgImageUrl = async url => {
	// const data = await fetchHtmlWithCache({ url, options, cacheMinutes: 15 })
	const res = await fetch(url, {
		method: 'GET',
		next: { revalidate: 600 },
	})
	const data = await res.text()

	const $ = cheerio.load(data)

	// const pageTitle = $('h1').text().trim()
	// log.info(`TITLE: ${pageTitle}`)

	let imageUrl = $('meta[property="og:image"]').attr('content')

	// Welp. Try to grab ANY image at this point
	if (!imageUrl) {
		log.info('NO OG IMAGE')
		// Find all image tags
		const images = $('img')
		let largestSize = 0

		// Iterate over each image tag
		images.each((index, element) => {
			// LOL for now just use the one with the longest src
			const src = $(element).attr('src')

			if (!src || src.includes('missing/episode') || src.includes('.svg')) {
				return
			}

			const length = src.length

			// const width = parseInt($(element).attr('width')) || 0
			// const height = parseInt($(element).attr('height')) || 0
			// const size = width * height

			log.info(`IMAGE: ${$(element).attr('src')} - ${length}`)
			// Check if current image is larger than the largest found so far
			if (length > largestSize) {
				largestSize = length
				imageUrl = src
			}
		})
	}

	if (imageUrl) {
		imageUrl = getCleanUrl(imageUrl)

		if (!imageUrl) return null

		if (!imageUrl?.startsWith('http')) {
			const baseUrl = new URL(url)
			imageUrl = new URL(imageUrl, baseUrl).href
		}
	}
	return imageUrl
}
