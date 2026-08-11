import assert from "node:assert/strict";
import test from "node:test";
import { resolveBrandCoreValuesHeading } from "./brand-core-values-heading.ts";

test("uses Vietnamese defaults when legacy brand content has no editable heading", () => {
  assert.deepEqual(resolveBrandCoreValuesHeading(undefined, "vi"), {
    kicker: "GIÁ TRỊ CỐT LÕI",
    title: "Đam mê. Đổi mới. Chuyên môn.",
  });
});

test("uses English defaults when legacy brand content has no editable heading", () => {
  assert.deepEqual(resolveBrandCoreValuesHeading(undefined, "en"), {
    kicker: "CORE VALUES",
    title: "Passion. Innovation. Expertise.",
  });
});

test("returns the administrator-edited text for the selected language", () => {
  const heading = {
    kicker: { vi: "Giá trị riêng", en: "Our values" },
    title: { vi: "Tiêu đề tiếng Việt", en: "English heading" },
  };

  assert.deepEqual(resolveBrandCoreValuesHeading(heading, "vi"), {
    kicker: "Giá trị riêng",
    title: "Tiêu đề tiếng Việt",
  });
  assert.deepEqual(resolveBrandCoreValuesHeading(heading, "en"), {
    kicker: "Our values",
    title: "English heading",
  });
});
