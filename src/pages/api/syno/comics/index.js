import { search } from './start'

import { getSearchResults, login, logout, RedisKey } from '@/third-party/synology'
import Cors from '@/utils/cors'
import redis from '@/utils/redis'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function handler(req, res) {
	console.log('')
	console.log('==============================')
	console.log('FETCHING COMIC SEARCH RESULTS')

	await Cors(req, res, {
		methods: ['GET', 'POST', 'OPTIONS'],
		origin: [/\.shawn\.party/, /localhost/],
	})

	// Check for cached results
	const cachedFiles = await redis.get(RedisKey.SEARCH_RESULTS)
	// console.log('CACHED FILES', cachedFiles)

	if (cachedFiles) {
		return res.status(200).json({ success: true, cached: true, files: cachedFiles })
	}

	// Prevent prod shit from calling with GET
	if (process.env.NODE_ENV === 'production') {
		if (req.method !== 'POST') {
			return res.status(405).send({ message: 'Only POST requests allowed' })
		}

		const { secret } = req?.body ?? {}
		if (secret !== process.env.SYNO_SECRET) {
			return res.status(401).send({ message: 'You cannot do that' })
		}
	}

	// Check to see if there is a completed search
	const taskId = await redis.get(RedisKey.SEARCH_TASK_ID)
	// console.log('TASK ID', taskId)

	// If not task, start a search
	if (!taskId) {
		return search(sid, res)
	}

	// Login
	const sid = await login()
	if (!sid) return res.status(401).json({ success: false, error: '+ synology.login failed' })

	let requestCount = 1
	let { success, finished, files, fileCount } = await getSearchResults(sid, taskId)

	while ((!success || !finished || fileCount <= 0) && requestCount <= 5) {
		await delay(1000)
		console.log(' ~~ retrying ~~', requestCount)
		;({ success, finished, files, fileCount } = await getSearchResults(sid, taskId))
		requestCount++
	}

	// Logout
	await logout()

	if (!success || fileCount <= 0) {
		console.log('+ synology.getSearchResults failed', { success, finished, files })
		res.status(400).json({ success: false, error: '+ synology.getSearchResults failed', debug: { success, finished, files } })
	}

	const outFiles = files.map(file => file.name.replace(/\.[^/.]+$/, '')).sort()

	// Redis
	redis.set(RedisKey.SEARCH_RESULTS, JSON.stringify(outFiles), { expiration: 60 * 60 * 24 * 4 })

	res.status(200).json({
		success: true,
		files: outFiles,
		cached: false,
	})
}

export default handler
