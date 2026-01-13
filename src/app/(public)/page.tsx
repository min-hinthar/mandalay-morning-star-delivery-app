import Image from "next/image";
import type { ReactElement } from "react";
import { CoverageCheck } from "@/components/coverage/coverage-check";

export default function HomePage(): ReactElement {
  return (
    <main className="min-h-screen bg-background">
      <section className="flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <Image
          src="/logo.png"
          alt="Mandalay Morning Star"
          width={160}
          height={160}
          priority
          className="mb-6"
        />
        <h1 className="text-center text-3xl font-display text-brand-red md:text-4xl">
          Mandalay Morning Star
        </h1>
        <p className="mt-3 max-w-md text-center text-muted">
          Authentic Burmese cuisine delivered fresh to your door every Saturday.
        </p>
      </section>

      <section className="flex justify-center px-4 pb-12">
        <CoverageCheck />
      </section>

      <section className="bg-brand-red/5 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-display text-brand-red">
            How It Works
          </h2>
          <div className="grid gap-6 text-sm md:grid-cols-3">
            <div>
              <div className="mb-2 text-3xl">1</div>
              <p className="font-medium">Check Coverage</p>
              <p className="text-muted">Enter your address above</p>
            </div>
            <div>
              <div className="mb-2 text-3xl">2</div>
              <p className="font-medium">Order by Friday 3PM</p>
              <p className="text-muted">Browse our menu and checkout</p>
            </div>
            <div>
              <div className="mb-2 text-3xl">3</div>
              <p className="font-medium">Saturday Delivery</p>
              <p className="text-muted">Fresh food, 11am - 7pm</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
