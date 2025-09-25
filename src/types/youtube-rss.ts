// TypeScript types for YouTube RSS feed XML compatible with fast-xml-parser

export interface YouTubeRSSFeed {
	feed: {
		'@_xmlns:yt': string
		'@_xmlns:media': string
		'@_xmlns': string
		link: Array<{
			'@_rel': string
			'@_href': string
		}>
		id: string
		'yt:channelId': string
		title: string
		author: {
			name: string
			uri: string
		}
		published: string
		entry: YouTubeRSSEntry[]
		channelId: string
	}
}

export interface YouTubeRSSEntry {
	id: string
	'yt:videoId': string
	'yt:channelId': string
	channelId: string
	media: {
		title: string
		contentUrl: string
		thumbnailUrl: string
		description: string
		starRating: {
			count: number
			average: number
			min: number
			max: number
		}
		statistics: {
			views: number
		}
	}
	title: string
	link: {
		'@_rel': string
		'@_href': string
	}
	author: {
		name: string
		uri: string
	}
	published: string
	updated: string
	'media:group': {
		'media:title': string
		'media:content': {
			'@_url': string
			'@_type': string
			'@_width': string
			'@_height': string
		}
		'media:thumbnail': {
			'@_url': string
			'@_width': string
			'@_height': string
		}
		'media:description': string
		'media:community': {
			'media:starRating': {
				'@_count': string
				'@_average': string
				'@_min': string
				'@_max': string
			}
			'media:statistics': {
				'@_views': string
			}
		}
	}
}

export type ParsedYouTubeRSS = YouTubeRSSFeed
