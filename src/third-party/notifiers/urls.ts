// import * as Sentry from '@sentry/node'

export const pingRefreshUrls = async (feedName: string, urls: string[]) => {
	console.log(`Ping Refresh URLs for: ${feedName}`)
	try {
		for (const url of urls) {
			const response = await fetch(url)
			console.log(` + ${response?.status} - Ping Refresh URL: ${url}`)
			// await new Promise(resolve => setTimeout(resolve, 2000))
		}
	} catch (error) {
		// Sentry.captureException(error)
		console.error(` + Error`, error)
	}
}
