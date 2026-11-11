# Cụm trang public Hafo Travel

Hafo Travel dùng Next.js App Router hiện có, với nội dung gợi ý hành trình Việt Nam bằng tiếng Việt và tiếng Anh. Khung tám section và các tương tác được tái sử dụng từ bản clone; nguồn khảo sát nằm trong [TEARDOWN](TEARDOWN.md).

## Chạy và cấu hình

Chạy `pnpm dev` trong `client`, mở `/vi` hoặc `/en`. Locale mặc định là `vi`; nút VI/EN giữ pathname, query và hash.

Thông tin liên hệ hiện được chủ dự án cung cấp: `haodev1307@gmail.com`, `0947055644`. Sửa tập trung trong `features/public-site/site.config.ts`.

Đặt `NEXT_PUBLIC_SITE_URL` thành origin HTTPS chính thức khi triển khai. Khi chưa có, metadata dùng `http://localhost:3000` cho phát triển và chưa xuất canonical/hreflang tuyệt đối. Không suy ra domain từ tên thương hiệu hoặc email.

| Trang                | Đường dẫn sau `/vi` hoặc `/en` |
| -------------------- | ------------------------------ |
| Trang chủ            | `/`                            |
| Trải nghiệm Việt Nam | `/experiences`                 |
| Liên hệ              | `/contacts`                    |
| Hà Giang             | `/kham-pha-ha-giang`           |
| Đà Lạt               | `/nghi-duong-da-lat`           |
| Hội An               | `/trai-nghiem-hoi-an`          |
| Ninh Bình            | `/kham-pha-ninh-binh`          |
| Hạ Long              | `/hanh-trinh-ha-long`          |
| Phú Quốc             | `/nghi-duong-phu-quoc`         |
| Điều khoản           | `/terms-and-conditions`        |
| Bảo mật              | `/privacy-policy`              |

Sáu URL retreat cũ redirect 308 sang URL tương ứng; `/coaches` và `/trai-nghiem` redirect 308 trực tiếp tới `/experiences`, giữ locale và query. Route trải nghiệm đặt tiếng Anh cho cả hai locale, nội dung dịch theo locale; slug sáu hành trình giữ nguyên. Bảng tương thích duy nhất ở `data/legacy-routes.ts`, được `next.config.ts` sử dụng.

## Sửa ở đâu

```text
app/[locale]/(public)/       Route mỏng, layout, metadata và social image
features/public-site/
  components/               Header, footer, card, form, gallery, menu và popup
  sections/                 Tám section trang chủ
  pages/                    Trang public; RetreatPage và LegalPage dùng chung
  data/
    experiences.ts          12 trải nghiệm, ghép bản dịch của request hiện tại
    retreats.ts             Card lấy cùng nguồn dữ liệu với trang chi tiết
    retreat-details.ts      Type và danh mục sáu hành trình
    retreats/               Dữ liệu ảnh và cấu hình từng hành trình
    image-assets.ts         ID ảnh, vai trò section và kích thước
    photo-assets.json       Nguồn, tác giả, license, alt, kích thước, điểm crop
    legacy-routes.ts        URL tương thích cũ
  styles/                   Token, font, layout và tương tác scope public
  metadata.ts               Metadata theo locale và origin cấu hình
  site.config.ts            Nhận diện, liên hệ và đơn vị tiền
messages/vi.json, en.json    Nội dung public trong namespace publicSite
public/hafo/                Logo, icon, ảnh WebP và font có license
```

## Dữ liệu và hành vi

- Giữ nguyên thứ tự tám section, sáu card hành trình, ba nhóm trải nghiệm, grid bốn ảnh của gallery và các control Base UI hiện có.
- Các giá trị trang trải nghiệm và các bước trang chủ dùng cấu hình riêng, render chung `HowWorksItem`; giữ rich text, class compact và data-animation theo từng vị trí.
- Giữ reveal qua IntersectionObserver/Web Animations API, menu Sheet, Popover trải nghiệm, Carousel mobile, scroll snap, sticky navigation và reduced motion. Thông số reveal vẫn ở `publicMotion`.
- Mục chuyên gia demo được thay bằng 12 góc nhìn du lịch Việt Nam. Card và Popover giới thiệu địa điểm, không tạo hồ sơ nhân viên hoặc chứng chỉ.
- Card và detail cùng lấy giá/slug/ảnh từ `retreatDetails`. Giá có kiểu `number | null`; hiện là `null` và hiển thị “Liên hệ tư vấn”. Khi có giá thật, hiển thị VND theo locale, không quy đổi từ giá demo.
- Lịch trình là gợi ý; chưa công bố ngày khởi hành, số chỗ, đánh giá khách hàng hay quan hệ đối tác. Các khối dấu ấn địa phương thay cho nhân sự demo.
- Ảnh trong phần hương vị là cảm hứng ẩm thực Việt Nam, có địa điểm chụp dưới từng ảnh; không được hiểu là thực đơn đã bao gồm. Không gắn ảnh của địa phương khác với chú thích sai địa điểm.
- Form giữ React Hook Form + Zod và Alert báo chưa có dịch vụ gửi. Submit hợp lệ không báo thành công và không có request POST. Điện thoại/email là kênh liên hệ trực tiếp.
- Lựa chọn cookie tiếp tục dùng key `roviet.public.cookie-choice` để giữ lựa chọn trước đó; không cài analytics hoặc marketing cookie.

## Style và ảnh

CSS riêng nằm trong `.public-site`; màu sáng/tối dùng semantic tokens cục bộ và `.hafo-inverse`. Font `Hafo Inter` được phục vụ local, giữ license Inter. Đơn vị fluid là `--hafo-unit`; không sửa font-size của `html`, CSS global hoặc theme admin.

Ảnh nội dung qua `PublicImage`/Next Image có width, height và sizes; ảnh raster dùng tối ưu của Next. Hero dùng hai lớp từ cùng một ảnh thật để giữ cấu trúc nhiều lớp mà không tạo địa điểm giả. Các ảnh nội dung khác được chọn riêng theo vai trò. Nguồn và mapping đầy đủ trong [ASSETS](ASSETS.md); màu, logo và font trong [BRAND](BRAND.md).

Portal Sheet/Popover tiếp tục lấy node hiện tại qua `usePublicPortalContainer`. Không import provider, mock hoặc CSS từ `template/` vào public.

## Kiểm tra

Chạy formatter/lint trong phạm vi sửa, `pnpm test:base` và `pnpm build`. Test public kiểm tra cấu trúc vi/en, ICU/rich text, dữ liệu sáu hành trình/12 trải nghiệm, giá card/detail và asset local. Kết quả browser, route, responsive và giới hạn kiểm tra được ghi riêng trong [QA](QA.md). Build hoặc HTTP 200 không thay thế bằng chứng giao diện/tương tác.
