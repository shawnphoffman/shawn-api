'use client'

import { useCallback, useEffect } from 'react'

export default function KoFi() {
	const drawOverlay = useCallback(() => {
		window.kofiWidgetOverlay.draw('shawnhoffman', {
			type: 'floating-chat',
			'floating-chat.donateButton.text': 'Support me',
			'floating-chat.donateButton.background-color': '#00bfa5',
			'floating-chat.donateButton.text-color': '#fff',
		})
	}, [])

	useEffect(() => {
		const url = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
		let exists = document.querySelector(`script[src="${url}"]`)

		if (exists) {
			console.log('already loaded')
			return
		}

		const script = document.createElement('script')
		script.src = url
		// script.async = true
		script.onload = () => drawOverlay()

		document.body.appendChild(script)
	}, [drawOverlay])

	return null
}
