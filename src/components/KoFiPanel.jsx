'use client'

export default function KoFiPanel() {
	return (
		<div className="kofiContainer">
			<iframe
				id="kofiframe"
				src="https://ko-fi.com/shawnhoffman/?hidefeed=true&widget=true&embed=true&preview=true"
				className="kofiFrame"
				height="712"
				title="shawnhoffman"
			></iframe>
		</div>
	)
}
