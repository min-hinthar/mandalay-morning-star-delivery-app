import Link from "next/link";

import { KITCHEN_LOCATION } from "@/types/address";

export const metadata = {
  title: "Privacy Policy | Mandalay Morning Star Burmese Kitchen",
  description: "How we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-background text-text-primary">
      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: February 14, 2026</p>

        {/* 1. Introduction */}
        <h2 className="text-xl font-display font-semibold mt-8">Introduction</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Mandalay Morning Star Burmese Kitchen (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
          operates a weekly meal delivery subscription service and the website at
          mandalaymorningstar.com. This Privacy Policy explains how we collect, use, and protect
          your personal information when you use our service. We believe in being transparent about
          our data practices&mdash;if you have questions, please reach out to us anytime.
        </p>

        {/* 2. Information We Collect */}
        <h2 className="text-xl font-display font-semibold mt-8">Information We Collect</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We collect the following types of information to provide and improve our service:
        </p>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>
            <strong>Account information:</strong> Your name, email address, and profile photo,
            provided through Google OAuth sign-in.
          </li>
          <li>
            <strong>Order data:</strong> Delivery address, order history, and any dietary
            preferences you share with us.
          </li>
          <li>
            <strong>Payment information:</strong> Payment card details are processed directly by
            Stripe. We do not store your card numbers on our servers.
          </li>
          <li>
            <strong>Device and usage data:</strong> Browser type, IP address, pages visited, and
            referring URL, collected automatically when you use our website.
          </li>
        </ul>

        {/* 3. How We Use Your Information */}
        <h2 className="text-xl font-display font-semibold mt-8">How We Use Your Information</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We use your information to:
        </p>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>Fulfill and deliver your orders, including communicating delivery updates.</li>
          <li>Send transactional emails such as order confirmations and status notifications.</li>
          <li>Improve our service based on how customers use the website and what they order.</li>
          <li>Diagnose errors and monitor performance to keep the site running smoothly.</li>
        </ul>

        {/* 4. Third-Party Service Providers */}
        <h2 className="text-xl font-display font-semibold mt-8">Third-Party Service Providers</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We work with trusted third-party services to operate our business. Here is exactly who has
          access to your data and why:
        </p>

        <h3 className="text-lg font-display font-medium mt-5">Google (OAuth)</h3>
        <p className="mt-2 font-body text-text-secondary leading-relaxed">
          We use Google Sign-In for account authentication. When you sign in with Google, we receive
          your name, email address, and profile photo. We request only standard scopes:{" "}
          <code>openid</code>, <code>email</code>, and <code>profile</code>. We do not access your
          contacts, calendar, or any other Google data.
        </p>

        <h3 className="text-lg font-display font-medium mt-5">Stripe</h3>
        <p className="mt-2 font-body text-text-secondary leading-relaxed">
          Stripe processes all payments. Your payment card details are sent directly to Stripe and
          never touch our servers. For more information, see{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Stripe&apos;s privacy policy
          </a>
          .
        </p>

        <h3 className="text-lg font-display font-medium mt-5">Resend</h3>
        <p className="mt-2 font-body text-text-secondary leading-relaxed">
          We use Resend to deliver transactional emails, including order confirmations and status
          updates. Resend processes your email address solely for the purpose of email delivery.
        </p>

        <h3 className="text-lg font-display font-medium mt-5">Sentry</h3>
        <p className="mt-2 font-body text-text-secondary leading-relaxed">
          We use Sentry for error monitoring and performance tracking. When errors occur, Sentry may
          capture anonymized session recordings to help us diagnose issues. All text, form inputs,
          and media are masked in these recordings (maskAllText, maskAllInputs, blockAllMedia).
          Session recordings are only captured when errors occur (replaysOnErrorSampleRate: 1.0,
          replaysSessionSampleRate: 0). Sentry also collects browser breadcrumbs&mdash;including
          console messages, DOM interactions, and network requests&mdash;to provide context for
          error reports.
        </p>

        <h3 className="text-lg font-display font-medium mt-5">Vercel</h3>
        <p className="mt-2 font-body text-text-secondary leading-relaxed">
          Our website is hosted on Vercel. We use Vercel Analytics to understand site usage patterns
          and Vercel Speed Insights to monitor loading performance. Speed Insights operates at a 50%
          sample rate. These tools collect anonymized usage and performance data.
        </p>

        {/* 5. Data Sharing */}
        <h2 className="text-xl font-display font-semibold mt-8">Data Sharing</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We share personal information <strong>only</strong> with the service providers listed
          above, and only to the extent necessary to operate our service. We do not sell, rent, or
          trade your personal information to third parties.
        </p>

        {/* 6. Data Retention */}
        <h2 className="text-xl font-display font-semibold mt-8">Data Retention</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We retain your account data for as long as your account is active. Order history is
          retained for our business records. You may request deletion of your personal information
          at any time by contacting us at the email address below.
        </p>

        {/* 7. Cookies and Similar Technologies */}
        <h2 className="text-xl font-display font-semibold mt-8">
          Cookies and Similar Technologies
        </h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Our website uses cookies and similar technologies for the following purposes:
        </p>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>
            <strong>Authentication:</strong> Session cookies to keep you signed in.
          </li>
          <li>
            <strong>Analytics:</strong> Vercel Analytics cookies to understand how visitors use our
            site.
          </li>
          <li>
            <strong>Error monitoring:</strong> Sentry cookies to associate error reports with
            browsing sessions.
          </li>
        </ul>

        {/* 8. Your Rights */}
        <h2 className="text-xl font-display font-semibold mt-8">Your Rights</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          You have the right to access, correct, or delete your personal information. If you would
          like to exercise any of these rights, please contact us at the email address below. We
          will respond to your request in a timely manner.
        </p>

        {/* 9. California Residents */}
        <h2 className="text-xl font-display font-semibold mt-8">California Residents</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          California residents may have additional rights under state law. If you are a California
          resident and would like more information about your rights, please contact us at the email
          address below.
        </p>

        {/* 10. Children's Privacy */}
        <h2 className="text-xl font-display font-semibold mt-8">Children&apos;s Privacy</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Our service is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If we become aware that we have collected data from a
          child under 13, we will take steps to delete it promptly.
        </p>

        {/* 11. Changes to This Policy */}
        <h2 className="text-xl font-display font-semibold mt-8">Changes to This Policy</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We may update this Privacy Policy from time to time. When we make changes, we will post
          the updated policy on this page with a new effective date. We encourage you to review this
          page periodically.
        </p>

        {/* 12. Contact Us */}
        <h2 className="text-xl font-display font-semibold mt-8">Contact Us</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          If you have any questions about this Privacy Policy or our data practices, we&apos;d love
          to hear from you:
        </p>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:admin@mandalaymorningstar.com" className="text-primary hover:underline">
              admin@mandalaymorningstar.com
            </a>
          </li>
          <li>
            <strong>Address:</strong> {KITCHEN_LOCATION.address}
          </li>
        </ul>

        {/* Footer links */}
        <div className="mt-12 border-t border-border pt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </div>
      </article>
    </main>
  );
}
