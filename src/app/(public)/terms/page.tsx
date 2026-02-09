import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Mandalay Morning Star",
};

export default function TermsPage() {
  return (
    <main className="bg-background text-text-primary">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-display font-semibold">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">
          Terms of Service for Mandalay Morning Star. This page is under
          construction.
        </p>
        <Link href="/" className="inline-flex mt-6 text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
