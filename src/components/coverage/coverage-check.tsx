"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoverageCheckResponse } from "@/lib/validators/coverage";

export function CoverageCheck(): ReactElement {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverageCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/coverage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = (await response.json()) as CoverageCheckResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to check coverage. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-display text-brand-red">
          Check Delivery Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted">
              We deliver within 50 miles of Covina, CA every Saturday
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold hover:bg-gold-dark text-foreground"
            disabled={loading || !address.trim()}
          >
            {loading ? "Checking..." : "Check Coverage"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div
            className={`mt-4 rounded-md border p-4 ${
              result.deliverable
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {result.deliverable ? (
              <>
                <p className="font-medium text-green-700">
                  Great news! We deliver to your area.
                </p>
                <p className="mt-1 text-sm text-green-600">
                  {result.formatted_address}
                </p>
                <p className="mt-2 text-xs text-green-600">
                  {result.distance_miles} miles / {result.duration_minutes} min drive
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-700">
                  Sorry, we don&apos;t deliver to this address yet.
                </p>
                <p className="mt-1 text-sm text-amber-600">
                  {result.formatted_address}
                </p>
                {result.reason && (
                  <p className="mt-2 text-xs text-amber-600">{result.reason}</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


