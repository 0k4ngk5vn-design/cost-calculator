import test from "node:test";
import assert from "node:assert/strict";
import { readJson, validateBody, validateId, publicError, errorStatus } from "../src/lib/security/request.mjs";
import config from "../next.config.mjs";

function request(body = "{}", headers = {}) {
  return new Request("https://calculator.example/api/ingredients", {
    method: "POST", body,
    headers: { origin: "https://calculator.example", "content-type": "application/json", ...headers },
  });
}

test("accepts same-origin JSON and rejects cross-origin, null and missing provenance", async () => {
  assert.deepEqual(await readJson(request()), {});
  for (const headers of [
    { origin: "https://evil.example" },
    { origin: "https://calculator.example.evil.example" },
    { origin: "null" },
    { origin: "" },
    { "sec-fetch-site": "same-site" },
    { "sec-fetch-site": "cross-site" },
    { origin: "https://evil.example", "x-forwarded-host": "evil.example" },
  ]) await assert.rejects(readJson(request("{}", headers)), { status: 403 });
  assert.deepEqual(await readJson(request("{}", { origin: "", "sec-fetch-site": "same-origin" })), {});
});

test("rejects non-JSON, malformed and oversized bodies, including absent length", async () => {
  await assert.rejects(readJson(request("{}", { "content-type": "text/plain" })), { status: 415 });
  for (const body of ["{", "null", "[]", '"text"']) {
    await assert.rejects(readJson(request(body)), { status: 400 });
  }
  await assert.rejects(readJson(request(JSON.stringify({ memo: "가".repeat(23000) }))), { status: 413 });
  await assert.rejects(readJson(request("{}", { "content-length": "65537" })), { status: 413 });
});

const ingredient = { name: "밀가루", quantity: "1.5", price: "0", unit: "kg", currency: "vnd", category: "food", memo: "", supplier: null };
test("validates numbers, text lengths, IDs and category types", () => {
  assert.equal(validateBody(ingredient, "ingredients"), ingredient);
  for (const quantity of [0, -1, null, true, [], {}, "", "Infinity", "NaN", "1e999", Number.MAX_VALUE]) {
    assert.throws(() => validateBody({ ...ingredient, quantity }, "ingredients"));
  }
  assert.throws(() => validateBody({ ...ingredient, name: "a".repeat(201) }, "ingredients"));
  assert.throws(() => validateBody({ category_name: "a", category_value: "b", unit_type: "currency" }, "category"));
  validateId("d0b23e73-f4ab-4a6b-b84b-bd78fbfe867d");
  assert.throws(() => validateId("1 OR 1=1"));
});

test("validates menu creation/update payloads and rejects broken ingredient lists", () => {
  const menu = { ...ingredient, amount: 1, ingredients: [{ ingredient_id: "1", amount: 2, amount_unit: "kg" }] };
  validateBody(menu, "menu");
  validateBody({ ...menu, id: "1", amount_unit: "kg", currency_unit: "vnd", ingredients: [{ ingredientId: "1", amount: "2", unit: "kg" }] }, "menu", true);
  for (const ingredients of [null, [], [null], [menu.ingredients[0], menu.ingredients[0]], [{ ingredient_id: "1", amount: -1, amount_unit: "kg" }]]) {
    assert.throws(() => validateBody({ ...menu, ingredients }, "menu"));
  }
});

test("internal errors stay private and session errors use 401", () => {
  assert.equal(errorStatus(new Error("UNAUTHORIZED")), 401);
  assert.equal(errorStatus(new Error("database secret")), 500);
  assert.ok(!publicError(new Error("database secret")).includes("secret"));
});

test("security headers cover business routes and exclude authentication routes", async () => {
  const rules = await config.headers();
  assert.ok(rules.every(({ source }) => !source.includes("auth") && !source.includes("login")));
  assert.ok(rules.every(({ headers }) => headers.some(({ key, value }) => key === "X-Frame-Options" && value === "DENY")));
  assert.ok(rules.filter(({ source }) => source.startsWith("/api/")).every(({ headers }) => headers.some(({ key, value }) => key === "Cache-Control" && value === "private, no-store")));
});
