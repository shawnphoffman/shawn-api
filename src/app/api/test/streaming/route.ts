export const dynamic = 'force-dynamic'

function sleep(time: number) {
	return new Promise(resolve => {
		setTimeout(resolve, time)
	})
}

const encoder = new TextEncoder()

async function* makeIterator() {
	yield encoder.encode('<h1>One</h1>')
	await sleep(5000)
	yield encoder.encode('<h1>Two</h1>')
	await sleep(5000)
	yield encoder.encode('<h1>Three</h1>')
}

export async function GET() {
	const iterator = makeIterator()
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
// https://akava.io/blog/using-nextjs-app-router-with-vercel-edge-functions
