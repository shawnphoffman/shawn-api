import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

import { GoodpodsPodcastSchema,goodpodsSource, leaderboardsToAwards } from '@/lib/podcast-data/sources/goodpods'
import { fetchInTiers } from '@/lib/podcast-data/tier'
import { KvPrefix } from '@/utils/kv'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodGoodpods}:${url}`
	try {
		const cachedResponse = (await kv.get(kvUrl)) as any | null
		if (cachedResponse) {
			return NextResponse.json({ ...cachedResponse, url, cached: true })
		}
	} catch (error) {
		console.error('Error getting cached response', error)
	}

	const result = await fetchInTiers({
		source: goodpodsSource,
		url,
		schema: GoodpodsPodcastSchema,
	})

	if (!result) {
		return NextResponse.json({ error: 'All fetch tiers failed' }, { status: 502 })
	}

	const { data, tier } = result
	const awards = leaderboardsToAwards(data).map(({ externalId: _externalId, currentPosition: _currentPosition, ...rest }) => rest)
	const review_average = data.review_average
	const total_reviews = data.total_reviews

	if (awards.length > 0) {
		kv.set(
			kvUrl,
			JSON.stringify({
				awards,
				review_average,
				total_reviews,
			}),
			{
				ex: 60 * 60 * 24 * 3,
			}
		)
	}

	return NextResponse.json({ awards, url, review_average, total_reviews, tier })
}
