import { NextRequest } from 'next/server'

import { podcastFeeds } from '@/config/feeds/podcasts'

import processFeeds from './_processFeeds'

export const dynamic = 'force-dynamic'
// export const runtime = 'edge'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// performance.mark('shawn:pod:start')

	// START
	yield encoder.encode(`========================================\n\n🚀 Starting...\n\n`)

	// PROCESS PODCASTS
	for (const podcast of podcastFeeds) {
		// performance.mark(`shawn:pod:${podcast?.name}:start`)

		yield encoder.encode(`🎙️ Processing: ${podcast?.name}\n`)

		const recentItems = await processFeeds({ debug, config: podcast })
		yield encoder.encode(`  ✅ Episodes:\n${recentItems}\n\n`)

		// performance.mark(`shawn:pod:${podcast?.name}:end`)
		// performance.measure(`shawn:pod:${podcast?.name}`, `shawn:pod:${podcast?.name}:start`, `shawn:pod:${podcast?.name}:end`)
	}

	// performance.mark('shawn:pod:end')

	// FINISH
	yield encoder.encode(`🏁 Finished!\n\n========================================`)

	// performance.measure('shawn:pod', 'shawn:pod:start', 'shawn:pod:end')

	// yield encoder.encode(`\n\n📊 Performance\n`)
	// for (const entry of performance.getEntries()) {
	// 	if (entry.name.startsWith('shawn:')) {
	// 		if (entry.entryType === 'measure') {
	// 			yield encoder.encode(`  - 📏 ${entry.name.replace('shawn:pod:', '').padEnd(30, '.')}: ${entry.duration}ms\n`)
	// 		}
	// 		performance.clearMarks(entry.name)
	// 		performance.clearMeasures(entry.name)
	// 	}
	// }
}

// export async function GET(context: { params: { foo: string } }) {
// console.log(`EMPTY GET ${JSON.stringify(context.params)}`)
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
