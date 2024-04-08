import { AppBskyFeedPost } from '@atproto/api'
import { BskyAgent, RichText } from '@atproto/api'

import { EpisodeType } from '@/getters/rss-feed/recent'
import { fetchRemoteImageBuffer } from '@/utils/imageUtils'

import { ImageBlob, manualUploadBlobToBsky } from './bluesky'

const username = process.env.BSKY_USERNAME
const password = process.env.BSKY_PASSWORD

const agent = new BskyAgent({
	service: 'https://bsky.social',
})

const websiteTarget = `Check out their website...`

//
// TODO - Check bsky for existing bleet
//

export const postRssBleet = async ({ name, item, homepage, handle, hashtags, imageOverride }: BleetArgs) => {
	// Login
	const loginResponse = await agent.login({
		identifier: username!,
		password: password!,
	})
	if (!loginResponse.success) {
		console.error('BLUESKY LOGIN FAILED')
	}

	try {
		// Generate Bleet
		const record = await formatRssBleet(agent, { name, item, homepage, handle, hashtags, imageOverride })

		// Post Bleet
		const post = await agent.post(record)

		console.log(`Bleeting: ${name} - ${item.title}`)
		console.log(post)
		console.log('================')

		return post
	} catch (error) {
		console.error('BLUESKY POST FAILED', error)
		return null
	}
}

const formatRssBleet = async (
	agent: BskyAgent,
	{ name, item, homepage, imageOverride, handle = [], hashtags = [] }: BleetArgs
): Promise<BleetResponse> => {
	const stinger = `New ${name} Content`
	let txt = `${stinger}!!!
${item.title}`

	if (homepage) {
		txt += `
${websiteTarget}`
	}

	if (handle.length) {
		txt += `
@${handle.join(' @')}`
	}

	if (hashtags.length) {
		txt += `
${hashtags.join(' ')}`
	}

	const rt = new RichText({ text: txt })
	await rt.detectFacets(agent)

	const facets = [
		...(homepage
			? [
					{
						index: {
							byteStart: txt.indexOf(websiteTarget),
							byteEnd: txt.indexOf(websiteTarget) + websiteTarget.length,
						},
						features: [
							{
								$type: 'app.bsky.richtext.facet#link',
								uri: homepage,
							},
						],
					},
			  ]
			: []),
		...(rt.facets || []),
	]

	let thumb: ImageBlob | undefined

	const image = imageOverride ? imageOverride : item.imageURL
	if (image) {
		const buffer = await fetchRemoteImageBuffer(image)

		const blob = await manualUploadBlobToBsky(agent, buffer)

		if (blob) {
			thumb = blob
		}
	}

	const record: BleetResponse = {
		text: rt.text,
		langs: ['en'],
		facets,
		embed: {
			$type: 'app.bsky.embed.external',
			external: {
				uri: item.link ? item.link : homepage ? homepage : '',
				title: item.title,
				description: stinger,
				thumb,
			},
		},
	}

	console.log('================')
	console.log(record)
	console.log('================')

	return record
}

type BleetResponse = Partial<AppBskyFeedPost.Record> & Omit<AppBskyFeedPost.Record, 'createdAt'>
interface BleetArgs {
	name: string
	item: Partial<EpisodeType>
	homepage?: string
	imageOverride?: string
	handle?: string[]
	hashtags?: string[]
}
