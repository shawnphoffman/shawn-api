import { ZodSchema } from 'zod'

import { FetchOutcome, Source } from './types'

/**
 * Run a source through its tiers in order. The first tier that returns
 * non-null data and passes Zod validation wins. Failures are logged with
 * the tier name so a recurring miss in production can be debugged from
 * Vercel function logs.
 */
export async function fetchInTiers<T>(args: { source: Source<T>; url: string; schema: ZodSchema<T> }): Promise<FetchOutcome<T> | null> {
	const { source, url, schema } = args

	const tiers = [
		{ name: 'native' as const, run: source.fetchNative },
		{ name: 'puppeteer' as const, run: source.fetchPuppeteer },
	]

	for (const tier of tiers) {
		try {
			const raw = await tier.run(url)
			if (raw === null) {
				console.warn(`[podcast-data] ${source.name}/${tier.name} returned null for ${url}`)
				continue
			}
			const parsed = schema.safeParse(raw)
			if (!parsed.success) {
				console.warn(`[podcast-data] ${source.name}/${tier.name} failed validation for ${url}`, parsed.error.issues.slice(0, 3))
				continue
			}
			return { tier: tier.name, data: parsed.data }
		} catch (error) {
			console.warn(`[podcast-data] ${source.name}/${tier.name} threw for ${url}`, error instanceof Error ? error.message : error)
		}
	}

	console.error(`[podcast-data] ${source.name}: all tiers failed for ${url}`)
	return null
}
