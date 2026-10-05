import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPodcastFeed, getRssFeed, getYouTubeFeed } from './recent'

const NOW = new Date('2026-10-04T18:00:00Z')
const fetchMock = vi.fn()
const respondWith = (xml: string) => fetchMock.mockResolvedValue(new Response(xml, { status: 200 }))

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] })
	vi.setSystemTime(NOW)
	fetchMock.mockReset()
	vi.stubGlobal('fetch', fetchMock)
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
	vi.useRealTimers()
})

// A podcast feed shaped like the Podbean and Anchor feeds the poller reads
const podcastXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
	<title>Blue Harvest</title>
	<link>https://blueharvest.rocks</link>
	<description>A Star Wars podcast</description>
	<itunes:image href="https://example.com/show.jpg"/>
	<item>
		<title>Episode 570: New Stuff</title>
		<guid isPermaLink="false">bh-570</guid>
		<pubDate>Fri, 02 Oct 2026 08:00:00 -0500</pubDate>
		<link>https://blueharvest.rocks/episodes/570</link>
		<enclosure url="https://example.com/570.mp3" type="audio/mpeg" length="1"/>
		<itunes:image href="https://example.com/570.jpg"/>
	</item>
	<item>
		<title>Episode 569: Older</title>
		<guid isPermaLink="false">bh-569</guid>
		<pubDate>Mon, 28 Sep 2026 08:00:00 -0500</pubDate>
		<enclosure url="https://example.com/569.mp3" type="audio/mpeg" length="1"/>
	</item>
	<item>
		<title>Episode 500: Ancient</title>
		<guid isPermaLink="false">bh-500</guid>
		<pubDate>Fri, 01 Aug 2025 08:00:00 -0500</pubDate>
		<enclosure url="https://example.com/500.mp3" type="audio/mpeg" length="1"/>
	</item>
</channel>
</rss>`

const rssItem = (title: string, guid: string, date: string) => `
	<item>
		<title>${title}</title>
		<link>https://theroguerebels.com/${guid}</link>
		<guid isPermaLink="false">https://theroguerebels.com/?p=${guid}</guid>
		<pubDate>${date}</pubDate>
		<description>Post body</description>
	</item>`

const rssXml = (items: string) => `<?xml version="1.0"?>
<rss version="2.0"><channel>
	<title>The Rogue Rebels</title>
	<link>https://theroguerebels.com</link>
	<description>Blog</description>
	${items}
</channel></rss>`

const ytEntry = (id: string, title: string, published: string) => `
	<entry>
		<id>yt:video:${id}</id>
		<yt:videoId>${id}</yt:videoId>
		<title>${title}</title>
		<link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/>
		<published>${published}</published>
		<media:group><media:thumbnail url="https://i.ytimg.com/vi/${id}/hqdefault.jpg" width="480" height="360"/></media:group>
	</entry>`

const ytXml = (entries: string) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
	<title>Blue Harvest</title>
	<author><name>Blue Harvest</name><uri>https://www.youtube.com/channel/UCnVaIQi3WprpT-2AHsOJbKg</uri></author>
	${entries}
</feed>`

describe('getPodcastFeed', () => {
	it('returns only episodes from the last week, newest first, with their guids', async () => {
		respondWith(podcastXml)
		const { meta, episodes } = await getPodcastFeed('https://feed.example/podcast.xml')
		expect(meta?.title).toBe('Blue Harvest')
		expect(episodes.map(e => e.guid)).toEqual(['bh-570', 'bh-569'])
		expect(episodes[0].title).toBe('Episode 570: New Stuff')
	})

	it('returns no episodes instead of throwing when the fetch fails', async () => {
		fetchMock.mockRejectedValue(new Error('network down'))
		expect(await getPodcastFeed('https://feed.example/podcast.xml')).toEqual({ episodes: [] })
	})
})

describe('getRssFeed', () => {
	it('reads the guid text from a guid that has attributes', async () => {
		respondWith(rssXml(rssItem('New post', '101', 'Sat, 03 Oct 2026 12:00:00 GMT') + rssItem('Old post', '100', 'Sat, 01 Aug 2026 12:00:00 GMT')))
		const { feed, items } = await getRssFeed('https://theroguerebels.com/feed')
		expect(feed?.title).toBe('The Rogue Rebels')
		expect(items).toHaveLength(1)
		expect(items[0].guid).toBe('https://theroguerebels.com/?p=101')
	})

	it('handles a feed with a single item', async () => {
		respondWith(rssXml(rssItem('Only post', '200', 'Sat, 03 Oct 2026 12:00:00 GMT')))
		const { items } = await getRssFeed('https://theroguerebels.com/feed')
		expect(items.map(i => i.title)).toEqual(['Only post'])
	})
})

describe('getYouTubeFeed', () => {
	it('returns recent videos with id, link and thumbnail', async () => {
		respondWith(ytXml(ytEntry('abc123', 'New video', '2026-10-04T06:12:29+00:00') + ytEntry('old999', 'Old video', '2026-09-01T00:00:00+00:00')))
		const { feed, items } = await getYouTubeFeed('https://www.youtube.com/feeds/videos.xml?channel_id=x')
		expect(feed?.title).toBe('Blue Harvest')
		expect(items).toEqual([
			{
				title: 'New video',
				guid: 'abc123',
				link: 'https://www.youtube.com/watch?v=abc123',
				pubDate: '2026-10-04T06:12:29+00:00',
				imageURL: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
			},
		])
	})

	it("handles a channel's first and only video", async () => {
		respondWith(ytXml(ytEntry('first1', 'First video', '2026-10-04T06:12:29+00:00')))
		const { items } = await getYouTubeFeed('https://www.youtube.com/feeds/videos.xml?channel_id=x')
		expect(items.map(i => i.guid)).toEqual(['first1'])
	})
})
