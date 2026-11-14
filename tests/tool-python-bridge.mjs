// Offline test bridge: JSON enters as data, never source code or a network URL.
import { readFileSync } from 'node:fs';
import { executeLocalTool } from '../assets/js/atlas/tool-models.js';
const { catalog, calls } = JSON.parse(readFileSync(0, 'utf8'));
console.log(JSON.stringify(calls.map((call) => executeLocalTool(call, catalog))));
