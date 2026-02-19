export const metadata = {
  title: "Privacy Policy - Phantom",
};

export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      <h1 className="text-[28px] font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-[13px] text-[#52525B] mb-10">Last updated: February 19, 2026</p>

      <Section title="1. Introduction">
        <p>
          Phantom (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Phantom platform (the &quot;Service&quot;).
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use our Service.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <h4 className="text-[14px] font-semibold text-[#A1A1AA] mt-4 mb-2">Account Information</h4>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>Email address</li>
          <li>Password (stored as a secure hash, never in plain text)</li>
          <li>Name (if provided)</li>
        </ul>

        <h4 className="text-[14px] font-semibold text-[#A1A1AA] mt-4 mb-2">Usage Data</h4>
        <p>We automatically collect certain information when you use our Service:</p>
        <ul>
          <li>Course and assignment data you input</li>
          <li>AI conversation history</li>
          <li>GPA and grade data you enter</li>
          <li>Device type, browser, and IP address</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our Service</li>
          <li>Send you verification emails and service notifications</li>
          <li>Generate AI-powered academic insights</li>
          <li>Calculate and track your GPA</li>
          <li>Provide anonymous, aggregated Campus Pulse statistics</li>
          <li>Respond to your requests and support inquiries</li>
        </ul>
      </Section>

      <Section title="4. Data Sharing">
        <p>
          We do not sell your personal data. We may share your information only in the
          following circumstances:
        </p>
        <ul>
          <li><strong>Service Providers:</strong> Third-party services that help us operate the platform (e.g., hosting, email delivery, payment processing)</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          <li><strong>Aggregated Data:</strong> Anonymous, aggregated statistics (Campus Pulse) that cannot identify you</li>
        </ul>
      </Section>

      <Section title="5. Data Security">
        <p>
          We implement industry-standard security measures to protect your data, including
          encrypted connections (HTTPS), hashed passwords (bcrypt), and secure session management.
          However, no method of transmission over the Internet is 100% secure.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain your personal data for as long as your account is active. You may request
          deletion of your account and associated data at any time by contacting us.
        </p>
      </Section>

      <Section title="7. Your Rights (GDPR)">
        <p>If you are located in the European Economic Area, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:privacy@phantom.app" className="text-white hover:underline">privacy@phantom.app</a>.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          We use essential cookies for authentication and session management. We do not use
          third-party tracking or advertising cookies.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes
          by posting the new policy on this page and updating the &quot;Last updated&quot; date.
        </p>
      </Section>

      <Section title="10. Contact Us">
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@phantom.app" className="text-white hover:underline">privacy@phantom.app</a>.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-[16px] font-semibold text-white mb-3">{title}</h3>
      <div className="text-[14px] text-[#A1A1AA] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[#71717A] [&_strong]:text-[#A1A1AA]">
        {children}
      </div>
    </section>
  );
}
