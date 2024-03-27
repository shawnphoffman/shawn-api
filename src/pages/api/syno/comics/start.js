import Cors from '@/utils/cors'
import redis from '@/utils/redis'
import { login, logout, RedisKey, startSearch } from '@/utils/synology'

export const search = async res => {
	// Login
	const sid = await login()
	if (!sid) return res.status(401).json({ success: false, error: '+ synology.login failed' })

	// Start search
	const taskId = await startSearch(sid)
	if (!taskId) return res.status(400).json({ success: false, error: '+ synology.startSearch failed' })

	// Redis
	redis.set(RedisKey.SEARCH_TASK_ID, taskId, {})
	redis.lpush(RedisKey.SEARCH_TASK_IDS, taskId)

	// Logout
	await logout()

	return res.status(200).json({
		success: true,
		taskId,
		searching: true,
	})
}

async function handler(req, res) {
	console.log('')
	console.log('=======================')
	console.log('STARTING COMICS SEARCH')

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

	// TODO Add secret handler
	// const { secret } = req?.body ?? {}

	return search(res)
}

export default handler
