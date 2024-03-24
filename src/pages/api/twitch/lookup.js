import Cors from 'src/utils/cors'
import fetchWithCache from 'src/utils/fetchWithCache'
import GetTwitchAccessToken from 'src/utils/getTwitchAccessToken'

const clientId = process.env.TWITCH_CLIENT_ID

async function GetTwitchUser(username, token) {
	var myHeaders = new Headers()
	myHeaders.append('Authorization', `Bearer ${token}`)
	myHeaders.append('Client-ID', clientId)

	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow',
	}

	const json = await fetchWithCache(`https://api.twitch.tv/helix/users?login=${username}`, requestOptions)

	return json
}

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

	// Get Twitch Name
	const { username } = req.query

	// Get Twitch User
	const user = await GetTwitchUser(username, token)

	// Set Cache Headers
	res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=599')

	res.json(user)
}
