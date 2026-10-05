# Shawn API

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K7NNOUK)

<!-- ko-fi colors -->
<!-- #FF5E5B -->
<!-- #13C3FF -->
<!-- #FBAA19 -->
<!-- #434B57 -->


## How it runs

One branch, `main`, deploys to two places from the same code.

| Where | What it does | How it deploys |
| --- | --- | --- |
| **Vercel** (`api.shawn.party`) | Answers requests from the podcast sites, giftwrapt and other sites: ratings, Open Graph and scraping, the Sanity relay, webhooks. Runs no scheduled jobs. | Every push to `main` |
| **Mac mini** (Docker) | Runs every scheduled job: the posts to Discord and Bluesky, and the Goodpods awards sync. A Cronicle scheduler on the same machine calls them. | A Dockhand git stack builds `docker-compose.yml` on the mini through a Hawser Edge agent, daily and on demand |

Browser scraping does not depend on where the app runs: every Puppeteer route connects to a remote browser at `PUPPETEER_WSS`. Goodpods sits behind a Cloudflare bot check that stops that browser, so on the Mac mini the Goodpods scraper goes through Byparr, a Cloudflare solver that runs as a second service in `docker-compose.yml` (`FLARESOLVERR_URL`). Vercel has no solver, so all Goodpods data comes from the Mac mini's awards sync, which writes the awards to Sanity and fills the shared cache the sites' rating route reads.

### Scheduled jobs

| Job name | Route | Runs on |
| --- | --- | --- |
| `podcast-check` | `/api/podcast-data/check` | Mac mini |
| `star-wars-frequent` | `/api/star-wars/check/frequent` | Mac mini |
| `star-wars-daily` | `/api/star-wars/check/daily` | Mac mini |
| `sf6-daily` | `/api/sf6/discord/daily-challenges` | Mac mini |
| `sync-awards` | `/api/podcast-data/sync-awards` | Mac mini |

Every job route goes through `src/lib/jobs/guard.ts`:

- `ENABLED_JOBS` is a comma-separated list of the job names a deployment runs. A job not in the list answers 404, so Vercel and the Mac mini never both post the same thing. Unset means every job may run; set but empty means none.
- Every job needs `Authorization: Bearer $CRON_SECRET`, which Cronicle sends from each job's headers.

Job routes answer with JSON: 200 when everything worked, 500 when anything failed, 409 when another run of the same job is still going. Cronicle treats anything but 2xx as a failure and posts it to the ShawnDev Discord channel.

YouTube channels are read through the YouTube Data API (each channel's uploads playlist, 1 unit of the daily quota per call, with `YOUTUBE_API_KEY`), falling back to the channel's RSS feed when the API fails, because YouTube's RSS feeds return 404 for hours at a time.

Feeds still sometimes go down on their own. So in the podcast check, a feed that will not load is only a warning at first. It fails the job once it has been down for 8 runs in a row (two hours), then about once a day while it stays down, and its count clears as soon as it loads again. The counts live in the Redis hash `job:feed-down`. A failed post is always an error.

### Goodpods awards

The awards sync reads every Sanity podcast (`category`) that has a Goodpods URL, upserts each leaderboard Goodpods currently lists as an award document (`award.goodpods.<id>`, `source: goodpods`), and refreshes that show's cached rating. Each synced award carries an `expiresAt` that slides forward on every sync (7 days for weekly boards, 31 for monthly); an award Goodpods stops listing is expired at once, and the sites only show active, unexpired awards. A scrape that fails expires nothing, and hand-made awards (any other `source`) are never touched.

### Posting each item once

The poller records every delivery in Redis sets (`rss:discord`, `rss:bsky`, `rss:overcast`, `rss:refresh`) with members of the form `<event>:<guid>`, and records it only after the post succeeds, so a failed post is retried on the next run. Changing those keys or the member format would make the poller post every recent item again; a test in `_processFeeds.test.ts` pins them.

### Trying a job without posting

Add `?debug=true` to the podcast check or either Star Wars check (with the bearer token) to run it without posting anything or recording anything as sent. The podcast dry run also logs in to Bluesky, which proves the account and client still work.

### Mac mini settings

The Dockhand stack's env only fills the `${...}` values in `docker-compose.yml`; the container sees just the variables listed under `environment:`. A new variable the app reads needs a line there as well as a value in Dockhand. Build-only settings (`NPM_TOKEN` for the private `@shawnphoffman` packages, `CONTAINER_NAME`, `SHAWN_API_HOST_PORT`) never reach the container.

### Tests

```bash
yarn test
```

The tests never reach the network or the real Redis.
