import { MessageFlags, WebhookClient } from 'discord.js'

import { EpisodeType } from '@/getters/rss-feed/recent'

import { crossPostMessage } from './discord'
import { DiscordWebhookConfig } from './webhookChannels'

// import type { DiscordWebhookConfig } from '../types'

const botToken = process.env.DISCORD_BOT_TOKEN!

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
		const webhookClient = new WebhookClient({
			id: webhook.id,
			token: webhook.token,
		})

		const content = `**${name}**
[*${item.title}*](${item.link || homepage})`

		const msg = await webhookClient.send({
			content,
			username: `Podcast Bot (${name})`,
			avatarURL: avatar || 'https://blueharvest.rocks/bots/bh_blue@2x.png',
			flags: MessageFlags.SuppressEmbeds,
		})

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
		const webhookClient = new WebhookClient({
			id: webhook.id,
			token: webhook.token,
		})

		await webhookClient.send({
			content,
			username,
		})
	} catch (e) {
		console.error(e)
	}
}
