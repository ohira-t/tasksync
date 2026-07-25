import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証情報は環境変数だけから取る。既定値を置くとリポジトリが公開された時点で
// そのまま本番の認証情報が漏れるため、未設定なら誰も通さない
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TaskSync"' },
  });
}

export function proxy(request: NextRequest) {
  if (!USER || !PASS) return unauthorized();

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    // Base64として壊れているヘッダーで500にしない
    return unauthorized();
  }

  // パスワードに ":" が含まれていても壊れないよう最初の1つだけで区切る
  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  if (user !== USER || pass !== PASS) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
