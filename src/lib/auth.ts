// HubForge OS — Identity & Auth
//
// DESIGN PRINCIPLE: Data sovereignty split.
//   - Platform stores: email + hashed password + userId + consent record.
//     Just enough to recognize a returning user. Nothing else.
//   - User's own Supabase stores: name, organization, country, role,
//     programs, indicators, lessons, context blocks. All personal data.
//   - Analytics: anonymous metadata (features used, session duration),
//     tracked against userId WITH consent. No program content, no names.
//
// STORAGE TIERS (same 3-tier fallback as the rest of HubForge):
//   1. Platform Supabase (env vars) — real server-side auth, syncs across devices
//   2. localStorage — device-only identity (works for trying it out,
//      clearly labeled "this device only")
//
// CONSENT (GDPR / DPDP compliant):
//   - Explicit consent checkbox required at signup
//   - Analytics opt-in is separate (user can say no to analytics)
//   - Consent version tracked (so we can re-prompt if terms change)
//   - Right to export: GET /api/auth/export
//   - Right to delete: DELETE /api/auth/account

export interface Account {
  id: string               // userId (random, not the email)
  email: string            // login identifier
  name?: string            // display name (stored in user's DB, not platform)
  passwordHash: string     // SHA-256(salt + password) — never store plaintext
  salt: string             // per-user salt
  createdAt: string
  lastSeen: string
  consent: ConsentRecord
}

export interface ConsentRecord {
  given: boolean
  date: string             // ISO timestamp
  version: string          // consent spec version (re-prompt if changed)
  analyticsOptIn: boolean  // separate opt-in for usage analytics
  termsAccepted: boolean
  privacyPolicyAccepted: boolean
}

export interface Session {
  userId: string
  email: string
  createdAt: string
  // "device" = localStorage-only identity (not synced)
  // "platform" = server-side identity (syncs across devices)
  type: 'device' | 'platform'
}

export const CONSENT_VERSION = '1.0.0'

const ACCOUNTS_KEY = 'hubforge.accounts'
const SESSION_KEY = 'hubforge.session'

// ───────────────────────────────────────────────────────────────────────────
// Password hashing (Web Crypto API — no external deps)
// ───────────────────────────────────────────────────────────────────────────

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateUserId(): string {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return 'u-' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ───────────────────────────────────────────────────────────────────────────
// localStorage account store (fallback when platform Supabase isn't configured)
// ───────────────────────────────────────────────────────────────────────────

function getLocalAccounts(): Account[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLocalAccounts(accounts: Account[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) } catch {}
}

function findLocalAccount(email: string): Account | null {
  return getLocalAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase()) || null
}

// ───────────────────────────────────────────────────────────────────────────
// Session management
// ───────────────────────────────────────────────────────────────────────────

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(session: Session | null): void {
  if (typeof window === 'undefined') return
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}

export function getCurrentUser(): { userId: string; email: string; type: 'device' | 'platform' } | null {
  const session = getSession()
  if (!session) return null
  return { userId: session.userId, email: session.email, type: session.type }
}

// ───────────────────────────────────────────────────────────────────────────
// Signup
// ───────────────────────────────────────────────────────────────────────────

export interface SignupParams {
  email: string
  password: string
  consent: {
    analyticsOptIn: boolean
    termsAccepted: boolean
    privacyPolicyAccepted: boolean
  }
}

export interface SignupResult {
  success: boolean
  error?: string
  session?: Session
}

export async function signup(params: SignupParams): Promise<SignupResult> {
  const { email, password, consent } = params

  // Validate
  if (!email || !email.includes('@')) return { success: false, error: 'Valid email is required' }
  if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters' }
  if (!consent.termsAccepted) return { success: false, error: 'You must accept the Terms of Service' }
  if (!consent.privacyPolicyAccepted) return { success: false, error: 'You must accept the Privacy Policy' }

  // Check if email already exists (local)
  if (findLocalAccount(email)) {
    return { success: false, error: 'An account with this email already exists. Try logging in.' }
  }

  // TODO: When platform Supabase is configured, try server-side signup first.
  // For now: localStorage fallback.

  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  const now = new Date().toISOString()

  const account: Account = {
    id: generateUserId(),
    email: email.toLowerCase(),
    passwordHash,
    salt,
    createdAt: now,
    lastSeen: now,
    consent: {
      given: true,
      date: now,
      version: CONSENT_VERSION,
      analyticsOptIn: consent.analyticsOptIn,
      termsAccepted: consent.termsAccepted,
      privacyPolicyAccepted: consent.privacyPolicyAccepted,
    },
  }

  const accounts = getLocalAccounts()
  accounts.push(account)
  saveLocalAccounts(accounts)

  const session: Session = {
    userId: account.id,
    email: account.email,
    createdAt: now,
    type: 'device', // localStorage fallback
  }
  saveSession(session)

  return { success: true, session }
}

// ───────────────────────────────────────────────────────────────────────────
// Login
// ───────────────────────────────────────────────────────────────────────────

export interface LoginParams {
  email: string
  password: string
}

export async function login(params: LoginParams): Promise<SignupResult> {
  const { email, password } = params
  if (!email || !password) return { success: false, error: 'Email and password are required' }

  const account = findLocalAccount(email)
  if (!account) {
    return { success: false, error: 'No account found with this email. Try signing up.' }
  }

  const passwordHash = await hashPassword(password, account.salt)
  if (passwordHash !== account.passwordHash) {
    return { success: false, error: 'Incorrect password' }
  }

  // Update last seen
  account.lastSeen = new Date().toISOString()
  const accounts = getLocalAccounts()
  const idx = accounts.findIndex((a) => a.id === account.id)
  if (idx >= 0) { accounts[idx] = account; saveLocalAccounts(accounts) }

  const session: Session = {
    userId: account.id,
    email: account.email,
    createdAt: new Date().toISOString(),
    type: 'device',
  }
  saveSession(session)

  return { success: true, session }
}

// ───────────────────────────────────────────────────────────────────────────
// Logout
// ───────────────────────────────────────────────────────────────────────────

export function logout(): void {
  saveSession(null)
}

// ───────────────────────────────────────────────────────────────────────────
// Account data export (GDPR right to access)
// ───────────────────────────────────────────────────────────────────────────

export function exportAccountData(): any {
  const session = getSession()
  if (!session) return null
  const account = getLocalAccounts().find((a) => a.id === session.userId)
  if (!account) return null
  return {
    userId: account.id,
    email: account.email,
    createdAt: account.createdAt,
    lastSeen: account.lastSeen,
    consent: account.consent,
    note: 'This is all the data HubForge OS stores about you on this device. Your programs, organization details, and indicators are stored in your own Supabase (if connected) or this browser\'s localStorage.',
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Account deletion (GDPR right to be forgotten)
// ───────────────────────────────────────────────────────────────────────────

export function deleteAccount(): void {
  const session = getSession()
  if (!session) return
  const accounts = getLocalAccounts().filter((a) => a.id !== session.userId)
  saveLocalAccounts(accounts)
  saveSession(null)
  // Note: programs, indicators, etc. in the user's own Supabase are NOT
  // deleted by this — the user controls their own database. We only delete
  // the platform identity.
}

// ───────────────────────────────────────────────────────────────────────────
// Consent helpers
// ───────────────────────────────────────────────────────────────────────────

export function hasConsented(): boolean {
  const session = getSession()
  if (!session) return false
  const account = getLocalAccounts().find((a) => a.id === session.userId)
  return account?.consent?.given === true
}

export function hasAnalyticsConsent(): boolean {
  const session = getSession()
  if (!session) return false
  const account = getLocalAccounts().find((a) => a.id === session.userId)
  return account?.consent?.analyticsOptIn === true
}

export function getConsentVersion(): string | null {
  const session = getSession()
  if (!session) return null
  const account = getLocalAccounts().find((a) => a.id === session.userId)
  return account?.consent?.version ?? null
}

// ───────────────────────────────────────────────────────────────────────────
// Display helpers
// ───────────────────────────────────────────────────────────────────────────

export function getDisplayEmail(): string | null {
  const session = getSession()
  return session?.email ?? null
}

export function getInitials(): string {
  const email = getDisplayEmail()
  if (!email) return '?'
  const name = email.split('@')[0]
  return name.substring(0, 2).toUpperCase()
}
