import { describe, expect, it } from 'vitest'

import { hasSpotifyRating, parseSpotifyRatingLabel } from './spotify'

describe('parseSpotifyRatingLabel', () => {
	it('reads the rating and count from the label Spotify shows today', () => {
		expect(parseSpotifyRatingLabel('4.7 stars, 56 ratings')).toEqual({ rating: '4.7', reviews: '(56)' })
	})

	it('handles large and abbreviated counts and a single rating', () => {
		expect(parseSpotifyRatingLabel('4.9 stars, 1,234 ratings')).toEqual({ rating: '4.9', reviews: '(1,234)' })
		expect(parseSpotifyRatingLabel('4.8 stars, 12K ratings')).toEqual({ rating: '4.8', reviews: '(12K)' })
		expect(parseSpotifyRatingLabel('5.0 star, 1 rating')).toEqual({ rating: '5.0', reviews: '(1)' })
	})

	it('returns null for anything else', () => {
		expect(parseSpotifyRatingLabel('Your Library')).toBeNull()
		expect(parseSpotifyRatingLabel(null)).toBeNull()
	})
})

describe('hasSpotifyRating', () => {
	it('rejects the broken values that used to be cached', () => {
		expect(hasSpotifyRating({ title: 'Your Library' })).toBe(false)
		expect(hasSpotifyRating({ title: 'Your Library', rating: '' })).toBe(false)
		expect(hasSpotifyRating(null)).toBe(false)
	})

	it('accepts a value with a rating', () => {
		expect(hasSpotifyRating({ title: 'Blue Harvest', rating: '4.7', reviews: '(56)' })).toBe(true)
	})
})
