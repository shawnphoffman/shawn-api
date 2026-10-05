import { describe, expect, it } from 'vitest'

import { parseChallenges } from './challenges'

// Trimmed from the real challenges page (2026-10-05). The image wrapper carries a <noscript> copy of
// the <img>, which cheerio reads as text; it used to leak into the reward count and post "ˣNaN".
const challenge = (title: string, reward: string, qty: number, taskClass: string, task: string) =>
	`<li><div class="challenge_challenge_title__Qfyup"><h3>${title}</h3>` +
	`<p class="challenge_end_date__iQSwN">Valid Until<!-- -->：<!-- -->11/01/2026 06:59</p></div>` +
	`<div class="challenge_challenge_content__XgZZG"><dl class="challenge_reward__Qc1uq"><dt>Rewards</dt><dd>` +
	`<div class="challenge_image__qshvD"><span><span><noscript><img alt="${reward}" src="/x.png"/></noscript></span></span></div>` +
	`<div class="challenge_challenge_modal__213lG "><div class="challenge_inner__nyCcS"><dl>` +
	`<dt>${reward}<!-- --> × <span>${qty}</span></dt><dd><p><span><noscript><img alt="${reward}" src="/x.png"/></noscript></span></p></dd></dl></div></div>` +
	`<p>${reward}<br/>× <span>${qty}</span></p></dd></dl>` +
	`<dl class="challenge_task__EsBxv"><dt>Tasks</dt><dd><ul><li class="${taskClass}">${task}</li></ul></dd></dl></div></li>`

const page = (...items: string[]) => `<html><body><ul class="challenge_challenge_list__5HV1K">${items.join('')}</ul></body></html>`

describe('parseChallenges', () => {
	it('reads the reward name and count', () => {
		const challenges = parseChallenges(
			page(
				challenge('Monthly Challenge 3', 'Drive Ticket', 500, 'challenge_type1__mibJ_', 'Fight in 10 Random Avatar Matches.'),
				challenge('Weekly Challenge 1', 'Kudos', 200, 'challenge_type3__dK0Uv', 'Fight in 1 extreme battle from a cabinet')
			)
		)
		expect(challenges).toEqual([
			{
				title: 'Monthly Challenge 3',
				endDate: '11/01/2026 06:59',
				reward: { item: 'Drive Ticket', qty: 500 },
				tasks: [{ mode: 'Fighting Ground', description: 'Fight in 10 Random Avatar Matches.' }],
			},
			{
				title: 'Weekly Challenge 1',
				endDate: '11/01/2026 06:59',
				reward: { item: 'Kudos', qty: 200 },
				tasks: [{ mode: 'Battle Hub', description: 'Fight in 1 extreme battle from a cabinet' }],
			},
		])
	})

	it('returns no challenges for a page without the list', () => {
		expect(parseChallenges('<html><body>Maintenance</body></html>')).toEqual([])
	})
})
