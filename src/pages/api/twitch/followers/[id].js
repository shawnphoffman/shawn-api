import GetTwitchAccessToken from 'src/utils/getTwitchAccessToken'
import fetchWithCache from 'src/utils/fetchWithCache'
import Cors from 'src/utils/cors'

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

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: [/\.shawn\.party/, /localhost/],
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
