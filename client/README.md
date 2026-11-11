# Hafo Travel Client

Next.js App Router, React Query, Zod 4, next-intl và bộ UI demo. Dùng cấu trúc root, alias `@/*`, không có `src/`.

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
- Locale mặc định vi; URL cũ /template điều hướng theo ngôn ngữ đã chọn.
- Theme/font/layout của demo dùng chung giữa hai locale; popup nằm trong scope của template đang mount để giữ style và tương tác khi đổi ngôn ngữ.
- `/api/backend/*` proxy tới BFF `/api/*`; endpoint hiện có là `POST /authorizer/login` và `POST /user`. Chưa có endpoint gốc `GET /`.
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
- `features/public-site/` chứa giao diện public độc lập; routes nằm trong `app/[locale]/(public)`, assets ở `public/hafo/`. Control dùng chung shadcn/Base UI; CSS, semantic tokens và portal được scope riêng để giữ style admin. Sáu retreat dùng một page component và dữ liệu riêng. Form liên hệ chưa kết nối API.
- `cn` và `useIsMobile` dùng chung tại `lib/utils.ts`, `hooks/use-mobile.ts`.
- Frontend dùng formatter Prettier mặc định; luôn dùng dấu ngoặc cho nhánh/vòng lặp và dòng trống giữa các bước xử lý.

Frontend chưa tích hợp auth thật; backend đã có Keycloak và user/role MongoDB. Proxy hiện không forward cookie/Authorization. Không đưa mock submit hoặc nghiệp vụ company của TS68 vào tính năng mới.
