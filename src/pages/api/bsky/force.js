import { postBleetToBsky } from '@/third-party/bluesky/bluesky'
// import { getOgImageUrl } from '@/components/bluesky/imageUtils'

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.status(405).send({ message: 'Only POST requests allowed' })
		return
	}

	const { type, title, content, url, token } = req.body

	if (token !== process.env.PURPLE_API_KEY) {
		res.status(401).send({ message: 'Unauthorized' })
		return
	}

	try {
		await postBleetToBsky({ contentType: type, title: title, items: content, url })
		// postBleet({ contentType: 'ContentType', items: 'TEST (composite) #StorWors', url: scrape })

		// const imageUrl = await getOgImageUrl(scrape)
		// if (imageUrl) {
		// 	return res.status(200).send({ imageUrl })
		// }
		// return res.status(404).send('No image found')
		return res.status(200).send('OK')
	} catch (error) {
		return res.status(400).send(JSON.stringify(error, null, 2))
	}
}
