/**
 * Next.js instrumentation file - runs once when the server starts.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  const { initSentry } = await import("@/lib/sentry");
  await initSentry();
}
