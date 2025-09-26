import { NextRequest } from 'next/server'

import processNews from './_processNews'
import processYoutini from './_processYoutini'

export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// START
	yield encoder.encode(`<h1>🚀 Starting...</h1>`)

	// DEBUG
	if (debug) {
		await new Promise(resolve => setTimeout(resolve, 5000))
		yield encoder.encode(`<h1>⏳ Fake Wait</h1>`)
	}

	// NEWS
	yield encoder.encode(`<h1>🚧 Processing the news...</h1>`)
	const newsResp = await processNews({ debug: false })
	yield encoder.encode(`<h1>✅ News:</h1>${newsResp}`)

	// YOUTINI
	yield encoder.encode(`<h1>🚧 Processing the Youtini news...</h1>`)
	const youtiniResp = await processYoutini({ debug: false })
	yield encoder.encode(`<h1>✅ Youtini News:</h1>${youtiniResp}`)

	// FINISH
	yield encoder.encode(`<h1>🏁 Finished!</h1>`)
}

export async function GET(req: NextRequest) {
	// Basic
	const { searchParams } = new URL(req.url)
	const debug = searchParams.get('debug') === 'true'

	// Processors
	const iterator = makeIterator({ debug })

	// Response Stream
	const stream = new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next()
			if (done) {
				controller.close()
			} else {
				controller.enqueue(value)
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	})
}
