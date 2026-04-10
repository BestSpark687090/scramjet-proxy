"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");
var keyRegistered = false;
const username = document.getElementById("username");
const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
	prefix: "/scramjet/",
});
async function start(){
	try{
await scramjet.init();
}catch(e){console.log(e)}
}
start();
document.querySelectorAll("*").forEach(function (e) {
	e.addEventListener("keydown", function (ev) {
		if (ev.ctrlKey && ev.shiftKey && ev.code == "KeyZ") {
			frame.style.display = "none";
		}
	});
});
// Get your ip. Deal with it, it's a alternate way of making sure you guys aren't stupid.
let grabbers = [
	"https://api.ipify.org/?format=json",
	"https://www.my-ip-is.com/api/ip",
	"https://api.myip.com",
	"https://api.my-ip.io/v2/ip.json",
];
let ip = "";
(async () => {
	for (let grabber of grabbers) {
		// console.log("Using "+fetcher)
		if (await checkOne(grabber)) {
			break;
		}
	}
})();
async function checkOne(grabber) {
	let res = await fetch(grabber);
	let json = await res.json();
	//console.log(json.ip)
	ip = json.ip;
	return true;
}
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (!keyRegistered) {
		keyRegistered = true;
		try {
			await registerSW();
		} catch (err) {
			error.textContent = "Failed to register service worker.";
			errorCode.textContent = err.toString();
			throw err;
		}
	}
	const url = search(address.value, searchEngine.value);
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
	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);
	frame.go(url);
});
