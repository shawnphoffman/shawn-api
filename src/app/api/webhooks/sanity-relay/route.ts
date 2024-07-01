import { type NextRequest, NextResponse } from 'next/server'
import { log } from 'next-axiom'
import { parseBody } from 'next-sanity/webhook'

type WebhookPayload = {
	_type: string
}

export const maxDuration = 60

const ProxyEndpoints = [
	// 'http://localhost:3000/api/revalidate',
	'https://justshillin.com/api/revalidate',
	'https://scruffypod.com/api/revalidate',
	'https://jammedtransmissions.com/api/revalidate',
	'https://blueharvest.rocks/api/revalidate',
	'https://myweirdfoot.com/api/revalidate',
	'https://blueypodcast.com/api/revalidate',
	'https://dev.justshillin.com/api/revalidate',
	'https://dev.scruffypod.com/api/revalidate',
	'https://dev.jammedtransmissions.com/api/revalidate',
	'https://dev.blueharvest.rocks/api/revalidate',
	'https://dev.blueypodcast.com/api/revalidate',
	'https://dev.myweirdfoot.com/api/revalidate',
]

export async function POST(req: NextRequest) {
	//
	const bodyText = await req.text()
	//
	const responses: { endpoint: string; status: string; message?: string; misc?: any; statusText?: string }[] = []
	//
	await Promise.all(
		ProxyEndpoints.map(async endpoint => {
			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					body: bodyText,
					headers: req.headers,
				})
				if (response.ok) {
					responses.push({ endpoint, status: 'success' })
				} else {
					responses.push({ endpoint, status: 'error', message: 'Invalid response status', misc: response, statusText: response.statusText })
					console.error(`API Sanity Webhook Error: ${endpoint}`, response.statusText, response)
				}
			} catch (err) {
				responses.push({ endpoint, status: 'exception', message: err.message })
				console.error(`API Sanity Webhook Exception: ${endpoint}`, err)
			}
		})
	)

	const { body } = await parseBody<WebhookPayload>(req, process.env.SANITY_REVALIDATE_SECRET)
	if (body) {
		log.info('API Sanity Webhook Body', JSON.parse(JSON.stringify(body)))
	}

	return NextResponse.json({ responses })
}
