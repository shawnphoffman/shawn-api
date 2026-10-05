/**
 * Document id for a synced award: award-<source>-<externalId>. The same
 * leaderboard always gets the same id, so a re-run updates it in place.
 *
 * No dots: Sanity treats any id with a dot as private, and the sites read
 * Sanity without a token, so they would never see the award.
 */
export function awardDocumentId(source: string, externalId: string): string {
	return `award-${source}-${externalId}`.replace(/[^A-Za-z0-9_-]/g, '-')
}
