import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import next from "next";

const email = process.env.AUTH_TEST_EMAIL;
const password = process.env.AUTH_TEST_PASSWORD;

test(
  "Next login, current profile, rotation and logout against the running Identity service",
  { timeout: 60000 },
  async (t) => {
    assert.ok(
      email && password,
      "Set AUTH_TEST_EMAIL and AUTH_TEST_PASSWORD for the isolated test account.",
    );
    let origin = process.env.AUTH_TEST_ORIGIN;

    if (!origin) {
      assert.ok(process.env.API_URL, "Set API_URL for the test BFF.");
      const app = next({ dev: false, hostname: "127.0.0.1" });
      const handler = app.getRequestHandler();
      const server = createServer(handler);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      t.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        await app.close();
      });
      origin = `http://127.0.0.1:${server.address().port}`;
      process.env.CLIENT_URL = origin;
      await app.prepare();
    }

    const cookies = new Map();
    const cookieHeader = () =>
      [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
    const post = (
      action,
      body,
      requestOrigin = origin,
      cookie = cookieHeader(),
    ) =>
      fetch(new URL(`/api/auth/${action}`, origin), {
        method: "POST",
        headers: {
          Origin: requestOrigin,
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
      });
    const me = (cookie = cookieHeader()) =>
      fetch(new URL("/api/backend/user/me", origin), {
        headers: { Cookie: cookie },
      });

    function acceptCookies(response) {
      const fields = response.headers.getSetCookie();
      assert.equal(fields.length, 2);

      for (const field of fields) {
        assert.ok(/; HttpOnly/i.test(field));
        assert.ok(/; SameSite=Lax/i.test(field));
        const [name, value] = field.split(";")[0].split("=");

        if (name.startsWith("__Host-")) {
          assert.ok(/; Secure/i.test(field));
        }

        cookies.set(name, value);
      }
    }

    const page = await fetch(new URL("/vi/auth/login", origin));
    assert.equal(page.status, 200);
    assert.equal((await me()).status, 401);
    assert.equal(
      (await post("login", {}, "https://other.example")).status,
      403,
    );
    const generic = await fetch(new URL("/api/backend/auth/login", origin), {
      method: "POST",
      headers: { Origin: origin },
    });
    assert.equal(generic.status, 404);

    const login = await post("login", { email, password });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("cache-control"), /no-store/);
    assert.deepEqual(Object.keys(await login.json()), ["message"]);
    acceptCookies(login);
    const first = cookieHeader();

    try {
      const accessName = [...cookies.keys()].find((name) =>
        name.endsWith("session_access"),
      );
      const refreshName = [...cookies.keys()].find((name) =>
        name.endsWith("session_refresh"),
      );
      assert.ok(accessName && refreshName);
      const access = cookies.get(accessName);
      const refresh = cookies.get(refreshName);
      assert.equal(refresh.split(".").length, 3);
      assert.equal((await me(`${accessName}=${refresh}`)).status, 401);
      assert.equal(
        (await post("refresh", null, origin, `${refreshName}=${access}`))
          .status,
        401,
      );

      const profile = await me();
      assert.equal(profile.status, 200);
      const { data } = await profile.json();
      assert.equal(data.user.email, email);
      assert.ok(Array.isArray(data.permissions));
      assert.ok(!Object.hasOwn(data.user, "passwordHash"));
      assert.equal(data.user.roles.length, 1);

      const refreshed = await post("refresh");
      assert.equal(refreshed.status, 200);
      assert.deepEqual(Object.keys(await refreshed.json()), ["message"]);
      acceptCookies(refreshed);
      assert.ok(cookies.get(refreshName) !== refresh);
      assert.equal((await me(first)).status, 200);
      assert.equal((await post("refresh", null, origin, first)).status, 401);
      assert.equal((await me()).status, 200);
    } finally {
      const current = cookieHeader();
      const logout = await post("logout");
      assert.equal(logout.status, 200);
      acceptCookies(logout);
      assert.ok([...cookies.values()].every((value) => value === ""));
      assert.equal((await me()).status, 401);
      assert.equal((await me(current)).status, 200);
      assert.equal((await post("refresh", null, origin, current)).status, 401);
      assert.equal((await post("logout")).status, 200);
    }
  },
);
