import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { execSync } from 'child_process';

import prettier from 'prettier';

const NODE_MODULES_DIRECTORY = join(process.cwd(), 'node_modules');
const PLATFORMS_DIRECTORY = join(process.cwd(), 'platforms');

type SimplePackageJSON = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

type Config = {
  /**
   * The path of the locales folder
   */
  path: string;
  /**
   * The translation output path with placeholders for locale and namespace
   */
  output: string;
  /**
   * Bundle the translations with the build output (resources)
   */
  bundle: boolean;
  /**
   * The path where the resources are bundled
   */
  bundlePath: string;
  /**
   * The path where the resources file is created
   */
  resourcesPath: string;
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

function extractTranslations(directories: string[], platformName: string, config: Config) {
  const searchPaths = directories.map((path) => {
    return join(path.replace(process.cwd(), ''), 'src/**/*.{ts,tsx}').slice(1);
  });

  const result = execSync(`npx i18next ${searchPaths.map((path) => `"${path}"`).join(' ')} -s`, {
    env: {
      ...process.env,
      LOCALES_PATH: config.path,
      OUTPUT_PATH: config.output,
      PLATFORM: platformName,
    },
  });

  process.stdout.write(result);
  console.info(`Extracted translations for ${join(PLATFORMS_DIRECTORY, platformName)}`);
}

async function generateNamespaces(platformPath: string, config: Config) {
  const defaultLocale = 'en';
  const localesPath = config.path;

  const namespaces = readdirSync(join(localesPath, defaultLocale))
    .filter((namespace) => !/_old\.json/.test(namespace))
    .map((namespace) => namespace.replace('.json', ''));

  const header = '// This file is generated, do not modify manually.\n// Run `$ yarn i18next` to update this file';

  const configContents = `${header}

export const NAMESPACES = ${JSON.stringify(namespaces)};`;

  // generate resource files
  if (config.bundle) {
    const languages = readdirSync(localesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // ensure the directory exists
    mkdirSync(dirname(config.bundlePath), { recursive: true });

    for (const index in languages) {
      const outputPath = config.bundlePath.replace('$LOCALE', languages[index]);
      const relativePath = relative(dirname(outputPath), config.path);
      let content = `${header}\n\n`;

      for (const namespaceIndex in namespaces) {
        const ns = namespaces[namespaceIndex];

        content += `export { default as ${ns} } from '${relativePath || '.'}/${languages[index]}/${ns}.json';\n`;
      }

      writeFileSync(outputPath, content);
    }
  }

  return new Promise<void>((resolve) => {
    prettier.resolveConfig('./prettierrc').then((options) => {
      const formatted = prettier.format(configContents, { ...options, filepath: config.resourcesPath });

      writeFileSync(config.resourcesPath, formatted, { encoding: 'utf-8' });

      console.info(`Generated namespaces for ${platformPath}`);
      resolve();
    });
  });
}

function flattenObject(obj: object, parentKey: string = ''): Record<string, string> {
  let result: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        const nestedFlattened = flattenObject(value, newKey);
        result = { ...result, ...nestedFlattened };
      } else {
        // Assign the value to the flattened key
        result[newKey] = value;
      }
    }
  }

  return result;
}

function iterateTranslations(localesPath: string, callback: (language: string, namespace: string) => void) {
  const languages = readdirSync(localesPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name); //.filter((namespace) => !/_old\.json/.test(namespace));

  for (const languageIndex in languages) {
    const languagePath = join(localesPath, languages[languageIndex]);
    const files = readdirSync(languagePath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile() && !/_old\.json/.test(dirent.name))
      .map((dirent) => dirent.name.replace('.json', ''));

    for (const fileIndex in files) {
      callback(languages[languageIndex], files[fileIndex]);
    }
  }
}

function applyMissingTranslations(translations: object, sourceTranslations: object, parentKey = '') {
  for (const key in translations) {
    if (Object.prototype.hasOwnProperty.call(translations, key)) {
      const flatKey = parentKey ? `${parentKey}.${key}` : key;
      const value = translations[key];

      if (typeof value === 'object' && value !== null) {
        translations[key] = applyMissingTranslations(value, sourceTranslations, flatKey);
      } else {
        if (translations[key] === '' && sourceTranslations[flatKey]) {
          console.info(`Fill missing translation for key: ${flatKey}`);
          translations[key] = sourceTranslations[flatKey];
        }
      }
    }
  }

  return translations;
}

function fillMissingTranslations(platforms: string[]) {
  const translations: Record<string, Record<string, string>> = {};

  // in the first pass, we build a translation dictionary using flattened keys
  // the key is the language + '_' + namespace
  // when a translation is missing or empty it's used from a different platform
  for (const index in platforms) {
    const platformPath = join(PLATFORMS_DIRECTORY, platforms[index]);
    const config = getPlatformConfig(platformPath);

    iterateTranslations(config.path, (language, namespace) => {
      const languagePath = join(config.path, language);
      const parsed = JSON.parse(readFileSync(join(languagePath, `${namespace}.json`), 'utf-8'));
      const key = `${language}_${namespace}`;
      const flattened = flattenObject(parsed);

      if (!translations[key]) {
        translations[key] = flattened;
        return;
      }

      for (const translationKey in flattened) {
        if (!(translationKey in translations[key]) || translations[key][translationKey] === '') {
          translations[key][translationKey] = flattened[translationKey];
        }
      }
    });
  }

  // in the second pass, we iterate all translation files again and fill each missing translation
  for (const index in platforms) {
    const platformPath = join(PLATFORMS_DIRECTORY, platforms[index]);
    const config = getPlatformConfig(platformPath);

    iterateTranslations(config.path, (language, namespace) => {
      const languagePath = join(config.path, language);
      const parsed = JSON.parse(readFileSync(join(languagePath, `${namespace}.json`), 'utf-8'));
      const key = `${language}_${namespace}`;

      if (translations[key]) {
        const fixedTranslations = applyMissingTranslations(parsed, translations[key]);
        writeFileSync(join(languagePath, `${namespace}.json`), JSON.stringify(fixedTranslations, null, 2) + '\n');
      } else {
        console.info(`Missing source translations for ${namespace} in language ${language}`);
      }
    });

    console.info(`Filled missing translations for ${platformPath}`);
  }
}

function getPlatformConfig(platformPath: string): Config {
  const configPath = join(platformPath, '.i18n.json');
  const defaultPath = 'public/locales';
  const defaultOutput = 'public/locales/$LOCALE/$NAMESPACE.json';
  const defaultBundlePath = 'src/i18n/locales/$LOCALE.ts';
  const defaultResourcesPath = 'src/i18n/resources.ts';

  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    return {
      path: join(platformPath, config.path || defaultPath),
      output: join(platformPath, config.output || defaultOutput),
      bundlePath: join(platformPath, config.bundlePath || defaultBundlePath),
      resourcesPath: join(platformPath, config.resourcesPath || defaultResourcesPath),
      bundle: config.bundle ?? false,
    };
  }

  return {
    path: join(platformPath, defaultPath),
    output: join(platformPath, defaultOutput),
    bundlePath: join(platformPath, defaultBundlePath),
    resourcesPath: join(platformPath, defaultResourcesPath),
    bundle: false,
  };
}

async function run() {
  const platforms = readdirSync(PLATFORMS_DIRECTORY, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((direct) => direct.name);

  for (const index in platforms) {
    const platformName = platforms[index];
    const platformPath = join(PLATFORMS_DIRECTORY, platformName);
    const platformPackagePath = join(platformPath, 'package.json');

    const config = getPlatformConfig(platformPath);

    // find all workspace dependencies
    const packageJSON = JSON.parse(readFileSync(platformPackagePath, 'utf-8')) as SimplePackageJSON;
    const workspacePackages = getWorkspacePackages(packageJSON);

    extractTranslations([platformPath, ...workspacePackages], platformName, config);
    await generateNamespaces(platformPath, config);
  }

  fillMissingTranslations(platforms);
}

run();
