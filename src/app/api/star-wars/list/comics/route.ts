import { getAllComics } from '@/getters/star-wars/comics'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
	const books = await getAllComics()
	return Response.json(books)
}
