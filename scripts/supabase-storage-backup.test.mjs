import assert from "node:assert/strict";
import test from "node:test";

import { isStorageFile, safeStoragePath } from "./supabase-storage-backup-lib.mjs";
import {
  assertFullRecoveryCoverage,
  inspectDatabaseDumpCoverage,
} from "./verify-database-backup.mjs";

test("keeps valid storage object paths inside the bucket directory", () => {
  assert.equal(
    safeStoragePath("event-media", "page-content/brand/card.jpeg"),
    "event-media/page-content/brand/card.jpeg",
  );
});

test("rejects storage paths that can escape the backup directory", () => {
  assert.throws(() => safeStoragePath("event-media", "../secret.txt"), /unsafe/i);
  assert.throws(() => safeStoragePath("../bucket", "image.png"), /unsafe/i);
  assert.throws(() => safeStoragePath("event-media", "/absolute.png"), /unsafe/i);
});

test("distinguishes files from virtual storage folders", () => {
  assert.equal(isStorageFile({ id: "object-id", name: "image.png" }), true);
  assert.equal(isStorageFile({ id: null, name: "page-content" }), false);
});

test("accepts database dumps that preserve app data, auth users, and storage metadata", () => {
  const sql = `
COPY "public"."home_content" ("key", "value") FROM stdin;
COPY "auth"."users" ("id", "encrypted_password") FROM stdin;
COPY "storage"."buckets" ("id", "name") FROM stdin;
COPY "storage"."objects" ("id", "bucket_id", "name") FROM stdin;
`;

  const coverage = inspectDatabaseDumpCoverage(sql);

  assert.deepEqual(coverage, {
    publicData: true,
    authUsers: true,
    storageBuckets: true,
    storageObjects: true,
  });
  assert.doesNotThrow(() => assertFullRecoveryCoverage(coverage));
});

test("rejects a database dump that would lose authentication users", () => {
  const coverage = inspectDatabaseDumpCoverage(
    'COPY "public"."home_content" ("key") FROM stdin;\n',
  );

  assert.throws(() => assertFullRecoveryCoverage(coverage), /auth users/i);
});
