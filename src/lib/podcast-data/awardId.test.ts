import { describe, expect, it } from 'vitest'

import { awardDocumentId } from './awardId'

describe('awardDocumentId', () => {
	it('is stable for the same leaderboard', () => {
		expect(awardDocumentId('goodpods', '104488373')).toBe('award-goodpods-104488373')
	})

	it('never contains a dot, which would make the award private in Sanity', () => {
		expect(awardDocumentId('goodpods', '1.2.3')).toBe('award-goodpods-1-2-3')
		expect(awardDocumentId('goodpods', 'a/b c')).not.toMatch(/[.\s/]/)
	})
})
