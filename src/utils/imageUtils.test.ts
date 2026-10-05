import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { fetchRemoteImageBuffer, getContentType } from './imageUtils'

describe('fetchRemoteImageBuffer', () => {
	it('turns any image into a 600x320 JPEG card with a blurred backdrop', async () => {
		const png = await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 40, b: 40 } } })
			.png()
			.toBuffer()
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(png))))

		const out = await fetchRemoteImageBuffer('https://example.com/cover.png')
		const meta = await sharp(out).metadata()
		expect(meta.format).toBe('jpeg')
		expect([meta.width, meta.height]).toEqual([600, 320])
	})
})

describe('getContentType', () => {
	it('maps image extensions to MIME types', () => {
		expect(getContentType('https://x.com/a.PNG')).toBe('image/png')
		expect(getContentType('https://x.com/a.jpg')).toBe('image/jpeg')
		expect(getContentType('https://x.com/a.webp')).toBe('image/webp')
	})
})
