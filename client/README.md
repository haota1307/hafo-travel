# Hafo Travel Client

Next.js App Router, React Query, Zod 4, next-intl và bộ UI demo. Dùng cấu trúc root, alias `@/*`, không có `src/`.

## Đăng ký và khôi phục tài khoản

Từ trang `/[locale]/auth/login`, chọn đăng ký hoặc quên mật khẩu. Mở email để hoàn tất thao tác. Đặt `AUTH_PUBLIC_ORIGIN` phía Identity trùng với origin public của Next. Với Google, cấu hình OAuth client loại Web application và thêm origin của Next vào Authorized JavaScript origins. Điền cùng Web client ID vào `NEXT_PUBLIC_GOOGLE_CLIENT_ID` phía client và `GOOGLE_CLIENT_ID` phía Identity trước khi build/chạy. [Cấu hình backend](../server/README.md) · [Hướng dẫn của Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Chạy local

Node.js 26.13.0 LTS, pnpm 12.18.0; kích hoạt Node theo `.nvmrc` ở root trước khi chạy:

```powershell
pnpm install --frozen-lockfile
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
pnpm dev
```

Đặt `API_URL=http://localhost:3300/api` trong `.env.local` theo cấu hình backend mẫu. Backend chạy theo [README server](../server/README.md). `NEXT_PUBLIC_API_URL` là fallback tương thích; không đặt secret trong biến public.

- Trang chủ: http://localhost:3000/vi và /en.
- Cụm trang public Hafo Travel: trang chủ, `/experiences`, `/contacts`, 6 hành trình Việt Nam và 2 trang pháp lý dưới mỗi locale, đầy đủ nội dung/metadata tiếng Việt và tiếng Anh. Nút VI/EN ở header giữ trang, query và hash khi đổi ngôn ngữ. `/trai-nghiem` và `/coaches` dưới mỗi locale redirect 308 trực tiếp tới `/experiences` cùng locale. Xem [cấu trúc và cách sửa](documents/public-site/README.md).
- Demo: /vi/template, /en/template.
- Bản mẫu quản trị du lịch mở tại `/vi/dashboard` hoặc `/en/dashboard`. Yêu cầu tư vấn, trạng thái nội dung và vai trò chỉnh thử được lưu trong phiên của tab trình duyệt. Các số liệu, chuyến đi và giao dịch là dữ liệu mẫu.
- Locale mặc định vi; URL cũ /template điều hướng theo ngôn ngữ đã chọn.
- Theme, font và layout của demo áp dụng cho cả hai locale. Popup nằm trong phạm vi của template đang mount để giữ style và tương tác khi đổi ngôn ngữ.
- Chỉnh màu, font và bo góc của public và demo tại một chỗ. [app/globals.css](app/globals.css)
- `/api/backend/*` proxy tới BFF `/api/*`. Các API hồ sơ và vai trò dùng phiên do Identity cấp. Xem [RBAC](../server/instructions/rbac.md).
- HTTP wrapper nhận envelope `{ statusCode, message, data, processId, duration }` và unwrap thành `{ status, payload: data }`. Validation backend trả `message: string[]` không có field/path; chưa có contract phân trang.

```powershell
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
pnpm build
pnpm test:base
pnpm start
```

Test base dùng Node test runner và fixture HTTP/messages, gồm cấu trúc bản dịch public, ICU/rich text, dữ liệu retreat/trải nghiệm theo locale và hành vi sort/filter/pagination/faceting/selection của bảng demo; không cần database. Dừng server tự bật sau khi kiểm tra. Build không chứng minh giao diện hoặc tương tác browser đúng.

Các dependency trực tiếp được ghim stable trong package/lockfile: Next 16.4.6, React 19.3.1, TanStack Table 9.3.1, DayPicker 10.0.2 (`@daypicker/react`), Zod 4.6.7 và ESLint 10.14.0. Alias lịch v9 đã bỏ. Compiler TypeScript 7.0.2 cài qua `@typescript/native`, còn alias `typescript` trỏ tới `@typescript/typescript6@6.0.2` để Next, ESLint và test loader có programmatic API.

pnpm 12 đặt cấu hình tại `pnpm-workspace.yaml`: `allowBuilds` liệt kê script build được phép; các ngoại lệ tuổi phát hành ghim đúng version được package manager ghi khi cập nhật stable. Ba plugin ESLint mới nhất chưa khai báo peer ESLint 10; `peerDependencyRules.allowedVersions` chỉ cho phép version 10.14.0 cho các plugin này, giữ nguyên các rule. Kiểm tra lint toàn frontend khi thay đổi các ngoại lệ. `shadcn` CLI nằm ở devDependencies.

## Phát triển

Đọc [instructions](documents/instructions.md): cấu trúc feature, schema/API/hook, response/error, i18n/navigation và UI. Đọc thêm instructions backend khi thay đổi contract.

- `app/` giữ routing/layout; `features/<domain>/` sở hữu API, query hooks, schema và component nghiệp vụ khi có yêu cầu.
- `components/ui/` là bộ Base UI chuẩn cho tính năng mới. Component tổng hợp dùng chung đặt trong `components/shared/` khi cần.
- `template/` chứa toàn bộ demo, Radix UI, mock và adapter i18n; code ứng dụng không import demo. ESLint kiểm tra ranh giới này.
- `features/public-site/` chứa giao diện public độc lập. Route nằm trong `app/[locale]/(public)` và assets ở `public/public-site/`. Control dùng chung shadcn/Base UI. CSS và portal public nằm trong phạm vi `.public-site`. Sáu retreat dùng một page component và dữ liệu riêng. Form liên hệ chưa kết nối API.
- `cn` và `useIsMobile` dùng chung tại `lib/utils.ts`, `hooks/use-mobile.ts`.
- Frontend dùng formatter Prettier mặc định; luôn dùng dấu ngoặc cho nhánh/vòng lặp và dòng trống giữa các bước xử lý.

Mở **Tài khoản của tôi** hoặc `/vi/auth/login` (tiếng Anh tại `/en/auth/login`) để đăng nhập, xem hồ sơ hiện tại và đăng xuất. Form trong template vẫn là demo. Đặt `API_URL` cho Next server và `CLIENT_URL` theo origin trình duyệt, bao gồm cổng. Production dùng HTTPS và cookie HttpOnly, Secure, SameSite=Lax. Có thể dùng `NEXT_PUBLIC_SITE_URL` làm origin khi chưa đặt `CLIENT_URL`. Xem [cách cấp tài khoản](../server/instructions/rbac.md).

Để chạy kiểm thử xuyên suốt trên stack thử nghiệm, đặt `AUTH_TEST_ORIGIN`, `AUTH_TEST_EMAIL` và `AUTH_TEST_PASSWORD` trong môi trường của process, rồi chạy `node --test test/auth-e2e.test.mjs` từ `client`. Bài test đăng nhập với tài khoản thử, xoay token, thu hồi refresh token và kiểm tra access JWT đã cấp còn dùng được đến khi hết hạn.

Khi chỉ có BFF và Identity đang chạy, đặt `API_URL` khớp với `GLOBAL_PREFIX` của BFF, build client rồi chạy cùng lệnh với `AUTH_TEST_ORIGIN` để trống. Suite tự mở Next trên một cổng loopback tạm thời và đóng khi hoàn tất.
