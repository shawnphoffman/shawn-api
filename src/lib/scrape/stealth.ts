// Runs in the page before any site script. Kept as one self-contained
// function because puppeteer serializes it into the browser.
export function applyStealth() {
	// Remove webdriver flag (critical for PerimeterX)
	Object.defineProperty(navigator, 'webdriver', {
		get: () => false,
	})

	// Override languages
	Object.defineProperty(navigator, 'languages', {
		get: () => ['en-US', 'en'],
	})

	// Override chrome runtime (common detection point)
	// @ts-ignore
	window.chrome = {
		runtime: {},
		loadTimes: function () {},
		csi: function () {},
		app: {},
	}

	// Override permissions
	const originalQuery = window.navigator.permissions.query
	window.navigator.permissions.query = parameters =>
		parameters.name === 'notifications'
			? Promise.resolve({ state: Notification.permission } as PermissionStatus)
			: originalQuery(parameters)

	// Override platform to appear more realistic
	Object.defineProperty(navigator, 'platform', {
		get: () => 'MacIntel',
	})

	// Override hardwareConcurrency (common fingerprinting)
	Object.defineProperty(navigator, 'hardwareConcurrency', {
		get: () => 8,
	})

	// Override deviceMemory
	Object.defineProperty(navigator, 'deviceMemory', {
		get: () => 8,
	})

	// Override maxTouchPoints (mobile detection)
	Object.defineProperty(navigator, 'maxTouchPoints', {
		get: () => 0,
	})

	// Override plugins to appear realistic
	Object.defineProperty(navigator, 'plugins', {
		get: () => {
			return [
				{
					0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
					description: 'Portable Document Format',
					filename: 'internal-pdf-viewer',
					length: 1,
					name: 'Chrome PDF Plugin',
				},
				{
					0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
					description: '',
					filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
					length: 1,
					name: 'Chrome PDF Viewer',
				},
				{
					0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
					1: { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
					description: '',
					filename: 'internal-nacl-plugin',
					length: 2,
					name: 'Native Client',
				},
			] as any
		},
	})

	// Override mimeTypes
	Object.defineProperty(navigator, 'mimeTypes', {
		get: () => {
			return [
				{
					type: 'application/pdf',
					suffixes: 'pdf',
					description: 'Portable Document Format',
					enabledPlugin: {},
				},
				{
					type: 'application/x-google-chrome-pdf',
					suffixes: 'pdf',
					description: 'Portable Document Format',
					enabledPlugin: {},
				},
			] as any
		},
	})

	// Canvas fingerprinting protection - add noise to canvas
	const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
	HTMLCanvasElement.prototype.toDataURL = function (type) {
		const context = this.getContext('2d')
		if (context) {
			const imageData = context.getImageData(0, 0, this.width, this.height)
			for (let i = 0; i < imageData.data.length; i += 4) {
				imageData.data[i] += Math.floor(Math.random() * 10) - 5
			}
			context.putImageData(imageData, 0, 0)
		}
		return originalToDataURL.apply(this, arguments as any)
	}

	// WebGL fingerprinting protection
	const getParameter = WebGLRenderingContext.prototype.getParameter
	WebGLRenderingContext.prototype.getParameter = function (parameter) {
		if (parameter === 37445) {
			return 'Intel Inc.'
		}
		if (parameter === 37446) {
			return 'Intel Iris OpenGL Engine'
		}
		return getParameter.apply(this, arguments as any)
	}

	// Override getBattery if it exists
	// @ts-ignore
	if (navigator.getBattery) {
		// @ts-ignore
		Object.defineProperty(navigator, 'getBattery', {
			get: () => {
				return () =>
					Promise.resolve({
						charging: true,
						chargingTime: 0,
						dischargingTime: Infinity,
						level: 1,
					})
			},
		})
	}

	// Override connection if it exists
	// @ts-ignore
	if (navigator.connection) {
		// @ts-ignore
		Object.defineProperty(navigator, 'connection', {
			get: () => ({
				effectiveType: '4g',
				rtt: 50,
				downlink: 10,
				saveData: false,
			}),
		})
	}

	// Override vendor
	Object.defineProperty(navigator, 'vendor', {
		get: () => 'Google Inc.',
	})

	// Override appVersion
	Object.defineProperty(navigator, 'appVersion', {
		get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	})
}
