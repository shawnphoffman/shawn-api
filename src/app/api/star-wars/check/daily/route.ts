import { NextRequest } from 'next/server'
import { log } from 'next-axiom'

import processBooks from './_processBooks'
import processComics from './_processComics'
import processTv from './_processTv'
import processWeeklyComics from './_processWeeklyComics'

export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// START
	yield encoder.encode(`<h1>🚀 Starting...</h1><h3>⏰ Current Time: ${new Date().toUTCString()}</h3>`)

	// DEBUG
	if (debug) {
		await new Promise(resolve => setTimeout(resolve, 5000))
		yield encoder.encode(`<h1>⏳ Fake Wait</h1>`)
	}

	// BOOKS
	const bookResp = await processBooks({ debug })
	yield encoder.encode(`<h1>✅ Books:</h1>${bookResp}`)

	// COMICS
	const comicResp = await processComics({ debug })
	yield encoder.encode(`<h1>✅ Comics:</h1>${comicResp}`)

	const comicWeeklyResp = await processWeeklyComics({ debug })
	yield encoder.encode(`<h1>✅ Comics Weekly:</h1>${comicWeeklyResp}`)

	// TV
	const tvResp = await processTv({ debug })
	yield encoder.encode(`<h1>✅ TV:</h1>${tvResp}`)

	// FINISH
	yield encoder.encode(`<h1>🏁 Finished!</h1>`)
}

export async function GET(req: NextRequest) {
	// Basic
	const { searchParams } = new URL(req.url)
	const debug = searchParams.get('debug') === 'true'

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	log.info(`Today is ${today.toString()}`)

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
