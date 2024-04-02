const pingOvercast = async (feed: string) => {
	const encodedFeed = encodeURIComponent(feed)
	const url = `https://overcast.fm/ping?urlprefix=${encodedFeed}`
	const response = await fetch(url)
	console.log(`${response.status} - Ping Overcast for ${feed}`)
}

export default pingOvercast
