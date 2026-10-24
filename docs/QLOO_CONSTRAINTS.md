# Qloo constraints

Rules for every Qloo call in Sitefit. Source: the hackathon developer guide and BUILD-PLAN §3.

## Host and auth

- Base URL is `https://hackathon.api.qloo.com` only. Set `QLOO_BASE_URL` and `QLOO_API_KEY`.
- The hackathon key does not work on `https://staging.api.qloo.com` or `https://api.qloo.com`. A 401 is a wrong host or a wrong header.
- Send the key as `X-Api-Key`. Do not use `Authorization: Bearer`, and do not put the key in the query string.
- Do not put the key in `NEXT_PUBLIC_*`. The browser never calls Qloo.

## Endpoints

- `/v2/insights` is GET. Parameters go in the query string. A JSON body will fail.
- Resolve names with `/search` first, then pass entity IDs.
- `/v2/tags` returns tag IDs. `filter.tags` and `signal.interests.tags` take those IDs, not free-text strings.
- Do not call `/recs` or `/recommendations`.

## Insights types

Supported `filter.type` values:

- `urn:entity:artist`
- `urn:entity:book`
- `urn:entity:brand`
- `urn:entity:destination`
- `urn:entity:movie`
- `urn:entity:person`
- `urn:entity:place`
- `urn:entity:podcast`
- `urn:entity:tv_show`
- `urn:entity:video_game`

There is no `urn:entity:food_and_drink`. Food is a `place` or a `brand`. A 403 means that type is unsupported. `urn:heatmap` is stretch; if it 403s, the neighborhood read is nearby places and brands.

`/search` types are not the same list as Insights `filter.type`. Check the search `types` parameter.

## Params that fail quietly

Invalid parameters are silently ignored. An empty 200 is not proof that the block has no culture. Check every param against the Entity Type Parameter Guide for that `filter.type` before scoring.

- `take` max is 50. Presets need 8–12.
- Turn on `feature.explainability=true` for every scoring call.
- WKT is longitude first: `POINT(-73.99823 40.722668)`.
- Preset localities are `West Village`, `Williamsburg`, and `Silver Lake`, passed as `filter.location.query`.

## Cache and the repo

Server-side cache is allowed. Do not commit Qloo response JSON. Preset entity IDs stored in our code are input configuration, not cached responses.

## Demo

The Devpost demo must be a public HTTPS URL. Localhost does not qualify. The repo needs a visible OSS license. The “write this without Qloo” control is part of the product: the page stamps the memo ungrounded.
