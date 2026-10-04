import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { type NextRequest, NextResponse } from 'next/server'
import { log } from 'next-axiom'

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
	// 'https://dev.scruffypod.com/api/revalidate',
	'https://dev.jammedtransmissions.com/api/revalidate',
	// 'https://dev.blueharvest.rocks/api/revalidate',
	// 'https://dev.blueypodcast.com/api/revalidate',
	// 'https://dev.myweirdfoot.com/api/revalidate',
]

export async function POST(req: NextRequest) {
	//
	const bodyText = await req.text()

	// Only relay requests Sanity signed; the sites check the same signature with the same secret
	const secret = process.env.SANITY_REVALIDATE_SECRET
	if (!secret) {
		return NextResponse.json({ error: 'SANITY_REVALIDATE_SECRET is not configured' }, { status: 500 })
	}
	const signature = req.headers.get(SIGNATURE_HEADER_NAME)
	if (!signature || !(await isValidSignature(bodyText, signature, secret))) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
	}

	try {
		log.info('API Sanity Webhook Body', { body: JSON.parse(bodyText) })
	} catch (error) {
		console.error('API Sanity Webhook Body Catch', error)
	}

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

	return NextResponse.json({ responses })
}
