import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import next from "next";

const requestPage = globalThis.fetch;

test("dashboard and guest pages follow the current role across locales", async (t) => {
  let permissions = ["UI:dashboard", "UI:dashboard/roles"];
  const bff = createServer((request, response) => {
    assert.equal(request.url, "/user/me");
    assert.equal(request.headers.authorization, "Bearer test.access.token");
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        statusCode: 200,
        message: "OK",
        data: {
          permissions,
          user: {
            userId: "staff",
            email: "staff@example.test",
            firstName: "Test",
            lastName: "User",
            roles: [{ id: "role", name: "operator" }],
          },
        },
      }),
    );
  });

  async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    return `http://127.0.0.1:${server.address().port}`;
  }

  process.env.API_URL = await listen(bff);
  const server = createServer();
  const origin = await listen(server);
  const app = next({
    dev: false,
    hostname: "127.0.0.1",
    port: server.address().port,
  });
  t.after(() => app.close());
  await app.prepare();
  server.on("request", app.getRequestHandler());
  const signedIn = "__Host-session_access=test.access.token";

  async function open(path, cookie = "") {
    return requestPage(new URL(path, origin), {
      redirect: "manual",
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(10000),
    });
  }

  async function expectRedirect(path, cookie, expected) {
    const response = await open(path, cookie);
    assert.equal(response.status, 307, path);
    const url = new URL(response.headers.get("location"), origin);
    assert.equal(url.origin, origin);
    assert.equal(url.pathname + url.search, expected);
    await response.text();
  }

  const section = "/en/dashboard/roles?record=role";
  const login = "/en/auth/login?next=" + encodeURIComponent(section);
  await expectRedirect(section, "", login);
  assert.equal((await open("/vi/auth/register")).status, 200);
  await expectRedirect(login, signedIn, section);
  await expectRedirect("/vi/auth/register", signedIn, "/vi/dashboard");
  await expectRedirect(
    "/vi/auth/login?next=//example.test",
    signedIn,
    "/vi/dashboard",
  );
  const allowed = await open(section, signedIn);
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /data-slot="sidebar"/);
  assert.equal((await open("/vi/dashboard", signedIn)).status, 200);

  permissions = ["UI:dashboard"];
  await expectRedirect("/vi/dashboard/users", signedIn, "/vi");
  await expectRedirect(login, signedIn, "/en/dashboard");
  const overview = await open("/vi/dashboard", signedIn);
  assert.equal(overview.status, 200);
  assert.doesNotMatch(await overview.text(), /href="\/vi\/dashboard\//);

  permissions = ["UI:dashboard/users"];
  const users = await open("/vi/dashboard/users?record=staff", signedIn);
  assert.equal(users.status, 200);
  const usersHtml = await users.text();
  assert.match(usersHtml, /href="\/vi\/dashboard\/users"/);
  assert.doesNotMatch(usersHtml, /href="\/vi\/dashboard(?:\/roles)?"/);
  await expectRedirect("/vi/dashboard", signedIn, "/vi");
  await expectRedirect("/vi/dashboard/roles", signedIn, "/vi");
  await expectRedirect("/en/auth/login", signedIn, "/en/dashboard/users");
  await expectRedirect(login, signedIn, "/en/dashboard/users");
  await expectRedirect(
    "/en/auth/login?next=%2Fen%2Fdashboard%2Fusers%3Frecord%3Dstaff",
    signedIn,
    "/en/dashboard/users?record=staff",
  );

  permissions = ["role.get_all"];

  for (const path of [
    "/vi/dashboard",
    "/vi/dashboard/roles",
    "/vi/auth/register",
    "/vi/auth/login",
  ]) {
    await expectRedirect(path, signedIn, "/vi");
  }

  for (const action of ["verify-email", "reset-password", "verify-google"]) {
    assert.equal((await open("/en/auth/" + action, signedIn)).status, 200);
  }

  const renewing = await open(
    section,
    "__Host-session_refresh=test.refresh.token",
  );
  assert.equal(renewing.status, 200);
  assert.doesNotMatch(await renewing.text(), /data-slot="sidebar"/);
});
