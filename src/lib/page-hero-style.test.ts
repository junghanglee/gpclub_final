import assert from "node:assert/strict";
import test from "node:test";
import { pageHeroTitleStyle } from "./page-hero-style.ts";

test("hero style maps bounded presets to predictable CSS", () => {
  assert.deepEqual(
    pageHeroTitleStyle({ titleSize: "compact", titleWeight: "semibold", align: "center" }),
    {
      fontSize: "clamp(2rem, 4vw, 3rem)",
      fontWeight: 600,
      textAlign: "center",
    },
  );
});

test("display preset supports multiline editor text without unsafe markup", () => {
  const style = pageHeroTitleStyle({ titleSize: "display", titleWeight: "black", align: "left" });
  assert.equal(style.fontWeight, 900);
  assert.equal(style.textAlign, "left");
  assert.match(String(style.fontSize), /clamp/);
});
