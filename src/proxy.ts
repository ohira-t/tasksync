import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER = process.env.BASIC_AUTH_USER ?? "GLS2PJ";
const PASS = process.env.BASIC_AUTH_PASS ?? "GLUG260519";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TaskSync"' },
  });
}

export function proxy(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  if (user !== USER || pass !== PASS) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
