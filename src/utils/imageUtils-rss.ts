import sharp from 'sharp'

// import FeedItem from '../rss-feed-emitter/FeedItem'

const REGEX_YOUTUBE = /hqdefault|sddefault/i
const POST_IMG_MAX = {
	// width: 600,
	width: 1200,
	// height: 320,
	height: 640,
	size: 1000000,
}

// export const getItemImage = (item: Partial<FeedItem>) => {
export const getItemImage = (item: any) => {
	let imageUrl: string | undefined
	if (item?.image?.url) {
		imageUrl = item.image.url?.replace(REGEX_YOUTUBE, 'maxresdefault')
	} else {
		try {
			imageUrl = item['media:content']['@']?.url
		} catch {
			try {
				imageUrl = item?.meta?.image?.url
			} catch {
				/* empty */
			}
		}
	}

	return imageUrl
}

export const fetchRemoteImageBuffer = async imgUrl => {
	// FETCH
	const options = {
		method: 'GET',
	}
	const fimg = await fetch(imgUrl, options)
	const fimgb = await fimg.arrayBuffer()

	// SHARP RESIZE
	const resized = await sharp(fimgb)
		.resize(POST_IMG_MAX.width, POST_IMG_MAX.height, {
			fit: sharp.fit.inside,
			withoutEnlargement: true,
		})
		.toBuffer()

	// COMPOSITE BLURRY BOI
	let composite = await sharp(fimgb)
		.resize(POST_IMG_MAX.width, POST_IMG_MAX.height)
		.modulate({ brightness: 0.5 })
		.blur(10)
		.composite([{ input: resized }])
		// .webp({ quality: 95, nearLossless: true })
		// .png({ quality: 90 })
		.jpeg({
			quality: 90,
		})
		.toBuffer()

	let bytes = Buffer.byteLength(composite)
	console.log('outsize', bytes / 1000, 'kb')
	if (bytes > POST_IMG_MAX.size) {
		composite = await sharp(composite).jpeg({ quality: 60 }).toBuffer()
		bytes = Buffer.byteLength(composite)
		console.log('outsize.2', bytes / 1000, 'kb')
	}

	return composite
}

// export const getOgImageUrl = async (url: string) => {
// 	try {
// 		const options = {
// 			method: 'GET',
// 		}
// 		const resp = await fetch(`https://api.shawn.party/api/bsky/get-image?scrape=${url}`, options)
// 		const json = await resp.json()
// 		return json?.imageUrl || ''
// 	} catch (error) {
// 		console.error('❌ getOgImageUrl', error)
// 		return ''
// 	}
// }
