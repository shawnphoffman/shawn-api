import { getAllBooks } from '@/getters/star-wars/books'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
	const books = await getAllBooks()
	return Response.json(books)
}
