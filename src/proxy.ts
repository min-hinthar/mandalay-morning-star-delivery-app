import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host && /^www\./i.test(host)) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./i, "");
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
