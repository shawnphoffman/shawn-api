import { AtpAgent, BlobRef, RichText } from '@atproto/api'
// import { captureException, captureMessage } from '@sentry/node'
import { log } from 'next-axiom'

import { fetchRemoteImageBuffer, getContentType, getOgImageUrl } from '@/utils/imageUtils'
import { getHandleDelay, recordHandleMentions } from '@/utils/blueskyThrottle'

import { getBskyAgent } from './agent'
// import { addToStarWarsFeed } from './shawnbot'

type PostBleetProps = {
	contentType?: string
	items: string
	url?: string
	title: string
	desc?: string
	handle?: string[]
}

const websiteTarget = `Click here for more...`

const formatBleet = async (agent, { contentType, items, url, title, desc }: PostBleetProps) => {
	const hasContentType = !!contentType

	const stinger = hasContentType ? `New Star Wars ${contentType}` : ''
	let txt = hasContentType
		? `${stinger}!!!
${items}`
		: items

	if (hasContentType && url) {
		txt += `
${websiteTarget}`
	}

	const rt = new RichText({ text: txt })
	await rt.detectFacets(agent)

	const facets = [
		...(hasContentType && url
			? [
					{
						index: {
							byteStart: txt.indexOf(websiteTarget),
							byteEnd: txt.indexOf(websiteTarget) + websiteTarget.length,
						},
						features: [
							{
								$type: 'app.bsky.richtext.facet#link',
								uri: url,
							},
						],
					},
				]
			: []),
		...(rt.facets || []),
	]

	const record = {
		text: rt.text,
		langs: ['en-US'],
		facets,
		embed: url
			? {
					$type: 'app.bsky.embed.external',
					external: {
						uri: url ? url : '',
						title: title || stinger,
						description: desc || stinger || '',
					},
				}
			: undefined,
	}

	// The thumbnail is optional; post without one rather than not at all
	if (url) {
		try {
			const imageUrl = await getOgImageUrl(url)
			if (imageUrl) {
				const buffer = await fetchRemoteImageBuffer(imageUrl)

				const mimetype = getContentType(imageUrl)

				const blob = await uploadImageToBsky(agent, buffer, mimetype)

				if (blob) {
					// @ts-expect-error thumb!
					record.embed.external.thumb = blob
				}
			}
		} catch (error) {
			log.warn('Bluesky thumbnail skipped', { url, error: String(error) })
		}
	}

	log.info('================')
	log.info('record', record)
	log.info('================')

	return record
}

//
// TODO - Check bsky for existing bleet
//

export const postBleetToBsky = async ({ contentType, items, url, title, desc, handle }: PostBleetProps) => {
	const agent = await getBskyAgent()

	// try {
	// Generate Bleet
	const record = await formatBleet(agent, { contentType, items, url, title, desc })

	// Check if we need to delay posting to avoid spamming handles
	const handles = handle || []
	const delay = await getHandleDelay(handles)
	if (delay > 0) {
		log.info(`Delaying Bluesky post by ${delay}ms to respect handle throttling`, { handles, delay })
		await new Promise(resolve => setTimeout(resolve, delay))
	}

	// Post Bleet
	const post = await agent.post(record)

	// Record that we mentioned these handles
	if (handles.length > 0) {
		await recordHandleMentions(handles)
	}

	log.info(`Bleeting: ${contentType || 'NO TYPE'}`)
	log.info('post', post)
	log.info('================')

	// if (post?.cid) {
	// 	await addToStarWarsFeed({ cid: post.cid, uri: post.uri, indexedAt: new Date().toISOString() })
	// }

	return post
	// } catch (error) {
	// 	log.error('BLUESKY POST FAILED', error)
	// 	// captureException(error)
	// 	return null
	// }
}

// Uploads through the agent, which talks to the account's own server and refreshes its session as needed
export const uploadImageToBsky = async (agent: AtpAgent, buffer: Buffer, mimetype?: string): Promise<BlobRef> => {
	const res = await agent.uploadBlob(new Uint8Array(buffer), {
		encoding: mimetype || 'image/jpeg',
		signal: AbortSignal.timeout(30000),
	})
	return res.data.blob
}
