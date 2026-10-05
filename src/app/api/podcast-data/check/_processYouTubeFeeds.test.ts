import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { YouTubeFeedConfig } from '@/config/feeds/types'
import { createFakeRedis, FakeRedis } from '@/test/fakeRedis'

let fake: FakeRedis
vi.mock('@/utils/redis', () => ({ default: () => fake, RedisKey: { RssBluesky: 'rss:bsky' } }))
vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

const getYouTubeUploads = vi.fn()
vi.mock('@/getters/youtube/uploads', () => ({ getYouTubeUploads: (...a: unknown[]) => getYouTubeUploads(...a) }))
const getYouTubeFeed = vi.fn()
vi.mock('@/getters/rss-feed/recent', () => ({ getYouTubeFeed: (...a: unknown[]) => getYouTubeFeed(...a) }))
const isYouTubeShort = vi.fn()
const isYouTubeScheduled = vi.fn()
vi.mock('@/third-party/youtube', () => ({
	isYouTubeShort: (...a: unknown[]) => isYouTubeShort(...a),
	isYouTubeScheduled: (...a: unknown[]) => isYouTubeScheduled(...a),
}))
const postRssBleet = vi.fn()
vi.mock('@/third-party/bluesky/bluesky-rss', () => ({ postRssBleet: (...a: unknown[]) => postRssBleet(...a) }))

import processYoutubeFeeds from './_processYouTubeFeeds'

const config: YouTubeFeedConfig = {
	name: 'Star Wars Explained YouTube',
	channelId: 'UCIKlsX1qfGqKPt4KAW-JOZg',
	url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIKlsX1qfGqKPt4KAW-JOZg',
	event: 'sw-explained-youtube',
	bluesky: true,
}
const video = { title: 'Watto Explained', guid: 'eywE1v1RjPo', link: 'https://www.youtube.com/watch?v=eywE1v1RjPo', pubDate: '2026-10-04T20:00:00Z' }
const feed = { title: 'Star Wars Explained', link: 'https://www.youtube.com/channel/UCIKlsX1qfGqKPt4KAW-JOZg' }

beforeEach(() => {
	fake = createFakeRedis()
	vi.spyOn(console, 'log').mockImplementation(() => {})
	getYouTubeUploads.mockReset().mockResolvedValue({ feed, items: [video] })
	getYouTubeFeed.mockReset().mockResolvedValue({ feed, items: [video] })
	isYouTubeShort.mockReset().mockResolvedValue(false)
	isYouTubeScheduled.mockReset().mockResolvedValue(false)
	postRssBleet.mockReset().mockResolvedValue(undefined)
})

describe('processYoutubeFeeds', () => {
	it('reads the API, posts once and records the same member format RSS used', async () => {
		const result = await processYoutubeFeeds({ debug: false, config })
		expect(getYouTubeUploads).toHaveBeenCalledWith('UCIKlsX1qfGqKPt4KAW-JOZg')
		expect(getYouTubeFeed).not.toHaveBeenCalled()
		expect(postRssBleet).toHaveBeenCalledOnce()
		expect([...(fake.sets.get('rss:bsky') ?? [])]).toEqual(['sw-explained-youtube:eywE1v1RjPo'])
		expect(result.down).toBeUndefined()
	})

	it('falls back to RSS when the API fails', async () => {
		getYouTubeUploads.mockRejectedValue(new Error('YouTube API returned 403: quota'))
		const result = await processYoutubeFeeds({ debug: false, config })
		expect(getYouTubeFeed).toHaveBeenCalledWith(config.url)
		expect(postRssBleet).toHaveBeenCalledOnce()
		expect(result.down).toBeUndefined()
	})

	it('marks the feed down only when both the API and RSS fail', async () => {
		getYouTubeUploads.mockRejectedValue(new Error('YouTube API returned 500'))
		getYouTubeFeed.mockResolvedValue({ items: [] })
		const result = await processYoutubeFeeds({ debug: false, config })
		expect(result.down).toBe('No YouTube videos for UCIKlsX1qfGqKPt4KAW-JOZg: API failed (YouTube API returned 500) and the RSS feed would not load')
		expect(postRssBleet).not.toHaveBeenCalled()
	})

	it('skips shorts, scheduled premieres and videos the feed config rejects', async () => {
		getYouTubeUploads.mockResolvedValue({
			feed,
			items: [
				{ ...video, guid: 'short1' },
				{ ...video, guid: 'sched1' },
				{ ...video, guid: 'offtopic', title: 'Cooking video' },
				video,
			],
		})
		isYouTubeShort.mockImplementation(async (id: string) => id === 'short1')
		isYouTubeScheduled.mockImplementation(async (id: string) => id === 'sched1')
		const result = await processYoutubeFeeds({ debug: false, config: { ...config, isValid: item => item.title !== 'Cooking video' } })
		expect(result.items).toEqual(['Watto Explained'])
		expect(postRssBleet).toHaveBeenCalledOnce()
	})

	it('posts nothing on a dry run', async () => {
		const result = await processYoutubeFeeds({ debug: true, config })
		expect(result.items).toEqual(['Watto Explained'])
		expect(postRssBleet).not.toHaveBeenCalled()
		expect(fake.sets.size).toBe(0)
	})
})
