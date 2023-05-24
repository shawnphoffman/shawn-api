// import Cors from 'src/utils/cors'
import podcastFeedParser from '@podverse/podcast-feed-parser'

const secondsToDhms = seconds => {
	seconds = Number(seconds)
	var d = Math.floor(seconds / (3600 * 24))
	var h = Math.floor((seconds % (3600 * 24)) / 3600)
	var m = Math.floor((seconds % 3600) / 60)
	var s = Math.floor(seconds % 60)

	var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
	var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
	var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
	var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
	return {
		display: dDisplay + hDisplay + mDisplay + sDisplay,
		days: d,
		hours: h,
		minutes: m,
		seconds: s,
	}
}

export default async function handler(req, res) {
	const url = req.query?.url

	if (!url) {
		res.status(401).send('URL required')
		return
	}

	const podcast = await podcastFeedParser.getPodcastFromURL({ url })

	const episodes = podcast.episodes
		.map(e => {
			return {
				title: e.title,
				duration: e.duration,
				guid: e.guid,
				link: e.link,
				pubDate: e.pubDate,
				imageURL: e.imageURL,
			}
		})
		.sort((a, b) => {
			const aDate = new Date(a.pubDate)
			const bDate = new Date(b.pubDate)
			if (aDate > bDate) return -1
			if (aDate < bDate) return 1
			return 0
		})

	const totalDuration = episodes.reduce((a, b) => {
		return a + b.duration
	}, 0)

	res.json({
		title: podcast.meta.title,
		total: {
			count: podcast.episodes.length,
			duration: totalDuration,
			display: secondsToDhms(totalDuration),
		},
		episodes,
		// raw: podcast,
	})
}
