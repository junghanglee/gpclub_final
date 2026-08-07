import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import { isStorageFile, safeStoragePath } from "./supabase-storage-backup-lib.mjs";

const PAGE_SIZE = 1000;
const outputDirectory = path.resolve(process.argv[2] || "backup/storage");
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function retry(operation, description, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw new Error(`${description} failed after ${attempts} attempts`, { cause: lastError });
}

async function listDirectory(bucketId, prefix) {
  const entries = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await retry(async () => {
      const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      return data ?? [];
    }, `Listing ${bucketId}/${prefix}`);

    entries.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return entries;
}

async function downloadObject(bucketId, objectPath) {
  const blob = await retry(async () => {
    const { data, error } = await supabase.storage.from(bucketId).download(objectPath);
    if (error) throw error;
    return data;
  }, `Downloading ${bucketId}/${objectPath}`);

  const contents = Buffer.from(await blob.arrayBuffer());
  const relativePath = safeStoragePath(bucketId, objectPath);
  const destination = path.join(outputDirectory, ...relativePath.split("/"));

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);

  return {
    bucket: bucketId,
    path: objectPath,
    bytes: contents.byteLength,
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}

async function backupBucket(bucket) {
  const objects = [];
  const pendingPrefixes = [""];

  while (pendingPrefixes.length > 0) {
    const prefix = pendingPrefixes.shift();
    const entries = await listDirectory(bucket.id, prefix);

    for (const entry of entries) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isStorageFile(entry)) {
        objects.push({
          ...(await downloadObject(bucket.id, objectPath)),
          metadata: entry.metadata,
        });
      } else {
        pendingPrefixes.push(objectPath);
      }
    }
  }

  return {
    id: bucket.id,
    name: bucket.name,
    public: bucket.public,
    fileSizeLimit: bucket.file_size_limit,
    allowedMimeTypes: bucket.allowed_mime_types,
    objects,
  };
}

await mkdir(outputDirectory, { recursive: true });

const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) throw bucketError;

const manifest = {
  formatVersion: 1,
  createdAt: new Date().toISOString(),
  projectUrl: supabaseUrl,
  buckets: [],
};

for (const bucket of buckets ?? []) {
  manifest.buckets.push(await backupBucket(bucket));
}

const objectCount = manifest.buckets.reduce((total, bucket) => total + bucket.objects.length, 0);
await writeFile(
  path.join(outputDirectory, "storage-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Backed up ${objectCount} objects from ${manifest.buckets.length} buckets.`);
