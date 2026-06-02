import Link from 'next/link';
import { ArrowLeft, FileSignature } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — 9 Star Labs Receipt Intelligence',
  description: 'Terms of Service and License Agreement for 9 Star Labs.',
  robots: { index: true, follow: true },
};

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-text-primary">{children}</strong>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-champagne hover:text-champagne-dim underline underline-offset-2 transition">
      {children}
    </a>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-10 mb-4 text-xl font-bold text-text-primary border-b border-white/10 pb-3">
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-7 text-text-secondary">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'introduction', label: '1. Introduction & Contract Formation' },
  { id: 'account', label: '2. Account Registration & Obligations' },
  { id: 'services', label: '3. Services & Use Rights' },
  { id: 'customer-data', label: '4. Customer Data & Privacy' },
  { id: 'ai-disclaimer', label: '5. AI & Automation Disclaimer' },
  { id: 'third-party', label: '6. Third-Party Services & Integrations' },
  { id: 'fees', label: '7. Fees, Billing & Taxes' },
  { id: 'confidentiality', label: '8. Confidentiality & Security' },
  { id: 'availability', label: '9. Service Availability & Support' },
  { id: 'warranties', label: '10. Warranties & Disclaimers' },
  { id: 'limitation', label: '11. Limitation of Liability' },
  { id: 'indemnities', label: '12. Indemnities' },
  { id: 'term', label: '13. Term, Suspension & Termination' },
  { id: 'termination-effects', label: '14. Effects of Termination' },
  { id: 'governing', label: '15. Governing Law & Dispute Resolution' },
  { id: 'changes', label: '16. Changes to Terms' },
  { id: 'general', label: '17. General Provisions' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-champagne transition hover:text-champagne-dim mb-10 group"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Return to App
        </Link>

        <div className="rounded-[2.5rem] border border-white/5 bg-card p-8 sm:p-14">
          <div className="mb-10 flex items-start gap-5 border-b border-white/10 pb-10">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[2rem] bg-champagne/15 champagne-glow">
              <FileSignature className="h-8 w-8 text-champagne" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                Terms of Service
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                <B>9 Star Labs Inc.</B> — Edmonton, Alberta, Canada
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-champagne">
                  Legal Agreement
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-400">
                  Effective: April 27, 2026
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-[3rem] border border-champagne/20 bg-champagne/[0.04] p-5">
            <p className="text-sm leading-7 text-text-secondary">
              By accessing or using the 9 Star Labs Receipt Intelligence platform (the &ldquo;Service&rdquo;),
              you agree to be bound by these Terms of Service. Please read them carefully. If you do not
              agree to these terms, you may not use the Service.
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-10 rounded-[3rem] border border-glass-border bg-surface/40 p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-champagne">Contents</p>
            <ol className="space-y-1.5">
              {TOC.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-sm text-text-secondary hover:text-champagne transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="introduction" title="1. Introduction & Contract Formation">
            <p>
              These Terms of Service constitute a legally binding agreement between you (whether personally
              or on behalf of an entity, referred to as &ldquo;you&rdquo; or &ldquo;Customer&rdquo;)
              and 9 Star Labs Inc. (&ldquo;9 Star Labs,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;), concerning your access and use of the Service.
            </p>
            <p>
              The Service is offered for use by business entities and their authorized representatives only.
              By accepting these Terms, you represent that you have the authority to bind your organization.
              If you do not have such authority, you must not use the Service.
            </p>
            <p>
              These Terms prevail over any conflicting terms in purchase orders, invoices, or other
              communications, unless expressly superseded by a signed written agreement between you and
              9 Star Labs.
            </p>
          </Section>

          <Section id="account" title="2. Account Registration & Obligations">
            <p>
              You must provide accurate, current, and complete information during registration and keep
              it updated. You are responsible for maintaining the confidentiality of your login credentials
              and for all activities that occur under your account.
            </p>
            <p>
              You must notify us immediately of any unauthorized use of your account or any other
              security breach. We are not liable for any loss or damage arising from your failure to
              safeguard your account credentials.
            </p>
            <p>
              Each account may have one primary administrator who can manage users, roles, and permissions
              within the organization. You are responsible for the actions of all users associated with
              your account.
            </p>
          </Section>

          <Section id="services" title="3. Services & Use Rights">
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and
              use the Service for your internal business purposes during the term of this agreement.
            </p>
            <p>
              The Service includes: receipt image capture and storage, AI-powered data extraction,
              CRA compliance scoring, tamper-evident audit trail, multi-user expense management,
              bank reconciliation, mileage tracking, and export tools (CSV, IDEA, PDF).
            </p>
            <p>
              You shall not: reverse-engineer, decompile, or attempt to extract the source code of the
              Service or its underlying AI models; use the Service for any unlawful purpose; or permit
              third parties to access the Service except as expressly authorized.
            </p>
          </Section>

          <Section id="customer-data" title="4. Customer Data & Privacy">
            <p>
              You retain all ownership rights to the receipt images, financial data, and other content
              you upload to the Service (&ldquo;Customer Data&rdquo;). We are granted a limited license
              to process, store, and transmit Customer Data solely to provide the Service.
            </p>
            <p>
              Our collection, use, and disclosure of personal information is governed by our{' '}
              <A href="/privacy">Privacy Policy</A>, which is incorporated by reference.
            </p>
            <p>
              You acknowledge that Customer Data may be processed and stored outside of Canada,
              including in the United States, as described in our Privacy Policy. You consent to
              such cross-border processing and storage.
            </p>
            <p>
              We implement appropriate technical and organizational measures to protect Customer Data,
              including encryption in transit (TLS 1.3), encryption at rest (AES-256), role-based
              access controls, and regular security audits. Despite these measures, no system is
              impenetrable and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section id="ai-disclaimer" title="5. AI & Automation Disclaimer">
            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/[0.05] p-4 mb-4">
              <p className="font-semibold text-amber-300 text-sm mb-1">AI Extraction Limitations</p>
              <p>
                The Service uses generative AI to extract text from uploaded documents. AI outputs may
                contain errors, omissions, or inaccuracies (&ldquo;hallucinations&rdquo;). You are
                solely responsible for reviewing and verifying all extracted data before using it for
                any purpose, including tax filing, accounting, or financial reporting.
              </p>
            </div>
            <p>
              CRA Readiness Scores, tax rate validations, and compliance indicators are informational
              tools only. <B>9 Star Labs does not provide tax, legal, or accounting advice.</B> We
              recommend consulting a qualified Canadian accountant or tax professional for advice
              specific to your situation.
            </p>
            <p>
              We do not guarantee that records accepted by our system will be accepted by the Canada
              Revenue Agency or any other regulatory body during an audit. You remain fully responsible
              for compliance with the <em>Income Tax Act</em> (Canada), the <em>Excise Tax Act</em>
              (Canada), and all applicable provincial legislation.
            </p>
          </Section>

          <Section id="third-party" title="6. Third-Party Services & Integrations">
            <p>
              The Service integrates with third-party platforms including QuickBooks Online, Xero,
              Google Gemini AI, Stripe, Supabase, and Vercel. Your use of these third-party services
              is subject to their respective terms of service and privacy policies.
            </p>
            <p>
              We are not responsible for the availability, security, or performance of third-party
              services. Any integration is provided as a convenience and may be modified or discontinued
              at any time.
            </p>
            <p>
              If you connect the Service to your QuickBooks Online or Xero account, you authorize
              us to access and transmit data to those platforms on your behalf in accordance with
              your authorization settings.
            </p>
          </Section>

          <Section id="fees" title="7. Fees, Billing & Taxes">
            <p>
              Subscription fees are billed in advance on a monthly or annual basis, as selected during
              checkout. Fees are non-refundable except as expressly stated in our refund policy or
              as required by applicable law.
            </p>
            <p>
              We may change our fees with 30 days&apos; notice. Continued use after the fee change
              constitutes acceptance of the new fees.
            </p>
            <p>
              You are responsible for all applicable taxes (including GST/HST, PST, QST) on fees
              paid under these Terms. If we are required to collect taxes, the amount will be added
              to your invoice.
            </p>
            <p>
              Late payments may result in suspension of access to the Service. We will provide
              7 days&apos; notice before suspending service for non-payment.
            </p>
          </Section>

          <Section id="confidentiality" title="8. Confidentiality & Security">
            <p>
              Each party agrees to maintain the confidentiality of the other party&apos;s confidential
              information and to use it only for purposes of performing obligations under these Terms.
              Confidential information includes account credentials, security reports, proprietary
              technology, and any data clearly marked as confidential.
            </p>
            <p>
              This section does not prevent us from disclosing information required by law, court order,
              or regulatory authority, provided we give you prior notice where legally permitted.
            </p>
          </Section>

          <Section id="availability" title="9. Service Availability & Support">
            <p>
              We strive to maintain 99.5% service availability on a monthly basis, excluding scheduled
              maintenance (announced at least 24 hours in advance) and events beyond our reasonable
              control (force majeure, third-party outages, internet disruptions).
            </p>
            <p>
              Support is provided via email during regular business hours (Mountain Time). We aim to
              respond to support inquiries within 1 business day. Critical issues affecting service
              availability receive priority response.
            </p>
            <p>
              Beta or preview features are provided &ldquo;as is&rdquo; without any warranty and may
              be modified or discontinued at any time without notice.
            </p>
          </Section>

          <Section id="warranties" title="10. Warranties & Disclaimers">
            <p>
              We warrant that the Service will perform materially in accordance with its documentation.
              Your sole remedy for breach of this warranty is correction of the non-conformity or,
              if correction is not commercially feasible, a refund of fees paid during the affected
              period.
            </p>
            <p>
              <B>Except as expressly stated in this section, the Service is provided &ldquo;as is&rdquo;
              and &ldquo;as available&rdquo; without warranties of any kind, either express or implied,
              including implied warranties of merchantability, fitness for a particular purpose,
              title, and non-infringement.</B>
            </p>
            <p>
              We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) AI
              extractions will be accurate or complete; (c) records stored in the Service will be
              accepted by any government agency; or (d) the Service will meet your specific business
              requirements.
            </p>
          </Section>

          <Section id="limitation" title="11. Limitation of Liability">
            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/[0.05] p-4 mb-4">
              <p className="font-semibold text-amber-300 text-sm mb-1">Important Liability Cap</p>
              <p>
                To the maximum extent permitted by applicable law, 9 Star Labs shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages, including loss
                of profits, data, tax penalties, or business interruption, arising out of your use of
                or inability to use the Service.
              </p>
            </div>
            <p>
              Our total aggregate liability to you for all claims arising under these Terms shall not
              exceed the total amount paid by you to 9 Star Labs in the twelve (12) months preceding
              the event giving rise to the claim.
            </p>
            <p>
              The above limitations do not apply to: (i) breach of confidentiality obligations;
              (ii) breach of data security obligations; (iii) infringement of intellectual property
              rights; (iv) gross negligence or wilful misconduct; or (v) liability that cannot be
              excluded under applicable law.
            </p>
          </Section>

          <Section id="indemnities" title="12. Indemnities">
            <p>
              <B>Customer indemnity:</B> You agree to indemnify, defend, and hold harmless 9 Star Labs
              from any claims, damages, liabilities, costs, and expenses arising from: (a) your misuse
              of the Service; (b) your violation of these Terms; (c) Customer Data that infringes
              third-party rights or violates applicable law; or (d) your failure to comply with
              tax or regulatory obligations.
            </p>
            <p>
              <B>9 Star Labs indemnity:</B> We agree to indemnify you against claims that the Service
              itself infringes a third-party Canadian intellectual property right, provided you notify
              us promptly and cooperate in the defense. If such a claim is likely, we may modify the
              Service or terminate your license with a refund of prepaid fees.
            </p>
          </Section>

          <Section id="term" title="13. Term, Suspension & Termination">
            <p>
              These Terms commence upon your acceptance and continue until terminated by either party
              as provided below.
            </p>
            <p>
              <B>Termination for convenience:</B> You may terminate your account at any time from
              your account settings. Fees are non-refundable for the remaining billing period.
            </p>
            <p>
              <B>Termination for cause:</B> Either party may terminate if the other party materially
              breaches these Terms and fails to cure within 30 days of written notice.
            </p>
            <p>
              <B>Suspension:</B> We may suspend your access to the Service immediately if: (a) you
              fail to pay fees when due; (b) your use poses a security risk to the Service or other
              users; (c) you violate applicable law; or (d) you exceed reasonable usage limits.
            </p>
          </Section>

          <Section id="termination-effects" title="14. Effects of Termination">
            <p>
              Upon termination: (a) your right to access the Service ceases immediately; (b) we will
              provide you with a 30-day data export window to download your Customer Data (CSV + ZIP);
              (c) after the export window, Customer Data will be deleted or anonymized, subject to
              legal retention obligations under the <em>Income Tax Act</em> and <em>Excise Tax Act</em>.
            </p>
            <p>
              Clauses intended to survive termination survive, including Sections 4 (Customer Data),
              5 (AI Disclaimer), 10 (Warranties), 11 (Limitation of Liability), 12 (Indemnities),
              and 15 (Governing Law).
            </p>
          </Section>

          <Section id="governing" title="15. Governing Law & Dispute Resolution">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              Province of Alberta and the federal laws of Canada applicable therein, without regard
              to conflict of law principles.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms shall first be attempted to be
              resolved through good-faith negotiation between the parties. If the dispute cannot be
              resolved within 30 days, either party may refer the matter to the courts of the
              Province of Alberta, sitting in Edmonton.
            </p>
            <p>
              <B>Quebec users:</B> If you are a consumer or business domiciled in Quebec, certain
              provisions of the <em>Civil Code of Québec</em> and Quebec consumer protection laws
              may apply notwithstanding the governing law clause above. Nothing in these Terms
              limits your rights under Quebec law where such rights cannot be waived by contract.
            </p>
          </Section>

          <Section id="changes" title="16. Changes to Terms">
            <p>
              We may update these Terms from time to time. Material changes will be communicated via
              email to the account administrator and/or through an in-app notification at least
              30 days before they take effect.
            </p>
            <p>
              Your continued use of the Service after the effective date of updated Terms constitutes
              acceptance of the changes. If you do not agree to the updated Terms, you may terminate
              your account before the effective date.
            </p>
          </Section>

          <Section id="general" title="17. General Provisions">
            <p>
              <B>Assignment:</B> You may not assign these Terms without our prior written consent.
              We may assign these Terms in connection with a merger, acquisition, or sale of assets.
            </p>
            <p>
              <B>Subcontracting:</B> We may use subcontractors and service providers to deliver the
              Service, provided they are bound by obligations consistent with these Terms.
            </p>
            <p>
              <B>Force Majeure:</B> Neither party is liable for delays or failures caused by events
              beyond its reasonable control, including acts of God, war, pandemic, government action,
              internet outages, or third-party service failures.
            </p>
            <p>
              <B>Entire Agreement:</B> These Terms, together with the Privacy Policy and any order
              forms, constitute the entire agreement between you and 9 Star Labs regarding the Service.
            </p>
            <p>
              <B>Severability:</B> If any provision of these Terms is found to be unenforceable, the
              remaining provisions remain in full force and effect.
            </p>
            <p>
              <B>Waiver:</B> Our failure to enforce any provision does not constitute a waiver of
              our right to enforce it later.
            </p>
            <p>
              <B>Notices:</B> Legal notices shall be sent to <A href="mailto:legal@9starlabs.ca">legal@9starlabs.ca</A>
              or to the mailing address on file for your account.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}
