const fs = require('fs');

// eslint-disable-next-line no-undef
const localesPath = process.env.LOCALES_PATH;
// eslint-disable-next-line no-undef
const output = process.env.OUTPUT_PATH;

const localesEntries = fs.readdirSync(localesPath, { withFileTypes: true });
const locales = localesEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

module.exports = {
  contextSeparator: '_',
  createOldCatalogs: true,
  defaultNamespace: 'common',
  defaultValue: '',
  indentation: 2,
  keepRemoved: false,
  keySeparator: '.',
  lexers: {
    mjs: ['JavascriptLexer'],
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    default: ['JavascriptLexer'],
  },
  lineEnding: 'auto',
  locales,
  namespaceSeparator: ':',
  output,
  sort: true,
};
