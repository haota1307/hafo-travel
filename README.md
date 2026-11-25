# Hafo Travel

- [Client](client/README.md): Next.js, giao diện public vi/en và template admin độc lập.
- [Server](server/README.md): BFF NestJS, Identity quản lý hồ sơ và vai trò trong MongoDB. Xem [bản đồ năm service backend](server/instructions/services.md).
- [Hướng dẫn frontend](client/documents/instructions.md).
- [Hướng dẫn backend](server/instructions/README.md).

Chạy frontend trong `client` bằng `pnpm dev`; chạy backend trong `server` bằng `pnpm dev-lite` sau khi cấu hình các dịch vụ theo README tương ứng. Client dùng `API_URL=http://localhost:3300/api` theo cấu hình backend mẫu.

Nền tảng dùng Node.js 26.13.0 LTS và pnpm 12.18.0; giới hạn phiên bản theo `package.json` của từng ứng dụng. Với nvm-windows, chạy `nvm install 26.13.0` rồi `nvm use 26.13.0`; cài pnpm bằng `npm install -g pnpm@12.18.0` nếu chưa có.

Cả client và server dùng compiler TypeScript 7.0.2 qua `@typescript/native` cho `pnpm typecheck`. Nx, Next, ESLint và trình soạn thảo dùng API TypeScript 6.0.2. Khi mở thư mục `server` trong VS Code, chọn `TypeScript: Select TypeScript Version` → `Use Workspace Version` để dùng SDK đã cấu hình trong [settings.json](server/.vscode/settings.json).
