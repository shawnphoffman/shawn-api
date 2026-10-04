import { log } from 'next-axiom'
import { NextResponse } from 'next/server'

type Section = { name: string; run: () => Promise<string> }

type SectionResult = { name: string; ok: boolean; output?: string; error?: string }

/**
 * Runs a job's sections one after another. A section that throws is recorded
 * and the rest still run. Responds 200 when every section worked and 500 when
 * any failed, so the scheduler sees the failure.
 */
export async function runSections(sections: Section[]): Promise<NextResponse> {
	const results: SectionResult[] = []
	for (const section of sections) {
		try {
			results.push({ name: section.name, ok: true, output: await section.run() })
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			log.error(`${section.name} failed`, { error: message })
			results.push({ name: section.name, ok: false, error: message })
		}
	}

	const ok = results.every(r => r.ok)
	return NextResponse.json({ ok, sections: results }, { status: ok ? 200 : 500 })
}
