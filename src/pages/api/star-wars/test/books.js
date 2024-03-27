import { getBooks } from '../get/future-books'

import redis from '@/utils/redis'

const handler = async (req, res) => {
	// const today = new Date().setHours(0, 0, 0, 0)

	const books = await getBooks()

	const redisResp = await redis.set('books', books, {
		ex: 30,
		// EX seconds -- Set the specified expire time, in seconds.
		// PX milliseconds -- Set the specified expire time, in milliseconds.
		// EXAT timestamp-seconds -- Set the specified Unix time at which the key will expire, in seconds.
		// PXAT timestamp-milliseconds -- Set the specified Unix time at which the key will expire, in milliseconds.
		// NX -- Only set the key if it does not already exist.
		// XX -- Only set the key if it already exist.
		// KEEPTTL -- Retain the time to live associated with the key.
		// GET -- Return the old string stored at key, or nil if key did not exist. An error is returned and SET aborted if the value stored at key is not a string.
	})
	console.log(`Redis Resp: ${redisResp}`)

	// const outBooks = books.filter(c => {
	const outBooks = books.filter(() => {
		// const pubDate = new Date(c.pubDate).setHours(0, 0, 0, 0)
		// return today === pubDate
		return true
	})

	// res.status(200).json({ success: true, data: todayBooks.map(processBook) })
	res.status(200).json({ success: true, data: outBooks })
}

export default handler
