import GetTwitchAccessToken from '@/third-party/twitch/getTwitchAccessToken'
import Cors from '@/utils/cors'
import fetchWithCache from '@/utils/fetchWithCache'

const clientId = process.env.TWITCH_CLIENT_ID

async function GetTwitchFollowers(id, token) {
	var myHeaders = new Headers()
	myHeaders.append('Authorization', `Bearer ${token}`)
	myHeaders.append('Client-ID', clientId)

	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow',
	}

	const json = await fetchWithCache(`https://api.twitch.tv/helix/users/follows?to_id=${id}&first=100`, requestOptions)

	return json
}

// TODO Change this to a regex matcher
const whitelist = ['https://obs.shawn.party', 'https://dev.obs.shawn.party', 'http://localhost']

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		// origin: [/shawn\.party/, /localhost/],
		origin: (origin, callback) => {
			console.log('ORIGIN')
			console.log(origin)
			console.log('+++++')
			if (whitelist.indexOf(origin) !== -1 || !origin) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
	})

	// Get Twitch Access Token
	const token = await GetTwitchAccessToken()

	// Get Twitch User ID
	const { id, countOnly } = req.query

	// Get Twitch Followers
	const followers = await GetTwitchFollowers(id, token)

	// Set Cache Headers
	res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=599')

	if (countOnly === 'true') {
		res.json({
			total: followers.total,
		})
	} else {
		res.json(followers)
	}
}
