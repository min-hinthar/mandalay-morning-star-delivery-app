import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/auth/user-menu";
import type { ReactElement } from "react";

export async function Header(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-background/80 px-6 py-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <h1 className="text-lg font-display text-brand-red">
          Mandalay Morning Star
        </h1>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
