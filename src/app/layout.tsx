import './globals.css'

import { Analytics } from '@vercel/analytics/react'
import localFont from 'next/font/local'

import KoFi from '@/components/KoFi'
// import KoFiPanel from '@/components/KoFiPanel'
const fontRegular = localFont({
	src: '../fonts/BerkeleyMonoVariable-Regular.woff2',
})

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={fontRegular.className}>
			<head></head>
			<body>
				<h1>Shawn API</h1>
				<hr />
				{children}

				<KoFi />
				{/* <KoFiPanel /> */}
				<Analytics />
			</body>
		</html>
	)
}
