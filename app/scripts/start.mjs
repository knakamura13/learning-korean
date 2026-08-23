import { existsSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const IMMUTABLE_CACHE_CONTROL = 'public,max-age=31536000,immutable';

function isImmutableStaticAsset(urlPath) {
	const path = urlPath.split('?')[0] ?? '';
	return path.startsWith('/fonts/') && /\.woff2$/i.test(path);
}

function stampFontCache(req, res) {
	if (!isImmutableStaticAsset(req.url ?? '')) return;
	const original = res.setHeader.bind(res);
	res.setHeader = (name, value) => {
		if (String(name).toLowerCase() === 'cache-control') {
			return original(name, IMMUTABLE_CACHE_CONTROL);
		}
		return original(name, value);
	};
	original('cache-control', IMMUTABLE_CACHE_CONTROL);
}

const createServer = http.createServer;
http.createServer = function patchedCreateServer(...args) {
	const server = createServer.apply(this, args);
	server.on('request', stampFontCache);
	return server;
};

const appRoot = dirname(fileURLToPath(import.meta.url));
const entry = join(appRoot, '../build/index.js');

if (!existsSync(entry)) {
	console.error(
		'pnpm start needs the Node adapter output. From app/: ADAPTER=node pnpm build && pnpm start'
	);
	process.exit(1);
}

await import(pathToFileURL(entry).href);
