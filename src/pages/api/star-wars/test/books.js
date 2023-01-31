import { Redis } from '@upstash/redis'
import { getBooks } from '../future-books'

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
	// const today = new Date().setHours(0, 0, 0, 0)

	const books = await getBooks()

	redis.set('books', books, {
		// EX seconds -- Set the specified expire time, in seconds.
		// PX milliseconds -- Set the specified expire time, in milliseconds.
		// EXAT timestamp-seconds -- Set the specified Unix time at which the key will expire, in seconds.
		// PXAT timestamp-milliseconds -- Set the specified Unix time at which the key will expire, in milliseconds.
		// NX -- Only set the key if it does not already exist.
		// XX -- Only set the key if it already exist.
		// KEEPTTL -- Retain the time to live associated with the key.
		// GET -- Return the old string stored at key, or nil if key did not exist. An error is returned and SET aborted if the value stored at key is not a string.
	})

	const outBooks = books.filter(c => {
		// const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		// return today === pubDate
		return true
	})

	// res.status(200).json({ success: true, data: todayBooks.map(processBook) })
	res.status(200).json({ success: true, data: outBooks })
}
