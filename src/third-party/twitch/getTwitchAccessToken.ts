import fetchWithCache from '@/utils/fetchWithCache'

const clientId = process.env.TWITCH_CLIENT_ID
const clientSecret = process.env.TWITCH_CLIENT_SECRET

async function GetTwitchAccessToken() {
	var myHeaders = new Headers()
	myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

	var urlencoded = new URLSearchParams()
	urlencoded.append('client_id', clientId!)
	urlencoded.append('client_secret', clientSecret!)
	urlencoded.append('grant_type', 'client_credentials')

	var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
		redirect: 'follow',
	}

	const json = await fetchWithCache('https://id.twitch.tv/oauth2/token', requestOptions)

	const token = json.access_token

	return token
}

export default GetTwitchAccessToken
