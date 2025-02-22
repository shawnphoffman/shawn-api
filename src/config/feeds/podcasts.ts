import WebhookChannel from '@/third-party/discord/webhookChannels'

import type { PodFeedConfig } from './types'

export const podcastFeeds: PodFeedConfig[] = [
	{
		name: 'Blue Harvest',
		url: 'https://feed.podbean.com/blueharvestpodcast/feed.xml',
		event: 'blue-harvest',
		channel: WebhookChannel.BlueHarvest,
		bluesky: true,
		bskyHandle: ['blueharvest.bsky.social'],
		homepage: 'https://blueharvest.rocks',
		refreshUrls: ['https://blueharvest.rocks/api/revalidate/episodes?force=true', 'https://blueharvest.rocks/episodes'],
		hashtags: ['#StarWars', '#Podcast', '#BlueHarvest'],
	},
	{
		name: 'Blue Harvest Patreon',
		url: process.env.RSS_BLUE_HARVEST_PATREON!,
		event: 'blue-harvest-patreon',
		channel: WebhookChannel.BlueHarvest,
		bluesky: false,
		ping: false,
		refreshUrls: ['https://blueharvest.rocks/api/revalidate/patreon?force=true', 'https://blueharvest.rocks/patreon-preview'],
		hashtags: ['#StarWars', '#Podcast', '#BlueHarvest'],
	},
	{
		name: 'High Potion',
		url: 'https://anchor.fm/s/5dc2916c/podcast/rss',
		event: 'high-potion',
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['blueharvest.bsky.social', 'stonedcobra.bsky.social'],
		homepage: 'https://myweirdfoot.com',
		refreshUrls: ['https://myweirdfoot.com/api/revalidate/episodes?force=true', 'https://myweirdfoot.com/episodes'],
		hashtags: ['#VideoGames', '#Podcast', '#HighPotion'],
	},
	{
		name: 'Jammed Transmissions',
		url: 'https://anchor.fm/s/d8972e20/podcast/rss',
		event: 'jammed-transmissions',
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['jammedtransmissions.com'],
		homepage: 'https://jammedtransmissions.com',
		refreshUrls: ['https://jammedtransmissions.com/api/revalidate/episodes?force=true', 'https://jammedtransmissions.com/episodes'],
		hashtags: ['#StarWars', '#Podcast', '#JammedTransmissions'],
	},
	{
		name: 'Canto Bight',
		url: 'https://feeds.soundcloud.com/users/soundcloud:users:354222428/sounds.rss',
		event: 'canto-bight',
		channel: WebhookChannel.Friends,
		bskyHandle: ['cantobightpod.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#CantoBight'],
	},
	{
		name: 'The Sith List',
		url: 'https://anchor.fm/s/2bd2304/podcast/rss',
		event: 'sith-list',
		channel: WebhookChannel.Friends,
		bluesky: true,
		bskyHandle: ['sithlist.bsky.social'],
		homepage: 'https://sithlist.com/',
		hashtags: ['#StarWars', '#Podcast', '#SithList'],
	},
	{
		name: 'Scruffy Looking Podcasters',
		url: 'https://feed.podbean.com/scruffypodcasters/feed.xml',
		event: 'scruffys',
		channel: WebhookChannel.Friends,
		bluesky: true,
		refreshUrls: ['https://scruffypod.com/api/revalidate/episodes?force=true', 'https://scruffypod.com/episodes'],
		homepage: 'https://scruffypod.com',
		hashtags: ['#StarWars', '#Podcast', '#ScruffyLookingPodcasters'],
	},
	{
		name: 'Rogue Rebels',
		url: 'https://anchor.fm/s/4fe27918/podcast/rss',
		event: 'rogue-rebels',
		channel: WebhookChannel.Friends,
		bluesky: true,
		homepage: 'https://theroguerebels.com/',
		bskyHandle: ['theroguerebels.com'],
		hashtags: ['#StarWars', '#Podcast', '#RogueRebels'],
	},
	// {
	// 	name: 'Rogue Rebels Blog',
	// 	url: 'https://theroguerebels.com/feed',
	// 	event: 'rogue-rebels-blog',
	// 	channel: WebhookChannel.Friends,
	// 	bluesky: true,
	// 	homepage: 'https://theroguerebels.com/',
	// 	bskyHandle: ['theroguerebels.com'],
	// 	hashtags: ['#StarWars', '#RogueRebels'],
	// },
	{
		name: 'Star Wars Spelt Out',
		url: 'https://anchor.fm/s/f4ac5590/podcast/rss',
		event: 'spelt-out',
		channel: WebhookChannel.Friends,
		bskyHandle: ['starwarsspeltout.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#StarWarsSpeltOut'],
	},
	{
		name: 'That Geek Pod',
		url: 'https://feed.podbean.com/thatgeekpod/feed.xml',
		event: 'geek-pod',
		channel: WebhookChannel.Friends,
		bskyHandle: ['catherinekneen.bsky.social', 'thatgeekpod.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#ThatGeekPod'],
	},
	{
		name: 'Steele Wars',
		url: 'https://feeds.acast.com/public/shows/6d969aa5-8ed7-4683-88f6-d9dce2d9b226',
		event: 'steele-wars',
		// homepage: 'http://steelewars.com/',
		bskyHandle: ['steelewars.bsky.social'],
		bluesky: true,
		hashtags: ['#StarWars', '#Podcast', '#SteeleWars'],
	},
	{
		name: 'Gunga Beach',
		url: 'https://gungabeachpodcast.podomatic.com/rss2.xml',
		event: 'gunga-beach',
		bluesky: true,
		channel: WebhookChannel.Friends,
		bskyHandle: ['stevemac79.bsky.social', 'brettpaci.bsky.social'],
		hashtags: ['#StarWars', '#Podcast', '#GungaBeach'],
	},
	{
		name: `Bluey Podcast`,
		url: 'https://anchor.fm/s/bdcbfb70/podcast/rss',
		event: 'bluey-pod',
		homepage: 'https://blueypodcast.com',
		bluesky: false,
		refreshUrls: ['https://blueypodcast.com/api/revalidate/episodes?force=true', 'https://blueypodcast.com/episodes'],
		hashtags: ['#Bluey', '#Podcast', '#DinnerWithTheHeelers'],
	},
	{
		name: `Just Shillin'`,
		url: 'https://feeds.zencastr.com/f/l5bmy6wm.rss',
		event: 'just-shillin-pod',
		channel: WebhookChannel.Friends,
		homepage: 'https://justshillin.com',
		bluesky: true,
		bskyHandle: ['shawn.justshillin.com', 'minganna1972.bsky.social'],
		refreshUrls: ['https://justshillin.com/api/revalidate/episodes?force=true', 'https://justshillin.com/episodes'],
		hashtags: ['#StarWars', '#Podcast', '#JustShillin'],
	},
]
