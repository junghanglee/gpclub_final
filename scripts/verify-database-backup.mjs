import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const REQUIRED_COVERAGE = {
  publicData: { pattern: /^COPY\s+"?public"?\./m, label: "public data" },
  authUsers: { pattern: /^COPY\s+"?auth"?\."?users"?\s/m, label: "auth users" },
  storageBuckets: {
    pattern: /^COPY\s+"?storage"?\."?buckets"?\s/m,
    label: "storage buckets",
  },
  storageObjects: {
    pattern: /^COPY\s+"?storage"?\."?objects"?\s/m,
    label: "storage objects",
  },
};

export function inspectDatabaseDumpCoverage(sql) {
  return Object.fromEntries(
    Object.entries(REQUIRED_COVERAGE).map(([key, requirement]) => [
      key,
      requirement.pattern.test(sql),
    ]),
  );
}

export function assertFullRecoveryCoverage(coverage) {
  const missing = Object.entries(REQUIRED_COVERAGE)
    .filter(([key]) => coverage[key] !== true)
    .map(([, requirement]) => requirement.label);

  if (missing.length > 0) {
    throw new Error(`Database backup is incomplete; missing ${missing.join(", ")}`);
  }
}

async function main() {
  const [, , dataFile, manifestFile] = process.argv;
  if (!dataFile || !manifestFile) {
    throw new Error("Usage: node verify-database-backup.mjs <data.sql> <manifest.json>");
  }

  const sql = await readFile(dataFile, "utf8");
  const coverage = inspectDatabaseDumpCoverage(sql);
  assertFullRecoveryCoverage(coverage);
  await writeFile(manifestFile, `${JSON.stringify(coverage, null, 2)}\n`);
  console.log("Database backup includes public data, auth users, and storage metadata.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
