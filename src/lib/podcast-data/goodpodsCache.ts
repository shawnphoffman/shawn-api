import { kv } from '@vercel/kv'

import { goodpodsCacheKey } from './goodpodsId'
import { GoodpodsPodcast, leaderboardsToAwards } from './sources/goodpods'

/** How long a show's Goodpods data stays cached; the sync refreshes it well before this */
const CACHE_SECONDS = 60 * 60 * 24 * 3

/** The awards and rating as cached and served to the sites */
export function toCachedGoodpods(data: GoodpodsPodcast) {
	const awards = leaderboardsToAwards(data).map(({ externalId: _externalId, currentPosition: _currentPosition, ...rest }) => rest)
	return { awards, review_average: data.review_average, total_reviews: data.total_reviews }
}

/**
 * Stores a show's Goodpods data where the sites' rating route reads it.
 * Written even when the show has no awards, since the rating is still needed.
 */
export async function cacheGoodpods(url: string, data: GoodpodsPodcast) {
	const cached = toCachedGoodpods(data)
	await kv.set(goodpodsCacheKey(url), JSON.stringify(cached), { ex: CACHE_SECONDS })
	return cached
}
