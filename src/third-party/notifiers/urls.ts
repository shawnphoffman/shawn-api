// import * as Sentry from '@sentry/node'

// Best effort: each URL is tried on its own, so one site being down does not skip the rest
export const pingRefreshUrls = async (feedName: string, urls: string[]) => {
	console.log(`Ping Refresh URLs for: ${feedName}`)
	for (const url of urls) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
			console.log(` + ${response?.status} - Ping Refresh URL: ${url}`)
		} catch (error) {
			console.error(` + Error pinging ${url}`, error)
		}
	}
}
