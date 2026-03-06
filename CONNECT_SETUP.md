# aBest.co Connection Setup

This repository is wired for:
- GitHub (source + CI)
- Cloudflare Pages (deployment)
- IDrive E2 (S3-compatible mirror backup)

## Required GitHub Secrets

Add these in GitHub:
`Settings -> Secrets and variables -> Actions`

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` = `23a6b5565d032e6bf1ffee7931c279cc`
- `IDRIVE_E2_ACCESS_KEY_ID`
- `IDRIVE_E2_SECRET_ACCESS_KEY`
- `IDRIVE_E2_ENDPOINT` (example: `https://<region>.e2.cloud.idrive.com`)
- `IDRIVE_E2_BUCKET`

## What happens

On each push to `main`:
1. GitHub Actions deploys this site to Cloudflare Pages project `abest-co`.
2. The same content is synced to `s3://<IDRIVE_E2_BUCKET>/site` via IDrive E2 endpoint.
