import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Image
        src="/logo.png"
        alt="Mandalay Morning Star"
        width={200}
        height={200}
        priority
      />
      <h1 className="mt-6 text-3xl font-display text-brand-red">
        Mandalay Morning Star
      </h1>
      <p className="mt-2 text-muted text-center max-w-md">
        Authentic Burmese cuisine delivered to your door every Saturday.
      </p>
      <p className="mt-8 text-sm text-muted">Coming Soon - Check back for ordering!</p>
    </main>
  );
}
