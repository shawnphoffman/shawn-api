import { describe, expect, it } from 'vitest'

import { extractGoodpodsPodcastId, goodpodsCacheKey } from './goodpodsId'

describe('goodpodsCacheKey', () => {
	it('gives the same key for different URLs of the same show', () => {
		// The Bluey site and the scheduled scrape use these two URLs for one show
		expect(goodpodsCacheKey('https://goodpods.com/podcasts/dinner-with-the-heelers-277737')).toBe(
			goodpodsCacheKey('https://goodpods.com/podcasts/dinner-with-the-heelers-a-bluey-podcast-277737')
		)
		expect(goodpodsCacheKey('https://goodpods.com/podcasts/high-potion-265438')).toBe('pod:goodpods:id:265438')
	})

	it('falls back to the URL when it has no podcast id', () => {
		expect(goodpodsCacheKey('https://goodpods.com/podcasts/no-id-here')).toBe('pod:goodpods:https://goodpods.com/podcasts/no-id-here')
	})
})

describe('extractGoodpodsPodcastId', () => {
	it('reads the trailing number, ignoring a query or trailing slash', () => {
		expect(extractGoodpodsPodcastId('https://goodpods.com/podcasts/blue-harvest-a-star-wars-podcast-84967')).toBe(84967)
		expect(extractGoodpodsPodcastId('https://goodpods.com/podcasts/just-shillin-303749/?ref=x')).toBe(303749)
		expect(extractGoodpodsPodcastId('https://goodpods.com/podcasts/no-id-here')).toBeNull()
	})
})
