# Roviet Client

Next.js App Router, React Query, Zod 4, next-intl và bộ UI demo. Dùng cấu trúc root, alias `@/*`, không có `src/`.

## Chạy local

Node.js 22.12+, pnpm 10.29.3:

```powershell
pnpm install --frozen-lockfile
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
pnpm dev
```

Đặt `API_URL=http://localhost:4000/api/v1` trong `.env.local`. Backend chạy theo [README server](../roviet-server/README.md). `NEXT_PUBLIC_API_URL` là fallback tương thích; không đặt secret trong biến public.

- Trang chủ: http://localhost:3000/vi và /en.
- Cụm trang public Hafo Travel: trang chủ, `/trai-nghiem`, `/contacts`, 6 hành trình Việt Nam và 2 trang pháp lý dưới mỗi locale, đầy đủ nội dung/metadata tiếng Việt và tiếng Anh. Nút VI/EN ở header giữ trang, query và hash khi đổi ngôn ngữ. Xem [cấu trúc và cách sửa](documents/public-site/README.md).
- Demo: /vi/template, /en/template.
- Locale mặc định vi; URL cũ /template điều hướng theo ngôn ngữ đã chọn.
- Theme/font/layout của demo dùng chung giữa hai locale; popup nằm trong scope của template đang mount để giữ style và tương tác khi đổi ngôn ngữ.
- `GET /api/backend` proxy tới backend gốc, trả envelope chứa `data: "Hello World!"`.
- HTTP wrapper unwrap thành `{ status: 200, payload: "Hello World!" }`.

```powershell
pnpm lint
pnpm format
pnpm format:check
pnpm build
pnpm test:base
pnpm start
```

Test base dùng Node test runner và fixture HTTP/messages, gồm cấu trúc bản dịch public, ICU/rich text và dữ liệu retreat/trải nghiệm theo locale; không cần database. Dừng server tự bật sau khi kiểm tra. Build không chứng minh giao diện hoặc tương tác browser đúng.

## Phát triển

Đọc [instructions](documents/instructions.md): cấu trúc feature, schema/API/hook, response/error, i18n/navigation và UI. Đọc thêm instructions backend khi thay đổi contract.

- `app/` giữ routing/layout; `features/<domain>/` sở hữu API, query hooks, schema và component nghiệp vụ khi có yêu cầu.
- `components/ui/` là bộ Base UI chuẩn cho tính năng mới. Component tổng hợp dùng chung đặt trong `components/shared/` khi cần.
- `template/` chứa toàn bộ demo, Radix UI, mock và adapter i18n; code ứng dụng không import demo. ESLint kiểm tra ranh giới này.
- `features/public-site/` chứa giao diện public độc lập; routes nằm trong `app/[locale]/(public)`, assets ở `public/hafo/`. Control dùng chung shadcn/Base UI; CSS, semantic tokens và portal được scope riêng để giữ style admin. Sáu retreat dùng một page component và dữ liệu riêng. Form liên hệ chưa kết nối API.
- `cn` và `useIsMobile` dùng chung tại `lib/utils.ts`, `hooks/use-mobile.ts`.
- Formatter dùng `.prettierrc.json` và `.editorconfig` ở root; luôn dùng dấu ngoặc cho nhánh/vòng lặp và dòng trống giữa các bước xử lý.

Demo chưa có auth thật. Không đưa mock submit hoặc nghiệp vụ company của TS68 vào tính năng mới.
