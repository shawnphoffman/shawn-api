import { KvPrefix } from '@/utils/kv'

/**
 * The Goodpods podcast id is the trailing number of a show's URL, e.g.
 * https://goodpods.com/podcasts/scruffy-looking-podcasters-a-star-wars-podcast-318983.
 */
export function extractGoodpodsPodcastId(url: string): number | null {
	const match = url.match(/-(\d+)(?:[/?#]|$)/)
	if (!match) return null
	const n = parseInt(match[1], 10)
	return Number.isFinite(n) ? n : null
}

/**
 * Cache key for a show's Goodpods data. Keyed on the podcast id, not the URL,
 * because the sites use different URLs for the same show (the Bluey site uses
 * dinner-with-the-heelers-277737, the scheduled scrape the longer slug).
 */
export function goodpodsCacheKey(url: string): string {
	const id = extractGoodpodsPodcastId(url)
	return id === null ? `${KvPrefix.PodGoodpods}:${url}` : `${KvPrefix.PodGoodpods}:id:${id}`
}
