import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import Cors from 'src/utils/cors'
import parser from 'xml2json'

const newUrl = process.env.RSS_BLUE_HARVEST_PATREON

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: [/blueharvest\.rocks$/, /myweirdfoot\.com$/, /localhost/],
	})

	const requestOptions = {
		method: 'GET',
	}
	const data = await fetchHtmlWithCache(newUrl, requestOptions, 60 * 24)
	const json = parser.toJson(data)
	const obj = JSON.parse(json)

	const { item } = obj.rss.channel
	const response = item.map(i => {
		const { guid, title, pubDate, link } = i
		return {
			title,
			guid: guid.$t,
			pubDate,
			link,
		}
	})

	res.status(200).send(response)
}
