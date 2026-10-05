export type SpotifyRating = {
	title: string
	/** The star rating as Spotify shows it, e.g. "4.7" */
	rating: string
	/** The rating count as Spotify shows it, e.g. "(56)" */
	reviews: string
}

/**
 * Reads the rating from the accessibility label Spotify puts on a show's
 * rating, e.g. "4.7 stars, 56 ratings" or "4.7 stars, 1,234 ratings". The
 * label is meant for screen readers, so it outlasts Spotify's generated CSS
 * class names.
 */
export function parseSpotifyRatingLabel(label: string | null | undefined): { rating: string; reviews: string } | null {
	const match = label?.match(/([\d.]+)\s*stars?,\s*([\d,.]+K?)\s*ratings?/i)
	if (!match) return null
	return { rating: match[1], reviews: `(${match[2]})` }
}

/** A cached or scraped value is only usable when it has a rating */
export function hasSpotifyRating(value: unknown): value is SpotifyRating {
	return typeof value === 'object' && value !== null && typeof (value as SpotifyRating).rating === 'string' && (value as SpotifyRating).rating.length > 0
}
