import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";

const require = createRequire(import.meta.url);
const controllerPath = dirname(require.resolve("@mercuryworkshop/scramjet-controller/dist/controller.api.js"));
const libcurlPath = dirname(require.resolve("@mercuryworkshop/libcurl-transport"));
const scramjetUtilsPath = dirname(require.resolve("@mercuryworkshop/scramjet-utils"));

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

// Wisp Configuration: Refer to the documentation at https://www.npmjs.com/package/@mercuryworkshop/wisp-js
Object.assign(wisp.options, {
	allow_udp_streams: false,
	hostname_blacklist: [/example\.com/],
	dns_servers: ["1.1.1.3", "1.0.0.3"],
});

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
				else socket.end();
			});
	},
});

fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});

fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/scramjet/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: controllerPath,
	prefix: "/controller/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: "/libcurl/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: scramjetUtilsPath,
	prefix: "/scramjet-utils/",
	decorateReply: false,
});

const _darkModePrefix = `(function(){const m=window.matchMedia.bind(window);window.matchMedia=function(q){const r=m(q);if(typeof q==='string'&&q.includes('prefers-color-scheme')){return new Proxy(r,{get(t,p){if(p==='matches')return q.includes('dark');const v=t[p];return typeof v==='function'?v.bind(t):v;}})}return r;};})();\n`;
const _darkInject = _darkModePrefix + readFileSync(resolve(controllerPath, "controller.inject.js"), "utf-8");
fastify.get("/dark-inject.js", (req, reply) =>
	reply.type("application/javascript").send(_darkInject)
);

fastify.setNotFoundHandler((res, reply) => {
	return reply.code(404).type("text/html").sendFile("404.html");
});

fastify.server.on("listening", () => {
	const address = fastify.server.address();

	console.log("Listening on:");
	console.log(`\thttp://localhost:${address.port}`);
	console.log(`\thttp://${hostname()}:${address.port}`);
	console.log(
		`\thttp://${
			address.family === "IPv6" ? `[${address.address}]` : address.address
		}:${address.port}`
	);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	fastify.close();
	process.exit(0);
}

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

fastify.listen({
	port: port,
	host: "0.0.0.0",
});
