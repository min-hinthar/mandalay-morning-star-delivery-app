"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverageStatus } from "@/components/checkout/CoverageStatus";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";

export function CoverageCheck() {
  const [address, setAddress] = useState("");
  const { mutate, reset, data, error, status } = useCoverageCheck();
  const isLoading = status === "pending";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      return;
    }

    reset();
    mutate({ address: trimmedAddress });
  };

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
              onChange={(event) => setAddress(event.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-center text-xs text-primary">
              We deliver within 50 miles of Covina, CA every Saturday.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-gold-dark text-white cursor-pointer"
            disabled={isLoading || !address.trim()}
          >
            {isLoading ? "Checking..." : "Check Coverage"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {data && (
          <div className="mt-4 space-y-2">
            <CoverageStatus result={data} />
            {data.formattedAddress && (
              <p className="text-center text-sm text-muted">
                {data.formattedAddress}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
