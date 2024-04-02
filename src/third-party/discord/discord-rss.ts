// import 'dotenv/config'

// import * as Sentry from '@sentry/node'
// import { MessageFlags, WebhookClient } from 'discord.js'

// import type { DiscordWebhookConfig } from '../types'

// const botToken = process.env.DISCORD_BOT_TOKEN

// const formatPodcastBody = (name, item, homepage) => {
// 	// const cleanDate = new Date(item.pubDate).getTime() / 1000
// 	// const duration = item['itunes:duration']?.['#']
// 	return `**${name}**
// [*${item.title}*](${item.link || homepage})`
// 	// 	*Title*: [*${item.title}*](${item.link})${
// 	// 		duration
// 	// 			? `
// 	// *Duration*: ${duration}`
// 	// 			: ''
// 	// 	}`
// 	// *Date*: <t:${cleanDate}:d>${
// }

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
// 		Sentry.captureException(e)
// 		console.log(`Webhook Error: (${item.title})`)
// 		console.error(e)
// 	}
// }

// export const sendWebhook = async (name, item, avatar, webhook, homepage) => {
// 	try {
// 		const webhookClient = new WebhookClient({
// 			id: webhook.id,
// 			token: webhook.token,
// 		})

// 		const content = formatPodcastBody(name, item, homepage)

// 		const msg = await webhookClient.send({
// 			content,
// 			username: `Podcast Bot (${name})`,
// 			avatarURL: avatar || 'https://blueharvest.rocks/bots/bh_blue@2x.png',
// 			// embeds: [embed],
// 			flags: MessageFlags.SuppressEmbeds,
// 		})

// 		console.log(`Webhook Success (${item.title})`)

// 		if (msg && msg.id && msg.channel_id && msg.author?.bot) {
// 			await crossPostMessage(msg.channel_id, msg.id)
// 		}

// 		return msg
// 	} catch (e) {
// 		Sentry.captureException(e)
// 		console.log(`Webhook Error: (${item.title})`)
// 		console.error(e)
// 	}
// }

// const crossPostMessage = async (channelId, messageId) => {
// 	try {
// 		const url = `https://discord.com/api/channels/${channelId}/messages/${messageId}/crosspost`
// 		const options = {
// 			method: 'POST',
// 			headers: {
// 				Authorization: `Bot ${botToken}`,
// 			},
// 		}
// 		const resp = await fetch(url, options)
// 		const json = await resp.json()

// 		if (json && json.flags === 1) {
// 			console.log(`CrossPost Success (${messageId})`)
// 		}
// 	} catch (e) {
// 		Sentry.captureException(e)
// 		console.log(`CrossPost Error (${messageId})`)
// 		console.error(e)
// 	}
// }

// export const sendNonPodWebhookRaw = async (username: string, webhook: DiscordWebhookConfig, content: any) => {
// 	try {
// 		const webhookClient = new WebhookClient({
// 			id: webhook.id,
// 			token: webhook.token,
// 		})

// 		await webhookClient.send({
// 			content,
// 			username,
// 		})
// 	} catch (e) {
// 		Sentry.captureException(e)
// 		console.error(e)
// 	}
// }
