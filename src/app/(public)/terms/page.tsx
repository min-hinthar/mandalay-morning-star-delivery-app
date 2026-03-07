import Link from "next/link";

import { KITCHEN_LOCATION } from "@/types/address";

export const metadata = {
  title: "Terms of Service | Mandalay Morning Star Burmese Kitchen",
  description: "Terms and conditions for using our meal delivery service.",
};

export default function TermsPage() {
  return (
    <main className="bg-background text-text-primary">
      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: February 14, 2026</p>

        {/* 1. Introduction / Acceptance of Terms */}
        <h2 className="text-xl font-display font-semibold mt-8">Acceptance of Terms</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          By accessing or using Mandalay Morning Star Burmese Kitchen&apos;s meal delivery service
          or website, you agree to be bound by these Terms of Service. If you do not agree to these
          terms, please do not use our service. Mandalay Morning Star Burmese Kitchen is located in
          Covina, California.
        </p>

        {/* 2. Service Description */}
        <h2 className="text-xl font-display font-semibold mt-8">Service Description</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We operate a weekly Burmese meal delivery service serving the greater Los Angeles area.
          Our fresh, homemade Burmese dishes are prepared with care and delivered to your door on
          our scheduled delivery days.
        </p>

        {/* 3. Account Terms */}
        <h2 className="text-xl font-display font-semibold mt-8">Account Terms</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          You must be at least 13 years old to use this service. You may register for an account
          using Google Sign-In or an email magic link. You are responsible for maintaining the
          accuracy of your account information. Each person may hold only one account.
        </p>

        {/* 4. Ordering and Payment */}
        <h2 className="text-xl font-display font-semibold mt-8">Ordering and Payment</h2>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>Orders must be placed before the cutoff time for each delivery day.</li>
          <li>All prices are in USD and include applicable taxes.</li>
          <li>
            Payment processing is handled securely by Stripe. By placing an order, you authorize the
            charge to your selected payment method.
          </li>
          <li>
            Pricing may change from time to time. Existing orders will always be honored at the
            original price.
          </li>
        </ul>

        {/* 5. Delivery */}
        <h2 className="text-xl font-display font-semibold mt-8">Delivery</h2>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>Delivery windows vary by day. Check the menu for current schedule.</li>
          <li>
            We deliver to addresses within our service area (greater Los Angeles&nbsp;/ Covina
            area).
          </li>
          <li>
            You are responsible for providing an accurate delivery address and ensuring someone is
            available to receive the order.
          </li>
          <li>
            We are not responsible for failed deliveries due to incorrect addresses or inaccessible
            locations.
          </li>
        </ul>

        {/* 6. Cancellation and Refunds */}
        <h2 className="text-xl font-display font-semibold mt-8">Cancellation and Refunds</h2>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>Orders may be cancelled before the weekly cutoff (Friday 3:00 PM PT).</li>
          <li>
            Orders cannot be cancelled after the cutoff, as food preparation has already begun.
          </li>
          <li>
            If you receive a damaged or incorrect item, please contact us within 24 hours of
            delivery and we will make it right.
          </li>
          <li>Refunds are issued to your original payment method via Stripe.</li>
        </ul>

        {/* 7. Food Safety and Allergens */}
        <h2 className="text-xl font-display font-semibold mt-8">Food Safety and Allergens</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Your safety matters to us. Please read this section carefully:
        </p>
        <ul className="mt-3 list-disc pl-6 font-body text-text-secondary leading-relaxed space-y-2">
          <li>
            Our kitchen handles common allergens including but not limited to: nuts, shellfish, soy,
            gluten, eggs, and dairy.
          </li>
          <li>
            Cross-contamination may occur despite our best precautions. If you have a severe
            allergy, please be aware of this risk.
          </li>
          <li>
            Customers with food allergies are responsible for reviewing menu descriptions and
            contacting us with questions before ordering.
          </li>
          <li>
            <strong>
              We are not liable for allergic reactions&mdash;you order at your own risk.
            </strong>
          </li>
          <li>All food is prepared in a commercial kitchen following food safety guidelines.</li>
        </ul>

        {/* 8. User Conduct */}
        <h2 className="text-xl font-display font-semibold mt-8">User Conduct</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          You agree to use our service lawfully and responsibly. You may not misuse the platform,
          attempt to gain unauthorized access to any part of the service, or interfere with the
          proper functioning of the website.
        </p>

        {/* 9. Intellectual Property */}
        <h2 className="text-xl font-display font-semibold mt-8">Intellectual Property</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          All content on this website&mdash;including recipes, photos, branding, and design&mdash;is
          owned by Mandalay Morning Star Burmese Kitchen. You may not reproduce, distribute, or
          create derivative works from our content without prior written permission.
        </p>

        {/* 10. Limitation of Liability */}
        <h2 className="text-xl font-display font-semibold mt-8">Limitation of Liability</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Our service is provided &quot;as is&quot; without warranties of any kind, either express
          or implied. To the fullest extent permitted by law, we are not liable for any indirect,
          incidental, or consequential damages arising from your use of the service. Our maximum
          liability is limited to the amount you paid for the specific order in question.
        </p>

        {/* 11. Governing Law */}
        <h2 className="text-xl font-display font-semibold mt-8">Governing Law</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          These terms are governed by and construed in accordance with the laws of the State of
          California. Any disputes arising from these terms or your use of the service shall be
          resolved in the courts of Los Angeles County, California.
        </p>

        {/* 12. Changes to Terms */}
        <h2 className="text-xl font-display font-semibold mt-8">Changes to Terms</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          We reserve the right to update these Terms of Service at any time. When we make changes,
          the updated terms will be posted on this page with a new effective date. Your continued
          use of the service after any changes constitutes acceptance of the updated terms.
        </p>

        {/* 13. Contact Us */}
        <h2 className="text-xl font-display font-semibold mt-8">Contact Us</h2>
        <p className="mt-3 font-body text-text-secondary leading-relaxed">
          Questions about these terms? We&apos;re here to help:
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
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </article>
    </main>
  );
}
