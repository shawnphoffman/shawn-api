export const YouTubeSource = {
	BlueHarvest: {
		channelId: 'UCnVaIQi3WprpT-2AHsOJbKg',
	},
	SteeleWars: {
		channelId: 'UCxnEDVUZe8-j61nKo4HzOYg',
	},
}

Object.values(YouTubeSource).forEach(s =>
	Object.defineProperty(s, 'rssFeed', {
		get: () => `https://www.youtube.com/feeds/videos.xml?channel_id=${s.channelId}`,
	})
)
