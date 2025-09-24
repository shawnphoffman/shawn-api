import { NextRequest } from 'next/server'

import { getWeeklyComics } from '@/getters/star-wars/comics'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
	const resp = await getWeeklyComics()
	return Response.json(resp)
}
