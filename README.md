# Markeetee

Markeetee is a Next.js directory for discovering African-owned businesses across the United States. The app includes public discovery pages, business detail pages, account and owner dashboards, admin tooling, email notifications, subscriptions, map discovery, and blog content.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, and Storage
- Resend for email delivery
- Stripe for subscriptions and billing
- Algolia for search indexing/search UI where configured
- Google Maps via `@vis.gl/react-google-maps`

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project with the expected Markeetee tables and storage buckets
- Optional integration accounts for Resend, Stripe, Algolia, Google Maps, Twilio, OpenAI, and Anthropic

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation Commands

```bash
npm run lint
npx tsc --noEmit --pretty false
npm run build
```

## Environment Variables

Create `.env.local` with the values needed for the features you are using. Never commit real credentials.

Public browser-safe values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-browser-maps-key
NEXT_PUBLIC_ALGOLIA_APP_ID=your-algolia-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your-search-only-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_LAUNCH_MODE=false
```

Server-only values:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_...
EMAIL_FROM="Markeetee <hello@example.com>"
CONTACT_EMAIL=support@example.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_GROWTH_ANNUAL=price_...
STRIPE_PRICE_PRO_STORE_MONTHLY=price_...
STRIPE_PRICE_PRO_STORE_ANNUAL=price_...
ALGOLIA_ADMIN_KEY=your-admin-key
CRON_SECRET=long-random-secret
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15555555555
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
BETA_COOKIE_SECRET=long-random-secret
```

`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, Stripe secret keys, webhook secrets, admin keys, AI keys, Twilio credentials, and cron secrets must remain server-only. Do not prefix them with `NEXT_PUBLIC_`.

## Database Setup

The application expects Supabase tables used throughout the app, including:

- `profiles`
- `businesses`
- `reviews`
- `products`
- `broadcast_emails`
- `email_preferences`
- `audit_logs`
- `blog_posts`
- admin/support tables used by the admin dashboard, such as reports, claims, feature flags, announcements, and beta/waitlist data

Enable Supabase Auth and configure the site URL and redirect URLs for local and deployed environments. For local development, include:

```text
http://localhost:3000/auth/callback
```

Business images, profile photos, and gallery uploads require Supabase Storage buckets and policies compatible with the app.

## Admin Email Setup

Admin broadcast email lives in the admin dashboard under `Send email`.

Required setup:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CONTACT_EMAIL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase `profiles` rows with `is_admin=true`; bulk broadcast requires `admin_role='super_admin'`
- `broadcast_emails` for send history
- `email_preferences` for unsubscribe and marketing preference handling

Development behavior:

- Broadcast and admin email routes run as dry-runs when `NODE_ENV !== 'production'`.
- Dry-runs validate recipients, templates, permissions, unsubscribe tokens, and logging paths without sending live email.
- Production sends require configured Resend credentials.

Marketing broadcasts respect `email_preferences.unsubscribed_all`, `marketing`, and `broadcast` preferences. Transactional messages such as password resets and security emails should remain separate from marketing broadcasts.

## Integrations

Supabase powers authentication, database queries, server admin operations, and storage.

Resend sends transactional and admin emails. Local validation does not send live emails.

Stripe powers checkout, customer portal, and webhook subscription updates.

Algolia is used by search-related tooling when the Algolia keys are configured.

Google Maps powers map discovery and map-related UI when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured.

Twilio, OpenAI, and Anthropic are referenced by API/admin tooling and only need configuration if those features are enabled.

## SEO And Crawlability

Public crawlable routes include the homepage, search, map, blog, public business pages, legal pages, FAQ, and launch offer page. Private account, dashboard, admin, auth, invite, and API routes are excluded via `robots.ts`.

The sitemap is generated in `app/sitemap.ts` and includes public static pages, published blog posts, and public business detail URLs from Supabase.

Business detail pages render initial business content and metadata on the server, then hydrate the interactive client experience.

## Deployment

Deploy to Vercel or another Next.js-compatible host.

Before production:

- Set all environment variables in the hosting provider.
- Configure Supabase Auth redirect URLs for the production domain.
- Configure Stripe webhook endpoint and secret.
- Verify Resend sending domain and `EMAIL_FROM`.
- Confirm sitemap and robots responses on the production domain.
- Run `npm run build`.

## Troubleshooting

- Missing Supabase env vars: authentication and database-backed pages will fail.
- Service role errors: confirm `SUPABASE_SERVICE_ROLE_KEY` is set server-side only.
- Admin email says dry-run: this is expected outside production.
- Resend provider errors: verify `RESEND_API_KEY`, `EMAIL_FROM`, and sender domain verification.
- Google Maps not rendering: verify the browser key and allowed referrers.
- Stripe checkout or portal errors: verify Stripe secret keys, price IDs, customer mapping, and webhook secret.
