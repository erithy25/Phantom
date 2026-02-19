export const metadata = {
  title: "Terms of Service - Phantom",
};

export default function TermsPage() {
  return (
    <article className="prose-legal">
      <h1 className="text-[28px] font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-[13px] text-[#52525B] mb-10">Last updated: February 19, 2026</p>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using the Phantom platform (&quot;Service&quot;), you agree to be bound by these
          Terms of Service. If you do not agree to these terms, you may not use the Service.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>
          Phantom is an AI-powered academic productivity platform that provides tools including
          AI chat assistance, GPA tracking, smart drafts, lecture capture, task management, and
          campus analytics. The Service is available through a paid subscription (Phantom Pro).
        </p>
      </Section>

      <Section title="3. Account Registration">
        <p>To use the Service, you must:</p>
        <ul>
          <li>Provide a valid email address</li>
          <li>Create a secure password</li>
          <li>Verify your email address</li>
          <li>Be at least 16 years of age</li>
        </ul>
        <p>
          You are responsible for maintaining the security of your account credentials. You must
          notify us immediately of any unauthorized use of your account.
        </p>
      </Section>

      <Section title="4. Subscription and Payments">
        <p>
          Phantom Pro is available for 9,99&euro; per month. By subscribing, you agree to the following:
        </p>
        <ul>
          <li>Subscriptions are billed monthly</li>
          <li>You may cancel your subscription at any time</li>
          <li>Cancellation takes effect at the end of the current billing period</li>
          <li>No refunds are provided for partial billing periods</li>
          <li>We reserve the right to change pricing with 30 days&apos; notice</li>
        </ul>
      </Section>

      <Section title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal purpose</li>
          <li>Submit content that infringes on intellectual property rights</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the Service to generate content intended for academic dishonesty or plagiarism</li>
          <li>Share your account credentials with others</li>
          <li>Reverse engineer or attempt to extract source code from the Service</li>
        </ul>
      </Section>

      <Section title="6. AI-Generated Content">
        <p>
          Phantom uses artificial intelligence to generate content, including study materials,
          draft essays, and academic insights. You acknowledge that:
        </p>
        <ul>
          <li>AI-generated content may contain inaccuracies</li>
          <li>You are responsible for reviewing and verifying all AI-generated content</li>
          <li>AI outputs should be used as a learning aid, not submitted as your own work</li>
          <li>We do not guarantee the accuracy, completeness, or fitness of AI outputs</li>
        </ul>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          The Service, including its design, code, and branding, is owned by Phantom. Content
          you create using the Service (your notes, grades, assignments) remains your property.
          By using the Service, you grant us a limited license to process your content to provide
          the Service.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Phantom shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, including loss of data, grades,
          academic standing, or profits, arising from your use of the Service.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of
          these Terms. You may delete your account at any time. Upon termination, your right to
          use the Service ceases immediately.
        </p>
      </Section>

      <Section title="10. Changes to Terms">
        <p>
          We may modify these Terms at any time. We will provide notice of material changes via
          email or through the Service. Continued use after changes constitutes acceptance of the
          new terms.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms are governed by the laws of the Federal Republic of Germany. Any disputes
          shall be resolved in the competent courts of Germany.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          For questions about these Terms, contact us at{" "}
          <a href="mailto:legal@phantom.app" className="text-white hover:underline">legal@phantom.app</a>.
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
