import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

// async function scrapeItems(
//   page,
//   extractItems,
//   itemCount,
//   scrollDelay = 800,
// ) {
//   let items = [];
//   try {
//     let previousHeight;
//     while (items.length < itemCount) {
//       items = await page.evaluate(extractItems);
//       previousHeight = await page.evaluate('document.body.scrollHeight');
//       await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
//       await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
//       await page.waitForTimeout(scrollDelay);
//     }
//   } catch(e) { }
//   return items;
// }

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const launchArgs = JSON.stringify({ stealth: true })
	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&launch=${launchArgs}`,
	})

	try {
		const page = await browser.newPage()

		await page.goto(url, { waitUntil: 'domcontentloaded' })

		const listItems = await page.evaluate(() => {
			const items = document.querySelectorAll('ul#g-items li')

			const data: { title: string; link: string }[] = []

			items.forEach(item => {
				const title = item.querySelector('h2')?.innerText

				if (!title) {
					return
				}

				const link = (item.querySelector('a.a-link-normal[title]') as HTMLAnchorElement)?.href

				const itemToAdd = {
					title,
					link,
				}

				data.push(itemToAdd)
			})

			console.log(data)

			return data
		})

		return NextResponse.json(listItems)
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}
