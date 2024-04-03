const fs = require('fs');

// eslint-disable-next-line no-undef
const platform = process.env.PLATFORM || 'web';
const localesEntries = fs.readdirSync(`./platforms/${platform}/public/locales`, { withFileTypes: true });
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
  output: `platforms/${platform}/public/locales/$LOCALE/$NAMESPACE.json`,
  sort: true,
};
