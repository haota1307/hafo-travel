import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { createTranslator } from "next-intl";

const locales = Object.fromEntries(
  ["vi", "en"].map((locale) => [
    locale,
    JSON.parse(
      readFileSync(
        new URL(`../messages/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ),
  ]),
);

const modules = new Map();

function moduleUrl(file) {
  const url = new URL(file, import.meta.url);

  if (modules.has(url.href)) {
    return modules.get(url.href);
  }

  const source = readFileSync(url, "utf8");
  const { outputText } = url.pathname.endsWith(".json")
    ? { outputText: `export default ${source}` }
    : ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      });
  const code = outputText.replace(
    /from (['"])(\.\/.+?|\.\.\/.+?)\1/g,
    (_, quote, dependency) => {
      const filename = dependency.endsWith(".json")
        ? dependency
        : `${dependency}.ts`;

      return `from ${JSON.stringify(moduleUrl(new URL(filename, url)))}`;
    },
  );
  const result = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  modules.set(url.href, result);

  return result;
}

function translator(locale) {
  return createTranslator({
    locale,
    messages: locales[locale],
    namespace: "publicSite",
    onError(error) {
      throw error;
    },
  });
}

function assertMatchingContent(en, vi, key = "publicSite") {
  assert.equal(typeof vi, typeof en, key);

  if (typeof en === "string") {
    assert.ok(en.length === 0 || vi.trim().length > 0, key);
    assert.ok(!/\p{L}\?\p{L}/u.test(vi), `${key}: damaged Vietnamese text`);

    return;
  }

  assert.equal(Array.isArray(vi), Array.isArray(en), key);
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort(), key);

  for (const name of Object.keys(en)) {
    assertMatchingContent(en[name], vi[name], `${key}.${name}`);
  }
}

test("Public messages have complete matching structures and valid ICU/rich text", () => {
  assertMatchingContent(locales.en.publicSite, locales.vi.publicSite);
  const rawCollections = new Set([
    "experienceProfiles",
    "retreatCards",
    "retreatContent",
  ]);
  const values = {
    name: "Hafo Travel",
    number: 2,
    year: 2026,
    max: 256,
    language: "English",
    br: () => "\n",
    emphasis: (chunks) => chunks,
    strong: (chunks) => chunks,
    link: (chunks) => chunks,
  };

  for (const locale of Object.keys(locales)) {
    const t = translator(locale);

    function visit(messages, prefix = "") {
      for (const [name, value] of Object.entries(messages)) {
        const key = prefix ? `${prefix}.${name}` : name;

        if (typeof value === "string") {
          assert.equal(
            typeof t.rich(key, values),
            "string",
            `${locale}.${key}`,
          );
        } else if (!rawCollections.has(key)) {
          visit(value, key);
        }
      }
    }

    visit(locales[locale].publicSite);
  }
});

test("Public data localizes every journey and experience without changing shared data or leaking locales", async () => {
  const { getRetreats } = await import(
    moduleUrl("../features/public-site/data/retreats.ts")
  );
  const { getExperiences } = await import(
    moduleUrl("../features/public-site/data/experiences.ts")
  );
  const { getRetreatPage, retreatPages } = await import(
    moduleUrl("../features/public-site/pages/retreat-pages.ts")
  );
  const en = translator("en");
  const vi = translator("vi");
  const enCards = getRetreats(en);
  const viCards = getRetreats(vi);
  assert.equal(enCards.length, 6);
  assert.equal(getExperiences(vi).length, 12);
  assert.equal(getExperiences(vi)[0].specialty, "Những cung đường cao nguyên");
  assert.equal(getExperiences(en)[0].specialty, "Highland roads");
  assert.deepEqual(
    getExperiences(en).map(({ image }) => image),
    getExperiences(vi).map(({ image }) => image),
  );

  for (const [slug, data] of Object.entries(retreatPages)) {
    const english = getRetreatPage(slug, en);
    const vietnamese = getRetreatPage(slug, vi);
    assert.notEqual(vietnamese.title, english.title, slug);
    assert.notEqual(vietnamese.about[0], english.about[0], slug);
    assert.deepEqual(vietnamese.images, english.images, slug);
    assert.equal(vietnamese.price, english.price, slug);
    assert.equal(vietnamese.price, null, slug);
    assert.equal(vietnamese.team.length, data.team.length, slug);
    assert.deepEqual(vietnamese.relatedSlugs, english.relatedSlugs, slug);
    assert.deepEqual(
      vietnamese.included.map((column) => column.map(({ icon }) => icon)),
      data.includedIcons,
      slug,
    );
    assert.ok(
      vietnamese.team.every(({ role, bio }) => role && bio.length),
      slug,
    );
    assert.ok(
      vietnamese.food.meals.every((meal) => !english.food.meals.includes(meal)),
      slug,
    );
    assert.equal(
      viCards.find((item) => item.slug === slug).price,
      vietnamese.price,
    );
    assert.deepEqual(getRetreatPage(slug, en), english, slug);
  }

  assert.equal(getRetreatPage("unknown", vi), undefined);
  assert.equal(getRetreatPage("toString", vi), undefined);
  assert.deepEqual(getRetreats(en), enCards);

  const { imageAssets } = await import(
    moduleUrl("../features/public-site/data/image-assets.ts")
  );

  for (const src of Object.keys(imageAssets)) {
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src);
  }
});
