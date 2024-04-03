import { NextRequest } from 'next/server'

import { getComicsWeekly } from '@/getters/star-wars/comics'

export async function GET(_req: NextRequest) {
	const resp = await getComicsWeekly()
	return Response.json(resp)
}
