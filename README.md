# Shawn API

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K7NNOUK)

<!-- ko-fi colors -->
<!-- #FF5E5B -->
<!-- #13C3FF -->
<!-- #FBAA19 -->
<!-- #434B57 -->

<!-- NOTE: vercel.json hobby plans can only run daily cron jobs -->

## How it runs

One branch, `main`, deploys to two places from the same code.

| Where | What it does | How it deploys |
| --- | --- | --- |
| **Vercel** (`api.shawn.party`) | Answers requests from the podcast sites, giftwrapt and other sites: ratings, Open Graph and scraping, the Sanity relay, webhooks. Runs the hourly awards sync from `vercel.json`. | Every push to `main` |
| **Mac mini** (Docker) | Runs the scheduled jobs that post to Discord and Bluesky. A Cronicle scheduler on the same machine calls them. | A Dockhand git stack builds `docker-compose.yml` on the mini through a Hawser Edge agent, daily and on demand |

Browser scraping does not depend on where the app runs: every Puppeteer route connects to a remote browser at `PUPPETEER_WSS`.

### Scheduled jobs

| Job name | Route | Runs on |
| --- | --- | --- |
| `podcast-check` | `/api/podcast-data/check` | Mac mini |
| `star-wars-frequent` | `/api/star-wars/check/frequent` | Mac mini |
| `star-wars-daily` | `/api/star-wars/check/daily` | Mac mini |
| `sf6-daily` | `/api/sf6/discord/daily-challenges` | Mac mini |
| `sync-awards` | `/api/podcast-data/sync-awards` | Vercel |

Every job route goes through `src/lib/jobs/guard.ts`:

- `ENABLED_JOBS` is a comma-separated list of the job names a deployment runs. A job not in the list answers 404, so Vercel and the Mac mini never both post the same thing. Unset means every job may run; set but empty means none.
- Every job needs `Authorization: Bearer $CRON_SECRET`. Vercel cron sends it on its own. Cronicle sends it from each job's headers. Each deployment has its own `CRON_SECRET`.

Job routes answer with JSON: 200 when everything worked, 500 when anything failed, 409 when another run of the same job is still going. Cronicle treats anything but 2xx as a failure and posts it to the ShawnDev Discord channel.

### Posting each item once

The poller records every delivery in Redis sets (`rss:discord`, `rss:bsky`, `rss:overcast`, `rss:refresh`) with members of the form `<event>:<guid>`, and records it only after the post succeeds, so a failed post is retried on the next run. Changing those keys or the member format would make the poller post every recent item again; a test in `_processFeeds.test.ts` pins them.

### Trying a job without posting

Add `?debug=true` to the podcast check or the frequent Star Wars check (with the bearer token) to run it without posting anything. The podcast dry run also logs in to Bluesky, which proves the account and client still work. The daily Star Wars check has no dry run for its weekly comics section yet, so `?debug=true` there still posts weekly comics.

### Mac mini settings

The Dockhand stack's env only fills the `${...}` values in `docker-compose.yml`; the container sees just the variables listed under `environment:`. A new variable the app reads needs a line there as well as a value in Dockhand. Build-only settings (`NPM_TOKEN` for the private `@shawnphoffman` packages, `CONTAINER_NAME`, `SHAWN_API_HOST_PORT`) never reach the container.

### Tests

```bash
yarn test
```

The tests never reach the network or the real Redis.
