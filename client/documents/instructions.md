# Hướng dẫn phát triển Roviet Client

## Quy tắc và stack

- Chỉ lên plan và dùng computer use khi được yêu cầu. Hạn chế test không cần thiết; dừng đúng process tự bật để test.
- Giữ thay đổi của người dùng; không tự thêm endpoint, schema nghiệp vụ hoặc auth chưa được yêu cầu.
- Dùng pnpm 10.29.3; version chính xác theo package.json/lockfile. Stack: Next App Router, React, TypeScript strict, Tailwind 4, React Query 5, React Hook Form, Zod 4, next-intl.
- Import Zod từ `zod`, không dùng `zod/v3`. Không cần Axios hoặc store toàn cục mới.
- Đọc source/module tương tự trước khi thêm helper, component hay dependency. Chỉ tạo thư mục khi có code cần dùng.

## Cấu trúc và UI

Dự án dùng thư mục root, không có `src/`; alias `@/*` trỏ về root.

```text
app/[locale]/                  Page/layout theo ngôn ngữ
app/[locale]/(public)/         Cụm trang public: home, coaches, contacts, retreat và pháp lý
app/[locale]/template/         Bộ demo admin, giữ CSS và assets hiện có
app/api/backend/[[...path]]/   Proxy backend, không có locale prefix
components/providers/         QueryProvider dùng chung
components/ui/                Primitive Base UI chuẩn cho tính năng mới
components/shared/            Component tổng hợp dùng chung (tạo khi cần)
template/                     Demo độc lập: màn hình, Radix UI, assets, mock, adapter
features/public-site/         Component/section/page/data/style của giao diện public Hafo Travel
features/<domain>/            API, query hooks, schema và component của feature (tạo khi cần)
hooks/                        Hook dùng chung, gồm useDebounceSearch
lib/                          HTTP, API URL, API error, utils
i18n/                         Routing, request config và navigation
messages/                     vi.json và en.json
proxy.ts                      Locale middleware
```

- Page mỏng; nghiệp vụ nằm trong `features/<domain>`, không đưa nghiệp vụ thật vào dữ liệu demo.
- Cụm public dùng `app/[locale]/(public)` và `features/public-site/`; assets local tại `public/hafo/`. Mọi selector/biến CSS giới hạn trong `.public-site`, font tên `Hafo Inter`, keyframe tiền tố `hafo-`; đơn vị fluid qua `--hafo-unit`, không thay `html` font-size hay `app/globals.css`. Không import template/provider admin vào public. Đọc [tài liệu public](public-site/README.md) khi sửa cụm này.
- Ảnh public dùng ID và vai trò trong `data/image-assets.ts`; `photo-assets.json` lưu nguồn, tác giả, license, alt vi/en, kích thước và crop. Chỉ dùng ảnh thật đã xác minh; giữ caption đúng địa điểm. Không tạo hồ sơ nhân sự hoặc đánh giá khách hàng mẫu.
- Nội dung Hafo Travel là bộ sưu tập gợi ý hành trình Việt Nam; toàn bộ nội dung public và metadata dùng namespace `publicSite` vi/en. Chưa có API liên hệ/booking; form chỉ validation và báo chưa khả dụng, không gửi Webflow hoặc giả lập thành công. Chỉ thêm tích hợp khi có yêu cầu/contract thật.
- Control public tái sử dụng `components/ui` (Button, Field/Input/Textarea, Sheet, Popover, Carousel, Card, Breadcrumb, Separator). Theme qua semantic tokens cục bộ; không đưa lại widget/reset/class Webflow. Popup dùng `portalContainer` của SheetContent/PopoverContent và `usePublicPortalContainer`, chờ root hiện tại mount. Chi tiết retreat dùng chung `pages/retreat-page.tsx`, nội dung ở `data/retreats/`.
- Code ứng dụng (`features`, `components`, `lib`, `hooks`, `i18n` và route ngoài demo) không import `@/template/*`; ESLint kiểm tra ranh giới này. Demo được phép dùng hạ tầng chung của ứng dụng.
- Tham khảo data-table, layout và confirm-dialog tại `template/components`. Khi cần dùng cho nghiệp vụ thật, tách component phù hợp sang `components/shared`, truyền nhãn/dữ liệu qua props và dùng primitive chuẩn; không kéo provider hoặc mock demo vào feature.
- `components.json` sinh primitive Base UI vào `components/ui`; đây là bộ chuẩn cho tính năng mới. Radix chỉ nằm trong `template/components/ui`. Không trộn `render` với `asChild`. Alias `template-react-day-picker` giữ API v9 của lịch demo.
- Chỉ có một `cn` tại `lib/utils.ts` và một `useIsMobile` tại `hooks/use-mobile.ts`; cả demo và ứng dụng dùng chung.
- Giữ semantic tokens, accessible name cho icon-only control, DialogTitle/SheetTitle và vùng cuộn cho modal dài.
- Portal custom lấy container từ `usePortalContainer`, chờ ref của template hiện tại mount; không tìm `template-root` trong document khi render vì node có thể thuộc locale cũ. Title/Description phải nằm trong Content của dialog.
- File/folder kebab-case, component PascalCase; API object `<domain>ApiRequest`, query keys `<domain>QueryKeys`, hooks `useGet...`/`useCreate...`/`useUpdate...`/`useDelete...`.
- Schema `<Name>Schema`, type suy ra từ `z.infer`, có thể dùng hậu tố `Type` nhất quán trong module.
- Feature gom `<domain>.api.ts`, `<domain>.queries.ts`, `<domain>.schema.ts` và `components/`. Schema riêng nằm cạnh feature; chỉ đưa schema ra thư mục dùng chung khi thực sự có nhiều nơi sử dụng. Không tạo module hoặc thư mục rỗng trước nghiệp vụ.
- Trình bày theo `AGENTS.md`, `.editorconfig` và `.prettierrc.json` ở root: luôn có `{}` cho nhánh/vòng lặp, tách các bước xử lý bằng dòng trống, tách khai báo schema/type độc lập. Chạy `pnpm format` hoặc formatter trong phạm vi sửa; ESLint kiểm tra dấu ngoặc và khoảng cách giữa các bước.

## Luồng API và contract

```text
Client component → feature hook → feature API → lib/http.ts
  → /api/backend → Roviet Server /api/v1
Server Component/route handler → feature API → backend trực tiếp
```

Server không dùng React Query hook. Component không gọi fetch trực tiếp cho backend thông thường.

- `.env.local`: `API_URL=http://localhost:4000/api/v1`; fallback `NEXT_PUBLIC_API_URL` chỉ để tương thích. Không đặt secret trong biến public. Thiếu URL backend thì báo lỗi rõ trên server.
- Proxy optional catch-all hỗ trợ cả `/api/backend` và đường dẫn con. Giữ method/query/body/status; chuyển tiếp Accept/Content-Type, response Content-Type/Content-Disposition/Retry-After/Allow. Không forward cookie hoặc Authorization. Backend không kết nối được trả 502.
- `{ baseUrl: "" }` dùng cho route nội bộ Next trên browser. Server phải dùng URL tuyệt đối. URL tuyệt đối bỏ qua baseUrl/proxy.
- `get/post/put/patch/delete` trả `{ status, payload }`. `post/put/patch` nhận body rồi options; `delete` giữ signature `(path, options)` hiện có.
- JSON body tự serialize và gắn Content-Type; FormData giữ nguyên multipart boundary. Options hỗ trợ AbortSignal và tùy chọn fetch; mặc định `cache: "no-store"`.
- Response thường unwrap `data`; pagination map thành `{ items, total, page, limit, totalPages }`. Pagination có data không phải array báo lỗi, không giả thành danh sách rỗng.
- Response không phải envelope giữ nguyên, text giữ chuỗi, body rỗng trả `null`. Binary download chưa có API riêng trong HTTP wrapper.
- HTTP lỗi: `HttpError.status`, `HttpError.payload` giữ nguyên body; 422 là `EntityError`. Lỗi mạng, abort hoặc JSON thành công sai định dạng giữ lỗi gốc. Không tự retry/refresh token khi gặp 401.
- Generic TypeScript không validate runtime; feature API có thể parse payload bằng Zod theo contract thật.

Backend thành công có `{ success: true, message: "OK", data, meta: { timestamp, requestId, path } }`. Danh sách có `data: items` và `meta.pagination`. Lỗi có `{ success: false, message, error: { statusCode, details }, meta }`. Service không tự bọc envelope.

Ví dụ đã có: `GET http://localhost:4000/api/v1` trả `data: "Hello World!"`; `await http.get<string>("/")` nhận `{ status: 200, payload: "Hello World!" }`.

### Lỗi và form

- Dùng `getApiValidationErrors(error)` đọc issue tại `error.details.message`, path dạng chuỗi hoặc array. Map vào field hợp lệ của form; không mặc định mọi lỗi có field errors.
- `getApiErrorCode(error)` đọc code từ envelope/details; feature dịch code đã biết bằng namespace phù hợp.
- `getApiErrorMessage(error, errorsT("UNKNOWN_ERROR"))` cho message tổng quát với fallback đã dịch. Không đưa raw payload/stack hoặc code kỹ thuật ra toast; abort không cần toast.
- Form dùng React Hook Form + Zod; map message validation theo locale. Chặn submit lặp bằng `isPending`, chỉ đóng form sau thành công.
- Quy ước số tiền, dấu thập phân, đơn vị và làm tròn phải theo nghiệp vụ đã xác nhận.

### Ví dụ feature (minh họa, /items chưa tồn tại)

```ts
// features/items/items.schema.ts
import { z } from "zod";

export const ItemSchema = z.object({ id: z.string(), name: z.string() });

export const ItemsSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number().optional(),
});

export type ItemsType = z.infer<typeof ItemsSchema>;
```

```ts
// features/items/items.api.ts
import http from "@/lib/http";
import { ItemsSchema } from "./items.schema";

export const itemsApiRequest = {
  async list(query: { page: number; search?: string }, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(query.page) });
    if (query.search) {
      params.set("search", query.search);
    }

    const res = await http.get<unknown>(`/items?${params}`, { signal });

    return { ...res, payload: ItemsSchema.parse(res.payload) };
  },
};
```

```ts
// features/items/items.queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { itemsApiRequest } from "./items.api";
type Query = Parameters<typeof itemsApiRequest.list>[0];

export const itemQueryKeys = {
  all: ["items"] as const,
  list: (query: Query) => ["items", "list", query] as const,
};

export function useGetItems(query: Query) {
  return useQuery({
    queryKey: itemQueryKeys.list(query),
    queryFn: async ({ signal }) =>
      (await itemsApiRequest.list(query, signal)).payload,
  });
}
```

### State, query và tìm kiếm

- QueryProvider tạo client riêng trên server, giữ client ổn định trên browser; `staleTime: 60_000`, query/mutation không tự retry.
- Query key chứa đầy đủ id/filter/search/sort/pagination ảnh hưởng kết quả. Truyền signal từ query xuống API.
- Detail dùng `enabled` khi id có sẵn; dùng `isLoading` cho request đầu đang chạy, tránh loading vô hạn với query disabled.
- Mutation thành công invalidate list/detail liên quan qua `useQueryClient`; không invalidate toàn bộ ứng dụng tùy tiện.
- `useDebounceSearch(initialValue?, { delay? })` trả `search`, `setSearch`, `debouncedSearch`; mặc định 400 ms, trim keyword. Input dùng search, API dùng debouncedSearch; reset trang khi keyword hiệu lực thay đổi.
- Hook `useTableSearch` của demo phục vụ filter URL/dữ liệu local, không cần thay bằng debounce API.
- Server state dùng React Query, form state dùng React Hook Form, UI state dùng React/context. Refetch/search không tự đổi ID đang chọn.

## i18n và navigation

- `next-intl` dùng `vi/en`, default `vi`, prefix luôn có trong URL: `/vi`, `/en`, `/vi/template/users`.
- URL thiếu prefix được locale middleware điều hướng theo cookie NEXT_LOCALE/Accept-Language, fallback vi. URL đã có locale quyết định ngôn ngữ. API, `_next` và asset có phần mở rộng không bị middleware xử lý.
- `[locale]/layout` validate locale, gắn `html lang`, NextIntlClientProvider và QueryProvider. Request config đặt timeZone Asia/Ho_Chi_Minh.
- Client dùng `useTranslations("<domain>")`; server dùng `getTranslations`. Message key ổn định theo ý nghĩa, thêm đồng thời vi/en; ICU cho biến/plural, escape dấu nháy theo cú pháp ICU.
- Link/useRouter/usePathname/redirect cho route nội bộ import từ `@/i18n/navigation`. usePathname trả path không có locale để menu active giữ đúng. useSearchParams/notFound vẫn dùng next/navigation.
- Language switch giữ pathname/query/hash khi đổi locale, không dùng cookie template-locale.
- Public có nút VI/EN tại header cho desktop/mobile, đổi bằng navigation của `next-intl`. Nội dung section, footer, pháp lý và validation dùng key có nghĩa trong `publicSite`; đoạn có định dạng dùng `t.rich`, không ghép các mảnh câu theo tiếng Anh.
- Dữ liệu public dịch được nằm trong `publicSite.experienceProfiles`, `retreatCards` và `retreatContent`. Các getter `getExperiences(t)`, `getRetreats(t)` và `getRetreatPage(slug, t)` ghép nội dung của request hiện tại với ảnh, slug, dấu ấn địa phương và giá dùng chung; không sửa object messages hay lưu dữ liệu đã dịch ở module scope. `data/localized-content.ts` suy ra kiểu từ messages tiếng Anh; test kiểm tra cấu trúc lồng nhau và độ dài array vi/en.
- Giá hành trình là `number | null`; card và detail cùng lấy từ `retreatDetails`. Hiện chưa có giá thật nên dùng `null` và nhãn liên hệ; khi có giá dùng currency VND trong `site.config.ts`, không quy đổi giá demo. Lịch trình là gợi ý trong messages. Metadata dùng `createPublicMetadata`; cấu hình `NEXT_PUBLIC_SITE_URL` khi triển khai để tạo canonical/hreflang đúng origin. URL cũ chỉ nằm trong `data/legacy-routes.ts` và redirect 308 qua `next.config.ts`.
- Route retreat sinh đủ cặp `{ locale, retreatSlug }` trong `generateStaticParams`; public layout và retreat page gọi `setRequestLocale` trước khi dùng i18n để hỗ trợ prerender. Không chỉ sinh slug khi route còn segment `[locale]`.
- Demo giữ `useI18n`/`Trans` như adapter tương thích: ánh xạ nhãn cũ qua `source-message-keys.json` sang namespace `template`; nội dung dữ liệu không biết giữ nguyên. Bộ messages chỉ có một nguồn tại `messages/`.
- Key đã chuyển là định danh cố định; thay wording bằng sửa value. Feature mới dùng key trực tiếp, không mở rộng pattern source-text của demo. Adapter giữ dateLocale và định dạng số/ngày/tiền; mặc định currency USD như demo, nghiệp vụ thật truyền currency rõ ràng.
- Theme/font/direction và CSS scope demo giữ nguyên, không đưa thêm theme provider toàn ứng dụng.
- Cookie `template-*` dùng `path=/` để đọc được trên cả `/vi/template` và `/en/template`; reset xóa cả path `/` và path cũ `/template`.

## Auth và database

Chưa có auth thật, session, cookie/token refresh hay quyền. Login demo chỉ mô phỏng. Không xem proxy hoặc ẩn nút là cơ chế authorization. Khi triển khai auth cần xác định contract mới; ưu tiên cookie HTTP-only, không lưu token localStorage. Backend hiện không có database model, không cần PostgreSQL để chạy endpoint gốc.

## Kiểm tra và cập nhật tài liệu

- Chỉ doc: rà nội dung/link/diff. Code: lint phạm vi ảnh hưởng; API/type/route/dependency cần build và kiểm tra tập trung tương ứng.
- `pnpm lint`, `pnpm build`, `pnpm test:base` là các lệnh kiểm tra nền tảng. `pnpm format`/`pnpm format:check` dùng Prettier. Test base dùng Node test runner và TypeScript đã cài, gồm kiểm tra public i18n về cấu trúc messages, ICU/rich text và dữ liệu theo locale; không thêm test framework.
- Smoke bằng HTTP backend/proxy và route locale; test pagination/validation bằng fixture vì chưa có endpoint nghiệp vụ.
- Không xem build hoặc HTTP SSR là bằng chứng tương tác/visual browser. Không dùng Computer Use khi chưa được yêu cầu.
- Dừng process tự bật để kiểm tra; không chạy lại kiểm tra đã đạt nếu không có thay đổi liên quan. Commit lockfile cùng dependency.
- Contract/API/i18n thay đổi phải cập nhật cả instructions FE/BE nếu liên quan; README chứa lệnh chạy, instructions chứa convention. Không tự ghi memory theo task nếu chưa được yêu cầu.
