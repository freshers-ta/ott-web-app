import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Trans = {
  [key: string]: Trans | string;
};

function flattenObject(obj: Trans, parentKey: string = ''): Record<string, string> {
  let result: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        const nestedFlattened = flattenObject(value, newKey);
        result = { ...result, ...nestedFlattened };
      } else if (typeof value === 'string') {
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

function applyMissingTranslations(translations: Trans, sourceTranslations: Record<string, string>, parentKey = '') {
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

async function getPlatformLocalesPath(platformPath: string) {
  const extensions = ['js', 'cjs', 'mjs', 'ts'];

  try {
    for (const index in extensions) {
      const configPath = join(platformPath, `i18next-parser.config.${extensions[index]}`);

      if (!existsSync(configPath)) continue;

      const parserConfig = (await import(configPath))?.default;

      if (typeof parserConfig.output === 'string') {
        return parserConfig.output.replace('/$LOCALE', '').replace('/$NAMESPACE.json', '');
      }
    }
  } catch (error: unknown) {
    console.error('Failed to load i18next-parser.config.js', error);
  }

  return join(platformPath, 'public/locales');
}

async function fillMissingTranslations(sourcePlatform: string, targetPlatform: string) {
  const translations: Record<string, Record<string, string>> = {};
  const sourcePlatformPath = join(process.cwd(), 'platforms', sourcePlatform);
  const targetPlatformPath = join(process.cwd(), 'platforms', targetPlatform);

  if (!existsSync(sourcePlatformPath)) {
    console.error(`Source platform doesn't exist ${sourcePlatformPath}`);
    process.exit();
  }

  if (!existsSync(targetPlatformPath)) {
    console.error(`Target platform doesn't exist ${targetPlatformPath}`);
    process.exit();
  }

  const sourceLocalesPath = await getPlatformLocalesPath(sourcePlatformPath);
  const targetLocalesPath = await getPlatformLocalesPath(targetPlatformPath);

  // in the first pass, we build a translation dictionary using flattened keys
  // the key is the language + '_' + namespace
  // when a translation is missing or empty it's used from a different platform
  iterateTranslations(sourceLocalesPath, (language, namespace) => {
    const languagePath = join(sourceLocalesPath, language);
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

  iterateTranslations(targetLocalesPath, (language, namespace) => {
    const languagePath = join(targetLocalesPath, language);
    const parsed = JSON.parse(readFileSync(join(languagePath, `${namespace}.json`), 'utf-8'));
    const key = `${language}_${namespace}`;

    if (translations[key]) {
      const fixedTranslations = applyMissingTranslations(parsed, translations[key]);
      writeFileSync(join(languagePath, `${namespace}.json`), JSON.stringify(fixedTranslations, null, 2) + '\n');
    } else {
      console.info(`Missing source translations for ${namespace} in language ${language}`);
    }
  });

  console.info(`Ready filling missing translations for ${targetLocalesPath}`);
}

async function run() {
  const [, , sourcePlatform, targetPlatform] = process.argv;

  if (!sourcePlatform || !targetPlatform) {
    console.info(`Usage:
  yarn i18next:sync <sourcePlatform> <targetPlatform>

Use this script to fill missing translations in the target platform
using the translations of the source platform as base.

Example:
  yarn i18next:sync web app

Missing arguments!`);
    process.exit();
  }

  await fillMissingTranslations(sourcePlatform, targetPlatform);
}

run();
