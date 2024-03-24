import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'

const clientId = process.env.TWITCH_CLIENT_ID
const clientSecret = process.env.TWITCH_CLIENT_SECRET

export default async function handler(req, res) {
	const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret)
	const apiClient = new ApiClient({ authProvider })

	const user = await apiClient.users.getUserByName('ice_planet_hoff')
	// const user = await apiClient.users.getUserByName('blueharvestpod')
	const follows = await apiClient.users.getFollowsPaginated({ followedUser: user.id })

	// let page
	// const result = []
	// while ((page = await follows.getNext()).length) {
	// 	result.push(...page)
	// }
	const result = await follows.getAll()

	const resp = {
		id: user.id,
		displayName: user.displayName,
		description: user.description,
		profilePictureUrl: user.profilePictureUrl,
		followers: result.map(f => f.userName),
		followerCount: result.length,
	}

	console.log(resp)

	res.status(200).json({ temp: 'woo', resp })
}
