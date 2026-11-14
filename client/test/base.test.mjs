import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { createTranslator } from "next-intl";

// Load the real TS helpers without emitting files or adding a test framework.
const modules = new Map();
function moduleUrl(name) {
  if (modules.has(name)) {
    return modules.get(name);
  }

  const source = readFileSync(
    new URL(`../lib/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  const code = outputText.replace(
    /from (['"])\.\/([\w-]+)\1/g,
    (_, quote, dependency) => `from "${moduleUrl(dependency)}"`,
  );
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  modules.set(name, url);

  return url;
}

const {
  default: http,
  HttpError,
  EntityError,
} = await import(moduleUrl("http"));
const { getApiValidationErrors, getApiErrorMessage, getApiErrorCode } =
  await import(moduleUrl("api-error"));

test("Template preferences remain readable across locale-prefixed routes and reset", async (t) => {
  const originalDocument = globalThis.document;
  t.after(() => {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  });
  let pathname = "/vi/template";
  const cookies = new Map();
  globalThis.document = {
    get cookie() {
      return [...cookies.values()]
        .filter(
          ({ path }) =>
            pathname === path ||
            pathname.startsWith(path.endsWith("/") ? path : `${path}/`),
        )
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");
    },
    set cookie(serialized) {
      const [pair, ...attributes] = serialized.split("; ");
      const [name, value] = pair.split("=");
      const options = Object.fromEntries(
        attributes.map((attribute) => attribute.split("=")),
      );
      const path = options.path;
      const key = `${name}:${path}`;

      if (options["max-age"] === "0") {
        cookies.delete(key);
      } else {
        cookies.set(key, { name, value, path });
      }
    },
  };
  const source = readFileSync(
    new URL("../template/lib/cookies.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  const { getCookie, setCookie, removeCookie } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

  for (const name of [
    "template-theme",
    "template-font",
    "template-dir",
    "template-sidebar",
  ]) {
    setCookie(name, "saved");
    assert.equal(getCookie(name), "saved");
    pathname = "/en/template/settings/appearance";
    assert.equal(getCookie(name), "saved");
    document.cookie = `${name}=legacy; path=/template`;
    removeCookie(name);
    assert.equal(getCookie(name), undefined);
    pathname = "/template";
    assert.equal(getCookie(name), undefined);
    pathname = "/vi/template";
  }
});

test("HTTP transport and BFF envelope contract", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalApiUrl = process.env.API_URL;
  t.after(() => {
    globalThis.fetch = originalFetch;

    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    if (originalApiUrl === undefined) {
      delete process.env.API_URL;
    } else {
      process.env.API_URL = originalApiUrl;
    }
  });
  process.env.API_URL = "http://backend.test/api";
  let calls = [];
  let reply = () =>
    Response.json(
      {
        statusCode: 200,
        message: "Success",
        code: "Success",
        data: { accessToken: "token", refreshToken: "refresh" },
        processId: "request-1",
        duration: "1 ms",
      },
      { status: 201 },
    );
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    options.signal?.throwIfAborted();

    return reply();
  };
  assert.deepEqual(
    await http.post("/authorizer/login", {
      username: "user",
      password: "password",
    }),
    { status: 201, payload: { accessToken: "token", refreshToken: "refresh" } },
  );
  assert.equal(calls.at(-1).url, "http://backend.test/api/authorizer/login");
  globalThis.window = {};
  await http.get("/items?page=2");
  assert.equal(calls.at(-1).url, "/api/backend/items?page=2");
  await http.get("/internal", { baseUrl: "" });
  assert.equal(calls.at(-1).url, "/internal");
  await http.get("https://other.test/data");
  assert.equal(calls.at(-1).url, "https://other.test/data");

  reply = () =>
    Response.json({ statusCode: 200, message: "Success", data: [{ id: 1 }] });
  assert.deepEqual((await http.get("/items")).payload, [{ id: 1 }]);
  const page = { items: [{ id: 1 }], total: 1, page: 1, limit: 2 };
  reply = () =>
    Response.json({ statusCode: 200, message: "Success", data: page });
  assert.deepEqual((await http.get("/items")).payload, page);
  reply = () =>
    Response.json({ statusCode: 200, message: "Success", data: null });
  assert.equal((await http.get("/empty")).payload, null);
  reply = () => new Response(null, { status: 204 });
  assert.equal((await http.delete("/items/1")).payload, null);
  reply = () => new Response("plain text");
  assert.equal((await http.get("/text")).payload, "plain text");
  reply = () => Response.json({ raw: true });
  assert.deepEqual((await http.get("/raw")).payload, { raw: true });

  for (const status of [400, 422, 401, 500]) {
    calls = [];
    const body = {
      statusCode: status,
      message: ["email must be an email", "password should not be empty"],
      data: null,
      processId: "request-1",
      duration: "1 ms",
    };
    reply = () => Response.json(body, { status });
    await assert.rejects(http.get("/failure"), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error instanceof EntityError, status === 422);
      assert.deepEqual(error.payload, body);
      assert.equal(error.status, status);
      assert.deepEqual(getApiValidationErrors(error), {});
      assert.equal(getApiErrorMessage(error, "Fallback"), "Fallback");

      return true;
    });
    assert.equal(calls.length, 1, "No automatic refresh or retry");
  }

  const codeError = new HttpError(400, { message: "INVALID_INPUT" });
  assert.equal(getApiErrorCode(codeError), "INVALID_INPUT");
  assert.equal(getApiErrorMessage(codeError, "Fallback"), "Fallback");
  assert.equal(
    getApiErrorCode(new HttpError(400, { message: ["INVALID_INPUT"] })),
    "INVALID_INPUT",
  );
  assert.deepEqual(
    getApiValidationErrors(
      new HttpError(400, {
        message: [
          { path: "email", message: "Required" },
          { path: ["profile", "name"], message: "Too short" },
          { path: "__proto__", message: "Ignored" },
        ],
      }),
    ),
    { email: ["Required"], "profile.name": ["Too short"] },
  );
  reply = () =>
    Response.json({ statusCode: 200, message: "Success", data: null });
  await http.post("/items", { name: "Sample item" });
  assert.equal(calls.at(-1).options.body, '{"name":"Sample item"}');
  assert.equal(
    calls.at(-1).options.headers.get("content-type"),
    "application/json",
  );
  const form = new FormData();
  form.append("name", "Sample item");
  await http.post("/upload", form);
  assert.equal(calls.at(-1).options.body, form);
  assert.equal(calls.at(-1).options.headers.has("content-type"), false);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(http.get("/slow", { signal: controller.signal }), {
    name: "AbortError",
  });
  assert.equal(calls.at(-1).options.signal, controller.signal);
});

test("Both locales have matching keys and every demo ICU message formats", () => {
  const load = (file) =>
    JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
  const en = load("../messages/en.json");
  const vi = load("../messages/vi.json");
  const mapping = load("../template/i18n/source-message-keys.json");
  assert.equal(vi.home.description, "Nền tảng ứng dụng");
  assert.equal(vi.errors.UNKNOWN_ERROR, "Đã xảy ra lỗi. Vui lòng thử lại.");

  for (const namespace of Object.keys(en)) {
    assert.deepEqual(
      Object.keys(en[namespace]).sort(),
      Object.keys(vi[namespace]).sort(),
    );
  }

  const values = {
    count: 2,
    page: 1,
    total: 5,
    email: "test@example.com",
    word: "DELETE",
    status: "active",
    priority: "high",
    label: "Test",
  };

  for (const [locale, messages] of Object.entries({ en, vi })) {
    const translate = createTranslator({
      locale,
      messages,
      namespace: "template",
      onError: (error) => {
        throw error;
      },
    });

    for (const key of Object.values(mapping)) {
      assert.equal(typeof translate(key, values), "string");
    }

    if (locale === "en") {
      assert.equal(
        translate(mapping["Deleted {count} task(s)"], { count: 1 }),
        "Deleted 1 task",
      );
      assert.equal(
        translate(mapping["Deleted {count} task(s)"], { count: 2 }),
        "Deleted 2 tasks",
      );
    } else {
      assert.equal(translate(mapping["Change language"]), "Đổi ngôn ngữ");
    }
  }
});
