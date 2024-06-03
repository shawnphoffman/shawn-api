import { NextRequest } from 'next/server'
import { log } from 'next-axiom'

import processBooks from './_processBooks'
import processComics from './_processComics'
import processTv from './_processTv'
import processWeeklyComics from './_processWeeklyComics'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// START
	yield encoder.encode(
		`========================================\n\n🚀 Starting...\n\n⏰ Current Time:\n  - ${new Date().toUTCString()}\n\n`
	)

	// BOOKS
	const bookResp = await processBooks({ debug })
	yield encoder.encode(`✅ Books:\n${bookResp}\n\n`)

	// COMICS
	const comicResp = await processComics({ debug })
	yield encoder.encode(`✅ Comics:\n${comicResp}\n\n`)

	const comicWeeklyResp = await processWeeklyComics({ debug })
	yield encoder.encode(`✅ Comics Weekly:\n${comicWeeklyResp}\n\n`)

	// TV
	const tvResp = await processTv({ debug })
	yield encoder.encode(`✅ TV:\n${tvResp}\n\n`)

	// FINISH
	yield encoder.encode(`🏁 Finished!\n\n========================================`)
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
			'Content-Type': 'text/plain; charset=utf-8',
		},
	})
}
