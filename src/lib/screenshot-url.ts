// スクリーンショットの blob 生URL(認証なしで閲覧可能)をクライアントに渡さず、
// 認証付きプロキシ /api/images/<id> 経由のURLに差し替えるためのヘルパー。
// DB には実URLを保存したまま、API の出口でだけ変換する。

export const IMAGE_PROXY_PREFIX = "/api/images/";

export function proxiedScreenshotUrl(id: string): string {
  return `${IMAGE_PROXY_PREFIX}${id}`;
}

export function screenshotIdFromProxyUrl(url: string): string | null {
  if (!url.startsWith(IMAGE_PROXY_PREFIX)) return null;
  const id = url.slice(IMAGE_PROXY_PREFIX.length);
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

export function maskTaskScreenshots<
  T extends { screenshots: { id: string; url: string }[] },
>(task: T): T {
  return {
    ...task,
    screenshots: task.screenshots.map((s) => ({
      ...s,
      url: proxiedScreenshotUrl(s.id),
    })),
  };
}
