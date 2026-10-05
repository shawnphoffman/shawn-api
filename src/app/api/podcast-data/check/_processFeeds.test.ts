import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PodFeedConfig } from '@/config/feeds/types'
import { createFakeRedis, FakeRedis } from '@/test/fakeRedis'

let fake: FakeRedis
vi.mock('@/utils/redis', () => ({
	default: () => fake,
	RedisKey: { RssDiscord: 'rss:discord', RssBluesky: 'rss:bsky', RssOvercast: 'rss:overcast', RssRefresh: 'rss:refresh' },
}))
vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

const getPodcastFeed = vi.fn()
vi.mock('@/getters/rss-feed/recent', () => ({ getPodcastFeed: (...a: unknown[]) => getPodcastFeed(...a) }))
const sendRssWebhook = vi.fn()
const sendNonPodWebhookRaw = vi.fn()
vi.mock('@/third-party/discord/discord-rss', () => ({
	sendRssWebhook: (...a: unknown[]) => sendRssWebhook(...a),
	sendNonPodWebhookRaw: (...a: unknown[]) => sendNonPodWebhookRaw(...a),
}))
vi.mock('@/third-party/discord/webhookChannels', () => ({ default: { ShawnDev: { id: 'dev', token: 'dev' } } }))
const postRssBleet = vi.fn()
vi.mock('@/third-party/bluesky/bluesky-rss', () => ({ postRssBleet: (...a: unknown[]) => postRssBleet(...a) }))
const pingOvercast = vi.fn()
vi.mock('@/third-party/notifiers/overcast', () => ({ default: (...a: unknown[]) => pingOvercast(...a) }))
const pingRefreshUrls = vi.fn()
vi.mock('@/third-party/notifiers/urls', () => ({ pingRefreshUrls: (...a: unknown[]) => pingRefreshUrls(...a) }))

import processFeeds from './_processFeeds'

const config: PodFeedConfig = {
	name: 'Blue Harvest',
	url: 'https://feed.example/bh.xml',
	event: 'blue-harvest',
	channel: { id: 'chan', token: 'tok' },
	bluesky: true,
	bskyHandle: ['blueharvest.bsky.social'],
	homepage: 'https://blueharvest.rocks',
	refreshUrls: ['https://blueharvest.rocks/episodes'],
	hashtags: ['#StarWars'],
}

const episode = { title: 'Episode 570', guid: 'bh-570', link: 'https://blueharvest.rocks/570', imageURL: '', pubDate: '', summary: '' }

beforeEach(() => {
	fake = createFakeRedis()
	vi.spyOn(console, 'log').mockImplementation(() => {})
	getPodcastFeed.mockReset().mockResolvedValue({ meta: { title: 'Blue Harvest', imageURL: 'https://example.com/show.jpg' }, episodes: [episode] })
	for (const fn of [sendRssWebhook, sendNonPodWebhookRaw, postRssBleet, pingOvercast, pingRefreshUrls]) fn.mockReset().mockResolvedValue(undefined)
})

describe('processFeeds', () => {
	it('sends to every destination and records each under the same keys the old poller used', async () => {
		const result = await processFeeds({ debug: false, config })
		expect(result.errors).toEqual([])
		expect(sendRssWebhook).toHaveBeenCalledOnce()
		expect(postRssBleet).toHaveBeenCalledOnce()
		expect(pingOvercast).toHaveBeenCalledWith('https://feed.example/bh.xml')
		expect(pingRefreshUrls).toHaveBeenCalledWith('Blue Harvest', ['https://blueharvest.rocks/episodes'])
		// Changing these keys or member formats would repost every recent episode
		for (const key of ['rss:discord', 'rss:bsky', 'rss:overcast', 'rss:refresh']) {
			expect([...(fake.sets.get(key) ?? [])]).toEqual(['blue-harvest:bh-570'])
		}
	})

	it('falls back to the podcast image for Bluesky when the episode has none', async () => {
		await processFeeds({ debug: false, config })
		expect(postRssBleet.mock.calls[0][0].imageOverride).toBe('https://example.com/show.jpg')
	})

	it('skips destinations already sent', async () => {
		await fake.sadd('rss:discord', 'blue-harvest:bh-570')
		await fake.sadd('rss:bsky', 'blue-harvest:bh-570')
		await processFeeds({ debug: false, config })
		expect(sendRssWebhook).not.toHaveBeenCalled()
		expect(postRssBleet).not.toHaveBeenCalled()
		expect(pingOvercast).toHaveBeenCalledOnce()
	})

	it('keeps going after a failed delivery and leaves only that one unrecorded', async () => {
		sendRssWebhook.mockRejectedValue(new Error('Discord webhook failed: 500'))
		const result = await processFeeds({ debug: false, config })
		expect(result.errors).toEqual(['Discord failed for blue-harvest:bh-570: Discord webhook failed: 500'])
		expect(postRssBleet).toHaveBeenCalledOnce()
		expect(fake.sets.get('rss:discord')).toBeUndefined()
		expect(fake.sets.get('rss:bsky')?.has('blue-harvest:bh-570')).toBe(true)
	})

	it('posts nothing and records nothing in debug mode', async () => {
		const result = await processFeeds({ debug: true, config })
		expect(result.items).toEqual(['Episode 570'])
		for (const fn of [sendRssWebhook, postRssBleet, pingOvercast, pingRefreshUrls]) expect(fn).not.toHaveBeenCalled()
		expect(fake.sets.size).toBe(0)
	})

	it('reports a feed that would not load as an error', async () => {
		getPodcastFeed.mockResolvedValue({ episodes: [] })
		const result = await processFeeds({ debug: false, config })
		expect(result.errors).toEqual(['No podcast feed found for "https://feed.example/bh.xml"'])
	})

	it('does not ping Overcast when the feed opts out', async () => {
		await processFeeds({ debug: false, config: { ...config, ping: false } })
		expect(pingOvercast).not.toHaveBeenCalled()
		expect(fake.sets.get('rss:overcast')).toBeUndefined()
	})
})
