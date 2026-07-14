# Photobooth Queue Agents Guide

## Repository Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/lib`: Shared server/client helpers.
- `src/types`: Shared TypeScript types.
- `prisma`: Prisma datasource and future migrations.
- `docs`: Product and delivery documentation.

## Commands

- `npm run dev`: Start local development.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: Run strict TypeScript checks.
- `npm run test`: Run Vitest.
- `npm run build`: Build production bundle.

## TypeScript

- Keep `strict` mode enabled.
- Do not use `any` unless there is no safer practical type.
- Prefer server-side validation with Zod for all external input.

## Security Rules

- Never commit secrets. Keep real values in `.env.local`.
- Do not expose server-only secrets to client code.
- Do not send full customer names or phone numbers to public or staff views.
- Do not send full data to the client and hide it with CSS.
- Staff users are read-only; block every staff mutation on the server.
- Every mutation must be validated on the server.
- Customer ticket access must use a secret access token, never a phone number.
- Timers must not write to the database every second. Store `serviceStartedAt` and `expectedEndAt`.

## Sprint Rules

- After each sprint, run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
- Do not implement the next sprint without an explicit user request.
