/**
 * Shared types for the tiered podcast-data fetchers.
 *
 * The pipeline is:
 *   native HTTP+cheerio  ->  puppeteer/browserless fallback  ->  cache hit / [] / null
 *
 * Each source (apple, spotify, goodpods) implements `Source<T>`. The
 * generic runner in `tier.ts` walks the tiers, validates each tier's
 * response with the source's Zod schema, and returns the first one that
 * passes. Tiers that throw or fail validation are logged and the next
 * tier is tried.
 */

export type FetchTier = 'native' | 'puppeteer'

export type FetchOutcome<T> = {
	tier: FetchTier
	data: T
}

/** What every source knows how to do. */
export type Source<T> = {
	/** Stable name for logs / cache keys. */
	name: string
	/** Try native HTTP+cheerio. Should return `null` for "couldn't get it" rather than throwing on the expected miss. Throws are still caught and treated as a tier miss. */
	fetchNative: (url: string) => Promise<T | null>
	/** Last-resort puppeteer/browserless path. Same null-on-miss contract. */
	fetchPuppeteer: (url: string) => Promise<T | null>
}
