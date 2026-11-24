#!/usr/bin/env node
/**
 * routes-apply.mjs — a párhuzamosan futott pl-site / ch-site / eu-site _routes.json-kiegészítése,
 * a régi sorrendben (pl → ch → eu). Lásd routes-market.mjs. A build-run.mjs hívja.
 */
import fs from 'node:fs';
import path from 'node:path';
import { APPLY } from './routes-market.mjs';

const DIST = 'dist';
for (const m of ['pl', 'ch', 'eu']) {
  const f = path.join(DIST, `.routes-${m}.json`);
  if (!fs.existsSync(f)) continue;
  try { APPLY[m](DIST, JSON.parse(fs.readFileSync(f, 'utf8'))); } finally { fs.rmSync(f, { force: true }); }
}
