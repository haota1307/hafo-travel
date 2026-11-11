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

- Chỉ sửa tài liệu: kiểm tra nội dung, link/path và `git diff --check`; không cần bật toàn bộ backend.
- Sửa logic: chạy test liên quan và lint project bị tác động. Thay contract/config/shared code ảnh hưởng app thì build các app tương ứng.
- Chuyển test/config Jest: chạy test qua target Nx để kiểm tra việc phát hiện test và import sau di chuyển.
- Không thêm test chỉ lặp lại implementation hoặc để tăng số lượng. Ưu tiên contract response, lỗi, guard/quyền truy cập và nhánh hồi quy có ý nghĩa.

```sh
pnpm exec nx test interceptors --runInBand
pnpm exec nx lint interceptors
pnpm exec nx build bff
pnpm build
pnpm lint
```

Hai lệnh cuối kiểm tra phạm vi rộng hơn; chỉ chạy khi thay đổi cần đến. Khi debug cache/daemon có thể đặt `NX_DAEMON=false`, `NX_ISOLATE_PLUGINS=false` và dùng `--skipNxCache`. Trên PowerShell nếu `pnpm.ps1` bị chặn, dùng `& 'C:\Program Files\nodejs\pnpm.cmd'` thay `pnpm`.

## Tài nguyên và báo cáo kết quả

- Test tự quản lý tài nguyên: đóng Nest app, TCP client/server, timer và khôi phục mock trong teardown/finally. TCP test dùng localhost và port động nếu phù hợp.
- Dừng đúng process do mình bật để test khi hoàn tất, không kill tất cả `node.exe` hoặc các service của người dùng. Không dùng `--forceExit` để che tài nguyên chưa đóng.
- Không tự dùng database/Keycloak thật hoặc chạy seed để kiểm chứng unit test. Test tích hợp dịch vụ thật cần môi trường và dữ liệu phù hợp với phạm vi được giao.
- Báo rõ lệnh đã chạy, pass/fail và phần chưa kiểm tra. `No tests found` không phải test pass; kết quả Nx lấy từ cache cần được phân biệt khi cần bằng chứng chạy mới.
- Hai suite hiện có kiểm tra response TCP/HTTP và pipeline auth/logging/RPC; có TCP socket local thật, còn cache/auth dependency được mock. Chúng không phải bằng chứng e2e với Redis/MongoDB/Keycloak thật.
