import { getAllTv } from '@/getters/star-wars/tv'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
	const tvShows = await getAllTv()
	return Response.json(tvShows)
}
