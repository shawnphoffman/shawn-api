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

	const addUrl = `${url}/posts`

	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/json')
	myHeaders.append('x-force-key', key)

	// console.log('INPUT', post)
	var requestOptions = {
		headers: myHeaders,
		method: 'POST',
		body: JSON.stringify(post),
	}
	try {
		return await fetch(addUrl, requestOptions)
		// const temp = await fetch(addUrl, requestOptions)
		// console.log('RESULT', temp)
		// return temp
	} catch (error) {
		console.error('Error adding to star wars feed', error)
	}
}
