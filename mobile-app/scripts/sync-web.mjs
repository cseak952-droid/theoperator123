import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const websiteRoot = resolve(mobileRoot, '..');
const outputRoot = join(mobileRoot, 'www');
const htmlFiles = ['index.html', 'journal.html'];

function addMobileAssets(html) {
  const withViewport = html.replace(
    /<meta name="viewport" content="([^"]*)">/i,
    (_match, content) => `<meta name="viewport" content="${content.includes('viewport-fit=cover') ? content : `${content}, viewport-fit=cover`}">`,
  );
  const withStyles = withViewport.replace(
    '</head>',
    '<link rel="stylesheet" href="mobile.css">\n</head>',
  );
  return withStyles.replace(
    '</body>',
    '<script src="mobile-bridge.js"></script>\n</body>',
  );
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const filename of htmlFiles) {
  const source = await readFile(join(websiteRoot, filename), 'utf8');
  await writeFile(join(outputRoot, filename), addMobileAssets(source), 'utf8');
}

await cp(join(websiteRoot, 'journal-app.js'), join(outputRoot, 'journal-app.js'));
await cp(join(websiteRoot, 'assets'), join(outputRoot, 'assets'), { recursive: true });
await cp(join(mobileRoot, 'mobile', 'mobile.css'), join(outputRoot, 'mobile.css'));
await cp(join(mobileRoot, 'mobile', 'mobile-bridge.js'), join(outputRoot, 'mobile-bridge.js'));

console.log(`Mobile web bundle refreshed at ${outputRoot}`);
