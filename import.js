import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const INPUT_FILE = './new_data.csv';
const OUTPUT_DIR = './data';
const OUTPUT_FILE = 'card_shops.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, INPUT_FILE);
const outputDir = path.resolve(__dirname, OUTPUT_DIR);
const outputPath = path.join(outputDir, OUTPUT_FILE);

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function getPeriodSortValue(periodName) {
  if (!periodName) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = periodName.match(/\d+/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[0]);
}

async function main() {
  const csvRaw = await fs.readFile(inputPath, 'utf8');
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\ufeff/, '').trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const headerColumns = parseCsvLine(lines[0]);
  const expectedHeaders = ['駅名', '期間', 'カード名'];

  if (expectedHeaders.some((header, index) => headerColumns[index] !== header)) {
    throw new Error(`Unexpected CSV headers: ${headerColumns.join(', ')}`);
  }

  const stationMap = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i]);

    if (columns.length < 3) {
      continue;
    }

    const stationName = columns[0]?.trim();
    const periodLabel = columns[1]?.trim();
    const cardName = columns[2]?.trim();

    if (!stationName || !cardName) {
      continue;
    }

    if (!stationMap.has(stationName)) {
      stationMap.set(stationName, {
        periods: new Map(),
        cards: new Set(),
      });
    }

    const stationEntry = stationMap.get(stationName);

    if (periodLabel) {
      if (!stationEntry.periods.has(periodLabel)) {
        stationEntry.periods.set(periodLabel, new Set());
      }
      stationEntry.periods.get(periodLabel).add(cardName);
    } else {
      stationEntry.cards.add(cardName);
    }
  }

  const stations = Array.from(stationMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
    .map(([stationName, data]) => {
      const station = { station: stationName };

      if (data.periods.size) {
        const sortedPeriods = Array.from(data.periods.entries())
          .sort((a, b) => {
            const valueDiff = getPeriodSortValue(a[0]) - getPeriodSortValue(b[0]);
            if (valueDiff !== 0) {
              return valueDiff;
            }
            return a[0].localeCompare(b[0], 'ja');
          })
          .reduce((acc, [periodName, cards]) => {
            acc[periodName] = Array.from(cards).sort((a, b) => a.localeCompare(b, 'ja'));
            return acc;
          }, {});

        station.periods = sortedPeriods;
      }

      if (data.cards.size) {
        station.cards = Array.from(data.cards).sort((a, b) => a.localeCompare(b, 'ja'));
      }

      return station;
    });

  await fs.mkdir(outputDir, { recursive: true });
  const jsonString = `${JSON.stringify({ stations }, null, 2)}\n`;
  await fs.writeFile(outputPath, jsonString, 'utf8');

  console.log(`Imported ${stations.length} stations to ${path.relative(__dirname, outputPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
