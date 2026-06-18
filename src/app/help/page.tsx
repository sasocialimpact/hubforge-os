export const metadata = { title: 'Help & Documentation — HubForge OS' }

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Help & Documentation</h1>
        <p className="text-sm text-muted-foreground mb-8">Everything you need to get started with HubForge OS</p>

        <div className="space-y-8">
          {/* Quick start */}
          <section>
            <h2 className="text-xl font-bold mb-3">Quick Start (3 minutes)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li><strong>Open HubForge OS.</strong> You'll see a welcome screen. Click "Get started".</li>
              <li><strong>Choose your AI.</strong> Pick "Use your own Z.ai key" (recommended, free) or "Use shared AI" (quick start). If using your own key, go to z.ai/manage/apikey, sign up (free), create a key, and paste it.</li>
              <li><strong>Tell us about yourself.</strong> Enter your name, email, organization, and country. You can skip this.</li>
              <li><strong>Describe your project.</strong> In the text box, type what you're working on. Example: <em>"Design a foundation literacy program for 1,000 children in 20 government schools in Andhra Pradesh, India. Budget $50,000 over 2 years."</em></li>
              <li><strong>Choose outputs.</strong> Select what you want: Strategy document, Theory of Change diagram, Logframe table, or Evaluation plan.</li>
              <li><strong>Click "Help me build it".</strong> Answer a few questions (or skip them). HubForge will research, draft, critique, and score your strategy.</li>
              <li><strong>Review the output.</strong> Read the strategy, check the Theory of Change diagram, review the Logframe. Give feedback to improve it.</li>
              <li><strong>Export.</strong> Click "Export" to download as Word, PDF, or Excel.</li>
            </ol>
          </section>

          {/* Outputs explained */}
          <section>
            <h2 className="text-xl font-bold mb-3">What HubForge produces</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-bold text-sm mb-1">Strategy Document</h3>
                <p className="text-xs text-muted-foreground">A complete written strategy with executive summary, problem analysis, objectives, stakeholder analysis, implementation plan, budget, risk management, and M&E framework. Formatted in Markdown — exportable to Word or PDF.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-bold text-sm mb-1">Theory of Change Diagram</h3>
                <p className="text-xs text-muted-foreground">A visual flowchart showing the causal chain: Inputs → Activities → Outputs → Outcomes → Impact, with assumptions and external factors. You can edit every element (add, remove, modify items) and export to Excel or PDF.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-bold text-sm mb-1">Logframe Table</h3>
                <p className="text-xs text-muted-foreground">A 4×5 logical framework: Goal, Purpose, Outputs, Activities — each with indicators (OVI), means of verification, and assumptions. Editable inline. Exportable to Excel for donor proposals.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-bold text-sm mb-1">Evaluation Plan</h3>
                <p className="text-xs text-muted-foreground">Evaluation questions, design (RCT/quasi-experimental/contribution), indicators, data collection methods, and timeline. Included in the strategy document.</p>
              </div>
            </div>
          </section>

          {/* AI providers */}
          <section>
            <h2 className="text-xl font-bold mb-3">Choosing an AI provider</h2>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-muted"><th className="p-2 text-left border border-border">Provider</th><th className="p-2 text-left border border-border">Cost</th><th className="p-2 text-left border border-border">Setup</th><th className="p-2 text-left border border-border">Best for</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border border-border font-medium">Z.ai (shared)</td><td className="p-2 border border-border">Free</td><td className="p-2 border border-border">None</td><td className="p-2 border border-border">Trying it out</td></tr>
                <tr><td className="p-2 border border-border font-medium">Z.ai (own key)</td><td className="p-2 border border-border">Free</td><td className="p-2 border border-border">30 sec — get key at z.ai</td><td className="p-2 border border-border">Regular use (recommended)</td></tr>
                <tr><td className="p-2 border border-border font-medium">Groq</td><td className="p-2 border border-border">Free tier</td><td className="p-2 border border-border">1 min — get key at console.groq.com</td><td className="p-2 border border-border">Fast responses</td></tr>
                <tr><td className="p-2 border border-border font-medium">OpenAI</td><td className="p-2 border border-border">~$0.01/strategy</td><td className="p-2 border border-border">2 min — get key at platform.openai.com</td><td className="p-2 border border-border">Highest quality</td></tr>
                <tr><td className="p-2 border border-border font-medium">Local (Ollama)</td><td className="p-2 border border-border">Free forever</td><td className="p-2 border border-border">Install Ollama, download model</td><td className="p-2 border border-border">Full privacy, offline use</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">Your API key is stored only in your browser. It's sent directly to the provider — never to HubForge servers.</p>
          </section>

          {/* The reasoning loop */}
          <section>
            <h2 className="text-xl font-bold mb-3">How the reasoning works</h2>
            <p className="text-sm mb-3">HubForge OS doesn't just generate once. It runs a 9-engine loop:</p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li><strong>Supervisor</strong> — understands your problem, asks clarifying questions</li>
              <li><strong>Retrieval</strong> — pulls frameworks (Theory of Change, Logframe) and evidence from the knowledge pack</li>
              <li><strong>Web Search</strong> — searches the live web for demographic data, previous programs, and evidence specific to your location</li>
              <li><strong>Rule Check</strong> — validates: SMART goals? Stakeholders named? Assumptions stated?</li>
              <li><strong>Reasoning</strong> — drafts the strategy using all the above</li>
              <li><strong>Critique</strong> — reviews the draft for weak assumptions, missing evidence, vague targets</li>
              <li><strong>Improvement</strong> — rewrites to fix every issue found</li>
              <li><strong>Evaluation</strong> — scores 0-100 on a 6-criterion rubric. If below 80, it loops again.</li>
              <li><strong>Structure</strong> — extracts the Theory of Change and Logframe from the strategy</li>
            </ol>
            <p className="text-sm mt-3">This takes 2-3 minutes. The progress indicator shows which engine is running.</p>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="text-xl font-bold mb-3">Giving feedback to improve outputs</h2>
            <p className="text-sm">After the strategy is generated, you'll see a "Tell me what to change" box. Type specific feedback like:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
              <li>"Make the assumptions about community participation more explicit"</li>
              <li>"Add a risk row on teacher attrition"</li>
              <li>"The budget needs a line item for monitoring and evaluation"</li>
              <li>"Align the indicators with NIPUN Bharat framework"</li>
            </ul>
            <p className="text-sm mt-2">HubForge will revise the strategy, re-score it, and show what it addressed. You can give feedback as many times as you want.</p>
          </section>

          {/* Exporting */}
          <section>
            <h2 className="text-xl font-bold mb-3">Exporting your work</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Word (.docx)</strong> — downloads the strategy as an editable Word document</li>
              <li><strong>PDF</strong> — downloads a formatted PDF with strategy + ToC + Logframe</li>
              <li><strong>Excel (.xlsx)</strong> — downloads the Logframe or ToC as a spreadsheet for donor templates</li>
              <li><strong>Copy</strong> — copies the strategy text to clipboard for pasting into proposals</li>
            </ul>
          </section>

          {/* Install as app */}
          <section>
            <h2 className="text-xl font-bold mb-3">Installing HubForge as an app</h2>
            <p className="text-sm">HubForge OS is a PWA (Progressive Web App). You can install it on your laptop:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
              <li><strong>Chrome/Edge:</strong> Click the install icon in the address bar, or click "Install" when the banner appears</li>
              <li><strong>Firefox:</strong> Bookmark → "Install this site as an app"</li>
              <li><strong>Safari (Mac):</strong> File → "Add to Dock"</li>
            </ul>
            <p className="text-sm mt-2">Once installed, HubForge opens as a native app window (not a browser tab) and works offline.</p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-xl font-bold mb-3">Privacy and data</h2>
            <p className="text-sm">See our <a href="/privacy" className="text-amber-700 dark:text-amber-400 underline">Privacy Policy</a> for full details. Key points:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
              <li>Your API key stays in your browser only</li>
              <li>We collect name, email, organization, country to understand who uses HubForge</li>
              <li>We do not collect beneficiary data</li>
              <li>You can delete your data anytime</li>
              <li>Analytics are anonymized and deleted after 90 days</li>
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold mb-3">Frequently asked questions</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-sm">How long does it take?</h3>
                <p className="text-xs text-muted-foreground">2-3 minutes for a full strategy. The progress indicator shows what's happening.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">Can I edit the outputs?</h3>
                <p className="text-xs text-muted-foreground">Yes. The Theory of Change and Logframe are fully editable — click any text to modify, add items with +, remove with ×.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">Is it really free?</h3>
                <p className="text-xs text-muted-foreground">Yes. HubForge OS is open source (Apache 2.0). The shared Z.ai AI is free. If you want unlimited use, get your own free Z.ai key or use Groq's free tier.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">Can I use it offline?</h3>
                <p className="text-xs text-muted-foreground">The UI works offline after first visit (cached by the service worker). AI calls need internet — except if you use a local model (Ollama).</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">Is my data safe?</h3>
                <p className="text-xs text-muted-foreground">API keys never leave your browser. Profile data is encrypted at rest in Supabase. See our <a href="/privacy" className="text-amber-700 dark:text-amber-400 underline">Privacy Policy</a>.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">Can my organization self-host?</h3>
                <p className="text-xs text-muted-foreground">Yes. HubForge is open source. Clone the repo, deploy to your own Vercel account or server, and use your own Supabase. See DEPLOYMENT.md in the repo.</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold mb-3">Need more help?</h2>
            <p className="text-sm">Email: <strong>support@hubforge.org</strong> (replace with your actual contact)</p>
            <p className="text-sm mt-1">Found a bug? Report it on GitHub: <strong>github.com/your-org/hubforge-os/issues</strong></p>
          </section>
        </div>
      </div>
    </div>
  )
}
