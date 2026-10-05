import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

import { cacheGoodpods } from '@/lib/podcast-data/goodpodsCache'
import { goodpodsCacheKey } from '@/lib/podcast-data/goodpodsId'
import { GoodpodsPodcastSchema, goodpodsSource } from '@/lib/podcast-data/sources/goodpods'
import { fetchInTiers } from '@/lib/podcast-data/tier'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	try {
		const cachedResponse = (await kv.get(goodpodsCacheKey(url))) as any | null
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

	const cached = await cacheGoodpods(url, result.data)
	return NextResponse.json({ ...cached, url, tier: result.tier })
}
