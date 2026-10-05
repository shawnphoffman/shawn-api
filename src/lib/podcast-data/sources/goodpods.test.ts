import { describe, expect, it, vi } from 'vitest'

vi.mock('puppeteer', () => ({ default: { connect: vi.fn() } }))

import { extractPodcastFromPage, GoodpodsPodcastSchema, leaderboardsToAwards } from './goodpods'

// Trimmed from the real Blue Harvest page Byparr returned; the podcast query is not always first
const page = (queries: unknown[]) =>
	`<html><head><title>BLUE HARVEST</title></head><body><div id="__next"></div>` +
	`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { dehydratedState: { queries } } } })}</script></body></html>`

const leaderboard = {
	leaderboard_id: 123,
	category_tag: 'leisure',
	period_type: 'week',
	indie_only: false,
	current_position: 3,
	url_slug: 'leisure/animation-and-manga',
}

describe('extractPodcastFromPage', () => {
	it('finds the podcast details among the cached queries', () => {
		const podcast = { review_average: 5, total_reviews: 47, leaderboard_info_list: [leaderboard], title: 'BLUE HARVEST' }
		const html = page([{ state: { data: { pages: [[{ review_average: 0 }]] } } }, { state: { data: podcast } }])
		const found = extractPodcastFromPage(html)
		expect(found).toEqual(podcast)
		const parsed = GoodpodsPodcastSchema.parse(found)
		expect(leaderboardsToAwards(parsed)[0]).toMatchObject({ frequency: 'Weekly', currentPosition: 3 })
	})

	it('accepts a show with no leaderboard placements', () => {
		const found = extractPodcastFromPage(page([{ state: { data: { review_average: 5, total_reviews: 47, leaderboard_info_list: [] } } }]))
		expect(GoodpodsPodcastSchema.safeParse(found).success).toBe(true)
	})

	it("returns null for Cloudflare's challenge page or broken data", () => {
		expect(extractPodcastFromPage('<html><title>Just a moment...</title></html>')).toBeNull()
		expect(extractPodcastFromPage('<script id="__NEXT_DATA__" type="application/json">{not json</script>')).toBeNull()
		expect(extractPodcastFromPage(page([{ state: { data: { something: 'else' } } }]))).toBeNull()
	})
})
