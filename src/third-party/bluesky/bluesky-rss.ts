// import 'dotenv/config'

import { AppBskyFeedPost } from '@atproto/api'
import { BskyAgent, RichText } from '@atproto/api'

import { fetchRemoteImageBuffer } from '@/utils/imageUtils'

// import { captureException, captureMessage } from '@sentry/node'
// import { fetchRemoteImageBuffer, getItemImage } from '../utils/imageUtils'

const username = process.env.BSKY_USERNAME
const password = process.env.BSKY_PASSWORD

const agent = new BskyAgent({
	service: 'https://bsky.social',
})

const websiteTarget = `Check out their website...`

const formatBleet = async (
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
	// const image = imageOverride ? imageOverride : getItemImage(item)
	const image = imageOverride ? imageOverride : item.imageURL
	if (image) {
		const buffer = await fetchRemoteImageBuffer(image)

		const blob = await manualUploadBlob(agent, buffer)

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

//
// TODO - Check bsky for existing bleet
//

export const postBleet = async ({ name, item, homepage, handle, hashtags, imageOverride }: BleetArgs) => {
	// Login
	const loginResponse = await agent.login({
		identifier: username!,
		password: password!,
	})
	if (!loginResponse.success) {
		console.error('BLUESKY LOGIN FAILED')
		// captureMessage('BLUESKY LOGIN FAILED', 'error')
	}

	try {
		// Generate Bleet
		const record = await formatBleet(agent, { name, item, homepage, handle, hashtags, imageOverride })

		// Post Bleet
		const post = await agent.post(record)

		console.log(`Bleeting: ${name} - ${item.title}`)
		console.log(post)
		console.log('================')

		return post
	} catch (error) {
		console.error('BLUESKY POST FAILED', error)
		// captureException(error)
		return null
	}
}

const manualUploadBlob = async (agent: BskyAgent, buffer: Buffer): Promise<ImageBlob | undefined> => {
	const jwt = agent.session?.accessJwt
	const uploadUrl = 'https://bsky.social/xrpc/com.atproto.repo.uploadBlob'

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${jwt}`,
			'Content-Type': 'image/jpeg',
		},
		body: buffer,
	}

	try {
		const resp = await fetch(uploadUrl, options)
		const json = await resp.json()

		// console.log('MANUAL UPLOAD BLOB', json)

		return json.blob
	} catch (error) {
		return
	}
}

type BleetResponse = Partial<AppBskyFeedPost.Record> & Omit<AppBskyFeedPost.Record, 'createdAt'>
interface BleetArgs {
	name: string
	// item: Partial<FeedItem>
	item: Partial<any>
	homepage?: string
	imageOverride?: string
	handle?: string[]
	hashtags?: string[]
}

interface ImageBlob {
	$type: 'blob'
	ref: {
		$link: string
	}
	mimeType: 'image/jpeg'
	size: number
}
