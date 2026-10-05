import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@/config/feeds/podcasts', () => ({ podcastFeeds: [{ name: 'Pod A' }] }))
vi.mock('@/config/feeds/rss', () => ({ rssFeeds: [{ name: 'Blog B' }] }))
vi.mock('@/config/feeds/youtube', () => ({ youtubeFeeds: [] }))

let locked = false
vi.mock('@/lib/jobs/lock', () => ({
	withJobLock: async (_job: string, _ttl: number, fn: () => Promise<unknown>) => (locked ? { locked: true } : { locked: false, result: await fn() }),
}))

const processFeeds = vi.fn()
const processRssFeeds = vi.fn()
vi.mock('./_processFeeds', () => ({ default: (...a: unknown[]) => processFeeds(...a) }))
vi.mock('./_processRssFeeds', () => ({ default: (...a: unknown[]) => processRssFeeds(...a) }))
vi.mock('./_processYouTubeFeeds', () => ({ default: vi.fn() }))

import { GET } from './route'

const call = (query = '', auth = 'Bearer secret') => GET(new NextRequest(`http://localhost/api/podcast-data/check${query}`, { headers: { authorization: auth } }))
const clean = (feed: string) => ({ feed, items: [], sent: [], errors: [] })

beforeEach(() => {
	locked = false
	vi.stubEnv('CRON_SECRET', 'secret')
	vi.stubEnv('ENABLED_JOBS', 'podcast-check')
	processFeeds.mockReset().mockResolvedValue(clean('Pod A'))
	processRssFeeds.mockReset().mockResolvedValue(clean('Blog B'))
})

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('GET /api/podcast-data/check', () => {
	it('rejects a request without the job token', async () => {
		expect((await call('', '')).status).toBe(401)
		expect(processFeeds).not.toHaveBeenCalled()
	})

	it('responds 200 with a summary when every feed works', async () => {
		const res = await call()
		expect(res.status).toBe(200)
		expect(await res.json()).toMatchObject({ ok: true, feeds: 2, errors: [] })
	})

	it('responds 500 and names the feed when anything failed', async () => {
		processRssFeeds.mockResolvedValue({ ...clean('Blog B'), errors: ['Bluesky failed for x: rate limited'] })
		const res = await call()
		expect(res.status).toBe(500)
		expect((await res.json()).errors).toEqual(['Blog B: Bluesky failed for x: rate limited'])
	})

	it('keeps checking other feeds when one throws', async () => {
		processFeeds.mockRejectedValue(new Error('parser exploded'))
		const res = await call()
		expect(processRssFeeds).toHaveBeenCalledOnce()
		expect((await res.json()).errors).toEqual(['Pod A: Pod A failed: parser exploded'])
	})

	it('responds 409 while another run holds the lock', async () => {
		locked = true
		expect((await call()).status).toBe(409)
		expect(processFeeds).not.toHaveBeenCalled()
	})

	it('passes debug through so nothing is posted', async () => {
		await call('?debug=true')
		expect(processFeeds.mock.calls[0][0].debug).toBe(true)
	})
})
