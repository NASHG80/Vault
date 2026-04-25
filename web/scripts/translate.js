import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TARGET_LANGS = [
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' }
];

// Split a large object into chunks of N top-level keys
function chunkObject(obj, size = 2) {
  const entries = Object.entries(obj);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

async function translateChunk(chunk, targetLanguage, retries = 2) {
  const prompt = `You are a professional localization translator. Translate the following English JSON data into ${targetLanguage}.
Respond ONLY with the translated valid JSON object. Keep keys identical, only translate values. Do NOT wrap in markdown or backticks. Do NOT include any other text. Make sure the JSON is complete and properly closed.

JSON data:
${JSON.stringify(chunk, null, 2)}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 8192,
      });

      let content = chatCompletion.choices[0]?.message?.content || '{}';
      // Strip markdown code fences if present
      content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(content);
    } catch (error) {
      if (attempt === retries) {
        console.warn(`  ⚠️  Chunk translation failed after ${retries + 1} attempts, using original:`, error.message);
        return chunk; // fallback to original
      }
      console.warn(`  ↻ Retry ${attempt + 1}/${retries}...`);
    }
  }
}

async function translateObject(obj, targetLanguage) {
  const chunks = chunkObject(obj, 2); // 2 top-level keys at a time
  const translated = {};

  for (let i = 0; i < chunks.length; i++) {
    const chunkKeys = Object.keys(chunks[i]).join(', ');
    process.stdout.write(`    chunk ${i + 1}/${chunks.length} [${chunkKeys}]... `);
    const result = await translateChunk(chunks[i], targetLanguage);
    Object.assign(translated, result);
    process.stdout.write('✓\n');
  }

  return translated;
}

async function main() {
  console.log('Starting chunked translation pipeline...\n');
  const enPath = path.join(__dirname, '../src/locales/en/translation.json');

  if (!fs.existsSync(enPath)) {
    console.error('English translation file not found:', enPath);
    process.exit(1);
  }

  const enRaw = fs.readFileSync(enPath, 'utf-8');
  const enJson = JSON.parse(enRaw);

  for (const lang of TARGET_LANGS) {
    console.log(`\nTranslating to ${lang.name} (${lang.code})...`);
    const translatedJson = await translateObject(enJson, lang.name);

    const destDir = path.join(__dirname, `../src/locales/${lang.code}`);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, 'translation.json');
    fs.writeFileSync(destPath, JSON.stringify(translatedJson, null, 2));
    console.log(`✅ Successfully generated ${lang.code}/translation.json`);
  }

  console.log('\n🎉 Translation process complete!');
}

main();
