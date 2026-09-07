import cron from "node-cron";
import { syncPvpFeed } from "./sync";

let started = false;

export function startCron() {
  if (started) return;
  started = true;

  void syncPvpFeed().catch((error) => {
    console.error("[pvp-feed] initial sync failed", error);
  });

  cron.schedule("*/30 * * * *", () => {
    void syncPvpFeed()
      .then((result) => {
        console.log("[pvp-feed] cron sync", result);
      })
      .catch((error) => {
        console.error("[pvp-feed] cron sync failed", error);
      });
  });

  console.log("[pvp-feed] background sync scheduled every 30 minutes");
}
