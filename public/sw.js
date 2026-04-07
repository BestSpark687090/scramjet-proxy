importScripts("/scram/scramjet.all.js");
importScripts("/config.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Minimal adult-only blocklist
const blockedKeywords = _CONFIG.theBadKeywords; // Add more domains if needed

// Utility: check if a URL/host should be blocked
function isBlocked(host, fullUrl) {
	return blockedKeywords.some(
		(keyword) => host.includes(keyword) || fullUrl.includes(keyword)
	);
}

async function handleRequest(event) {
	await scramjet.loadConfig();
	scramjet.config.prefix="/scramjet/";
	const url = event.request.url;
	const prefix = "/scramjet/";

	if (url.startsWith(location.origin + prefix)) {
		const encoded = url.slice((location.origin + prefix).length);
		const decoded = decodeURIComponent(encoded);
		const host = new URL(decoded).hostname;

		if (isBlocked(host, decoded)) {
			// Return the custom Gooner Alert page with embedded Highlight logging
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
            <!-- Embed Highlight SDK -->
            <script
            crossorigin="anonymous"
            src="https://cdn.jsdelivr.net/npm/launchdarkly-js-client-sdk"
          ></script>
          <script
            crossorigin="anonymous"
            src="https://cdn.jsdelivr.net/npm/@launchdarkly/observability"
          ></script>
            <script>
            const context = {
              kind: "user",
              key: "gooner",
            };
            const client = LDClient.initialize("69920bd42aae3b09e8e14fed", context, {
              plugins: [
                new Observability.default({
                  tracingOrigins: true,
                  networkRecording: { enabled: true, recordHeadersAndBody: true },
                }),
              ],
            });
            client.waitUntilReady()
            .then(() => {
              const username = parent.document.body.querySelector("#username").value || "unknown??"
              const ip = parent.window.ip || "unknown"
              console.log('Client is ready');
              console.log(username,"on",ip,"is gooner on scramjet!!!")
              client.track("gooner-alert", { user: username, ip, url: location.href });
              client.flush();
              console.log()
              // Start your application
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
	}

	if (scramjet.route(event)) {
		return scramjet.fetch(event);
	}
	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});
