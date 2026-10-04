import { log } from 'next-axiom'

import { deliverOnce } from '@/lib/jobs/deliverOnce'

export type FeedResult = {
	feed: string
	/** Titles of the recent items the feed returned */
	items: string[]
	/** Deliveries made this run, as "Destination: member" */
	sent: string[]
	/** Anything that failed; a non-empty list makes the job report failure */
	errors: string[]
}

export const newFeedResult = (feed: string): FeedResult => ({ feed, items: [], sent: [], errors: [] })

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Makes one delivery for one item and records the outcome on the feed result.
 * A failure is recorded and logged instead of stopping the rest of the feed,
 * and stays unsent in Redis so the next run tries it again.
 */
export async function deliver(result: FeedResult, destination: string, setKey: string, member: string, send: () => Promise<unknown>) {
	try {
		const outcome = await deliverOnce(setKey, member, send)
		if (outcome === 'sent') {
			result.sent.push(`${destination}: ${member}`)
			console.log(`    ⚪️ ${destination} sent`, member)
		} else {
			console.log(`    🔘 ${destination} already sent`, member)
		}
	} catch (error) {
		result.errors.push(`${destination} failed for ${member}: ${describe(error)}`)
		log.error(`${destination} failed`, { member, error: describe(error) })
	}
}

/** Records an error that is not tied to one delivery, such as a feed that would not load */
export function recordError(result: FeedResult, message: string, error?: unknown) {
	const full = error === undefined ? message : `${message}: ${describe(error)}`
	result.errors.push(full)
	log.error(full)
}
