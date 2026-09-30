const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'lib', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');

if (!fs.existsSync(enPath)) {
  console.error('Base locale en.json not found!');
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const baseKeys = Object.keys(en);
console.log(`Base locale (en.json) contains ${baseKeys.length} keys.\n`);

const localeFiles = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json') && f !== 'en.json');

let hasMissing = false;

for (const file of localeFiles) {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const missing = baseKeys.filter((k) => !(k in data));

  if (missing.length > 0) {
    console.warn(`[WARNING] ${file} is missing ${missing.length} keys:`);
    console.warn(missing.map((k) => `  - ${k}`).join('\n'));
    hasMissing = true;
  } else {
    console.log(`[PASS] ${file}: All ${baseKeys.length} keys translated.`);
  }
}

if (!hasMissing) {
  console.log('\nAll i18n localization dictionaries are 100% complete!');
} else {
  console.log('\nSome localization dictionaries have missing keys.');
}
