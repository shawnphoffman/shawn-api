import 'server-only'

import { createClient } from '@sanity/client'

import { awardDocumentId } from './awardId'

const projectId = process.env.SANITY_PROJECT_ID || 'uc06juhv'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
	// Lazy throw so route handlers that don't write to Sanity (e.g. the
	// goodpods-scrape read-only endpoint) don't blow up at import time.
	console.warn('[podcast-data/sanity] SANITY_API_WRITE_TOKEN is not set; awards sync will fail.')
}

export const sanityWriteClient = createClient({
	projectId,
	dataset,
	apiVersion: '2024-05-11',
	token,
	useCdn: false,
})

export type PodcastCategory = {
	_id: string
	title: string
	goodpodsUrl?: string
}

export async function listPodcastsForSync(): Promise<PodcastCategory[]> {
	return sanityWriteClient.fetch<PodcastCategory[]>(
		`*[_type == "category" && defined(goodpodsUrl)]{ _id, title, goodpodsUrl }`
	)
}

export type AwardUpsert = {
	categoryId: string
	source: 'goodpods'
	externalId: string
	name: string
	frequency: string
	linkUrl: string
	imageUrl: string
	width: number
	height: number
	expiresAt: string | null
	lastSeenAt: string
}

/**
 * Upsert one award. The _id (see awardDocumentId) is deterministic, so
 * re-running the sync against the same Goodpods leaderboard updates in place
 * rather than creating duplicates.
 *
 * `active: true` is set on insert only - we don't force it back to true
 * if an editor manually flipped it off. `lastSeenAt` is always overwritten;
 * `expiresAt` is overwritten on each sync to slide the window forward.
 * Manual fields (rawHtml, custom name) are preserved via createIfNotExists.
 */
export async function upsertAward(award: AwardUpsert): Promise<void> {
	const _id = awardDocumentId(award.source, award.externalId)
	const tx = sanityWriteClient.transaction()
	tx.createIfNotExists({
		_id,
		_type: 'award',
		category: { _type: 'reference', _ref: award.categoryId },
		active: true,
		source: award.source,
		externalId: award.externalId,
		name: award.name,
		frequency: award.frequency,
		linkUrl: award.linkUrl,
		imageUrl: award.imageUrl,
		width: award.width,
		height: award.height,
		expiresAt: award.expiresAt,
		lastSeenAt: award.lastSeenAt,
	})
	tx.patch(_id, p =>
		p.set({
			category: { _type: 'reference', _ref: award.categoryId },
			source: award.source,
			externalId: award.externalId,
			name: award.name,
			frequency: award.frequency,
			linkUrl: award.linkUrl,
			imageUrl: award.imageUrl,
			width: award.width,
			height: award.height,
			expiresAt: award.expiresAt,
			lastSeenAt: award.lastSeenAt,
		})
	)
	await tx.commit({ autoGenerateArrayKeys: true })
}

/**
 * Expires this podcast's synced Goodpods awards that the latest scrape no
 * longer lists, by setting expiresAt to now. The sites only show unexpired
 * awards, so they drop off at once, and the change itself prompts the sites
 * to refresh. If Goodpods lists the award again, the next upsert slides
 * expiresAt forward and it shows again. Hand-made awards (any other source)
 * are never touched. Returns how many awards were expired.
 */
export async function expireUnseenAwards(categoryId: string, seenExternalIds: string[], nowIso: string): Promise<number> {
	const stale = await sanityWriteClient.fetch<{ _id: string }[]>(
		`*[_type == "award" && source == "goodpods" && category._ref == $categoryId && !(externalId in $seen) && (!defined(expiresAt) || expiresAt > $now)]{ _id }`,
		{ categoryId, seen: seenExternalIds, now: nowIso }
	)
	if (stale.length === 0) return 0
	const tx = sanityWriteClient.transaction()
	for (const award of stale) {
		tx.patch(award._id, p => p.set({ expiresAt: nowIso }))
	}
	await tx.commit()
	return stale.length
}
