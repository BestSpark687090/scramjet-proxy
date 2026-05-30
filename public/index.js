"use strict";
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const frameWrapper = document.getElementById("sj-frame-wrapper");
const frameElement = document.getElementById("sj-frame");
const frameUrl = document.getElementById("sj-frame-url");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const username = document.getElementById("username");

let controller = null;
let frame = null;

document.querySelectorAll("*").forEach(function (e) {
	e.addEventListener("keydown", function (ev) {
		if (ev.ctrlKey && ev.shiftKey && ev.code == "KeyZ") {
			if (frameWrapper) frameWrapper.style.display = "none";
		}
	});
});

// Get your ip.
let grabbers = [
	"https://api.ipify.org/?format=json",
	"https://www.my-ip-is.com/api/ip",
	"https://api.myip.com",
	"https://api.my-ip.io/v2/ip.json",
];
let ip = "";
(async () => {
	for (let grabber of grabbers) {
		if (await checkOne(grabber)) {
			break;
		}
	}
})();
async function checkOne(grabber) {
	let res = await fetch(grabber);
	let json = await res.json();
	ip = json.ip;
	return true;
}

function showErrorScreen(msg, details) {
	frameWrapper.style.display = "none";
	error.textContent = msg;
	errorCode.textContent = details;
}

async function initController() {
	const wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	const { default: LibcurlClient } = await import("/libcurl/index.mjs");
	const transport = new LibcurlClient({ wisp: wispUrl });
	await transport.init();
	controller = new $scramjetController.Controller({
		serviceworker: navigator.serviceWorker.controller,
		transport,
		config: {
			prefix: "/~/sj/",
			scramjetPath: "/scramjet/scramjet.js",
			injectPath: "/controller/controller.inject.js",
			wasmPath: "/scramjet/scramjet.wasm",
		},
	});
	await controller.wait();

	const cachePlugin = new $scramjetUtils.HttpCachePlugin();
	const urlWatcher = new $scramjetUtils.UrlWatcherPlugin((url) => {
		frameUrl.textContent = url;
	});
	const catchEscapedLinks = new $scramjetUtils.CatchEscapedLinksPlugin(
		(url) =>
			new URL(`${location.pathname}?goto=${encodeURIComponent(url.href)}`, location.origin)
	);

	frame = controller.createFrame(frameElement, {
		plugins: [cachePlugin, urlWatcher, catchEscapedLinks],
	});
}

async function navigate(url) {
	if (!url.startsWith("http")) {
		url = `https://${url}`;
	}
	if (!controller) {
		await initController();
	}
	await frame.go(url);
	frameWrapper.style.display = "flex";
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (username.value == "") {
		alert("Must enter a username, sorry!");
		return;
	}
	if (address.value == "") {
		alert(
			"Please type your search/URL into the space below the username field."
		);
		return;
	}

	const url = search(address.value, searchEngine.value);

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	// Wait for the service worker to become the controller
	if (!navigator.serviceWorker.controller) {
		await new Promise((resolve) =>
			navigator.serviceWorker.addEventListener("controllerchange", resolve, {
				once: true,
			})
		);
	}

	H.identify(username.value);
	H.track("URL", address.value);
	H.startManualSpan("URL", { attributes: { url: address.value } }, (span) => {
		console.log(
			username.value,
			"visited",
			address.value,
			"IP is",
			ip,
			"h track"
		);
		span.end();
	});
	client.track("URL", { user: username.value, url: address.value });
	LDObserve.startSpan("URLGrab", (span) => {
		console.log(
			username.value,
			"visited",
			address.value,
			"IP is",
			ip,
			"man span"
		);
	});
	console.log(
		username.value,
		"visited",
		address.value,
		"IP is",
		ip,
		"normal tab"
	);

	try {
		await navigate(url);
	} catch (err) {
		showErrorScreen(err.message, err.stack);
	}
});

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	registerSW()
		.then(() => {
			if (!navigator.serviceWorker.controller) {
				return new Promise((resolve) =>
					navigator.serviceWorker.addEventListener("controllerchange", resolve, {
						once: true,
					})
				);
			}
		})
		.then(() => navigate(goto))
		.catch((err) => showErrorScreen(err.message, err.stack));
}
