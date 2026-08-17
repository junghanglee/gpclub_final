import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHeroColor, pageHeroTitleStyle } from "./page-hero-style.ts";

test("hero style maps bounded presets to predictable CSS", () => {
  assert.deepEqual(
    pageHeroTitleStyle({
      titleSize: "compact",
      titleWeight: "semibold",
      align: "center",
      kickerColor: "#ec4899",
      titleColor: "#171717",
      highlightColor: "#ec4899",
      descriptionColor: "#525252",
    }),
    {
      fontSize: "min(2.25rem, 9vw)",
      fontWeight: 600,
      textAlign: "center",
      color: "#171717",
    },
  );
});

test("display preset supports multiline editor text without unsafe markup", () => {
  const style = pageHeroTitleStyle({
    titleSize: "display",
    titleWeight: "black",
    align: "left",
    kickerColor: "#ec4899",
    titleColor: "#171717",
    highlightColor: "#ec4899",
    descriptionColor: "#525252",
  });
  assert.equal(style.fontWeight, 900);
  assert.equal(style.textAlign, "left");
  assert.equal(style.fontSize, "min(3rem, 11vw)");
});

test("hero colors accept hex values and reject unsafe CSS input", () => {
  assert.equal(normalizeHeroColor("#E91E8C", "#111111"), "#e91e8c");
  assert.equal(normalizeHeroColor("url(javascript:alert(1))", "#111111"), "#111111");
  assert.equal(normalizeHeroColor("", "#ec4899"), "#ec4899");
});
