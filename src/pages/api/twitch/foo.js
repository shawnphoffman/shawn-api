// import { ClientCredentialsAuthProvider } from '@twurple/auth'
// import { ApiClient } from '@twurple/api'

// const clientId = process.env.TWITCH_CLIENT_ID
// const clientSecret = process.env.TWITCH_CLIENT_SECRET
// const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret)
// const apiClient = new ApiClient({ authProvider })

export default async function handler(req, res) {
	res.status(200).json({ temp: 'sub' })
}
