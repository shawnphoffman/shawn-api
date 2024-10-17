import { NextResponse } from 'next/server'
import puppeteer, { Page } from 'puppeteer'

export const maxDuration = 60

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

// Melissa: https://www.amazon.com/hz/wishlist/ls/171GNLZ1NNLL8?ref_=list_d_wl_lfu_nav_9
// Shawn: https://www.amazon.com/hz/wishlist/ls/3TBI1L7T5L35V/ref=nav_wishlist_lists_1

function extractItems() {
	console.log('extracting')
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
	// /*  For extractedElements, you are selecting the tag and class,
	// 		that holds your desired information,
	// 		then choosing the disired child element you would like to scrape from.
	// 		in this case, you are selecting the
	// 		"<div class=blog-post />" from "<div class=container />" See below: */
	// 	const extractedElements = document.querySelectorAll('#container > div.blog-post');
	// 	const items = [];
	// 	for (let element of extractedElements) {
	// 		items.push(element.innerText);
	// 	}
	// 	return items;
}

async function scrapeItems(page: Page, extractItems, itemCount, scrollDelay = 2000) {
	let items = []
	console.log('scraping')
	try {
		let previousHeight
		while (items.length < itemCount) {
			console.log('items.length', items.length)
			console.log('itemsCount', itemCount)
			items = await page.evaluate(extractItems)
			previousHeight = await page.evaluate('document.body.scrollHeight')
			console.log('debug', { previousHeight, l: items.length })
			await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

			const scrollSuccess = await Promise.race([
				page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`),
				new Promise<boolean>(res => setTimeout(() => res(false), 5000)),
			])

			if (!scrollSuccess) {
				console.log('Scroll timeout, exiting loop')
				break
			}

			await new Promise(res => setTimeout(res, scrollDelay))
		}
	} catch (e) {
		console.log('error', e)
	}
	return items
}

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
		page.setViewport({ width: 1280, height: 900 })

		// await page.goto(url, { waitUntil: 'domcontentloaded' })
		await page.goto(url)

		// const listItems = await page.evaluate(() => {})
		const listItems = await scrapeItems(page, extractItems, 100)

		return NextResponse.json(listItems)
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}
