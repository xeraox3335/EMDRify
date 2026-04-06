const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'release', 'web');

const filesToCopy = ['index.html', 'styles.css', 'renderer.js'];

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

function copyReleaseFiles() {
  ensureDirectory(outputDir);
  clearDirectory(outputDir);

  for (const relativeFile of filesToCopy) {
    const source = path.join(projectRoot, relativeFile);
    const destination = path.join(outputDir, relativeFile);

    if (!fs.existsSync(source)) {
      throw new Error(`Missing required file: ${relativeFile}`);
    }

    fs.copyFileSync(source, destination);
  }

  const runtimeConfig = `window.EMDRIFY_RUNTIME = { mode: 'web' };\n`;
  fs.writeFileSync(path.join(outputDir, 'web-runtime.js'), runtimeConfig, 'utf8');

  const indexPath = path.join(outputDir, 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');

  if (!indexHtml.includes('web-runtime.js')) {
    indexHtml = indexHtml.replace(
      '<script src="renderer.js"></script>',
      '<script src="web-runtime.js"></script>\n    <script src="renderer.js"></script>'
    );
  }

  fs.writeFileSync(indexPath, indexHtml, 'utf8');

  console.log('Static website release created at:', outputDir);
}

copyReleaseFiles();
