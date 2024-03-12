// import { postBleet } from '@/components/bluesky/bluesky'
import { getOgImageUrl } from '@/components/bluesky/imageUtils'

export default async function handler(req, res) {
	const scrape = req.query.scrape
	// const scrape = 'https://starwars.fandom.com/wiki/Thrawn:_Alliances_2'

	if (!scrape) {
		res.status(401).send({ go: 'away' })
		return
	}

	try {
		// postBleet({ contentType: 'ContentType', items: 'TEST (composite) #StorWors', url: scrape })

		const imageUrl = await getOgImageUrl(scrape)
		if (imageUrl) {
			return res.status(200).send({ imageUrl })
		}
		return res.status(404).send('No image found')
		// return res.status(200).send('OK')
	} catch (error) {
		return res.status(400).send('Bad request')
	}
}
