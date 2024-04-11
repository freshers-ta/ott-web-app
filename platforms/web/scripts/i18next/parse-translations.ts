import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

import prettier from 'prettier';

const i18nextParserConfig = join(process.cwd(), 'i18next-parser.config.js');
const platformGlob = join(process.cwd(), 'src/**/*.{ts,tsx}');

type WorkspaceEntry = {
  location: string;
  workspaceDependencies: string[];
};

type WorkspaceInfo = Record<string, WorkspaceEntry>;

function syncTranslations() {
  const result = execSync('yarn workspaces --json info').toString('utf-8');
  const info = JSON.parse(result);
  const data = JSON.parse(info.data) as WorkspaceInfo;

  const dependencies = data['@jwp/ott-web']?.workspaceDependencies || [];

  const globs = dependencies
    .map((dependency) => data[dependency])
    .filter((entry) => entry && existsSync(join('../..', entry.location, 'src')))
    .map((entry) => `'${join(entry.location, 'src/**/*.{ts,tsx}')}'`)
    .join(' ');

  const command = `npx i18next --config ${i18nextParserConfig} '${platformGlob}' ${globs}`;

  console.info('Running command:');
  console.info(` ${command}`);

  execSync(command, { env: process.env, stdio: 'pipe', cwd: '../../' });
}

function generateNamespaces() {
  const defaultLocale = 'en';
  const localesPath = 'public/locales';
  const resourcesPath = 'src/i18n/resources.ts';

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

async function run() {
  syncTranslations();
  generateNamespaces();
}

run();
