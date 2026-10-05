import type { AtpAgent } from '@atproto/api'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('./agent', () => ({ getBskyAgent: vi.fn() }))

import { uploadImageToBsky } from './bluesky'

describe('uploadImageToBsky', () => {
	it('uploads through the agent with the image type and returns its blob', async () => {
		const blob = { ref: 'bafy' }
		const uploadBlob = vi.fn().mockResolvedValue({ data: { blob } })
		const agent = { uploadBlob } as unknown as AtpAgent

		expect(await uploadImageToBsky(agent, Buffer.from('png-bytes'), 'image/png')).toBe(blob)
		const [data, opts] = uploadBlob.mock.calls[0]
		expect(data).toBeInstanceOf(Uint8Array)
		expect(Buffer.from(data).toString()).toBe('png-bytes')
		expect(opts.encoding).toBe('image/png')
	})

	it('defaults to JPEG', async () => {
		const uploadBlob = vi.fn().mockResolvedValue({ data: { blob: {} } })
		await uploadImageToBsky({ uploadBlob } as unknown as AtpAgent, Buffer.from('x'))
		expect(uploadBlob.mock.calls[0][1].encoding).toBe('image/jpeg')
	})
})
