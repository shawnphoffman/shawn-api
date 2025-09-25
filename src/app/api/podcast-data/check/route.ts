import { NextRequest } from 'next/server'

import { podcastFeeds } from '@/config/feeds/podcasts'
import { rssFeeds } from '@/config/feeds/rss'

import processFeeds from './_processFeeds'
import processRssFeeds from './_processRssFeeds'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = false
export const maxDuration = 60

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// performance.mark('shawn:pod:start')

	// START
	yield encoder.encode(`<h1>🚀 Starting...</h1><hr />`)

	// DEBUG
	if (debug) {
		await new Promise(resolve => setTimeout(resolve, 5000))
		yield encoder.encode(`<h1>⏳ Fake Wait</h1><hr />`)
	}

	// PROCESS PODCASTS
	for (const podcast of podcastFeeds) {
		// performance.mark(`shawn:pod:${podcast?.name}:start`)

		yield encoder.encode(`<h2>🎙️ Processing: ${podcast?.name}</h2>`)

		const recentItems = await processFeeds({ debug, config: podcast })
		yield encoder.encode(`<h3>✅ Episodes:</h3>${recentItems}<hr />`)

		// performance.mark(`shawn:pod:${podcast?.name}:end`)
		// performance.measure(`shawn:pod:${podcast?.name}`, `shawn:pod:${podcast?.name}:start`, `shawn:pod:${podcast?.name}:end`)
	}

	// PROCESS RSS FEEDS
	for (const rssFeed of rssFeeds) {
		// performance.mark(`shawn:pod:${podcast?.name}:start`)

		yield encoder.encode(`<h2>🎙️ Processing: ${rssFeed?.name}</h2>`)

		const recentItems = await processRssFeeds({ debug, config: rssFeed })
		yield encoder.encode(`<h3>✅ Items:</h3>${recentItems}<hr />`)

		// performance.mark(`shawn:pod:${podcast?.name}:end`)
		// performance.measure(`shawn:pod:${podcast?.name}`, `shawn:pod:${podcast?.name}:start`, `shawn:pod:${podcast?.name}:end`)
	}

	// performance.mark('shawn:pod:end')

	// FINISH
	yield encoder.encode(`<h1>🏁 Finished!</h1>`)

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

export async function GET(req: NextRequest) {
	// Prevent execution during build time
	if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
		return new Response('Not available during build', { status: 503 })
	}

	// Additional build-time check
	if (process.env.NEXT_PHASE === 'phase-production-build') {
		return new Response('Not available during build', { status: 503 })
	}

	// Check if we're in a Docker build context
	if (process.env.DOCKER_BUILDKIT === '1' || process.env.BUILDKIT_PROGRESS === 'plain') {
		return new Response('Not available during build', { status: 503 })
	}

	// Basic
	const { searchParams } = new URL(req.url)
	const debug = searchParams.get('debug') === 'true'

	// Processors
	// const iterator = makeIterator({ debug: false })
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
