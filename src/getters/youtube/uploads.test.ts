import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getYouTubeUploads, uploadsPlaylistId } from './uploads'

const NOW = new Date('2026-10-05T01:45:00Z')
const fetchMock = vi.fn()

const entry = (videoId: string, title: string, publishedAt: string, privacyStatus = 'public') => ({
	snippet: {
		title,
		channelTitle: 'Blue Harvest',
		publishedAt,
		thumbnails: { high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }, default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` } },
	},
	contentDetails: { videoId, videoPublishedAt: publishedAt },
	status: { privacyStatus },
})

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(NOW)
	fetchMock.mockReset()
	vi.stubGlobal('fetch', fetchMock)
	vi.stubEnv('YOUTUBE_API_KEY', 'test-key')
})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllEnvs()
})

describe('uploadsPlaylistId', () => {
	it("swaps the channel id's UC prefix for UU", () => {
		expect(uploadsPlaylistId('UCnVaIQi3WprpT-2AHsOJbKg')).toBe('UUnVaIQi3WprpT-2AHsOJbKg')
	})
})

describe('getYouTubeUploads', () => {
	it('asks for the uploads playlist and returns recent public videos in the RSS shape', async () => {
		fetchMock.mockResolvedValue(
			Response.json({
				items: [
					entry('8xg2OHeERIc', 'We WERE ranked 16!', '2026-10-04T20:00:00Z'),
					entry('secret1', 'Private video', '2026-10-04T19:00:00Z', 'private'),
					entry('kB1vZ7i_1zo', 'Sittin on Business again', '2026-09-27T20:00:00Z'),
				],
			})
		)

		const { feed, items } = await getYouTubeUploads('UCnVaIQi3WprpT-2AHsOJbKg')

		const url = new URL(fetchMock.mock.calls[0][0])
		expect(url.pathname).toBe('/youtube/v3/playlistItems')
		expect(url.searchParams.get('playlistId')).toBe('UUnVaIQi3WprpT-2AHsOJbKg')
		expect(url.searchParams.get('key')).toBe('test-key')

		expect(feed.title).toBe('Blue Harvest')
		expect(items).toEqual([
			{
				title: 'We WERE ranked 16!',
				guid: '8xg2OHeERIc',
				link: 'https://www.youtube.com/watch?v=8xg2OHeERIc',
				pubDate: '2026-10-04T20:00:00Z',
				imageURL: 'https://i.ytimg.com/vi/8xg2OHeERIc/hqdefault.jpg',
			},
		])
	})

	it('returns the feed with no items for a channel with nothing recent', async () => {
		fetchMock.mockResolvedValue(Response.json({ items: [] }))
		const { feed, items } = await getYouTubeUploads('UCnVaIQi3WprpT-2AHsOJbKg')
		expect(feed).toBeDefined()
		expect(items).toEqual([])
	})

	it('throws with the API message when YouTube refuses the call', async () => {
		fetchMock.mockResolvedValue(Response.json({ error: { message: 'The request cannot be completed because you have exceeded your quota.' } }, { status: 403 }))
		await expect(getYouTubeUploads('UCnVaIQi3WprpT-2AHsOJbKg')).rejects.toThrow('YouTube API returned 403: The request cannot be completed because you have exceeded your quota.')
	})

	it('throws without calling YouTube when there is no API key', async () => {
		vi.stubEnv('YOUTUBE_API_KEY', '')
		await expect(getYouTubeUploads('UCnVaIQi3WprpT-2AHsOJbKg')).rejects.toThrow('YOUTUBE_API_KEY is not configured')
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
