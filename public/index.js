"use strict";
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const username = document.getElementById("username");

let controller = null;

document.querySelectorAll("*").forEach(function (e) {
	e.addEventListener("keydown", function (ev) {
		if (ev.ctrlKey && ev.shiftKey && ev.code == "KeyZ") {
			const frame = document.getElementById("sj-frame");
			if (frame) frame.style.display = "none";
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

	if (!controller) {
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
	}

	const frame = controller.createFrame();
	frame.element.id = "sj-frame";
	document.body.appendChild(frame.element);
	frame.go(url);
});
