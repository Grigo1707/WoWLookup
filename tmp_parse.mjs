import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const items = data.equipment || [];
for (let i = 0; i < 3; i++) {
  const it = items[i];
  if (!it) break;
  console.log(`--- Item ${i+1} ---`);
  console.log(`  name: ${it.name}`);
  console.log(`  slot: ${it.slot?.type}`);
  console.log(`  media: ${JSON.stringify(it.media)}`);
  console.log(`  keys: ${Object.keys(it).join(', ')}`);
  // Check for any icon/file_data_id field at any level
  const str = JSON.stringify(it);
  const matches = str.match(/"(icon[^"]*|file_data_id[^"]*)":\s*(\d+|"[^"]+")/g);
  if (matches) console.log(`  icon-related fields: ${matches.slice(0,5).join(' | ')}`);
}
