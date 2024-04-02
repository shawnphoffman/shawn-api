import { AxiomRequest, withAxiom } from 'next-axiom'

import { getOgImageUrl } from '@/utils/imageUtils'

// http://localhost:3000/api/open-graph/image?scrape=https://starwars.fandom.com/wiki/Thrawn:_Alliances_2

export const GET = withAxiom(async (req: AxiomRequest) => {
	const { searchParams } = new URL(req.url)
	const scrape = searchParams.get('scrape')

	if (!scrape) {
		return Response.json({ message: 'No image URL provided' }, { status: 400 })
	}

	try {
		const imageUrl = await getOgImageUrl(scrape)
		if (imageUrl) {
			return Response.json({ imageUrl })
		}
		return Response.json({ message: 'No image found' }, { status: 404 })
	} catch (error) {
		return Response.json({ error }, { status: 500 })
	}
})
