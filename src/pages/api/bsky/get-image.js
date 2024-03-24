// import { postBleet } from '@/components/bluesky/bluesky'
import { getOgImageUrl } from '@/utils/imageUtils'

export default async function handler(req, res) {
	const scrape = req.query.scrape
	// const scrape = 'https://starwars.fandom.com/wiki/Thrawn:_Alliances_2'

	if (!scrape) {
		res.status(401).json({ go: 'away' })
		return
	}

	try {
		// postBleet({ contentType: 'ContentType', items: 'TEST (composite) #StorWors', url: scrape })

		const imageUrl = await getOgImageUrl(scrape)
		if (imageUrl) {
			return res.json({ imageUrl })
		}
		return res.status(404).text('No image found')
	} catch (error) {
		return res.status(400).text('Bad request')
	}
}
