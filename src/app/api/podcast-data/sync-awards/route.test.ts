import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let locked = false
vi.mock('@/lib/jobs/lock', () => ({
	withJobLock: async (_job: string, _ttl: number, fn: () => Promise<unknown>) => (locked ? { locked: true } : { locked: false, result: await fn() }),
}))
const listPodcastsForSync = vi.fn()
const upsertAward = vi.fn()
const expireUnseenAwards = vi.fn()
vi.mock('@/lib/podcast-data/sanity', () => ({
	listPodcastsForSync: () => listPodcastsForSync(),
	upsertAward: (...a: unknown[]) => upsertAward(...a),
	expireUnseenAwards: (...a: unknown[]) => expireUnseenAwards(...a),
}))
const cacheGoodpods = vi.fn()
vi.mock('@/lib/podcast-data/goodpodsCache', () => ({ cacheGoodpods: (...a: unknown[]) => cacheGoodpods(...a) }))
const fetchInTiers = vi.fn()
vi.mock('@/lib/podcast-data/tier', () => ({ fetchInTiers: (...a: unknown[]) => fetchInTiers(...a) }))
vi.mock('puppeteer', () => ({ default: { connect: vi.fn() } }))

import { GET } from './route'

const call = (query = '') => GET(new NextRequest(`http://localhost/api/podcast-data/sync-awards${query}`, { headers: { authorization: 'Bearer secret' } }))

const bluey = { _id: 'cat-bluey', title: 'Dinner with the Heelers', goodpodsUrl: 'https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737' }
const jammed = { _id: 'cat-jammed', title: 'Jammed Transmissions', goodpodsUrl: 'https://goodpods.com/podcasts/jammed-transmissions-a-star-wars-podcast-222540' }
const leaderboard = (id: number, period: string) => ({
	leaderboard_id: id,
	category_tag: 'kids-and-family',
	period_type: period,
	indie_only: false,
	current_position: 2,
	url_slug: 'kids-and-family/parenting',
})
const blueyData = { review_average: 5, total_reviews: 95, leaderboard_info_list: [leaderboard(11, 'week'), leaderboard(12, 'month')] }

beforeEach(() => {
	locked = false
	vi.stubEnv('CRON_SECRET', 'secret')
	vi.stubEnv('ENABLED_JOBS', 'sync-awards')
	vi.spyOn(console, 'error').mockImplementation(() => {})
	listPodcastsForSync.mockReset().mockResolvedValue([bluey])
	fetchInTiers.mockReset().mockResolvedValue({ tier: 'solver', data: blueyData })
	for (const fn of [upsertAward, expireUnseenAwards, cacheGoodpods]) fn.mockReset().mockResolvedValue(0)
})

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('GET /api/podcast-data/sync-awards', () => {
	it('upserts current awards, expires the rest and refreshes the rating cache', async () => {
		const res = await call()
		expect(res.status).toBe(200)
		expect(upsertAward).toHaveBeenCalledTimes(2)
		expect(upsertAward.mock.calls[0][0]).toMatchObject({ categoryId: 'cat-bluey', source: 'goodpods', frequency: 'Weekly' })
		expect(cacheGoodpods).toHaveBeenCalledWith(bluey.goodpodsUrl, blueyData)
		const [categoryId, seen] = expireUnseenAwards.mock.calls[0]
		expect(categoryId).toBe('cat-bluey')
		expect(seen).toEqual(upsertAward.mock.calls.map(c => c[0].externalId))
		expect((await res.json()).summary[0]).toMatchObject({ podcast: 'Dinner with the Heelers', tier: 'solver', awards: 2, rating: 5 })
	})

	it('expires nothing for a podcast whose scrape failed, and answers 500', async () => {
		listPodcastsForSync.mockResolvedValue([bluey, jammed])
		fetchInTiers.mockImplementation(async ({ url }: { url: string }) => (url === jammed.goodpodsUrl ? null : { tier: 'solver', data: blueyData }))
		const res = await call()
		expect(res.status).toBe(500)
		expect(expireUnseenAwards).toHaveBeenCalledTimes(1)
		expect(expireUnseenAwards.mock.calls[0][0]).toBe('cat-bluey')
		expect((await res.json()).summary[1]).toMatchObject({ podcast: 'Jammed Transmissions', error: 'all tiers failed' })
	})

	it('writes nothing on a dry run', async () => {
		const res = await call('?debug=true')
		expect(res.status).toBe(200)
		for (const fn of [upsertAward, expireUnseenAwards, cacheGoodpods]) expect(fn).not.toHaveBeenCalled()
		expect((await res.json()).summary[0].awards).toBe(2)
	})

	it('answers 409 while another sync holds the lock', async () => {
		locked = true
		expect((await call()).status).toBe(409)
		expect(fetchInTiers).not.toHaveBeenCalled()
	})

	it('says so when no podcast has a Goodpods URL', async () => {
		listPodcastsForSync.mockResolvedValue([])
		const res = await call()
		expect(res.status).toBe(200)
		expect((await res.json()).note).toBe('No podcasts with goodpodsUrl set.')
	})
})
