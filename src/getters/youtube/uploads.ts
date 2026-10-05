import type { YouTubeFeedType, YouTubeItemType } from '@/getters/rss-feed/recent'
import { cleanDate, getYesterday } from '@/utils/dates'

type PlaylistItem = {
	snippet?: {
		title?: string
		channelTitle?: string
		publishedAt?: string
		thumbnails?: Record<string, { url?: string } | undefined>
	}
	contentDetails?: { videoId?: string; videoPublishedAt?: string }
	status?: { privacyStatus?: string }
}

/** Every channel's uploads playlist is its channel id with UC swapped for UU */
export const uploadsPlaylistId = (channelId: string) => (channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId)

/**
 * Lists a channel's recent public uploads through the YouTube Data API. Each
 * call costs 1 unit of the daily quota. Returns the same shape as the RSS
 * getter, keeping the same recency window (since the start of yesterday,
 * minus two days), and throws when the API cannot be read, so the caller can
 * fall back to the channel's RSS feed.
 */
export async function getYouTubeUploads(channelId: string): Promise<{ feed: YouTubeFeedType; items: YouTubeItemType[] }> {
	const key = process.env.YOUTUBE_API_KEY
	if (!key) {
		throw new Error('YOUTUBE_API_KEY is not configured')
	}

	const params = new URLSearchParams({
		part: 'snippet,contentDetails,status',
		maxResults: '10',
		playlistId: uploadsPlaylistId(channelId),
		key,
	})
	const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`, {
		cache: 'no-store',
		signal: AbortSignal.timeout(20000),
	})
	if (!res.ok) {
		const body = await res.json().catch(() => null)
		throw new Error(`YouTube API returned ${res.status}${body?.error?.message ? `: ${body.error.message}` : ''}`)
	}
	const json: { items?: PlaylistItem[] } = await res.json()
	const entries = json.items ?? []

	const pastDate = getYesterday()
	pastDate.setDate(pastDate.getDate() - 2)

	const items = entries
		// The uploads playlist also lists private and deleted videos, which RSS never showed
		.filter(e => e.status?.privacyStatus === 'public' && e.contentDetails?.videoId)
		.map(e => {
			const videoId = e.contentDetails!.videoId!
			const thumbs = e.snippet?.thumbnails ?? {}
			return {
				title: e.snippet?.title ?? '',
				guid: videoId,
				link: `https://www.youtube.com/watch?v=${videoId}`,
				pubDate: e.contentDetails?.videoPublishedAt ?? e.snippet?.publishedAt ?? '',
				imageURL: thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url,
			}
		})
		.filter(item => item.pubDate && cleanDate(item.pubDate) >= pastDate)

	return {
		feed: {
			title: entries[0]?.snippet?.channelTitle ?? channelId,
			link: `https://www.youtube.com/channel/${channelId}`,
		},
		items,
	}
}
