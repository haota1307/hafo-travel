# Hafo Travel — nhận diện public

Hướng Forest & Ivory dành cho cảm hứng nghỉ dưỡng và du lịch Việt Nam: hiện đại, tối giản, thanh lịch. Giữ bộ khung và tương tác của bản clone; thay nhận diện, nội dung và ảnh.

| Vai trò    | Giá trị   | Sử dụng                      |
| ---------- | --------- | ---------------------------- |
| Primary    | `#143C32` | Logo, CTA, nền footer        |
| Background | `#F7F5EF` | Nội dung và khoảng thở       |
| Surface    | `#EEE8DC` | Card phụ, nền nhạt           |
| Accent     | `#A68B5B` | Chi tiết trang trí, icon nhỏ |
| Foreground | `#20372E` | Nội dung trên nền sáng       |
| Muted text | `#5C6C62` | Mô tả và nhãn phụ            |

Màu vàng dùng làm điểm nhấn; nội dung quan trọng và trạng thái focus dùng xanh có độ tương phản rõ. Khối nền đậm dùng chữ ivory và token inverse, tránh đổi màu trên toàn ứng dụng.

## Logo

Biểu tượng H được vẽ riêng bằng SVG: hai nét đứng, một đường chân trời cong và nét ngang mảnh. Wordmark dùng outline từ font Inter có license đi kèm, không phụ thuộc font bên ngoài khi dùng SVG.

- `public/hafo/brand/hafo-travel.svg`: logo đầy đủ trên nền sáng.
- `public/hafo/brand/hafo-travel-inverse.svg`: logo đầy đủ trên nền tối.
- `public/hafo/brand/hafo-icon.svg`, `hafo-icon-inverse.svg`: biểu tượng độc lập.
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`: icon trình duyệt/thiết bị.
- `og-image.jpg`: ảnh nhận diện 1200 × 630 từ ảnh thật Phú Quốc và logo Hafo Travel.

Header/footer dùng cùng hình học qua `SiteMark`, cùng tên và font trong config. Giữ tỷ lệ biểu tượng; không kéo giãn hoặc thêm bóng. Ưu tiên kích thước từ 24 px cho icon giao diện.

## Typography và motion

Inter local có glyph tiếng Việt; family CSS đặt tên `Hafo Inter` để cô lập. Giữ license tại `public/hafo/fonts/LICENSE`. Heading dùng weight 500, tracking vừa phải; body 400–500, line-height rộng hơn để dấu tiếng Việt rõ.

H1 nổi bật trên ảnh, H2 cho section, H3/H4 cho card và nội dung. Cỡ chữ có giới hạn tối thiểu tại tablet/mobile để tránh chữ quá nhỏ do đơn vị fluid. Bố cục vẫn giữ nhịp section và grid của bản clone.

Reveal giữ duration 800 ms, distance 40 px, hero distance 200 px, easing `cubic-bezier(0.165, 0.84, 0.44, 1)` và ngưỡng viewport 0.88. Tôn trọng reduced motion; không thêm thư viện animation, shader hoặc panel vào production.
