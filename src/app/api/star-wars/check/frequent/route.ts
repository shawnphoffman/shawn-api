import { NextRequest } from 'next/server'

import { guardJob } from '@/lib/jobs/guard'
import { runSections } from '@/lib/jobs/sections'

import processNews from './_processNews'
import processYoutini from './_processYoutini'

export const dynamic = 'force-dynamic'

/**
 * GET /api/star-wars/check/frequent
 *
 * Posts new starwars.com and Youtini news to Bluesky. Called by Cronicle on
 * the Mac mini. `?debug=true` runs the checks without posting.
 */
export async function GET(req: NextRequest) {
	const rejected = guardJob(req, 'star-wars-frequent')
	if (rejected) return rejected

	const debug = req.nextUrl.searchParams.get('debug') === 'true'

	return runSections([
		{ name: 'News', run: () => processNews({ debug }) },
		{ name: 'Youtini', run: () => processYoutini({ debug }) },
	])
}
