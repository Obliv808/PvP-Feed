import { FeedDashboard } from "@/components/FeedDashboard";
import { readCache } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const cache = readCache();

  return (
    <FeedDashboard
      initialArticles={cache.articles}
      lastSync={cache.lastSync}
      lastError={cache.lastError}
    />
  );
}
