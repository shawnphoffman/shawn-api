export type DiscordWebhookConfig = {
	id: string
	token: string
}

const webhookId = process.env.DISCORD_WEBHOOK_ID!
const webhookToken = process.env.DISCORD_WEBHOOK_TOKEN!
const webhookIdFriends = process.env.DISCORD_WEBHOOK_ID_FRIENDS!
const webhookTokenFriends = process.env.DISCORD_WEBHOOK_TOKEN_FRIENDS!
const webhookIdDev = process.env.DEV_WEBHOOK_ID!
const webhookTokenDev = process.env.DEV_WEBHOOK_TOKEN!
const webhookIdYouTube = process.env.WEBHOOK_ID_YOUTUBE!
const webhookTokenYouTube = process.env.WEBHOOK_TOKEN_YOUTUBE!
const webhookIdShawnDev = process.env.DISCORD_WEBHOOK_ID_SHAWN_DEV!
const webhookTokenShawnDev = process.env.DISCORD_WEBHOOK_TOKEN_SHAWN_DEV!

const BlueHarvest: DiscordWebhookConfig = {
	id: webhookId,
	token: webhookToken,
}
const Friends: DiscordWebhookConfig = {
	id: webhookIdFriends,
	token: webhookTokenFriends,
}
const YouTube: DiscordWebhookConfig = {
	id: webhookIdYouTube,
	token: webhookTokenYouTube,
}
const Dev: DiscordWebhookConfig = {
	id: webhookIdDev,
	token: webhookTokenDev,
}
const ShawnDev: DiscordWebhookConfig = {
	id: webhookIdShawnDev,
	token: webhookTokenShawnDev,
}

type WebhookChannelType = {
	[key: string]: DiscordWebhookConfig
}

const WebhookChannel: WebhookChannelType = {
	BlueHarvest,
	Friends,
	YouTube,
	Dev,
	ShawnDev,
} as const

export default WebhookChannel
