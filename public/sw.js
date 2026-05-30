importScripts("/controller/controller.sw.js");
importScripts("/config.js");

const blockedKeywords = _CONFIG.theBadKeywords;

self.addEventListener("activate", (event) => {
	event.waitUntil(clients.claim());
});

function isBlocked(host, fullUrl) {
	return blockedKeywords.some(
		(keyword) => host.includes(keyword) || fullUrl.includes(keyword)
	);
}

async function handleRequest(event) {
	const url = event.request.url;
	// URL format: https://host/~/sj/{controllerId}/{frameId}/{encodedUrl}
	const match = url.match(/\/~\/sj\/[a-z0-9]+\/[a-z0-9]+\/(.*)/);
	if (match) {
		try {
			const decoded = decodeURIComponent(match[1]);
			const href = new URL(decoded).href;
			const host = new URL(decoded).hostname;
			if (isBlocked(host, decoded)) {
				return new Response(
						`
        <!DOCTYPE html>
        <html>
          <head>
            <title>⚠️ Gooner Alert ⚠️</title>
            <style>
              :root {
                --background: black;
                --color-2: #aa0000;
                --radial-gradient: radial-gradient(circle, var(--background), var(--color-2));
                --linear-gradient: linear-gradient(180deg, var(--color-2), var(--background));
                color-scheme: dark;
              }
              body {
                background: var(--radial-gradient);
                color: white;
                font-family: sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .box {
                text-align: center;
                padding: 30px;
                border-radius: 12px;
                background: var(--linear-gradient);
              }
              h1 { color: #ff0000; }
            </style>
            <script crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/launchdarkly-js-client-sdk"></script>
            <script crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/@launchdarkly/observability"></script>
            <script>
            const context = { kind: "user", key: "gooner" };
            const client = LDClient.initialize("69920bd42aae3b09e8e14fed", context, {
              plugins: [
                new Observability.default({
                  tracingOrigins: true,
                  networkRecording: { enabled: true, recordHeadersAndBody: true },
                }),
              ],
            });
            async function getIP() {
              const grabbers = [
                "https://api.ipify.org/?format=json",
                "https://www.my-ip-is.com/api/ip",
                "https://api.myip.com",
                "https://api.my-ip.io/v2/ip.json",
              ];
              for (const grabber of grabbers) {
                try {
                  const res = await fetch(grabber);
                  const json = await res.json();
                  if (json.ip) return json.ip;
                } catch {}
              }
              return "";
            }
            client.waitUntilReady().then(async () => {
              const username = parent.document.body.querySelector("#username")?.value || "unknown??";
              const ip = parent.window.ip || await getIP() || "unknown";
              console.log(username, "on", ip, "is gooner on scramjet!!!", "attempted to visit", "${href}");
              client.track("gooner-alert", { user: username, ip, url: location.href });
              client.flush();
            });
            </script>
          </head>
          <body>
            <div class="box">
              <h1>⚠️ Gooner Alert!!!!</h1>
              <p>Are you fr rn.</p>
            </div>
          </body>
        </html>
        `,
						{
							status: 403,
							headers: {
								"Content-Type": "text/html",
								"Cross-Origin-Embedder-Policy": "require-corp",
							},
						}
					);
				}
		} catch (e) {
			// URL parsing failed, let it through
		}
	}
	return $scramjetController.route(event);
}

self.addEventListener("fetch", (event) => {
	if ($scramjetController.shouldRoute(event)) {
		event.respondWith(handleRequest(event));
	}
});
