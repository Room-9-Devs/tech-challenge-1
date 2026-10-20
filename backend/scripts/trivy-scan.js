/**
 * Roda o Trivy via Docker (não precisa instalar o Trivy).
 *
 * Uso (dentro de backend/):
 *   npm run security:scan        -> repositório + imagem
 *   npm run security:scan:fs     -> só repositório (deps, secrets, misconfig)
 *   npm run security:scan:image  -> só imagem Docker do backend
 *
 * O scan de repositório envia apenas os arquivos versionados/não ignorados pelo git
 * (via tar no stdin), evitando o bind mount do node_modules, que é muito lento no
 * Docker Desktop do Windows.
 */
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Manter igual ao TRIVY_VERSION de .github/workflows/trivy.yml
const TRIVY_IMAGE = 'aquasec/trivy:0.76.0';
const BACKEND_IMAGE = 'tech-challenge-backend:local';
const ROOT = path.resolve(__dirname, '..', '..');
const CACHE_VOLUME = 'trivy-cache:/root/.cache';

function ensureDocker() {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (result.status !== 0) {
    console.error('Docker não encontrado ou não está rodando. Inicie o Docker e tente novamente.');
    process.exit(1);
  }
}

function listRepoFiles() {
  const result = spawnSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`git ls-files falhou: ${result.stderr}`);
  }
  return result.stdout
    .split('\0')
    .filter(Boolean)
    .filter((file) => fs.existsSync(path.join(ROOT, file)));
}

function scanRepository() {
  console.log('\n🔍 Trivy: scan do repositório\n');

  const listFile = path.join(os.tmpdir(), `trivy-files-${process.pid}.txt`);
  fs.writeFileSync(listFile, listRepoFiles().join('\n'));

  return new Promise((resolve) => {
    const tar = spawn('tar', ['-cf', '-', '-T', listFile], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
    const trivy = spawn(
      'docker',
      [
        'run', '--rm', '-i',
        '-v', CACHE_VOLUME,
        '--entrypoint', 'sh',
        TRIVY_IMAGE,
        '-c',
        'mkdir -p /src && tar -xf - -C /src && cd /src && trivy fs --quiet --skip-version-check --config trivy.yaml .',
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );

    tar.stdout.pipe(trivy.stdin);
    trivy.on('close', (code) => {
      fs.rmSync(listFile, { force: true });
      resolve(code ?? 1);
    });
  });
}

function scanImage() {
  console.log('\n🐳 Trivy: build e scan da imagem do backend\n');

  const build = spawnSync('docker', ['build', '-t', BACKEND_IMAGE, path.join(ROOT, 'backend')], {
    stdio: 'inherit',
  });
  if (build.status !== 0) return build.status ?? 1;

  const scan = spawnSync(
    'docker',
    [
      'run', '--rm',
      '-v', '/var/run/docker.sock:/var/run/docker.sock',
      '-v', CACHE_VOLUME,
      '-v', `${path.join(ROOT, 'trivy.yaml')}:/cfg/trivy.yaml:ro`,
      '-v', `${path.join(ROOT, '.trivyignore')}:/cfg/.trivyignore:ro`,
      '-w', '/cfg',
      TRIVY_IMAGE,
      'image', '--quiet', '--skip-version-check',
      '--config', 'trivy.yaml',
      // Misconfig do Dockerfile já é coberta no scan de repositório
      '--scanners', 'vuln,secret',
      BACKEND_IMAGE,
    ],
    { stdio: 'inherit' },
  );
  return scan.status ?? 1;
}

async function main() {
  const target = process.argv[2] ?? 'all';
  if (!['all', 'fs', 'image'].includes(target)) {
    console.error(`Alvo inválido: "${target}". Use all, fs ou image.`);
    process.exit(1);
  }

  ensureDocker();

  const codes = [];
  if (target !== 'image') codes.push(await scanRepository());
  if (target !== 'fs') codes.push(scanImage());

  const failed = codes.some((code) => code !== 0);
  console.log(failed ? '\n❌ Trivy encontrou problemas (veja acima).' : '\n✅ Nenhum problema HIGH/CRITICAL encontrado.');
  process.exit(failed ? 1 : 0);
}

main();
