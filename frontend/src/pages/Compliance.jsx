import { Scale, Shield, FileCheck, AlertCircle, Clock, Phone, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const EXCLUSIONS = [
  'Health, medical, or hospitalisation expenses',
  'Life insurance or accidental death benefit',
  'Vehicle repair, damage, or theft',
  'Personal accident or bodily injury',
  'War, armed conflict, or military operations',
  'Pandemic, epidemic, or government-declared health emergency',
  'Terrorism or civil unrest (unless declared curfew via civic trigger)',
  'Nuclear, chemical, or biological events',
  'Intentional self-inflicted disruption',
  'Pre-existing conditions or chronic illness',
  'Loss of income due to personal reasons (illness, leave, resignation)',
  'Platform-side issues (app downtime, order cancellations)',
];

function Section({ icon: Icon, color, bg, title, children }) {
  return (
    <div className="card-glass mb-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="icon-wrap w-10 h-10 shrink-0" style={{ background: bg }}>
          <Icon size={18} color={color} strokeWidth={1.8} />
        </div>
        <h2 className="text-base font-bold text-ink-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Compliance() {
  return (
    <div className="min-h-screen" style={{ background: '#f2f2f7' }}>
      {/* Header */}
      <div
        className="border-b border-[#e5e5ea] py-10"
        style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f2f2f7 60%,#ecfdf5 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Logo height={36} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border border-[#c7d2fe]"
            style={{ background: 'rgba(238,242,255,0.9)' }}>
            <Scale size={12} color="#4f46e5" strokeWidth={2.5} />
            <span className="text-[#4f46e5] text-xs font-semibold">Regulatory Compliance</span>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#1c1c1e] mb-3 tracking-tight">
            IRDAI Compliance &amp; Disclosures
          </h1>
          <p className="text-[#636366] text-sm max-w-xl mx-auto leading-relaxed">
            KamaiShield is designed to operate within India's insurance regulatory framework.
            This page documents our regulatory positioning, data practices, and product disclosures.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* IRDAI Sandbox */}
        <Section icon={Scale} color="#4f46e5" bg="#eef2ff" title="IRDAI Regulatory Sandbox">
          <div className="space-y-3 text-sm text-ink-700 leading-relaxed">
            <p>
              KamaiShield is designed for the{' '}
              <strong className="text-ink-900">IRDAI Regulatory Sandbox</strong> under Circular{' '}
              <span className="font-mono text-xs bg-surface-100 px-1.5 py-0.5 rounded">
                IRDA/INT/GDL/MISC/142/08/2019
              </span>
              . Parametric insurance products qualify under the{' '}
              <strong className="text-ink-900">"innovative products"</strong> category of the sandbox framework.
            </p>
            <p>
              The sandbox allows insurtech startups to test innovative products with real customers under
              IRDAI supervision for up to 36 months before full licensing. KamaiShield's parametric
              trigger model — where payouts are based on objective, verifiable data rather than loss
              assessment — is specifically suited to this pathway.
            </p>
            <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-xl p-3 mt-2">
              <p className="text-[#4f46e5] text-xs font-semibold mb-1">Sandbox Eligibility Criteria Met</p>
              <ul className="text-xs text-ink-600 space-y-1">
                <li className="flex items-center gap-2"><ChevronRight size={12} className="text-[#4f46e5] shrink-0"/>Innovative product not currently available in Indian market</li>
                <li className="flex items-center gap-2"><ChevronRight size={12} className="text-[#4f46e5] shrink-0"/>Technology-driven distribution (mobile-first, no agents)</li>
                <li className="flex items-center gap-2"><ChevronRight size={12} className="text-[#4f46e5] shrink-0"/>Targets underserved segment (gig economy workers)</li>
                <li className="flex items-center gap-2"><ChevronRight size={12} className="text-[#4f46e5] shrink-0"/>Parametric structure enables objective, dispute-free claims</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Product Classification */}
        <Section icon={FileCheck} color="#059669" bg="#d1fae5" title="Product Classification">
          <div className="space-y-3 text-sm text-ink-700 leading-relaxed">
            <p>
              KamaiShield is classified as a{' '}
              <strong className="text-ink-900">micro-insurance product</strong> under{' '}
              <strong className="text-ink-900">IRDAI (Micro Insurance) Regulations, 2005</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Product Type', value: 'Parametric Income Protection' },
                { label: 'Premium Range', value: '₹29–₹79 per week' },
                { label: 'Coverage Cap', value: '₹500–₹1,800 per week' },
                { label: 'Policy Term', value: 'Weekly (renewable)' },
                { label: 'Distribution', value: 'Direct digital (no agents)' },
                { label: 'Claim Type', value: 'Automatic parametric trigger' },
              ].map(item => (
                <div key={item.label} className="bg-surface-50 border border-surface-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-ink-900 font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-2">
              Weekly premiums of ₹29–₹79 fall within the micro-insurance premium limits prescribed under
              the 2005 regulations. The product covers income loss only — not life, health, or property.
            </p>
          </div>
        </Section>

        {/* Data Protection */}
        <Section icon={Shield} color="#0284c7" bg="#e0f2fe" title="Data Protection — DPDP Act 2023">
          <div className="space-y-3 text-sm text-ink-700 leading-relaxed">
            <p>
              KamaiShield is compliant with the{' '}
              <strong className="text-ink-900">Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </p>
            <div className="space-y-2">
              {[
                { title: 'No biometric data stored', desc: 'We do not collect fingerprints, face scans, or any biometric identifiers.' },
                { title: 'Location data — limited purpose', desc: 'GPS coordinates are used only for claim zone verification and are permanently deleted after 30 days.' },
                { title: 'Minimal data collection', desc: 'We collect only: phone number, city/zone, delivery platform, and UPI ID. No Aadhaar, PAN, or bank account numbers.' },
                { title: 'Data residency', desc: 'All data is stored on servers located within India.' },
                { title: 'Right to erasure', desc: 'Riders can request complete data deletion by contacting support. Deletion is processed within 72 hours.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0284c7] mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">{item.title}</p>
                    <p className="text-ink-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* KYC */}
        <Section icon={Phone} color="#7c3aed" bg="#ede9fe" title="KYC Requirements">
          <div className="space-y-3 text-sm text-ink-700 leading-relaxed">
            <p>
              Phone-based OTP authentication satisfies the{' '}
              <strong className="text-ink-900">minimum KYC requirements</strong> for micro-insurance
              products with premiums under ₹500/week, as per IRDAI guidelines for simplified KYC
              in low-value insurance products.
            </p>
            <div className="bg-[#ede9fe] border border-[#c4b5fd] rounded-xl p-3">
              <p className="text-[#7c3aed] text-xs font-semibold mb-2">KYC Data Collected</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-ink-600">
                <div className="flex items-center gap-1.5"><ChevronRight size={11} className="text-[#7c3aed]"/>Mobile number (OTP verified)</div>
                <div className="flex items-center gap-1.5"><ChevronRight size={11} className="text-[#7c3aed]"/>Full name (self-declared)</div>
                <div className="flex items-center gap-1.5"><ChevronRight size={11} className="text-[#7c3aed]"/>City and delivery zone</div>
                <div className="flex items-center gap-1.5"><ChevronRight size={11} className="text-[#7c3aed]"/>UPI ID (for payouts)</div>
              </div>
            </div>
            <p className="text-xs text-ink-500">
              For premiums exceeding ₹500/week or annual coverage above ₹30,000, full KYC
              (Aadhaar-based eKYC) would be required. KamaiShield's current product tiers are
              designed to remain within simplified KYC limits.
            </p>
          </div>
        </Section>

        {/* Exclusions */}
        <Section icon={AlertCircle} color="#d97706" bg="#fef3c7" title="Coverage Exclusions">
          <div className="space-y-2 text-sm text-ink-700">
            <p className="text-ink-500 text-xs mb-3">
              KamaiShield covers <strong className="text-ink-800">income loss from the 5 defined parametric triggers only</strong>.
              The following are explicitly excluded from all plans:
            </p>
            <div className="space-y-1.5">
              {EXCLUSIONS.map((excl, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-surface-100 last:border-0">
                  <AlertCircle size={13} className="text-warning-500 mt-0.5 shrink-0" />
                  <span className="text-ink-700 text-xs leading-relaxed">{excl}</span>
                </div>
              ))}
            </div>
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 mt-3">
              <p className="text-warning-700 text-xs font-semibold mb-1">Important Notice</p>
              <p className="text-ink-600 text-xs leading-relaxed">
                This product is not a substitute for health insurance, life insurance, or vehicle insurance.
                Riders are encouraged to maintain separate coverage for those risks.
              </p>
            </div>
          </div>
        </Section>

        {/* Grievance Redressal */}
        <Section icon={Clock} color="#e11d48" bg="#ffe4e6" title="Grievance Redressal">
          <div className="space-y-3 text-sm text-ink-700 leading-relaxed">
            <p>
              KamaiShield maintains a{' '}
              <strong className="text-ink-900">48-hour response SLA</strong> for all claim disputes
              and grievances, in line with IRDAI's consumer protection guidelines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: '01', title: 'Submit Grievance', desc: 'Contact support via app or email within 30 days of the disputed decision.' },
                { step: '02', title: '48-Hour Response', desc: 'Our team reviews and responds within 48 hours with a resolution or status update.' },
                { step: '03', title: 'Escalation', desc: 'Unresolved disputes can be escalated to IRDAI\'s Integrated Grievance Management System (IGMS).' },
              ].map(item => (
                <div key={item.step} className="bg-surface-50 border border-surface-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-[#e11d48] mb-1">{item.step}</p>
                  <p className="font-semibold text-ink-900 text-xs mb-1">{item.title}</p>
                  <p className="text-ink-500 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-xl p-3 mt-1">
              <p className="text-ink-800 text-xs font-semibold mb-1">Contact</p>
              <p className="text-ink-500 text-xs">Email: <span className="text-primary-600">grievance@kamaishield.in</span></p>
              <p className="text-ink-500 text-xs">IRDAI IGMS: <span className="text-primary-600">igms.irda.gov.in</span></p>
              <p className="text-ink-500 text-xs">IRDAI Toll-Free: <span className="text-primary-600">155255</span></p>
            </div>
          </div>
        </Section>

        {/* Footer note */}
        <div className="text-center py-6 border-t border-surface-200">
          <p className="text-ink-400 text-xs leading-relaxed max-w-xl mx-auto">
            KamaiShield is a proof-of-concept platform. This compliance documentation reflects our
            intended regulatory positioning. Actual insurance operations require IRDAI licensing or
            sandbox approval. For questions, contact{' '}
            <span className="text-primary-600">legal@kamaishield.in</span>.
          </p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-primary-600 text-xs font-semibold mt-3 hover:underline">
            Back to Home <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
