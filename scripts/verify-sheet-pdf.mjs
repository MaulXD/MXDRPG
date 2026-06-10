/**
 * Pure-logic tests for sheet PDF export helpers.
 * node scripts/verify-sheet-pdf.mjs
 */
import assert from "node:assert/strict";

// --- Replicated from lib/character/export-sheet-pdf.ts ---
function sheetPdfFilename(name) {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "personagem";
  return `Eldarin-Ficha-${base}.pdf`;
}

// --- Replicated from lib/character/sheet-pdf-links.ts ---
const VALID_SKILLS = new Set([
  "percepcao",
  "investigacao",
  "religiao",
  "iniciativa",
  "furtividade",
  "atletismo",
]);

function buildSheetPdfLinkUrl(opts) {
  const params = new URLSearchParams();
  params.set("sheetPdf", "1");
  params.set("characterId", opts.characterId);
  params.set("action", opts.action);
  if (opts.skill) params.set("skill", opts.skill);

  const base = opts.baseUrl.replace(/\/$/, "");
  const path = opts.roomId
    ? `/mesa/${encodeURIComponent(opts.roomId)}`
    : `/personagem/${encodeURIComponent(opts.characterId)}`;
  return `${base}${path}?${params.toString()}`;
}

function parsePdfLinkAction(value) {
  if (value.startsWith("roll:")) {
    const skill = value.slice(5);
    if (!skill || !VALID_SKILLS.has(skill)) return null;
    return { characterId: "", action: "roll", skill };
  }
  if (value === "open") return { characterId: "", action: "open" };
  return null;
}

function parseSheetPdfSearchParams(search) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("sheetPdf") !== "1") return null;

  const characterId = params.get("characterId")?.trim();
  if (!characterId) return null;

  const actionRaw = params.get("action")?.trim();
  const action = actionRaw === "open" ? "open" : "roll";

  const skillRaw = params.get("skill")?.trim();
  const skill =
    skillRaw && VALID_SKILLS.has(skillRaw) ? skillRaw : undefined;

  return { characterId, action, skill };
}

function stripSheetPdfSearchParams(search) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("sheetPdf");
  params.delete("characterId");
  params.delete("action");
  params.delete("skill");
  const next = params.toString();
  return next ? `?${next}` : "";
}

// --- Replicated from lib/media/html2canvas-sanitize.ts ---
const UNSAFE_COLOR_VALUE =
  /color-mix\s*\(|(?<![\w-])color\s*\(|oklch\s*\(|oklab\s*\(|lch\s*\(|lab\s*\(/i;

function isUnsafeColor(value) {
  return UNSAFE_COLOR_VALUE.test(value);
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("verify-sheet-pdf: sheetPdfFilename");
test("strips accents", () => {
  assert.equal(sheetPdfFilename("José da Silva"), "Eldarin-Ficha-Jose-da-Silva.pdf");
});
test("sanitizes special chars", () => {
  assert.equal(sheetPdfFilename("Hero #1 (test)"), "Eldarin-Ficha-Hero-1-test.pdf");
});
test("truncates to 48 chars", () => {
  const long = "A".repeat(60);
  const result = sheetPdfFilename(long);
  assert.match(result, /^Eldarin-Ficha-A+\.pdf$/);
  assert.equal(result.replace("Eldarin-Ficha-", "").replace(".pdf", "").length, 48);
});
test("fallback for empty name", () => {
  assert.equal(sheetPdfFilename("---"), "Eldarin-Ficha-personagem.pdf");
});
test("trims leading/trailing dashes", () => {
  assert.equal(sheetPdfFilename("  Foo Bar  "), "Eldarin-Ficha-Foo-Bar.pdf");
});

console.log("verify-sheet-pdf: buildSheetPdfLinkUrl");
test("mesa path with roomId", () => {
  const url = buildSheetPdfLinkUrl({
    baseUrl: "https://eldarin.example/",
    roomId: "demo",
    characterId: "char-1",
    action: "roll",
    skill: "percepcao",
  });
  assert.equal(
    url,
    "https://eldarin.example/mesa/demo?sheetPdf=1&characterId=char-1&action=roll&skill=percepcao"
  );
});
test("personagem path without roomId", () => {
  const url = buildSheetPdfLinkUrl({
    baseUrl: "http://localhost:3000",
    characterId: "abc/xyz",
    action: "open",
  });
  assert.equal(
    url,
    "http://localhost:3000/personagem/abc%2Fxyz?sheetPdf=1&characterId=abc%2Fxyz&action=open"
  );
});
test("open action omits skill param", () => {
  const url = buildSheetPdfLinkUrl({
    baseUrl: "http://localhost:3000",
    characterId: "c1",
    action: "open",
  });
  assert.ok(!url.includes("skill="));
});

console.log("verify-sheet-pdf: parsePdfLinkAction");
test("roll:skill", () => {
  assert.deepEqual(parsePdfLinkAction("roll:investigacao"), {
    characterId: "",
    action: "roll",
    skill: "investigacao",
  });
});
test("open", () => {
  assert.deepEqual(parsePdfLinkAction("open"), { characterId: "", action: "open" });
});
test("invalid returns null", () => {
  assert.equal(parsePdfLinkAction("foo"), null);
});
test("roll: with empty skill id returns null", () => {
  assert.equal(parsePdfLinkAction("roll:"), null);
});
test("roll: with invalid skill returns null", () => {
  assert.equal(parsePdfLinkAction("roll:foo"), null);
});

console.log("verify-sheet-pdf: parseSheetPdfSearchParams");
test("valid roll deep link", () => {
  assert.deepEqual(
    parseSheetPdfSearchParams("?sheetPdf=1&characterId=ch1&action=roll&skill=iniciativa"),
    { characterId: "ch1", action: "roll", skill: "iniciativa" }
  );
});
test("missing sheetPdf flag", () => {
  assert.equal(parseSheetPdfSearchParams("?characterId=ch1"), null);
});
test("missing characterId", () => {
  assert.equal(parseSheetPdfSearchParams("?sheetPdf=1&action=roll"), null);
});
test("invalid skill stripped", () => {
  assert.deepEqual(
    parseSheetPdfSearchParams("?sheetPdf=1&characterId=ch1&action=roll&skill=invalid"),
    { characterId: "ch1", action: "roll", skill: undefined }
  );
});
test("unknown action defaults to roll", () => {
  assert.deepEqual(
    parseSheetPdfSearchParams("?sheetPdf=1&characterId=ch1&action=foo"),
    { characterId: "ch1", action: "roll", skill: undefined }
  );
});

console.log("verify-sheet-pdf: stripSheetPdfSearchParams");
test("removes all pdf params", () => {
  assert.equal(
    stripSheetPdfSearchParams(
      "?sheetPdf=1&characterId=ch1&action=roll&skill=percepcao&foo=bar"
    ),
    "?foo=bar"
  );
});
test("empty when only pdf params", () => {
  assert.equal(
    stripSheetPdfSearchParams("?sheetPdf=1&characterId=ch1&action=open"),
    ""
  );
});
test("preserves unrelated params", () => {
  assert.equal(stripSheetPdfSearchParams("?tab=inventory"), "?tab=inventory");
});

console.log("verify-sheet-pdf: UNSAFE_COLOR_VALUE");
test("color-mix is unsafe", () => {
  assert.ok(isUnsafeColor("color-mix(in srgb, #fff 50%, #000)"));
});
test("color() is unsafe", () => {
  assert.ok(isUnsafeColor("color(display-p3 1 0 0)"));
});
test("oklch is unsafe", () => {
  assert.ok(isUnsafeColor("oklch(0.5 0.2 240)"));
});
test("oklab is unsafe", () => {
  assert.ok(isUnsafeColor("oklab(0.5 0.1 0.1)"));
});
test("lch is unsafe", () => {
  assert.ok(isUnsafeColor("lch(50% 40 240)"));
});
test("lab is unsafe", () => {
  assert.ok(isUnsafeColor("lab(50% 20 -10)"));
});
test("#hex is safe", () => {
  assert.ok(!isUnsafeColor("#c9a962"));
  assert.ok(!isUnsafeColor("#fff"));
});
test("rgb/rgba is safe", () => {
  assert.ok(!isUnsafeColor("rgb(18, 25, 33)"));
  assert.ok(!isUnsafeColor("rgba(122, 163, 201, 0.22)"));
});
test("does not false-positive on background-color property names", () => {
  assert.ok(!isUnsafeColor("border-color: rgb(0,0,0)"));
});
test("hsl is safe (not in blocklist)", () => {
  assert.ok(!isUnsafeColor("hsl(200 50% 50%)"));
});

console.log(`\nverify-sheet-pdf: OK (${passed} tests)`);
