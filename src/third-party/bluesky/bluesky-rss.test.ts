import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
const resolveHandle = vi.fn(async ({ handle }: { handle: string }) => ({ success: true, data: { did: `did:plc:${handle.split('.')[0]}` } }))
// Covers both places RichText.detectFacets has looked up handles across @atproto/api versions
const fakeAgent = { post, resolveHandle, com: { atproto: { identity: { resolveHandle } } } }
vi.mock('./agent', () => ({ getBskyAgent: async () => fakeAgent }))

const manualUploadBlobToBsky = vi.fn()
vi.mock('./bluesky', () => ({ manualUploadBlobToBsky: (...a: unknown[]) => manualUploadBlobToBsky(...a) }))
const fetchRemoteImageBuffer = vi.fn()
vi.mock('@/utils/imageUtils', () => ({ fetchRemoteImageBuffer: (...a: unknown[]) => fetchRemoteImageBuffer(...a) }))
vi.mock('@/utils/blueskyThrottle', () => ({ getHandleDelay: async () => 0, recordHandleMentions: async () => {} }))

import { postRssBleet } from './bluesky-rss'

const item = { title: 'Episode 570: New Stuff', link: 'https://blueharvest.rocks/570', imageURL: 'https://example.com/570.jpg' }

beforeEach(() => {
	post.mockReset().mockResolvedValue({ uri: 'at://did:plc:me/app.bsky.feed.post/1', cid: 'cid1' })
	fetchRemoteImageBuffer.mockReset().mockResolvedValue(Buffer.from('jpeg'))
	manualUploadBlobToBsky.mockReset().mockResolvedValue({ $type: 'blob', ref: { $link: 'bafy' }, mimeType: 'image/jpeg', size: 4 })
	vi.spyOn(console, 'log').mockImplementation(() => {})
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

const sendIt = () =>
	postRssBleet({
		name: 'Blue Harvest',
		item,
		homepage: 'https://blueharvest.rocks',
		handle: ['blueharvest.bsky.social'],
		hashtags: ['#StarWars', '#Podcast'],
	})

describe('postRssBleet', () => {
	it('posts the title, a homepage link, the mention and the hashtags with a link card', async () => {
		await sendIt()
		const record = post.mock.calls[0][0]
		expect(record.text).toBe(
			'New Blue Harvest Content!!!\nEpisode 570: New Stuff\nCheck out their website...\n@blueharvest.bsky.social\n#StarWars #Podcast'
		)
		const features = record.facets.flatMap((f: { features: { $type: string }[] }) => f.features)
		expect(features).toContainEqual({ $type: 'app.bsky.richtext.facet#link', uri: 'https://blueharvest.rocks' })
		expect(features).toContainEqual({ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:blueharvest' })
		expect(features).toContainEqual({ $type: 'app.bsky.richtext.facet#tag', tag: 'StarWars' })
		expect(record.embed).toMatchObject({
			$type: 'app.bsky.embed.external',
			external: { uri: 'https://blueharvest.rocks/570', title: 'Episode 570: New Stuff', description: 'New Blue Harvest Content' },
		})
		expect(record.embed.external.thumb).toMatchObject({ ref: { $link: 'bafy' } })
	})

	it('links the homepage text to the right bytes of the post', async () => {
		await sendIt()
		const record = post.mock.calls[0][0]
		const link = record.facets.find((f: { features: { $type: string }[] }) => f.features[0].$type === 'app.bsky.richtext.facet#link')
		const bytes = Buffer.from(record.text)
		expect(bytes.subarray(link.index.byteStart, link.index.byteEnd).toString()).toBe('Check out their website...')
	})

	it('still posts, without a thumbnail, when the image cannot be fetched', async () => {
		fetchRemoteImageBuffer.mockRejectedValue(new Error('image 404'))
		await sendIt()
		expect(post).toHaveBeenCalledOnce()
		expect(post.mock.calls[0][0].embed.external.thumb).toBeUndefined()
	})

	it('throws when Bluesky refuses the post, so it is not recorded as sent', async () => {
		post.mockRejectedValue(new Error('rate limited'))
		await expect(sendIt()).rejects.toThrow('rate limited')
	})
})
