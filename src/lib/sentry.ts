/**
 * Sentry error tracking - thin wrapper with graceful degradation.
 *
 * Works on both client and server by dynamically importing the right package:
 *   - Browser: @sentry/browser
 *   - Server:  @sentry/node
 *
 * To activate: `bun add @sentry/browser @sentry/node` and set NEXT_PUBLIC_SENTRY_DSN.
 * If the env var is missing or the packages aren't installed, everything no-ops.
 */

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
const IS_BROWSER = typeof window !== "undefined";

let _sentry: typeof import("@sentry/browser") | typeof import("@sentry/node") | null = null;
let _initPromise: Promise<void> | null = null;
let _initialized = false;

/**
 * Initialize Sentry. Safe to call multiple times; only the first call takes effect.
 * Returns a promise that resolves once init is complete (or immediately if no DSN).
 */
export function initSentry(): Promise<void> {
  if (_initPromise) return _initPromise;
  if (!DSN) {
    _initPromise = Promise.resolve();
    return _initPromise;
  }

  _initPromise = (async () => {
    try {
      if (IS_BROWSER) {
        const Sentry = await import("@sentry/browser");
        Sentry.init({
          dsn: DSN,
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 1.0,
          integrations: (defaults) => {
            const integrations = [...defaults];
            // Add Replay if available (it's in @sentry/browser)
            if ("replayIntegration" in Sentry) {
              integrations.push((Sentry as any).replayIntegration());
            }
            return integrations;
          },
          environment: process.env.NODE_ENV ?? "development",
        });
        _sentry = Sentry;
      } else {
        const Sentry = await import("@sentry/node");
        Sentry.init({
          dsn: DSN,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV ?? "development",
        });
        _sentry = Sentry;
      }
      _initialized = true;
    } catch {
      // @sentry/* packages not installed - silently degrade
      _sentry = null;
    }
  })();

  return _initPromise;
}

/** Capture an exception. No-ops if Sentry is not active. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!_initialized || !_sentry) return;
  _sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Capture a message. No-ops if Sentry is not active. */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
): void {
  if (!_initialized || !_sentry) return;
  _sentry.captureMessage(message, level);
}

/** Set the current user for Sentry context. Pass null to clear. */
export function setUser(
  user: { id?: string; email?: string; username?: string } | null,
): void {
  if (!_initialized || !_sentry) return;
  _sentry.setUser(user);
}
