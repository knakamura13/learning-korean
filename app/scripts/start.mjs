import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));
const entry = join(appRoot, '../build/index.js');

if (!existsSync(entry)) {
	console.error(
		'pnpm start needs the Node adapter output. From app/: ADAPTER=node pnpm build && pnpm start'
	);
	process.exit(1);
}

await import(pathToFileURL(entry).href);
