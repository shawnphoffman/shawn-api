import { NextRequest } from 'next/server'

import processNews from './_processNews'

export const dynamic = 'force-dynamic'
// export const runtime = 'edge'

const encoder = new TextEncoder()

async function* makeIterator({ debug }) {
	// START
	yield encoder.encode(`========================================\n\n🚀 Starting...\n\n`)

	// NEWS
	const newsResp = await processNews({ debug })
	yield encoder.encode(`✅ News:\n${newsResp}\n\n`)

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

	return new Response(stream)
}
