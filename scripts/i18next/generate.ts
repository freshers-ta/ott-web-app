import { readdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

import prettier from 'prettier';

const NODE_MODULES_DIRECTORY = join(process.cwd(), 'node_modules');
const PLATFORMS_DIRECTORY = join(process.cwd(), 'platforms');

type SimplePackageJSON = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function getWorkspacePackages(packageJSON: SimplePackageJSON) {
  const deps = Object.keys(packageJSON.dependencies);
  const devDeps = Object.keys(packageJSON.devDependencies);
  const peerDeps = Object.keys(packageJSON.peerDependencies);

  const packages = [...deps, ...devDeps, ...peerDeps].filter((name) => name.startsWith('@jwp/'));

  return packages.map((name) => {
    return realpathSync(join(NODE_MODULES_DIRECTORY, name));
  });
}

function extractTranslations(directories: string[], platformName: string) {
  const searchPaths = directories.map((path) => {
    return join(path.replace(process.cwd(), ''), 'src/**/*.{ts,tsx}').slice(1);
  });

  const result = execSync(`npx i18next ${searchPaths.map((path) => `"${path}"`).join(' ')}`, {
    env: {
      ...process.env,
      PLATFORM: platformName,
    },
  });

  process.stdout.write(result);
}

function generateNamespaces(platformPath: string) {
  const defaultLocale = 'en';
  const localesPath = join(platformPath, 'public/locales');
  const resourcesPath = join(platformPath, 'src/i18n/resources.ts');

  const namespaces = readdirSync(join(localesPath, defaultLocale))
    .filter((namespace) => !/_old\.json/.test(namespace))
    .map((namespace) => namespace.replace('.json', ''));

  const configContents = `// This file is generated, do not modify manually.
// Run \`$ yarn i18next\` to update this file

export const NAMESPACES = ${JSON.stringify(namespaces)};`;

  prettier.resolveConfig('./prettierrc').then((options) => {
    const formatted = prettier.format(configContents, { ...options, filepath: resourcesPath });

    writeFileSync(resourcesPath, formatted, { encoding: 'utf-8' });

    console.info(`Generated i18next resources for all namespaces`);
  });
}

function run() {
  const platforms = readdirSync(PLATFORMS_DIRECTORY, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((direct) => direct.name);

  for (const index in platforms) {
    const platformName = platforms[index];
    const platformPath = join(PLATFORMS_DIRECTORY, platformName);
    const platformPackagePath = join(platformPath, 'package.json');

    // find all workspace dependencies
    const packageJSON = JSON.parse(readFileSync(platformPackagePath, 'utf-8')) as SimplePackageJSON;
    const workspacePackages = getWorkspacePackages(packageJSON);

    extractTranslations([platformPath, ...workspacePackages], platformName);
    generateNamespaces(platformPath);
  }
}

run();
