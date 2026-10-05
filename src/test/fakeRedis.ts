/**
 * In-memory stand-in for the parts of @upstash/redis the jobs use, so tests
 * never touch the real Redis. Mock '@/utils/redis' to return it.
 */
export function createFakeRedis() {
	const sets = new Map<string, Set<string>>()
	const values = new Map<string, unknown>()
	const hashes = new Map<string, Record<string, number>>()

	return {
		sets,
		values,
		hashes,
		async hgetall(key: string) {
			return hashes.has(key) ? { ...hashes.get(key)! } : null
		},
		async hincrby(key: string, field: string, by: number) {
			const hash = hashes.get(key) ?? {}
			hash[field] = (hash[field] ?? 0) + by
			hashes.set(key, hash)
			return hash[field]
		},
		async hdel(key: string, field: string) {
			const hash = hashes.get(key)
			if (!hash || !(field in hash)) return 0
			delete hash[field]
			return 1
		},
		async sismember(key: string, member: string) {
			return sets.get(key)?.has(member) ? 1 : 0
		},
		async sadd(key: string, member: string) {
			if (!sets.has(key)) sets.set(key, new Set())
			sets.get(key)!.add(member)
			return 1
		},
		async get(key: string) {
			return values.has(key) ? values.get(key) : null
		},
		async set(key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) {
			if (opts?.nx && values.has(key)) return null
			values.set(key, value)
			return 'OK'
		},
		// Only the lock release script is used: delete KEYS[1] if it holds ARGV[1]
		async eval(_script: string, keys: string[], args: unknown[]) {
			if (values.get(keys[0]) === args[0]) {
				values.delete(keys[0])
				return 1
			}
			return 0
		},
	}
}

export type FakeRedis = ReturnType<typeof createFakeRedis>
