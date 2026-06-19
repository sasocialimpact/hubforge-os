export const metadata = { title: 'Privacy Policy - HubForge OS' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Who we are</h2>
            <p>HubForge OS is an open-source decision intelligence platform for social impact organizations. We do not sell, rent, or trade your data. This policy explains what we collect, why, and how we protect it.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. What we collect</h2>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-muted"><th className="p-2 text-left border border-border">Data</th><th className="p-2 text-left border border-border">Purpose</th><th className="p-2 text-left border border-border">Stored where</th><th className="p-2 text-left border border-border">Retention</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border border-border">Name, email, organization, country, role</td><td className="p-2 border border-border">Understand who uses HubForge; improve the product</td><td className="p-2 border border-border">Supabase (EU-hosted)</td><td className="p-2 border border-border">Until you request deletion</td></tr>
                <tr><td className="p-2 border border-border">Problem descriptions and generated strategies</td><td className="p-2 border border-border">Provide the reasoning service; institutional memory</td><td className="p-2 border border-border">Supabase</td><td className="p-2 border border-border">Until you delete the session</td></tr>
                <tr><td className="p-2 border border-border">Analytics events (page views, clicks, errors)</td><td className="p-2 border border-border">Improve UX; fix bugs; understand usage patterns</td><td className="p-2 border border-border">Supabase</td><td className="p-2 border border-border">90 days</td></tr>
                <tr><td className="p-2 border border-border">AI provider API keys (Z.ai, OpenAI, etc.)</td><td className="p-2 border border-border">Call AI providers to generate strategies</td><td className="p-2 border border-border">Your browser only (localStorage)</td><td className="p-2 border border-border">Until you clear browser data</td></tr>
                <tr><td className="p-2 border border-border">Browser type, device type</td><td className="p-2 border border-border">Debug errors; optimize for devices</td><td className="p-2 border border-border">Supabase (anonymized)</td><td className="p-2 border border-border">90 days</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. What we do NOT collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Beneficiary data.</strong> HubForge OS is a planning tool, not a data collection tool. We never collect data about the people your program serves.</li>
              <li><strong>Your AI API keys.</strong> Keys are stored in your browser only and sent directly to the AI provider (Z.ai, OpenAI, etc.). They never pass through HubForge servers.</li>
              <li><strong>Payment information.</strong> HubForge OS is free. We don't process payments.</li>
              <li><strong>Cookies for advertising.</strong> We don't use advertising or tracking cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Your rights (GDPR / CCPA)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> - request a copy of your data</li>
              <li><strong>Rectification</strong> - correct inaccurate data</li>
              <li><strong>Erasure</strong> - delete your account and all associated data</li>
              <li><strong>Portability</strong> - export your data in JSON format</li>
              <li><strong>Objection</strong> - opt out of analytics tracking</li>
              <li><strong>Withdraw consent</strong> - at any time, without giving a reason</li>
            </ul>
            <p className="mt-2">To exercise these rights, email <strong>privacy@hubforge.org</strong> (replace with your actual contact). We respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Data security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>All data in transit is encrypted via HTTPS/TLS 1.3</li>
              <li>Supabase database is encrypted at rest (AES-256)</li>
              <li>API keys are stored in browser localStorage (not transmitted to HubForge servers)</li>
              <li>Admin dashboard is password-protected</li>
              <li>We do not share data with third parties except AI providers (to generate strategies) and hosting providers (Vercel, Supabase)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. AI providers</h2>
            <p>When you generate a strategy, your problem description is sent to an AI provider:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>If you use the shared Z.ai:</strong> Your problem text is sent to Z.ai's API. Z.ai's privacy policy applies.</li>
              <li><strong>If you use your own API key:</strong> Your problem text is sent directly from your browser to the provider (OpenAI, Anthropic, etc.). That provider's privacy policy applies. HubForge OS does not see or store your API key.</li>
              <li><strong>If you use a local model (Ollama):</strong> No data leaves your computer.</li>
            </ul>
            <p className="mt-2"><strong>Do not enter sensitive beneficiary data into the problem description.</strong> HubForge OS is a planning tool, not a data processing tool.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Data retention</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>User profiles:</strong> Retained until you request deletion</li>
              <li><strong>Reasoning sessions:</strong> Retained until you delete them</li>
              <li><strong>Analytics events:</strong> Automatically deleted after 90 days</li>
              <li><strong>Browser data (API keys, preferences):</strong> Stored until you clear browser data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Children's privacy</h2>
            <p>HubForge OS is not designed for or directed to children under 16. We do not knowingly collect data from children. If you believe we have, please contact us and we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">9. Changes to this policy</h2>
            <p>We may update this policy. We will notify users by email (if we have your email) and display a notice in the app for 30 days before changes take effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">10. Contact</h2>
            <p>Questions about privacy? Contact: <strong>privacy@hubforge.org</strong> (replace with your actual contact email)</p>
          </section>
        </div>
      </div>
    </div>
  )
}
