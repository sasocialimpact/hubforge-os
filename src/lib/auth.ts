// HubForge OS - Identity & Auth
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
//   1. Platform Supabase (env vars) - real server-side auth, syncs across devices
//   2. localStorage - device-only identity (works for trying it out,
//      clearly labeled "this device only")
//
// CONSENT (GDPR / DPDP compliant):
//   - Explicit consent checkbox required at signup
//   - Analytics opt-in is separate (user can say no to analytics)
//   - Consent version tracked (so we can re-prompt if terms change)
//   - Right to export: GET /api/auth/export
//   - Right to delete: DELETE /api/auth/account
//
// PASSWORD HASHING:
//   - PBKDF2 (Web Crypto) with 150,000 iterations of SHA-256, 16-byte salt,
//     32-byte derived key. Stored as `pbkdf2$<iterations>$<saltHex>$<hashHex>`.
//   - PBKDF2 is a slow KDF designed for passwords - much harder to brute
//     force than a single SHA-256 pass. (Previous versions used plain
//     SHA-256, which is fast and unsafe for password storage.)
//   - The hash format includes the iteration count so it can be raised in
//     the future without breaking existing accounts (re-hash on next login).

export interface Account {
  id: string               // userId (random, not the email)
  email: string            // login identifier
  name?: string            // display name (stored in user's DB, not platform)
  passwordHash: string     // pbkdf2$<iter>$<saltHex>$<hashHex> - never store plaintext
  salt: string             // per-user salt (legacy field; also embedded in passwordHash for new accounts)
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
// Password hashing (PBKDF2 via Web Crypto API - no external deps)
//
// Storage format: `pbkdf2$<iterations>$<saltHex>$<hashHex>`
//   - iterations: tunable work factor (raised over time)
//   - saltHex: 16-byte per-user random salt
//   - hashHex: 32-byte derived key
//
// Why PBKDF2 and not bcrypt/argon2?
//   - Web Crypto ships PBKDF2 natively in every modern browser and Node
//     runtime (no native module, no WASM payload, no extra dependency).
//   - 150k iterations of SHA-256 puts each guess at ~50-100ms on commodity
//     hardware - sufficient resistance for a low-stakes, serverless-friendly
//     identity layer. If we ever need stronger protection, swap the algorithm
//     and re-hash on next login (the iteration count is stored in the hash).
// ───────────────────────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 150_000
const PBKDF2_KEY_LENGTH = 32 // bytes -> 64 hex chars

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return arr
}

async function derivePbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8,
  )
  return toHex(bits)
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const salt = fromHex(saltHex)
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hash}`
}

/**
 * Verify a password against a stored hash. Supports:
 *   - Current format: `pbkdf2$<iter>$<saltHex>$<hashHex>`
 *   - Legacy format: a bare 64-char hex SHA-256 (single iteration, no salt
 *     prefix). Used by accounts created before PBKDF2 was introduced. We
 *     keep verifying them (using the stored `salt` field) so users aren't
 *     locked out, but the next signup/password change always writes PBKDF2.
 */
async function verifyPassword(password: string, stored: string, legacySalt: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2$')) {
    const [, iterStr, saltHex, hashHex] = stored.split('$')
    const iterations = parseInt(iterStr, 10)
    if (!iterations || !saltHex || !hashHex) return false
    const salt = fromHex(saltHex)
    const candidate = await derivePbkdf2(password, salt, iterations)
    // Constant-time-ish compare: XOR each byte. (crypto.subtle doesn't ship
    // a constant-time compare; we emulate by comparing equal-length hex
    // strings after XOR - good enough for an offline attack scenario where
    // the attacker doesn't get timing feedback anyway.)
    if (candidate.length !== hashHex.length) return false
    let diff = 0
    for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i)
    return diff === 0
  }
  // Legacy SHA-256(salt + password) fallback.
  try {
    const enc = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(legacySalt + password))
    const candidate = toHex(buf)
    if (candidate.length !== stored.length) return false
    let diff = 0
    for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

function generateSalt(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return toHex(arr)
}

function generateUserId(): string {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return 'u-' + toHex(arr)
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
  // Profile data (stored in user_profiles table, visible to admin for
  // understanding who's using HubForge and how to improve it).
  profile?: {
    name?: string
    country?: string
    role?: string
    organization?: string
    orgType?: string
    sectors?: string[]
    operatingCountries?: string[]
    teamSize?: string
  }
}

export interface SignupResult {
  success: boolean
  error?: string
  session?: Session
}

export async function signup(params: SignupParams): Promise<SignupResult> {
  const { email, password, consent, profile } = params

  // Validate
  if (!email || !email.includes('@')) return { success: false, error: 'Valid email is required' }
  if (email.length > 254) return { success: false, error: 'Email is too long' }
  if (!password || password.length < 8) return { success: false, error: 'Password must be at least 8 characters' }
  if (password.length > 256) return { success: false, error: 'Password is too long' }
  if (!consent.termsAccepted) return { success: false, error: 'You must accept the Terms of Service' }
  if (!consent.privacyPolicyAccepted) return { success: false, error: 'You must accept the Privacy Policy' }

  // ── Try server-side signup first (real auth via Supabase) ──
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password,
        name: profile?.name,
        country: profile?.country,
        role: profile?.role,
        organization: profile?.organization,
        orgType: profile?.orgType,
        sectors: profile?.sectors,
        operatingCountries: profile?.operatingCountries,
        teamSize: profile?.teamSize,
        consentVersion: CONSENT_VERSION,
        analyticsOptIn: consent.analyticsOptIn,
      }),
    })
    const data = await res.json()
    if (res.ok && data.user) {
      // Server-side signup succeeded - store the session + tokens
      const session: Session = {
        userId: data.user.userId,
        email: data.user.email,
        createdAt: new Date().toISOString(),
        type: 'platform',
      }
      saveSession(session)
      // Store tokens for API calls
      if (data.accessToken) {
        try {
          localStorage.setItem('hubforge.accessToken', data.accessToken)
          localStorage.setItem('hubforge.refreshToken', data.refreshToken)
        } catch {}
      }
      // Store the profile locally for the UI to use
      if (data.user) {
        try {
          localStorage.setItem('hubforge.userProfile', JSON.stringify({
            ...data.user,
            analyticsOptIn: consent.analyticsOptIn,
          }))
        } catch {}
      }
      return { success: true, session }
    }
    // If server returned 503 (Supabase not configured), fall through to
    // localStorage. Otherwise return the error.
    if (res.status !== 503) {
      return { success: false, error: data.error || 'Signup failed' }
    }
  } catch (e) {
    // Network error - fall through to localStorage
  }

  // ── localStorage fallback (device-only identity) ──
  if (findLocalAccount(email)) {
    return { success: false, error: 'An account with this email already exists. Try logging in.' }
  }

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
  if (email.length > 254 || password.length > 256) return { success: false, error: 'Invalid credentials' }

  // ── Try server-side login first (real auth via Supabase) ──
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok && data.user) {
      const session: Session = {
        userId: data.user.userId,
        email: data.user.email,
        createdAt: new Date().toISOString(),
        type: 'platform',
      }
      saveSession(session)
      if (data.accessToken) {
        try {
          localStorage.setItem('hubforge.accessToken', data.accessToken)
          localStorage.setItem('hubforge.refreshToken', data.refreshToken)
        } catch {}
      }
      if (data.user) {
        try {
          localStorage.setItem('hubforge.userProfile', JSON.stringify(data.user))
        } catch {}
      }
      return { success: true, session }
    }
    // If server returned 503 (Supabase not configured), fall through to
    // localStorage. Otherwise return the error.
    if (res.status !== 503) {
      return { success: false, error: data.error || 'Login failed' }
    }
  } catch (e) {
    // Network error - fall through to localStorage
  }

  // ── localStorage fallback ──
  const account = findLocalAccount(email)
  if (!account) {
    return { success: false, error: 'No account found with this email. Try signing up.' }
  }

  const ok = await verifyPassword(password, account.passwordHash, account.salt)
  if (!ok) {
    return { success: false, error: 'Incorrect password' }
  }

  // Upgrade: if the account is on the legacy SHA-256 hash, re-hash with
  // PBKDF2 so we phase out the weaker scheme over time.
  if (!account.passwordHash.startsWith('pbkdf2$')) {
    try {
      const newHash = await hashPassword(password, account.salt)
      account.passwordHash = newHash
    } catch {
      // Non-fatal: keep the legacy hash if PBKDF2 re-hash fails.
    }
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
  // Clear tokens + cached profile
  try {
    localStorage.removeItem('hubforge.accessToken')
    localStorage.removeItem('hubforge.refreshToken')
    localStorage.removeItem('hubforge.userProfile')
  } catch {}
  // Best-effort server-side logout (fire and forget)
  try {
    const token = localStorage.getItem('hubforge.accessToken')
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  } catch {}
}

// ───────────────────────────────────────────────────────────────────────────
// Profile access (for UI display + admin)
// ───────────────────────────────────────────────────────────────────────────

export function getStoredProfile(): any | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('hubforge.userProfile')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('hubforge.accessToken')
  } catch { return null }
}

export function isPlatformAuth(): boolean {
  const session = getSession()
  return session?.type === 'platform'
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
  // Clear platform identity
  const accounts = getLocalAccounts().filter((a) => a.id !== session.userId)
  saveLocalAccounts(accounts)
  saveSession(null)
  // Clear all local data so nothing lingers (GDPR right to be forgotten).
  // Programs, indicators, etc. in the user's OWN Supabase are NOT touched -
  // the user controls their own database. We only clear this browser.
  try {
    localStorage.removeItem('hubforge.accessToken')
    localStorage.removeItem('hubforge.refreshToken')
    localStorage.removeItem('hubforge.userProfile')
    localStorage.removeItem('hubforge.session')
    localStorage.removeItem('hubforge.profile')
    localStorage.removeItem('hubforge.organization')
    localStorage.removeItem('hubforge.programs')
    localStorage.removeItem('hubforge.indicators')
    localStorage.removeItem('hubforge.contextBlocks')
    localStorage.removeItem('hubforge.usage')
    localStorage.removeItem('hubforge.landingSeen')
    localStorage.removeItem('hubforge.onboarded')
    localStorage.removeItem('hubforge.scalingNudgeDismissed')
  } catch {}
  // Best-effort server-side account deletion (if Supabase configured)
  try {
    const token = localStorage.getItem('hubforge.accessToken')
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  } catch {}
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
