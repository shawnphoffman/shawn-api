// import { fetchHtmlWithCache } from '@/utils/fetchWithCache'
// import * as cheerio from 'cheerio'
import { verifySignature } from '@upstash/qstash/nextjs'

async function handler(req, res) {
	console.log('If this is printed, the signature has already been verified')

	res.status(200).json({ success: true })
}

export default verifySignature(handler)

export const config = {
	api: {
		bodyParser: false,
	},
}
