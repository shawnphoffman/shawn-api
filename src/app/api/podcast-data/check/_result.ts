import { log } from 'next-axiom'

import { deliverOnce } from '@/lib/jobs/deliverOnce'
import redis, { RedisKey } from '@/utils/redis'

export type FeedResult = {
	feed: string
	/** Titles of the recent items the feed returned */
	items: string[]
	/** Deliveries made this run, as "Destination: member" */
	sent: string[]
	/** Anything that failed; a non-empty list makes the job report failure */
	errors: string[]
	/** Problems that do not fail the job (yet), such as a feed that is briefly down */
	warnings: string[]
	/** Set when the feed itself could not be read this run */
	down?: string
}

export const newFeedResult = (feed: string): FeedResult => ({ feed, items: [], sent: [], errors: [], warnings: [] })

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

/** Records an error that is not tied to one delivery */
export function recordError(result: FeedResult, message: string, error?: unknown) {
	const full = error === undefined ? message : `${message}: ${describe(error)}`
	result.errors.push(full)
	log.error(full)
}

/**
 * Marks the feed as unreadable this run. Feeds go down for a while on their
 * own (YouTube's channel feeds do this), so this is not an error by itself;
 * applyFeedDownPolicy decides when it becomes one.
 */
export function markFeedDown(result: FeedResult, message: string, error?: unknown) {
	result.down = error === undefined ? message : `${message}: ${describe(error)}`
	log.warn(result.down)
}

/** Runs in a row a feed may be down before it fails the job: two hours of 15-minute runs */
export const FEED_DOWN_ALERT_RUNS = 8
/** After that first alert, how often to fail the job again while the feed stays down: about once a day */
export const FEED_DOWN_REMIND_RUNS = 96

/**
 * Counts consecutive runs each feed has been down, in one Redis hash. A down
 * feed is a warning until it reaches FEED_DOWN_ALERT_RUNS, fails the job then,
 * and again every FEED_DOWN_REMIND_RUNS runs while it stays down. A feed that
 * reads again has its count cleared. A dry run reports but changes no counts.
 */
export async function applyFeedDownPolicy(results: FeedResult[], { debug }: { debug: boolean }) {
	const counts = (await redis().hgetall<Record<string, number>>(RedisKey.FeedDown)) ?? {}

	for (const result of results) {
		if (!result.down) {
			if (!debug && counts[result.feed]) await redis().hdel(RedisKey.FeedDown, result.feed)
			continue
		}

		const runs = debug ? Number(counts[result.feed] ?? 0) + 1 : await redis().hincrby(RedisKey.FeedDown, result.feed, 1)
		const due = runs >= FEED_DOWN_ALERT_RUNS && (runs - FEED_DOWN_ALERT_RUNS) % FEED_DOWN_REMIND_RUNS === 0
		const message = `${result.down} (down ${runs} run${runs === 1 ? '' : 's'} in a row)`
		if (due) {
			result.errors.push(message)
		} else {
			result.warnings.push(message)
		}
	}
}
