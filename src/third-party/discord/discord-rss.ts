import { EpisodeType } from '@/getters/rss-feed/recent'

import { crossPostMessage } from './discord'
import { DiscordWebhookConfig } from './webhookChannels'

// const botToken = process.env.DISCORD_BOT_TOKEN!

// export const sendWebhookRaw = async (name, item, avatar, webhook, content) => {
// 	try {
// 		const webhookClient = new WebhookClient({
// 			id: webhook.id,
// 			token: webhook.token,
// 		})

// 		const msg = await webhookClient.send({
// 			content,
// 			username: `Podcast Bot (${name})`,
// 			avatarURL: avatar || 'https://blueharvest.rocks/bots/bh_purple@2x.png',
// 			// embeds: [embed],
// 			// flags: MessageFlags.SuppressEmbeds,
// 		})

// 		console.log(`Webhook Success (${item.title})`)

// 		if (msg && msg.id && msg.channel_id && msg.author?.bot) {
// 			await crossPostMessage(msg.channel_id, msg.id)
// 		}
// 	} catch (e) {
// 		console.log(`Webhook Error: (${item.title})`)
// 		console.error(e)
// 	}
// }

type RssDiscordWebhookProps = {
	/** The name of the podcast/feed */
	name: string
	/** */
	item: EpisodeType
	/** */
	avatar: string
	/** */
	webhook: DiscordWebhookConfig
	/** */
	homepage?: string
}

export const sendRssWebhook = async ({ name, item, avatar, webhook, homepage }: RssDiscordWebhookProps) => {
	try {
		const content = `**${name}**
[*${item.title}*](${item.link || homepage})`

		const url = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`

		var myHeaders = new Headers()
		myHeaders.append('Content-Type', 'application/json')

		var requestOptions = {
			headers: myHeaders,
			method: 'POST',
			body: JSON.stringify({
				content,
				username: `Podcast Bot (${name})`,
				avatarURL: avatar || 'https://blueharvest.rocks/bots/bh_blue@2x.png',
				flags: 4,
			}),
		}

		const response = await fetch(url, requestOptions)
		const msg = await response.json()

		console.log(`Webhook Success (${item.title})`)

		if (msg && msg.id && msg.channel_id && msg.author?.bot) {
			await crossPostMessage(msg.channel_id, msg.id)
		}

		return msg
	} catch (e) {
		console.log(`Webhook Error: (${item.title})`)
		console.error(e)
	}
}

type NonPodDiscordWebhookProps = {
	/** */
	username: string
	/** */
	webhook: DiscordWebhookConfig
	/** */
	content: any
}

export const sendNonPodWebhookRaw = async ({ username, webhook, content }: NonPodDiscordWebhookProps) => {
	try {
		const url = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`

		var myHeaders = new Headers()
		myHeaders.append('Content-Type', 'application/json')

		var requestOptions = {
			headers: myHeaders,
			method: 'POST',
			body: JSON.stringify({
				content,
				username,
			}),
		}

		await fetch(url, requestOptions)
	} catch (e) {
		console.error(e)
	}
}
