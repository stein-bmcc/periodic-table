import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const additions = [
  "picture",
  "source",
  "track",
  "details",
  "summary",
  "dialog",
  "search",
  "time",
  "mark",
  "code",
  "hr",
  "fieldset",
  "legend",
  "caption",
  "thead",
  "tbody",
  "tfoot",
  "title",
];

async function audit(page) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const report = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    return report.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    }));
  });
  expect(result).toEqual([]);
}

// Check actual computed foreground/background pairs, including individual tokens.
async function contrastPairs(page) {
  return page.evaluate(() => {
    const rgb = (value) => value.match(/[\d.]+/g).map(Number);
    const luminance = (channels) =>
      channels
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
    const pairs = new Map();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (
        !node.textContent.trim() ||
        parent.closest("script, style, .sr-only") ||
        !parent.checkVisibility()
      )
        continue;
      let ancestor = parent;
      let background;
      while (ancestor) {
        const candidate = rgb(getComputedStyle(ancestor).backgroundColor);
        if (candidate.length === 3 || candidate[3] === 1) {
          background = candidate;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!background) background = [255, 255, 255];
      const foreground = rgb(getComputedStyle(parent).color);
      const values = [luminance(foreground), luminance(background)].sort(
        (a, b) => a - b,
      );
      const ratio = (values[1] + 0.05) / (values[0] + 0.05);
      const key = `${foreground.slice(0, 3)} / ${background.slice(0, 3)}`;
      pairs.set(key, {
        colors: key,
        ratio: Math.round(ratio * 100) / 100,
        example: node.textContent.trim().slice(0, 40),
      });
    }
    const number = document.querySelector("dialog .line-numbers-rows > span");
    if (number?.checkVisibility()) {
      const foreground = rgb(getComputedStyle(number, "::before").color);
      const background = rgb(
        getComputedStyle(number.closest("pre")).backgroundColor,
      );
      const values = [luminance(foreground), luminance(background)].sort(
        (a, b) => a - b,
      );
      const colors = `${foreground.slice(0, 3)} / ${background.slice(0, 3)}`;
      pairs.set(colors, {
        colors,
        ratio:
          Math.round(((values[1] + 0.05) / (values[0] + 0.05)) * 100) / 100,
        example: "Line number",
      });
    }
    return [...pairs.values()];
  });
}

test("every card has complete sourced content; filters preserve membership and colors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#elements > li")).toHaveCount(73);
  await expect(page.locator("#definitions > .definition")).toHaveCount(73);
  const mainCard = page
    .locator("#elements > li")
    .filter({ has: page.locator('[data-definition="definition-main"]') });
  await expect(mainCard.locator(".frequency")).toHaveText(
    "Typical website usage: common",
  );
  await expect(mainCard.locator(".importance")).toHaveText(
    "Learning priority: 1",
  );
  const names = await page
    .locator("#elements [data-definition]")
    .allTextContents();
  expect(names.slice(0, 5).map((name) => name.trim())).toEqual([
    "doctype",
    "html",
    "head",
    "title",
    "meta",
  ]);
  await expect(page.locator(".card-anatomy .anatomy-labels dt")).toHaveCount(5);
  const cardData = await page.locator("#elements > li").evaluateAll((cards) =>
    cards.map((card) => ({
      id: card.querySelector("[data-definition]").dataset.definition,
      memberships: card.dataset.filters.split(" "),
      color: getComputedStyle(card.querySelector(".element")).backgroundColor,
    })),
  );
  for (const { id } of cardData) {
    await expect(page.locator(`#${id} .lead`)).not.toBeEmpty();
    await expect(page.locator(`#${id} .source a`).first()).toHaveAttribute(
      "href",
      /^https:\/\/developer.mozilla.org\//,
    );
    await expect(page.locator(`#${id} code`)).not.toBeEmpty();
  }
  for (const name of additions)
    await expect(
      page.locator(`[data-definition="definition-${name}"]`),
    ).toHaveCount(1);
  for (const filter of [
    "core",
    "text",
    "media",
    "page-section",
    "setup",
    "all",
  ]) {
    const control = page.locator(`[data-filter="${filter}"]`);
    await control.click();
    const expected = cardData.filter(
      ({ memberships }) => filter === "all" || memberships.includes(filter),
    ).length;
    await expect(page.locator("#elements > li:visible")).toHaveCount(expected);
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.filter[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator("#results-count")).toContainText(
      `${expected} of 73`,
    );
  }
  const colorsAfter = await page
    .locator("#elements .element")
    .evaluateAll((cards) =>
      cards.map((card) => getComputedStyle(card).backgroundColor),
    );
  expect(colorsAfter).toEqual(cardData.map(({ color }) => color));
  expect(errors).toEqual([]);
});

test("all 73 definitions open and return focus after dismissal", async ({
  page,
}) => {
  await page.goto("/");
  const triggers = page.locator("a[data-definition]");
  for (let i = 0; i < (await triggers.count()); i++) {
    const link = triggers.nth(i);
    const id = await link.getAttribute("data-definition");
    await link.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(`dialog #${id}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close definition" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(link).toBeFocused();
  }
});

test("dialog contains keyboard focus and prevents background interaction", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-definition="definition-form"]').click();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => document.activeElement.closest("dialog") !== null,
    ),
  ).toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement.closest("dialog") !== null,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Close definition" }).click();
  await expect(
    page.locator('[data-definition="definition-form"]'),
  ).toBeFocused();
});

test("line numbers stay out of copied HTML and clipboard failures are reported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.copiedCode = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.copiedCode = value;
        },
      },
    });
  });
  await page.goto("/");
  const original = await page.locator("#definition-picture code").textContent();
  await page.locator('[data-definition="definition-picture"]').click();
  const code = page.locator("dialog pre code");
  await expect(code.locator(".token").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Plain text" })).toHaveCount(0);
  await expect(code.locator(".line-numbers-rows > span")).toHaveCount(
    original.split("\n").length,
  );
  await expect(code.locator(".line-numbers-rows")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(
    await code.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const selected = selection.toString();
      selection.removeAllRanges();
      return selected;
    }),
  ).toBe(original);
  const preBounds = await page.locator("dialog pre").boundingBox();
  const copyBounds = await page
    .getByRole("button", { name: "Copy code", exact: true })
    .boundingBox();
  expect(copyBounds.y).toBeGreaterThanOrEqual(preBounds.y + preBounds.height);
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await page.evaluate(() => window.copiedCode)).toBe(original);
  await expect(page.locator("dialog .copy-status")).toHaveText("Code copied.");
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("Denied");
    };
  });
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.locator("dialog .copy-status")).toContainText(
    "Copy unavailable",
  );
});

test("fragment links work with scripting, without scripting, and without Prism", async ({
  browser,
  page,
}) => {
  await page.goto("/#definition-video");
  await expect(page.locator("dialog #definition-video")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await context.newPage();
  await fallback.goto("http://127.0.0.1:4173/");
  await expect(fallback.locator(".filters")).toBeHidden();
  await fallback.locator('[data-definition="definition-audio"]').click();
  await expect(fallback).toHaveURL(/#definition-audio$/);
  await expect(fallback.locator("#definition-audio")).toBeInViewport();
  await expect(fallback.locator("#definition-audio code")).not.toBeEmpty();
  await context.close();
  const noDialog = await browser.newContext();
  await noDialog.addInitScript(() => {
    delete HTMLDialogElement.prototype.showModal;
  });
  const inline = await noDialog.newPage();
  await inline.goto("http://127.0.0.1:4173/");
  await expect(inline.locator("#definitions")).toBeVisible();
  await inline.locator('[data-definition="definition-form"]').click();
  await expect(inline).toHaveURL(/#definition-form$/);
  await expect(inline.locator("#definition-form")).toBeInViewport();
  await noDialog.close();
  await page.route("**/js/vendor/prism.js", (route) => route.abort());
  await page.goto("/");
  await page.locator('[data-definition="definition-video"]').click();
  await expect(page.locator("dialog pre code")).toContainText("<video");
  await expect(page.locator("dialog .token")).toHaveCount(0);
});

test("layout reflows at 320px and 200 percent text sizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const noOverflow = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  await noOverflow();
  await page.locator('[data-definition="definition-table"]').click();
  await noOverflow();
  const box = await page.locator("dialog").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
  await page.keyboard.press("Escape");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await noOverflow();
  await page.locator('[data-definition="definition-picture"]').click();
  await noOverflow();
  await expect(
    page.getByRole("button", { name: "Close definition" }),
  ).toBeVisible();
});

test("Flexbox centers names and keeps metadata at opposite corners", async ({
  page,
}) => {
  await page.goto("/");
  const measurements = await page
    .locator("#elements .element")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const bounds = (selector) =>
          card.querySelector(selector).getBoundingClientRect();
        const outer = card.getBoundingClientRect();
        const name = bounds(".name");
        return {
          offset: Math.abs(
            name.y + name.height / 2 - outer.y - outer.height / 2,
          ),
          top: bounds(".type").top < name.top,
          bottom: bounds(".frequency").bottom > name.bottom,
          leftRight:
            bounds(".type").left < bounds(".parents").left &&
            bounds(".frequency").left < bounds(".importance").left,
        };
      }),
    );
  for (const measurement of measurements) {
    expect(measurement.offset).toBeLessThanOrEqual(1);
    expect(measurement.top && measurement.bottom && measurement.leftRight).toBe(
      true,
    );
  }
});

test("AA automated audit and computed text contrast cover page, filters, and all examples", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.goto("/");
  await audit(page);
  const pairs = new Map();
  async function collect() {
    for (const pair of await contrastPairs(page)) pairs.set(pair.colors, pair);
  }
  await collect();
  for (const filter of [
    "all",
    "core",
    "text",
    "media",
    "page-section",
    "setup",
  ]) {
    const button = page.locator(`[data-filter="${filter}"]`);
    await button.click();
    await button.hover();
    await button.focus();
    await collect();
  }
  await page.locator('[data-filter="all"]').click();
  for (const link of await page.locator("a[data-definition]").all()) {
    await link.click();
    await collect();
    await page.keyboard.press("Escape");
  }
  await page.locator('[data-definition="definition-video"]').click();
  await audit(page);
  const report = [...pairs.values()];
  const reportPath = testInfo.outputPath("computed-contrast.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach("computed-contrast.json", {
    path: reportPath,
    contentType: "application/json",
  });
  expect(report.filter(({ ratio }) => ratio < 4.5)).toEqual([]);
});
