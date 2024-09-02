import { NextRequest } from 'next/server'

import { podcastFeeds } from '@/config/feeds/podcasts'

export const dynamic = 'force-dynamic'
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

	const randomPods = podcastFeeds.filter(x => x.refreshUrls?.length).sort(() => 0.5 - Math.random())

	const podPromises = randomPods
		.map(podcast => {
			return podcast.refreshUrls!.map(url => {
				console.log(`Ping Refresh URL: ${url}`)
				fetch(url)
			})
		})
		.flat()

	await Promise.all(podPromises)

	// FINISH
	yield encoder.encode(`<h1>🏁 Finished!</h1>`)
}

export async function GET(req: NextRequest) {
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
