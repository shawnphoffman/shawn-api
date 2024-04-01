import { getAllNews } from '@/getters/star-wars/news'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
	const news = await getAllNews()
	return Response.json(news)
}
