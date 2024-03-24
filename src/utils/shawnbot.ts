export type Post = {
	uri: string
	cid: string
	replyParent: string | null
	replyRoot: string | null
	indexedAt: string
}

export const addToStarWarsFeed = async (post: Post) => {
	const url = process.env.FEED_GEN_URL
	const key = process.env.FEED_GEN_FORCE_KEY

	if (!url || !key) {
		console.error('Feed generator URL or key not found')
		return
	}

	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')
	myHeaders.append('x-force-key', key)

	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(post),
	}
	try {
		await fetch(url, requestOptions)
	} catch (error) {
		console.error('Error adding to star wars feed', error)
	}
}
