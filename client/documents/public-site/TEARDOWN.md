# Teardown: Vita Travel

Bản public hiện tại đã rebrand thành **Hafo Travel**. Tài liệu này giữ nguyên nguồn đo và giới hạn của bản clone để truy xuất lịch sử; nhận diện, route và ảnh đang dùng được mô tả trong [README](README.md), [BRAND](BRAND.md) và [ASSETS](ASSETS.md). Asset nguyên mẫu đã chuyển ra khỏi public.

Tài liệu này ghi nhận nguyên mẫu và bản clone ban đầu. Control hiện tại đã chuẩn hóa sang shadcn/Base UI, sáu retreat dùng chung layout/data và các asset không dùng đã được dọn; xem [README](README.md) và [QA](QA.md) cho kiến trúc/kết quả hiện tại.

Nguồn: https://vita-travel.webflow.io/ — khảo sát ngày 2026-11-07 tại 1440, 768 và 390 px, chiều cao viewport 1000 px, DPR 1.

`CONFIRMED` chỉ giá trị đọc trực tiếp từ DOM/CSS/runtime; `OBSERVED` chỉ hành vi quan sát qua browser. Tệp khảo sát chi tiết nằm ở `output/vita-travel.webflow.io/` tại root workspace, gồm `surface-map.json`, `motion.json`, `tokens-*.json`, `measurements-*.json`, `specs/` và `qa/`.

## Stack và bề mặt

| Thành phần                              | Nguồn đo                                       | Tái hiện                                                               |
| --------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Webflow và jQuery                       | CONFIRMED: document/scripts                    | Component React trong Next.js của dự án                                |
| GSAP 3.14.1, SplitText, ScrollTrigger   | CONFIRMED: runtime                             | IntersectionObserver và Web Animations API; thông số cơ bản giữ nguyên |
| ScrollSmoother smooth 1.2, effects true | CONFIRMED: source runtime                      | Cuộn native, không nạp ScrollSmoother                                  |
| Slick mobile                            | CONFIRMED: source runtime                      | Scroll snap và nút chọn ảnh                                            |
| Inter, weight 300/400/500/600/700       | CONFIRMED: computed styles và Google Fonts CSS | Font local, đổi tên family thành Vita Inter để cô lập                  |
| Canvas/WebGL/WebGPU/video               | CONFIRMED: không có trên các bề mặt khảo sát   | Không cần shader track                                                 |

Probe có fingerprint `lenis`, nhưng đối chiếu source xác nhận phần cuộn của trang dùng ScrollSmoother. Không dựa vào fingerprint này để cài thêm Lenis.

## Design system

| Vai trò                      | Giá trị                                               |
| ---------------------------- | ----------------------------------------------------- |
| Nền                          | `#091b20`                                             |
| Green                        | `#0d2e37`                                             |
| Accent                       | `#fb9826`                                             |
| Màu nhấn khi focus/click     | `#fa8805`                                             |
| Chữ                          | White và white opacity 60% / 50% / 40% / 20%          |
| H1 tại 1440                  | 190 px, weight 600, line-height 100%, tracking -10 px |
| H2 tại 1440                  | 60 px, weight 600; responsive theo class nguyên mẫu   |
| Thân bài                     | 16–28 px tùy cấp; Inter                               |
| Lề container desktop         | 40 px                                                 |
| Khoảng cách section phổ biến | 80 px                                                 |
| Bán kính nút                 | 80 px                                                 |

CONFIRMED: kích thước dùng rem dựa trên `html` fluid của nguyên mẫu: `16 * width / 1440`, đổi sang `16 * width / 375` khi width <= 479; từ 1440 dùng 16 px, từ 1920 dùng `16 * width / 1920`. Desktop height <= 800 dùng hệ số 14 thay cho 16. Bản tích hợp dùng biến `--vita-unit` riêng để có cùng kết quả mà không sửa font-size toàn ứng dụng.

## Section và tương tác

| Thứ tự | Section            | Track                       | Hành vi                                        |
| ------ | ------------------ | --------------------------- | ---------------------------------------------- |
| 1      | Hero Travel        | DOM + ảnh WebP nhiều lớp    | Load reveal, CTA tới retreat                   |
| 2      | Retreat categories | DOM + WebP                  | Reveal; trượt ngang trên mobile                |
| 3      | About              | DOM + ảnh                   | Reveal nội dung và số liệu                     |
| 4      | Featured retreats  | DOM + 6 card                | Link tới 6 route chi tiết                      |
| 5      | Combine Retreat    | DOM + background responsive | Reveal; 4 bước hiển thị theo grid              |
| 6      | Destination        | DOM + SVG/background        | Bản đồ desktop, ảnh khu vực mobile             |
| 7      | How Vita Works     | DOM + SVG                   | 4 bước                                         |
| 8      | Practitioners      | DOM + card/ảnh              | Hồ sơ hover/focus; gallery mobile              |
| 9      | Footer             | DOM + ảnh                   | Footer đầy đủ ở trang chủ, bản gọn ở trang con |

CONFIRMED: reveal mặc định duration 0.8 s, distance 40 px, `power3.out`, trigger `top 88%`; hero `fade-up-big` distance 200 px. Runtime nguồn có stagger ký tự 0.03 s, stagger dòng thường 0.06–0.08 s, nhiều reveal section 0.7–0.8 s. Bản React giữ trigger/duration/distance cơ bản và dùng reveal theo khối; không tuyên bố tái hiện chính xác SplitText.

CONFIRMED: SplitText gom phần số và chữ Step của Combine thành một block dọc; CSS tích hợp tái hiện cấu trúc hiển thị này. Trên mobile, một số đoạn chữ trong nguyên mẫu được tách theo ký tự nên có thể ngắt giữa từ; các đoạn tương ứng dùng `word-break: break-all`.

## Assets và cấu trúc đích

139 ảnh/SVG tải từ nguồn, tổng khoảng 6.53 MB, tier REAL. Font Inter local có license kèm theo. Icon thương hiệu trong header dùng path SVG của nguyên mẫu; không tạo ảnh AI hay placeholder. Không nạp CSS/JS/CDN của Webflow khi chạy ứng dụng.

Đích xây dựng là `roviet-client` hiện có: Next.js App Router + React + TypeScript, không scaffold project thứ hai. `app/[locale]/(public)` sở hữu layout, `features/public-site/` sở hữu component, section, dữ liệu và CSS. Đây là lựa chọn theo yêu cầu tích hợp của dự án.

## Giới hạn đã biết

- Motion là bản dựng lại bằng React/native API; không có SplitText theo từng ký tự/dòng hoặc hiệu ứng cuộn trễ ScrollSmoother.
- Các chấm bản đồ SVG giữ hình học, chưa tái hiện nhịp pulse ngẫu nhiên của GSAP.
- Ghi nhận tại thời điểm clone: dữ liệu và nhận diện nguyên mẫu còn là demo. Bước re-skin Hafo Travel được ghi riêng trong README/BRAND/ASSETS.
- Form chỉ kiểm tra dữ liệu local; chưa có dịch vụ gửi liên hệ, booking hoặc checkout.
- Kết quả pixel diff chứng minh trạng thái tĩnh và viewport được chụp; không chứng minh motion trùng từng frame.
