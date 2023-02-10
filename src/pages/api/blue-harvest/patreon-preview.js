import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
import Cors from 'src/utils/cors'
import parser from 'xml2json'

const newUrl = process.env.RSS_BLUE_HARVEST_PATREON

var whitelist = [
	'https://blueharvest.rocks/',
	'https://dev.blueharvest.rocks/',
	'https://myweirdfoot.com/',
	'https://dev.myweirdfoot.com/',
	'http://localhost',
]

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: (origin, callback) => {
			if (whitelist.indexOf(origin) !== -1 || !origin) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
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
