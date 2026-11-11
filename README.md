# Hafo Travel

- [Tài liệu dự án](documents/README.md): phạm vi, nghiệp vụ, kiến trúc microservice/Kafka, AI agent và các quyết định cần xác nhận.
- [Client](client/README.md): Next.js, giao diện public vi/en và template admin độc lập.
- [Server](server/README.md): BFF NestJS, authorizer Keycloak và user-access MongoDB.
- [Hướng dẫn frontend](client/documents/instructions.md).
- [Hướng dẫn backend](server/instructions/README.md).

Chạy frontend trong `client` bằng `pnpm dev`; chạy backend trong `server` bằng `pnpm dev-lite` sau khi cấu hình các dịch vụ theo README tương ứng. Client dùng `API_URL=http://localhost:3300/api` theo cấu hình backend mẫu.

Nền tảng dùng Node.js 26.13.0 LTS và pnpm 12.18.0; giới hạn phiên bản theo `package.json` của từng ứng dụng. Với nvm-windows, chạy `nvm install 26.13.0` rồi `nvm use 26.13.0`; cài pnpm bằng `npm install -g pnpm@12.18.0` nếu chưa có.

Khi mở cả thư mục này trong VS Code, chọn `TypeScript: Select TypeScript Version` → `Use Workspace Version` để dùng API/editor TypeScript 6.0.2. Cả FE/BE cài song song compiler TypeScript 7.0.2 qua `@typescript/native`; `pnpm typecheck` dùng compiler mới, còn Nx/Next/ESLint/test loader dùng API TypeScript 6 theo [hướng dẫn Nx](https://nx.dev/docs/kb/typescript-7). `.vscode/settings.json` ở root cấu hình SDK và thư mục ESLint cho cả client/server; setting trong `server/.vscode` chỉ áp dụng khi mở riêng server.
