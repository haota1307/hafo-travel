import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import next from "next";

const requestPage = globalThis.fetch;

test("dashboard and guest pages follow the current role across locales", async (t) => {
  let permissions = ["UI:dashboard", "UI:dashboard/roles"];
  let googleError = "GOOGLE_EMAIL_CONFIRMATION_REQUIRED";
  const role = {
    id: "68a3f2f1b3e811435a8ad006",
    name: "operator",
    displayName: "Tour operations",
    description: "",
    permissions: ["UI:dashboard/roles"],
    memberCount: 1,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  };
  let sessionRoleName = role.name;
  const invitations = [];
  const bff = createServer(async (request, response) => {
    if (request.method === "POST" && request.url === "/auth/google") {
      request.resume();
      response.writeHead(403, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ statusCode: 403, message: googleError }));

      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/auth/accept-invitation"
    ) {
      const chunks = [];

      for await (const chunk of request) {
        chunks.push(chunk);
      }

      const body = JSON.parse(Buffer.concat(chunks).toString());
      invitations.push(body);
      const statusCode = body.token === "unused-link" ? 200 : 400;
      response.writeHead(statusCode, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ statusCode, message: "OK", data: {} }));

      return;
    }

    assert.equal(request.headers.authorization, "Bearer test.access.token");
    response.setHeader("Content-Type", "application/json");

    if (request.method === "GET" && request.url === "/role") {
      if (!permissions.includes("role.get_all")) {
        response.statusCode = 403;
        response.end(JSON.stringify({ statusCode: 403, message: "Forbidden" }));

        return;
      }

      response.end(
        JSON.stringify({ statusCode: 200, message: "OK", data: [role] }),
      );

      return;
    }

    assert.equal(request.url, "/user/me");
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
            roles: [{ id: role.id, name: sessionRoleName }],
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
  process.env.NEXT_PUBLIC_SITE_URL = origin;
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

  const section = `/en/dashboard/roles?record=${role.id}`;
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
  const allowedHtml = await allowed.text();
  assert.match(allowedHtml, /data-slot="sidebar"/);
  assert.match(allowedHtml, /Access denied<\/h2>/);
  const deniedRoles = await open("/api/backend/role", signedIn);
  assert.equal(deniedRoles.status, 403);
  await deniedRoles.json();
  assert.equal((await open("/vi/dashboard", signedIn)).status, 200);
  await expectRedirect("/en/dashboard/permissions", signedIn, "/en");

  permissions = ["UI:dashboard/permissions"];
  const deniedMatrix = await open("/en/dashboard/permissions", signedIn);
  assert.equal(deniedMatrix.status, 200);
  assert.match(await deniedMatrix.text(), /Access denied<\/h2>/);

  permissions = ["UI:dashboard/roles", "role.get_all"];
  const rolePage = await open("/vi/dashboard/roles", signedIn);
  assert.equal(rolePage.status, 200);
  const rolePageHtml = await rolePage.text();
  assert.match(rolePageHtml, /Vai trò<\/h1>/);
  assert.doesNotMatch(rolePageHtml, /Không có quyền truy cập<\/h2>/);
  assert.doesNotMatch(rolePageHtml, /Thêm vai trò<\/button>/);
  assert.doesNotMatch(rolePageHtml, /href="\/vi\/dashboard\/permissions"/);
  await expectRedirect("/vi/dashboard/permissions", signedIn, "/vi");

  permissions = ["UI:dashboard/permissions", "role.get_all"];
  const matrix = await open("/vi/dashboard/permissions", signedIn);
  assert.equal(matrix.status, 200);
  const matrixHtml = await matrix.text();
  assert.match(matrixHtml, /Phân quyền<\/h1>/);
  assert.doesNotMatch(matrixHtml, /Không có quyền truy cập<\/h2>/);
  assert.doesNotMatch(matrixHtml, /href="\/vi\/dashboard\/roles"/);
  await expectRedirect("/vi/dashboard/roles", signedIn, "/vi");

  sessionRoleName = "administrator";
  permissions = ["UI:dashboard/roles", "role.get_all"];
  const legacyAdminMatrix = await open("/vi/dashboard/permissions", signedIn);
  assert.equal(legacyAdminMatrix.status, 200);
  assert.match(await legacyAdminMatrix.text(), /Phân quyền<\/h1>/);
  sessionRoleName = role.name;

  const roleList = await open("/api/backend/role", signedIn);
  assert.equal(roleList.status, 200);
  assert.deepEqual((await roleList.json()).data, [role]);

  permissions = ["UI:dashboard/roles", "role.get_all", "role.create"];
  const roleAdmin = await open("/en/dashboard/roles", signedIn);
  assert.equal(roleAdmin.status, 200);
  assert.match(await roleAdmin.text(), /Add role<\/button>/);

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
  assert.doesNotMatch(usersHtml, /Mời tài khoản<\/button>/);
  await expectRedirect("/vi/dashboard", signedIn, "/vi");
  await expectRedirect("/vi/dashboard/roles", signedIn, "/vi");
  await expectRedirect("/vi/dashboard/permissions", signedIn, "/vi");
  await expectRedirect("/en/auth/login", signedIn, "/en/dashboard/users");
  await expectRedirect(login, signedIn, "/en/dashboard/users");
  await expectRedirect(
    "/en/auth/login?next=%2Fen%2Fdashboard%2Fusers%3Frecord%3Dstaff",
    signedIn,
    "/en/dashboard/users?record=staff",
  );

  permissions = [
    "UI:dashboard/users",
    "user.get_all",
    "user.get_by_id",
    "user.create",
    "user.assign_roles",
    "role.get_all",
  ];
  const adminUsers = await open("/vi/dashboard/users", signedIn);
  assert.equal(adminUsers.status, 200);
  const adminUsersHtml = await adminUsers.text();
  assert.match(adminUsersHtml, /Mời tài khoản<\/button>/);
  assert.doesNotMatch(adminUsersHtml, /minhanh@example.com/);

  permissions = ["role.get_all"];

  for (const path of [
    "/vi/dashboard",
    "/vi/dashboard/roles",
    "/vi/dashboard/permissions",
    "/vi/auth/register",
    "/vi/auth/login",
  ]) {
    await expectRedirect(path, signedIn, "/vi");
  }

  for (const action of ["verify-email", "reset-password", "verify-google"]) {
    assert.equal((await open("/en/auth/" + action, signedIn)).status, 200);
  }

  for (const [locale, title] of [
    ["vi", "Kích hoạt tài khoản nội bộ"],
    ["en", "Activate your staff account"],
  ]) {
    const invitePage = await open(`/${locale}/auth/accept-invitation`);
    assert.equal(invitePage.status, 200);
    assert.ok((await invitePage.text()).includes(title));
  }

  const renewing = await open(
    section,
    "__Host-session_refresh=test.refresh.token",
  );
  assert.equal(renewing.status, 200);
  assert.doesNotMatch(await renewing.text(), /data-slot="sidebar"/);

  async function googleLogin() {
    return requestPage(new URL("/api/auth/google", origin), {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "test-credential" }),
      signal: AbortSignal.timeout(10000),
    });
  }

  const confirmation = await googleLogin();
  assert.equal(confirmation.status, 403);
  assert.equal(confirmation.headers.get("set-cookie"), null);
  assert.deepEqual(await confirmation.json(), {
    message: "GOOGLE_EMAIL_CONFIRMATION_REQUIRED",
  });

  googleError = "Upstream error details";
  const forbidden = await googleLogin();
  assert.equal(forbidden.status, 403);
  assert.deepEqual(await forbidden.json(), { message: "AUTH_REQUEST_FAILED" });

  function acceptInvitation(
    token,
    { path = "/api/auth/accept-invitation", from = origin } = {},
  ) {
    return requestPage(new URL(path, origin), {
      method: "POST",
      headers: { Origin: from, "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: "test-password" }),
      signal: AbortSignal.timeout(10000),
    });
  }

  const activation = await acceptInvitation("unused-link");
  assert.equal(activation.status, 200);
  assert.equal(activation.headers.get("set-cookie"), null);
  assert.deepEqual(await activation.json(), { message: "OK" });
  const invalidLink = await acceptInvitation("expired-link");
  assert.equal(invalidLink.status, 400);
  await invalidLink.json();
  const invalidOrigin = await acceptInvitation("unused-link", {
    from: "http://example.test",
  });
  assert.equal(invalidOrigin.status, 403);
  await invalidOrigin.json();
  const genericProxy = await acceptInvitation("unused-link", {
    path: "/api/backend/auth/accept-invitation",
  });
  assert.equal(genericProxy.status, 404);
  await genericProxy.json();
  assert.deepEqual(invitations, [
    { token: "unused-link", password: "test-password" },
    { token: "expired-link", password: "test-password" },
  ]);
});
