import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

build({
  configFile: resolve(__dirname, 'vite.config.js'),
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
