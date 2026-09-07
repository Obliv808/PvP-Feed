import { NextResponse } from "next/server";
import { readCache } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  const cache = readCache();
  return NextResponse.json({
    lastSync: cache.lastSync,
    lastError: cache.lastError,
    articles: cache.articles,
  });
}
