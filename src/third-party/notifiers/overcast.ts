// Throws when Overcast does not accept the ping, so the caller does not record it as sent
const pingOvercast = async (feed: string) => {
	const encodedFeed = encodeURIComponent(feed)
	const url = `https://overcast.fm/ping?urlprefix=${encodedFeed}`
	const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
	console.log(`${response.status} - Ping Overcast for ${feed}`)
	if (!response.ok) {
		throw new Error(`Overcast ping failed for ${feed}: ${response.status} ${response.statusText}`)
	}
}

export default pingOvercast
