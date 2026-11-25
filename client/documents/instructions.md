# Hướng dẫn phát triển Hafo Travel Client

## Quy tắc và stack

- Chỉ lên plan và dùng computer use khi được yêu cầu. Hạn chế test không cần thiết; dừng đúng process tự bật để test.
- Giữ thay đổi của người dùng; không tự thêm endpoint, schema nghiệp vụ hoặc auth chưa được yêu cầu.
- Dùng Node.js 26.13.0 LTS và pnpm 12.18.0; version chính xác theo `.nvmrc`, package.json/lockfile. Stack: Next 16.4, React 19.3, TypeScript strict, Tailwind 4, React Query 5, React Hook Form, Zod 4, next-intl. Dependency trực tiếp ghim stable; cấu hình pnpm nằm tại `pnpm-workspace.yaml`.
- TypeScript 7.0.2 chạy CLI qua alias `@typescript/native`; alias `typescript` trỏ tới `@typescript/typescript6@6.0.2` cho API mà Next/ESLint/test loader và editor còn cần. `pnpm typecheck` dùng compiler 7, không import programmatic API từ compiler native.
- Import Zod từ `zod`, không dùng `zod/v3`. Không cần Axios hoặc store toàn cục mới.
- Đọc source/module tương tự trước khi thêm helper, component hay dependency. Chỉ tạo thư mục khi có code cần dùng.

## Cấu trúc và UI

Dự án dùng thư mục root, không có `src/`; alias `@/*` trỏ về root.

```text
app/globals.css                Tailwind và theme của public và demo admin
app/[locale]/                  Page/layout theo ngôn ngữ
app/[locale]/(public)/         Cụm trang public: home, experiences, contacts, retreat và pháp lý
app/[locale]/template/         Layout của demo admin
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
- Input một dòng và Button mặc định cao 36px (`h-9`). Form dùng kích thước từ `components/ui`; chỉ chọn biến thể kích thước khi thiết kế yêu cầu.
- `app/globals.css` là nơi chỉnh màu, font và bo góc của public và demo admin. Theme áp dụng theo `.public-site` và `.template-scope`.
- Cụm public dùng `app/[locale]/(public)` và `features/public-site/`. Assets local tại `public/public-site/`. Mọi selector và biến CSS riêng của public giới hạn trong `.public-site`, dùng font `Public Inter` và tiền tố `site-` cho tên kỹ thuật. Đơn vị fluid `--site-unit` áp dụng trong `.public-site` để giữ kích thước chữ mặc định của `html`. Không import template/provider admin vào public. Đọc [tài liệu public](public-site/README.md) khi sửa cụm này.
- Ảnh public dùng ID và vai trò trong `data/image-assets.ts`; `photo-assets.json` lưu nguồn, tác giả, license, alt vi/en, kích thước và crop. Chỉ dùng ảnh thật đã xác minh; giữ caption đúng địa điểm. Không tạo hồ sơ nhân sự hoặc đánh giá khách hàng mẫu.
- Nội dung Hafo Travel là bộ sưu tập gợi ý hành trình Việt Nam; toàn bộ nội dung public và metadata dùng namespace `publicSite` vi/en. Chưa có API liên hệ/booking; form chỉ validation và báo chưa khả dụng, không gửi Webflow hoặc giả lập thành công. Chỉ thêm tích hợp khi có yêu cầu/contract thật.
- Control public tái sử dụng `components/ui` (Button, Field/Input/Textarea, Sheet, Popover, Carousel, Card, Breadcrumb, Separator). Theme qua semantic tokens cục bộ; không đưa lại widget/reset/class Webflow. Popup dùng `portalContainer` của SheetContent/PopoverContent và `usePublicPortalContainer`, chờ root hiện tại mount. Chi tiết retreat dùng chung `pages/retreat-page.tsx`, nội dung ở `data/retreats/`.
- Code ứng dụng (`features`, `components`, `lib`, `hooks`, `i18n` và route ngoài demo) không import `@/template/*`; ESLint kiểm tra ranh giới này. Demo được phép dùng hạ tầng chung của ứng dụng.
- Tham khảo data-table, layout và confirm-dialog tại `template/components`. Khi cần dùng cho nghiệp vụ thật, tách component phù hợp sang `components/shared`, truyền nhãn/dữ liệu qua props và dùng primitive chuẩn; không kéo provider hoặc mock demo vào feature.
- `components.json` sinh primitive Base UI vào `components/ui`; đây là bộ chuẩn cho tính năng mới. Radix chỉ nằm trong `template/components/ui`. Không trộn `render` với `asChild`. Cả hai bộ lịch dùng DayPicker 10 từ `@daypicker/react`; không dùng lại alias lịch v9 hoặc classNames `table`, dùng `month_grid`.
- Bảng demo dùng TanStack Table 9: `useTable`, `templateTableFeatures` và type theo feature tại `template/components/data-table/table-features.ts`. Row model/registry nằm trong feature; đọc state qua `table.state`, không dùng `useReactTable`, `getState()` hoặc global declaration merge kiểu v8. Các generic dữ liệu bảng giới hạn `TData extends object`.
- Chỉ có một `cn` tại `lib/utils.ts` và một `useIsMobile` tại `hooks/use-mobile.ts`; cả demo và ứng dụng dùng chung.
- Giữ semantic tokens, accessible name cho icon-only control, DialogTitle/SheetTitle và vùng cuộn cho modal dài.
- Portal custom lấy container từ `usePortalContainer`, chờ ref của template hiện tại mount; không tìm `template-root` trong document khi render vì node có thể thuộc locale cũ. Title/Description phải nằm trong Content của dialog.
- File/folder kebab-case, component PascalCase; API object `<domain>ApiRequest`, query keys `<domain>QueryKeys`, hooks `useGet...`/`useCreate...`/`useUpdate...`/`useDelete...`.
- Schema `<Name>Schema`, type suy ra từ `z.infer`, có thể dùng hậu tố `Type` nhất quán trong module.
- Feature gom `<domain>.api.ts`, `<domain>.queries.ts`, `<domain>.schema.ts` và `components/`. Schema riêng nằm cạnh feature; chỉ đưa schema ra thư mục dùng chung khi thực sự có nhiều nơi sử dụng. Không tạo module hoặc thư mục rỗng trước nghiệp vụ.
- Trình bày theo `AGENTS.md` và formatter hiện có: luôn có `{}` cho nhánh/vòng lặp, tách các bước xử lý bằng dòng trống, tách khai báo schema/type độc lập. Frontend dùng Prettier mặc định. Chạy formatter trong phạm vi sửa; ESLint kiểm tra dấu ngoặc và khoảng cách giữa các bước.

## Mẫu module gọi API

Đối chiếu [mã mẫu Vai trò](#ví-dụ-module-vai-trò) khi thêm hoặc sửa feature gọi API. Dùng contract của endpoint đang triển khai để xác định schema và query key.

- `page.tsx` gắn màn hình vào route. `features/<domain>/components/` giữ trạng thái tương tác, form, thông báo và gọi hook của feature.
- `<domain>.schema.ts` mô tả request, response và dữ liệu form khi cần. Kiểu dữ liệu được suy ra từ schema. Form kiểm tra dữ liệu nhập, API kiểm tra `payload` bằng schema nếu cần xác thực response ở runtime.
- `<domain>.api.ts` khai báo một object `<domain>ApiRequest` với method theo nghiệp vụ như `list`, `detail`, `create`, `update`. Method tập trung HTTP verb, path, query params và body, rồi gọi `@/lib/http`. Giữ tham số và kiểu trả về theo contract đã đối chiếu ở BFF.
- `<domain>.queries.ts` khai báo query key và các hook đọc/ghi. Query trả dữ liệu cho component, truyền `signal` xuống API và đưa các tham số ảnh hưởng kết quả vào key. Mutation làm mới đúng danh sách hoặc chi tiết bị ảnh hưởng. Component xử lý toast và đóng form sau khi thao tác thành công.
- Kiểm tra HTTP verb, path, quyền, envelope và cấu trúc dữ liệu ở BFF trước khi viết API/schema. Chọn `useQuery` cho danh sách thông thường và `useInfiniteQuery` khi giao diện cần tải thêm và endpoint có contract phân trang. Session và xử lý 401 thuộc tầng tích hợp xác thực dùng chung.

## Luồng API và contract

```text
Client component → feature hook → feature API → lib/http.ts
  → /api/backend → BFF NestJS /api
Server Component/route handler → feature API → backend trực tiếp
```

Server không dùng React Query hook. Component không gọi fetch trực tiếp cho backend thông thường.

- `.env.local`: `API_URL=http://localhost:3300/api` theo cấu hình backend mẫu; fallback `NEXT_PUBLIC_API_URL` chỉ để tương thích. Không đặt secret trong biến public. Thiếu URL backend thì báo lỗi rõ trên server.
- `CLIENT_URL` là địa chỉ gốc của frontend, ví dụ `http://localhost:3000`. Next.js đối chiếu origin này với header `Origin` khi trình duyệt gửi yêu cầu ghi.
- Proxy optional catch-all hỗ trợ cả `/api/backend` và đường dẫn con. Giữ method/query/body/status; chuyển tiếp Accept/Content-Type, response Content-Type/Content-Disposition/Retry-After/Allow. Proxy đọc đúng access cookie HttpOnly và tự tạo bearer header cho BFF. Kiểm tra origin trước thao tác ghi. Nhóm `/auth` chỉ đi qua route chuyên trách `/api/auth/[action]`. Backend không kết nối được trả 502.
- `{ baseUrl: "" }` dùng cho route nội bộ Next trên browser. Server phải dùng URL tuyệt đối. URL tuyệt đối bỏ qua baseUrl/proxy.
- `get/post/put/patch/delete` trả `{ status, payload }`. `post/put/patch` nhận body rồi options; `delete` giữ signature `(path, options)` hiện có.
- JSON body tự serialize và gắn Content-Type; FormData giữ nguyên multipart boundary. Options hỗ trợ AbortSignal và tùy chọn fetch; mặc định `cache: "no-store"`.
- Response BFF nhận diện bằng `statusCode` và `message` dạng chuỗi hoặc mảng chuỗi; wrapper unwrap `data`. Backend chưa có contract phân trang; không tự chuyển đổi pagination, feature parse theo contract của endpoint khi bổ sung.
- Response không phải envelope giữ nguyên, text giữ chuỗi, body rỗng trả `null`. Binary download chưa có API riêng trong HTTP wrapper.
- HTTP lỗi: `HttpError.status`, `HttpError.payload` giữ nguyên body; 422 là `EntityError`. Lỗi mạng, abort hoặc JSON thành công sai định dạng giữ lỗi gốc. Đối với query cần phiên trên browser, dùng `http.getAuthenticated` với path BFF bắt đầu bằng `/`. Khi gặp 401, helper đồng bộ refresh rồi đọc lại tối đa một lần. Lệnh ghi và request thông thường trả nguyên lỗi cho caller.
- Generic TypeScript không validate runtime; feature API có thể parse payload bằng Zod theo contract thật.

Backend BFF trả `{ statusCode, message, data, code, processId, duration }` khi thành công, với `code: Success`. `message` là `string | string[]`; HTTP status lấy từ response HTTP. RPC nội bộ dùng gRPC/protobuf; BFF map về dữ liệu HTTP và bọc `ResponseDto` một lần. Frontend tiếp tục dùng HTTP.

BFF có các route hồ sơ, gán role và CRUD role theo [RBAC backend](../../server/instructions/rbac.md). BFF kiểm tra chữ ký và quyền được cấp trong access JWT. `GET /user/me` lấy hồ sơ hiện tại từ Identity và trả quyền hiệu lực của JWT ở `data.permissions`. Tạo hồ sơ dùng tên, email và đúng một role.

Các action đăng ký, xác thực email, quên/đặt lại mật khẩu và Google dùng cùng Next handler `/api/auth/[action]`. Form ở `features/auth`, route ở `/[locale]/auth`, dữ liệu đi qua schema, API object và React Query. Hai màn hình nhận liên kết đọc token từ fragment khi submit. Google Identity Services trả credential cho mutation; route Next ghi cookie phiên sau khi Identity xác minh.

### Lỗi và form

- Validation backend hiện trả HTTP 400 với `message: string[]`, không có field/path; không đoán field từ nội dung chuỗi. `getApiValidationErrors(error)` chỉ map khi HTTP 400/422 thực sự có issue `{ path, message }` trong `payload.message`; contract hiện tại trả `{}`. Map issue có cấu trúc vào field hợp lệ của form khi endpoint hỗ trợ.
- `getApiErrorCode(error)` đọc code từ `payload.code`, `payload.message` (chuỗi hoặc mảng) và issue có cấu trúc; feature dịch code đã biết bằng namespace phù hợp.
- `getApiErrorMessage(error, errorsT("UNKNOWN_ERROR"))` cho message tổng quát với fallback đã dịch. Không đưa raw payload/stack hoặc code kỹ thuật ra toast; abort không cần toast.
- Form dùng React Hook Form + Zod; map message validation theo locale. Chặn submit lặp bằng `isPending`, chỉ đóng form sau thành công.
- Quy ước số tiền, dấu thập phân, đơn vị và làm tròn phải theo nghiệp vụ đã xác nhận.

### Ví dụ module Vai trò

Mã tham chiếu dựa trên `GET /role`, `GET /role/:id` và `PUT /role/:id` trong [controller BFF](../../server/apps/bff/src/app/modules/role/controllers/role.controller.ts) và [hợp đồng RBAC](../../server/instructions/rbac.md#http-api).

| File | Mẫu triển khai |
| --- | --- |
| [roles.schema.ts](examples/roles/roles.schema.ts) | Schema cho danh sách, chi tiết và body cập nhật. BFF kiểm tra permission theo danh mục hiện hành. |
| [roles.api.ts](examples/roles/roles.api.ts) | API object gọi `http`, truyền `signal` và kiểm tra `payload` đã bóc từ envelope. |
| [roles.queries.ts](examples/roles/roles.queries.ts) | Query key, điều kiện tải chi tiết và làm mới danh sách cùng đúng ID sau cập nhật. |

Luồng **mở danh sách → chọn vai trò → lưu chỉnh sửa** đi qua các lớp sau:

1. **Mở danh sách.** Route `page.tsx` render màn hình trong `features/roles/components/`. Màn hình gọi `useGetRoles(canReadList)`. Hook dùng key `['roles', 'list']`, gọi `rolesApiRequest.list(signal)` và trả mảng lấy từ `payload`. Màn hình hiển thị trạng thái tải, lỗi hoặc danh sách rỗng theo kết quả query.
2. **Chọn vai trò.** Màn hình giữ `selectedId` và gọi `useGetRole(selectedId, canReadDetail)`. Chi tiết có cache riêng theo ID và chỉ tải khi có ID cùng quyền đọc chi tiết. Khi mở form sửa, khởi tạo form từ dữ liệu của ID đang chọn và dùng `zodResolver(UpdateRoleBodySchema)` để kiểm tra dữ liệu nhập.
3. **Lưu chỉnh sửa.** Component dùng `useUpdateRole()` và gọi `mutateAsync({ id, body })` trong `handleSubmit`. API gọi `PUT /role/:id`. Sau thành công, hook làm mới cache danh sách và chi tiết của ID vừa sửa, component báo thành công và đóng form. Trong lúc lưu, dùng `isPending` để khóa nút lưu. Khi lỗi, giữ form mở và hiển thị thông báo đã dịch.

`canReadList`, `canReadDetail` và quyền sửa lấy từ session theo quyền `role.get_all`, `role.get_by_id` và `role.update`. BFF xác thực và kiểm tra quyền cho từng request.

Khi áp dụng cho feature khác, đặt mã triển khai tại `client/features/<domain>/` và đối chiếu endpoint, DTO cùng response của feature đó trước khi chọn schema, hook và tham số của query key. Ví dụ, danh sách có bộ lọc gửi lên server cần đưa bộ lọc vào key. Màn hình chỉ đọc dùng query, màn hình có thao tác ghi dùng thêm mutation và xác định dữ liệu cần làm mới.

Mẫu nằm trong thư mục tài liệu. Để dùng trên một route thật, module cần lớp HTTP bóc đúng envelope BFF và phiên đăng nhập được truyền qua proxy.

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
- Route trang trải nghiệm dùng thư mục/URL tiếng Anh `experiences` cho cả hai locale: `/vi/experiences`, `/en/experiences`. Nội dung vẫn dịch theo locale. `/trai-nghiem` và `/coaches` redirect 308 trực tiếp tới `/experiences`, giữ locale/query; slug các hành trình giữ nguyên.
- Language switch giữ pathname/query/hash khi đổi locale, không dùng cookie template-locale.
- Public có nút VI/EN tại header cho desktop/mobile, đổi bằng navigation của `next-intl`. Nội dung section, footer, pháp lý và validation dùng key có nghĩa trong `publicSite`; đoạn có định dạng dùng `t.rich`, không ghép các mảnh câu theo tiếng Anh.
- Dữ liệu public dịch được nằm trong `publicSite.experienceProfiles`, `retreatCards` và `retreatContent`. Các getter `getExperiences(t)`, `getRetreats(t)` và `getRetreatPage(slug, t)` ghép nội dung của request hiện tại với ảnh, slug, dấu ấn địa phương và giá dùng chung; không sửa object messages hay lưu dữ liệu đã dịch ở module scope. `data/localized-content.ts` suy ra kiểu từ messages tiếng Anh; test kiểm tra cấu trúc lồng nhau và độ dài array vi/en.
- Giá hành trình là `number | null`; card và detail cùng lấy từ `retreatDetails`. Hiện chưa có giá thật nên dùng `null` và nhãn liên hệ; khi có giá dùng currency VND trong `site.config.ts`, không quy đổi giá demo. Lịch trình là gợi ý trong messages. Metadata dùng `createPublicMetadata`; cấu hình `NEXT_PUBLIC_SITE_URL` khi triển khai để tạo canonical/hreflang đúng origin. URL cũ chỉ nằm trong `data/legacy-routes.ts` và redirect 308 qua `next.config.ts`.
- Route retreat sinh đủ cặp `{ locale, retreatSlug }` trong `generateStaticParams`; public layout và retreat page gọi `setRequestLocale` trước khi dùng i18n để hỗ trợ prerender. Không chỉ sinh slug khi route còn segment `[locale]`.
- Demo giữ `useI18n`/`Trans` như adapter tương thích: ánh xạ nhãn cũ qua `source-message-keys.json` sang namespace `template`; nội dung dữ liệu không biết giữ nguyên. Bộ messages chỉ có một nguồn tại `messages/`.
- Key đã chuyển là định danh cố định; thay wording bằng sửa value. Feature mới dùng key trực tiếp, không mở rộng pattern source-text của demo. Adapter giữ dateLocale và định dạng số/ngày/tiền; mặc định currency USD như demo, nghiệp vụ thật truyền currency rõ ràng.
- Provider của demo quản lý theme, font và hướng đọc trong layout demo. Bảng màu sáng và tối dùng `.template-scope.light` và `.template-scope.dark` trong `app/globals.css`.
- Cookie `template-*` dùng `path=/` để đọc được trên cả `/vi/template` và `/en/template`; reset xóa cả path `/` và path cũ `/template`.

## Auth và database

Login trong template là mô phỏng. Luồng thực tế ở `features/auth` và `/[locale]/auth/login`. Next giữ access JWT và refresh JWT trong hai cookie HttpOnly. Proxy gửi access JWT dưới dạng Bearer đến BFF. Route refresh và logout chuyển giá trị refresh cookie đến Identity qua BFF. Route auth trả trạng thái cho browser và giữ credential ngoài JSON. Xem [cấu hình và kiểm thử](../README.md).

## Kiểm tra và cập nhật tài liệu

- Chỉ doc: rà nội dung/link/diff. Code: lint phạm vi ảnh hưởng; API/type/route/dependency cần build và kiểm tra tập trung tương ứng.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:base` là các lệnh kiểm tra nền tảng. `pnpm format`/`pnpm format:check` dùng Prettier. Test base dùng Node test runner và API TypeScript 6 đã cài, gồm public i18n và hồi quy bảng demo v9; không thêm test framework. Ngoại lệ peer của ba plugin ESLint 10 chỉ cho phép version cụ thể trong `pnpm-workspace.yaml`, không tắt rule khi nâng dependency.
- Smoke bằng HTTP backend/proxy và route locale khi cần; test transport/validation bằng fixture contract BFF, không cần gọi MongoDB thật cho unit test.
- Không xem build hoặc HTTP SSR là bằng chứng tương tác/visual browser. Không dùng Computer Use khi chưa được yêu cầu.
- Dừng process tự bật để kiểm tra; không chạy lại kiểm tra đã đạt nếu không có thay đổi liên quan. Commit lockfile cùng dependency.
- Contract/API/i18n thay đổi phải cập nhật cả instructions FE/BE nếu liên quan; README chứa lệnh chạy, instructions chứa convention. Không tự ghi memory theo task nếu chưa được yêu cầu.
