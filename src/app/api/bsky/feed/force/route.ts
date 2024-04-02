import { NextRequest } from 'next/server'

import { postBleet } from '@/third-party/bluesky/bluesky'

export async function POST(req: NextRequest) {
	const { type, title, content, url, token } = await req.json()

	if (token !== process.env.PURPLE_API_KEY) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const resp = await postBleet({ contentType: type, title: title, items: content, url })
		return Response.json(resp)
	} catch (error) {
		return Response.json({ error }, { status: 400 })
	}
}
