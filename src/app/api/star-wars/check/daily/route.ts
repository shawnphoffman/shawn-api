import { NextRequest } from 'next/server'
import { log } from 'next-axiom'

import { guardJob } from '@/lib/jobs/guard'
import { runSections } from '@/lib/jobs/sections'

import processBooks from './_processBooks'
import processComics from './_processComics'
import processTv from './_processTv'
import processWeeklyComics from './_processWeeklyComics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/star-wars/check/daily
 *
 * Posts today's Star Wars book, comic and TV releases to Discord and Bluesky.
 * Called by Cronicle on the Mac mini. `?debug=true` runs the checks without
 * posting.
 */
export async function GET(req: NextRequest) {
	const rejected = guardJob(req, 'star-wars-daily')
	if (rejected) return rejected

	const debug = req.nextUrl.searchParams.get('debug') === 'true'

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	log.info(`Today is ${today.toString()}`)

	return runSections([
		{ name: 'Books', run: () => processBooks({ debug }) },
		{ name: 'Comics', run: () => processComics({ debug }) },
		{ name: 'Comics Weekly', run: () => processWeeklyComics({ debug }) },
		{ name: 'TV', run: () => processTv({ debug }) },
	])
}
