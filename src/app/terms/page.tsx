export const metadata = { title: 'Terms of Service - HubForge OS' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Acceptance of terms</h2>
            <p>By using HubForge OS, you agree to these terms. If you don't agree, don't use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. What HubForge OS is</h2>
            <p>HubForge OS is an AI-assisted planning tool that generates draft program strategies, theories of change, and logical frameworks. It is <strong>not</strong> a substitute for professional M&E expertise, legal advice, or donor compliance review.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. Your responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Review all outputs.</strong> AI-generated content may contain errors, hallucinations, or inappropriate recommendations. You are responsible for reviewing and validating every output before using it.</li>
              <li><strong>Do not enter sensitive data.</strong> Do not enter beneficiary names, personal data, or confidential organizational information into the problem description.</li>
              <li><strong>Comply with your organization's policies.</strong> Your organization may have policies on AI tool usage, data sharing, and donor compliance. You are responsible for complying with those.</li>
              <li><strong>Provide accurate information.</strong> The quality of outputs depends on the quality of your input.</li>
              <li><strong>Respect intellectual property.</strong> Do not use HubForge OS to generate content that infringes on others' copyright.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. No warranty</h2>
            <p>HubForge OS is provided "as is" without warranty of any kind. We do not guarantee that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The service will be available at all times</li>
              <li>Outputs will be accurate, complete, or suitable for your purpose</li>
              <li>The service will meet your organization's compliance requirements</li>
              <li>Errors will be corrected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, HubForge OS and its contributors shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of or inability to use the service, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Loss of funding due to proposal rejection</li>
              <li>Harm to beneficiaries from implementing AI-recommended strategies</li>
              <li>Data loss or corruption</li>
              <li>Reputational damage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. AI provider terms</h2>
            <p>When you use an AI provider (Z.ai, OpenAI, Anthropic, Google, Groq), you are also bound by that provider's terms of service. You are responsible for complying with their usage policies, rate limits, and billing terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Your content</h2>
            <p>You retain ownership of all content you input and all outputs generated from your inputs. You may use outputs for any purpose, including commercial proposals, subject to your organization's policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Open source license</h2>
            <p>HubForge OS is licensed under Apache 2.0. You may inspect, modify, and self-host the code. If you self-host, you are responsible for compliance with these terms, privacy policy, and applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">9. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the service for illegal activities</li>
              <li>Generate content that promotes violence, discrimination, or harm</li>
              <li>Attempt to overload, hack, or reverse-engineer the service</li>
              <li>Share your API keys with others</li>
              <li>Use the service to generate content for fraudulent proposals</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">10. Service changes and termination</h2>
            <p>We may modify, suspend, or discontinue the service at any time. We will provide 30 days' notice for material changes. You may stop using the service at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">11. Governing law</h2>
            <p>These terms are governed by the laws of your jurisdiction. Disputes will be resolved in the courts of your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">12. Contact</h2>
            <p>Questions about these terms? Contact: <strong>legal@hubforge.org</strong> (replace with your actual contact email)</p>
          </section>
        </div>
      </div>
    </div>
  )
}
