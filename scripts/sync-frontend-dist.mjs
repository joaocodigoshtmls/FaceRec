import { cp, rm, stat } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const frontendDist = resolve(projectRoot, 'frontend', 'dist');
const rootDist = resolve(projectRoot, 'dist');

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

(async () => {
  const hasFrontendDist = await pathExists(frontendDist);

  if (!hasFrontendDist) {
    console.error('[sync-frontend-dist] Pasta frontend/dist não encontrada. Execute `npm run build --workspace frontend` antes.');
    process.exitCode = 1;
    return;
  }

  const hasRootDist = await pathExists(rootDist);

  if (hasRootDist) {
    await rm(rootDist, { recursive: true, force: true });
  }

  await cp(frontendDist, rootDist, { recursive: true });
  console.log(`[sync-frontend-dist] Copiado ${frontendDist} -> ${rootDist}`);
})();
