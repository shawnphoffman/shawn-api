import Cors from 'src/utils/cors'
import redis from 'src/utils/redis'
import { cleanSearches, login, logout,RedisKey } from 'src/utils/synology'

async function handler(req, res) {
	console.log('')
	console.log('=========================')
	console.log('CLEANING COMICS SEARCHES')

	await Cors(req, res, {
		methods: ['GET', 'POST', 'OPTIONS'],
		origin: [/\.shawn\.party/, /localhost/],
	})

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

	// Login
	const sid = await login()
	if (!sid) return res.status(401).json({ success: false, error: '+ synology.login failed' })

	// Get task ids
	const taskIds = await redis.lrange(RedisKey.SEARCH_TASK_IDS, 0, -1)
	console.log(`+ synology.cleanSearches taskIds: ${taskIds}`)
	if (taskIds.length === 0) return res.status(200).json({ success: true, status: '+ synology.cleanSearches no tasks' })

	// Clean searches
	const cleanSuccess = await cleanSearches(sid, taskIds)
	if (!cleanSuccess) return res.status(400).json({ success: false, error: '+ synology.cleanSearches failed' })

	// Redis
	redis.del(RedisKey.SEARCH_TASK_IDS)
	redis.del(RedisKey.SEARCH_TASK_ID)

	// Logout
	await logout()

	res.status(200).json({
		success: true,
		taskIds,
		cleaned: true,
	})
}

export default handler
