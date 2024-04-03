import { NextRequest } from 'next/server'

import { getWeeklyComics } from '@/getters/star-wars/comics'

export async function GET(_req: NextRequest) {
	const resp = await getWeeklyComics()
	return Response.json(resp)
}
