# Test và kiểm chứng

## Vị trí test

Mỗi project Nx giữ test trong `tests/` cạnh `src/`:

```text
libs/interceptors/
  src/lib/                       # code runtime
  tests/
    request-pipeline.spec.ts
    response-interceptors.spec.ts
  jest.config.cts
  tsconfig.spec.json
```

Áp dụng tương tự `apps/<app>/tests/` và `libs/<lib>/tests/`. Khi cần, đặt fixture/mock/helper chỉ phục vụ test trong `tests/fixtures`, `tests/mocks`, `tests/helpers`. Không import chúng vào runtime. Chưa có test thì không cần tạo folder rỗng.

`jest.preset.js` dùng `testMatch` cho `tests/**/*.spec.ts` và `tests/**/*.test.ts`. Các `tsconfig.spec.json` include `tests/**/*.ts`. Jest/TypeScript config vẫn ở root project để Nx nhận diện target. `tsconfig.app.json`/`tsconfig.lib.json` chỉ include source runtime; Nx production inputs loại trừ toàn bộ `tests/`.

Khi chuyển test, sửa import tương đối và tìm lại tham chiếu setup/fixture. Không chỉ di chuyển file mà bỏ quên cấu hình. Test cùng library có thể import `../src/lib/...`; shared dependency khác dùng alias sẵn có.

## Chọn kiểm tra theo thay đổi

- Dùng Node.js 26.13.0 và pnpm 12.18.0. Compiler CLI TypeScript 7.0.2 cài qua `@typescript/native`; alias `typescript` dùng `@typescript/typescript6@6.0.2` cho API của Nx/ts-loader/ts-jest. `pnpm typecheck` kiểm tra toàn bộ app/library/spec bằng compiler 7.
- Khi mở root repository trong VS Code, SDK ở root trỏ tới API/editor TypeScript 6.0.2 trong `server/node_modules`; chọn `TypeScript: Select TypeScript Version` → `Use Workspace Version`. Setting `js/ts.tsdk.path` chỉ khai báo đường dẫn, không tự chọn SDK. Khi mở riêng server, dùng `server/.vscode`.
- Cấu hình backend dùng NodeNext, ES2023, strict và isolatedModules, bỏ baseUrl/node10/node16 override cũ và `ignoreDeprecations`. Type/interface dùng trong decorated signature phải import type; class DTO/service cần metadata runtime vẫn import giá trị.
- Jest 30/ts-jest chạy với `NODE_OPTIONS=--experimental-vm-modules` được khai báo trong `nx.json` để nạp Nest 12 ESM trên Node 26. Giữ kiểm tra kiểu độc lập; không thêm `--forceExit`, tắt diagnostics hoặc bỏ suite để che lỗi migration.

- Chỉ sửa tài liệu: kiểm tra nội dung, link/path và `git diff --check`; không cần bật toàn bộ backend.
- Sửa logic: chạy test liên quan và lint project bị tác động. Thay contract/config/shared code ảnh hưởng app thì build các app tương ứng.
- Chuyển test/config Jest: chạy test qua target Nx để kiểm tra việc phát hiện test và import sau di chuyển.
- Không thêm test chỉ lặp lại implementation hoặc để tăng số lượng. Ưu tiên contract response, lỗi, guard/quyền truy cập và nhánh hồi quy có ý nghĩa.

```sh
pnpm exec nx test interceptors --runInBand
pnpm exec nx test authorizer --runInBand
pnpm exec nx lint interceptors
pnpm exec nx build bff
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Các lệnh workspace kiểm tra phạm vi rộng hơn; chỉ chạy khi thay đổi cần đến. Khi debug cache/daemon có thể đặt `NX_DAEMON=false`, `NX_ISOLATE_PLUGINS=false`, dùng `--skipNxCache` và `--output-style=static` để thấy log lỗi trực tiếp trên Nx 24. Trên PowerShell nếu `pnpm.ps1` bị chặn, dùng `pnpm.cmd` của Node 26 đã kích hoạt.

## Tài nguyên và báo cáo kết quả

- Test tự quản lý tài nguyên: đóng Nest app, gRPC client/server, timer và khôi phục mock trong teardown/finally. gRPC test dùng localhost và port động nếu phù hợp.
- Dừng đúng process do mình bật để test khi hoàn tất, không kill tất cả `node.exe` hoặc các service của người dùng. Không dùng `--forceExit` để che tài nguyên chưa đóng.
- Không tự dùng database/Keycloak thật hoặc chạy seed để kiểm chứng unit test. Test tích hợp dịch vụ thật cần môi trường và dữ liệu phù hợp với phạm vi được giao.
- Báo rõ lệnh đã chạy, pass/fail và phần chưa kiểm tra. `No tests found` không phải test pass; kết quả Nx lấy từ cache cần được phân biệt khi cần bằng chứng chạy mới.
- Các suite trong `libs/interceptors/tests/` kiểm tra HTTP envelope, status/error metadata gRPC, deadline/correlation và pipeline auth/cache/logging. Suite `apps/authorizer/tests/keycloak-http.service.spec.ts` dùng HTTP mock kiểm tra header Location khi tạo user.
- Suite `apps/bff/tests/authorizer-http.spec.ts` khởi tạo BFF HTTP và hai server gRPC bằng controller/service thật trên cổng localhost động. Kiểm tra login/validation/Swagger, tạo user lồng Keycloak, JWT ký bằng key test/JWKS mock, lookup thiếu user, cache expiry, deadline/correlation và lỗi HTTP giữ nguyên; bổ sung 401/403, CRUD role, đổi role, role không tồn tại và cập nhật quyền khi token đã cache. Tạo user phải có cả hai quyền; HTTP/gRPC từ chối mảng role rỗng hoặc nhiều phần tử; role đang được gán không được xóa. MongoDB repository, Keycloak HTTP và cache được mock; không chứng minh tích hợp dịch vụ ngoài thật. Hook khởi tạo có ngân sách 30 giây để nạp module ESM và bật HTTP/gRPC; test riêng giữ timeout mặc định.

Sau khi sửa proto, chạy `pnpm proto:generate`, typecheck, lint và suite liên quan; khi đổi packaging/config, build ba app để kiểm tra proto assets. ESLint chỉ cho phép các import xuyên app cụ thể trong suite tích hợp BFF để dựng service thật (user/role/authorizer); runtime vẫn chịu module boundary thông thường.
