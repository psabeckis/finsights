import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_JSON_PATH = resolve(__dirname, '../package.json');
const content = readFileSync(PACKAGE_JSON_PATH);

const packageJson = JSON.parse(content.toString(), null, 2);

delete packageJson.type;

writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
