import { readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const siteUrl = 'https://sim.physicslens.com';
const rootDirectory = resolve(import.meta.dirname, '..');

const directoryEntries = await readdir(rootDirectory, { withFileTypes: true });
const appPaths = directoryEntries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .filter(directory => existsSync(join(rootDirectory, directory, 'index.html')))
    .sort((left, right) => left.localeCompare(right));

const urls = ['', ...appPaths].map(path => `  <url><loc>${siteUrl}/${path}</loc></url>`);
const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    ''
].join('\n');

await writeFile(join(rootDirectory, 'sitemap.xml'), sitemap);
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);