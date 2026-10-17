/* Footfall dashboard service worker — booking alerts via Web Push.
 *
 * The API sends {title, body, tag, url}. When a dashboard tab is focused the
 * alert is handed to the page (it shows an in-page toast) instead of a
 * system notification, so the owner isn't told the same thing twice.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Footfall", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Footfall";
  const options = {
    body: data.body || "",
    tag: data.tag || undefined,
    icon: "/logo/notify-icon.png",
    badge: "/logo/notify-icon.png",
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const focused = windows.find((w) => w.focused && new URL(w.url).pathname.startsWith("/dashboard"));
      if (focused) {
        focused.postMessage({ type: "footfall-alert", id: data.tag, kind: data.kind, title, body: options.body, url: options.data.url });
        return undefined;
      }
      return self.registration.showNotification(title, options);
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).pathname.startsWith("/dashboard"));
      if (existing) {
        existing.focus();
        return existing.navigate(target);
      }
      return self.clients.openWindow(target);
    }),
  );
});
