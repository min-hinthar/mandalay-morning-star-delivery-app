import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Mandalay Morning Star",
};

export default function PrivacyPage() {
  return (
    <main className="bg-background text-text-primary">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-display font-semibold">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">
          Privacy Policy for Mandalay Morning Star. This page is under
          construction.
        </p>
        <Link href="/" className="inline-flex mt-6 text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
