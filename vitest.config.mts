import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		// No test may reach the network; each one stubs fetch or the module it needs
		unstubGlobals: true,
		restoreMocks: true,
	},
})
