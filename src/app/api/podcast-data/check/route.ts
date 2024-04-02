import { NextRequest } from 'next/server'

import processItems from './_processItems'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// START
	yield encoder.encode(`========================================\n\n🚀 Starting...\n\n`)

	// RECENT ITEMS
	const feedUrl = ['https://feed.podbean.com/blueharvestpodcast/feed.xml', 'https://feeds.zencastr.com/f/l5bmy6wm.rss']

	for (const feed of feedUrl) {
		yield encoder.encode(`🎙️ Checking feed: ${feed}\n`)
		const recentItems = await processItems({ debug, feedUrl: feed })
		yield encoder.encode(`✅ Episodes:\n${recentItems}\n\n`)
	}

	// FINISH
	yield encoder.encode(`🏁 Finished!\n\n========================================`)
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
			'Content-Type': 'text/plain; charset=utf-8',
		},
	})
}

export const dynamic = 'force-dynamic'
