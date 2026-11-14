# Kiểm tra cụm trang public

## Sửa layout Combine ngày 09/11/2026

Lượt rebrand trước đã bỏ sót việc so sánh tỷ lệ và vị trí hàng bước của section Combine. Khi bỏ ID Webflow khỏi markup, selector chia cột cũ không còn khớp; override `position: relative` cũng làm hàng bước mất vị trí bám đáy. Đây là lỗi layout trong quá trình remix.

- Đã chuyển quy tắc chia cột sang class của component: mô tả chiếm 2/6, mỗi bước chiếm 1/6; mobile giữ mô tả toàn chiều rộng và bốn bước trong lưới 2 × 2.
- Bỏ override vị trí, khôi phục hàng bước bám đáy khung ảnh. Cỡ chữ và chiều cao dòng trong bảng bước dùng lại tỷ lệ fluid của section gốc, tránh bị typography toàn site làm tăng chiều cao.
- Chromium headless trên dev server có sẵn kiểm tra `/vi` và `/en` tại 1800, 1440, 768, 480, 479, 390 và 360 px. Cả 14 trường hợp giữ đúng tỷ lệ cột, không chồng hàng bước lên danh sách phía trên và không có khoảng hở dưới hàng bước.
- Tại 1440 px, chiều rộng các ô là 480/240/240/240/240 px; hàng bước cao khoảng 290,8 px. Tại 390 px, mô tả rộng 390 px, mỗi bước rộng 195 px; bảng cách danh sách phía trên khoảng 27,4 px.
- Prettier trong phạm vi CSS và tài liệu sửa đạt. Chỉ thay CSS của Combine; không thay route, nội dung, ảnh hoặc motion. Không chạy lại build vì không đổi API/type/route/dependency. Browser test được đóng sau khi dùng; không mở thêm server.

Hồ sơ kiểm tra section gồm `measurements.json`, `combine-vi-1440.png`, `combine-vi-390.png` và các ảnh theo locale/viewport, được lưu trong thư mục output của lần kiểm tra. Kết quả này chỉ xác nhận section Combine, không thay thế việc đối chiếu từng section còn lại.

## Hafo Travel — rebrand ngày 09/11/2026

Evidence production là `verification.json` trong hồ sơ đổi nhận diện ngày 09/11/2026. Script kiểm tra dùng Chromium headless; không dùng Computer Use. Server test riêng chạy cổng 3107 và đã dừng; dev server có sẵn của người dùng được giữ nguyên.

- `pnpm build` đạt, gồm TypeScript và 12 cặp locale/slug của sáu hành trình. Lượt build cuối không còn cảnh báo metadataBase.
- ESLint/Prettier phạm vi sửa đạt; `pnpm test:base` đạt 5/5. Test kiểm tra cấu trúc vi/en, ICU/rich text, dữ liệu theo locale, giá card/detail cùng nguồn, asset local và lỗi ký tự tiếng Việt bị hỏng.
- 22 URL public (11 trang × vi/en) trả 200, có một H1 và nhận diện Hafo Travel. Cookie ngôn ngữ đối lập không đổi nội dung của locale trên URL.
- 14 URL tương thích (7 URL × vi/en) trả 308 đúng đích và giữ query; browser xác nhận fragment cũng được giữ.
- 80 asset (68 ảnh và 12 asset thương hiệu/font) trả 200. Browser giải mã ảnh trên các trang; không ghi nhận ảnh lỗi. SVG hợp lệ XML; font WOFF giữ glyph tiếng Việt.
- 22 trang được kiểm tra bằng browser ở desktop; thêm 15 trường hợp responsive trên tablet/mobile. Các template home, trải nghiệm, liên hệ, detail và hai trang pháp lý được chụp tại 1440/768/390 × 1000. Kiểm tra bổ sung hero sau sửa xác nhận chiều rộng khung đúng viewport ở cả ba kích thước; font Public Inter weight 500 đã tải.
- Sheet mở/đóng bằng Escape, trả focus và điều hướng đúng locale. Popover trải nghiệm hỗ trợ Enter/Escape; portal vẫn nằm trong public scope.
- Gallery mobile chọn được ảnh thứ tư. Điều hướng phần hương vị cuộn đúng heading, cập nhật active state và hash. Đổi VI/EN giữ pathname, query và hash, nội dung detail đổi theo locale.
- Form báo lỗi họ tên/email, submit hợp lệ hiển thị thông tin liên hệ thay vì báo thành công; không có contact POST. Cookie decline giữ sau reload. Mục lục pháp lý hoạt động; reduced motion giữ nội dung hiển thị. Admin demo nằm ngoài public shell.
- Không ghi nhận page error hoặc console error trong lượt production. Chromium có hai cảnh báo ảnh hero preload chưa dùng kịp khi kiểm tra đổi viewport/điều hướng; ảnh vẫn tải và giải mã thành công. Không coi đây là đo PageSpeed hoặc chứng minh LCP/CLS bằng 0.
- Rà source của public, routes và messages: không còn tên/logo/domain/email thương hiệu cũ. URL cũ được giữ riêng trong bảng redirect; tên nguồn còn trong hồ sơ teardown lịch sử.

Ảnh cuối trong hồ sơ đổi nhận diện gồm `hero-1440.png`, `hero-768.png`, `hero-390.png`, các ảnh `home-*`, ảnh template trang con và `brand-kit.png`. `before-after-1440.jpg`, `before-after-768.jpg`, `before-after-390.jpg` đặt bản mới cạnh baseline clone ngày 07/11/2026. Baseline có trước bản i18n ngày 09/11; so sánh này phục vụ review nhận diện/bố cục, không phải pixel diff yêu cầu cùng màu và cùng nội dung.

Giới hạn sử dụng: chưa có API gửi liên hệ, booking hoặc thanh toán; giá/lịch trình là dữ liệu tư vấn, không tạo giá hoặc ngày khởi hành giả. Đặt `NEXT_PUBLIC_SITE_URL` thành origin chính thức khi triển khai; hiện dùng localhost cho phát triển. Ảnh phần hương vị là cảm hứng ẩm thực Việt Nam và ghi rõ nơi chụp, không xác nhận thực đơn của một tour/resort.

Các mục bên dưới là hồ sơ kiểm tra trước khi rebrand, không đại diện cho giao diện Hafo Travel hiện tại.

## Đa ngôn ngữ public

Kiểm tra ngày 2026-11-09. Evidence HTTP production tại `output/public-i18n/verification.json` ở root workspace.

- `pnpm build` đạt, bao gồm TypeScript và prerender 12 cặp locale/slug của sáu retreat.
- ESLint và Prettier trong phạm vi thay đổi đạt; `pnpm test:base` đạt 5/5. Test public kiểm tra cấu trúc messages lồng nhau và độ dài array vi/en, định dạng ICU/rich text, ghép nội dung cho đủ 6 retreat và 12 chuyên gia, cùng việc giữ dữ liệu dùng chung khi đổi locale.
- Cả 22 URL (11 trang × vi/en) trả HTTP 200, có đúng một H1 và title/description theo ngôn ngữ URL, kể cả khi cookie `NEXT_LOCALE` mang locale còn lại. Không ghi nhận lỗi `MISSING_MESSAGE`, `FORMATTING_ERROR` hoặc `INVALID_MESSAGE` trong HTML và log server của lượt cuối.
- Rà source TSX: không còn copy tiếng Anh cố định trong nội dung hiển thị ngoài tên riêng `Phenomenon Studio`. Nội dung section, footer, pháp lý, thẻ, chi tiết retreat, chuyên môn và tiểu sử đã chuyển vào messages.
- Nút VI/EN dùng navigation hiện có với pathname, query và hash tại thời điểm click, không cuộn về đầu trang khi đổi locale. Giá dùng formatter theo locale và giữ đơn vị USD.
- Không chạy Computer Use hoặc browser trong lượt này. Các kiểm tra HTTP/source không chứng minh thao tác click, trạng thái focus, giữ hash sau chuyển trang hoặc bố cục tiếng Việt ở từng viewport. Kết quả browser của bản shadcn bên dưới chỉ áp dụng cho bản được kiểm tra ngày 2026-11-07.
- Các process server tự bật để kiểm tra đều đã được dừng.

## Bản chuẩn hóa shadcn

Kiểm tra ngày 2026-11-07. Evidence ở `output/shadcn-refactor/verification.json`, `summary.json` và ảnh `home-1440.png`, `home-768.png`, `home-390.png` tại root workspace.

- `pnpm build` đạt; TypeScript, ESLint và Prettier trong phạm vi sửa đạt.
- Cả 11 route `/en` trả 200 và có một H1 sau khi gom sáu retreat vào một page component. Nhãn chung của retreat `/vi` hiển thị đúng tiếng Việt.
- Sheet mở, đóng bằng Escape và chuyển trang đúng locale; Popover mở hồ sơ và đóng bằng Escape. Cả hai portal nằm trong `.public-site` hiện tại.
- Carousel chọn được ảnh thứ tư; điều hướng Food cuộn đúng section và cập nhật active state. Nút chọn ảnh chỉ bật sau khi carousel sẵn sàng.
- Form Field/Input/Textarea báo hai lỗi họ tên/email khi để trống; submit hợp lệ hiển thị Alert chưa khả dụng. Không có request POST, page error hoặc console error trong lượt kiểm tra cuối.
- Không tràn ngang tại 1440, 768 và 390 px. Admin demo vẫn nằm ngoài public shell.
- 485 rule CSS riêng đều giới hạn trong `.public-site`; key vi/en của namespace `publicSite` khớp nhau. `app/globals.css`, source template và dependency không thay đổi.
- Module `public-site/` giảm từ 13.343 xuống 8.684 dòng TS/TSX/CSS (giảm 4.659 dòng, khoảng 35%); bỏ 29 asset không còn được tham chiếu, khoảng 351 KB. `image-assets.ts` chỉ còn 110 ảnh/SVG đang dùng.

Các con số pixel diff bên dưới là hồ sơ của bản clone ban đầu. UI control hiện tại chủ động theo shadcn; không dùng kết quả cũ để khẳng định bản chuẩn hóa vẫn khớp nguyên mẫu từng pixel. Lượt hiện tại kiểm tra tương tác, route, responsive và scope; không chạy lại toàn bộ bộ diff cũ.

## Hồ sơ clone ban đầu

Bằng chứng của lần clone trước khi chuẩn hóa control nằm trong thư mục `qa/` của hồ sơ khảo sát gốc.

Pixel diff dùng Chromium, DPR 1, viewport 1440/768/390 × 1000, per-pixel threshold 0.2 và giới hạn sai khác 2% mỗi ảnh. Ảnh reference hoàn tất các reveal một lần và tắt ScrollSmoother để đo bố cục native ổn định. Cookie và dev indicator được ẩn trong cả hai bên; không bật reduced motion khi so sánh. Motion được kiểm tra riêng bằng hành vi.

Không xem build/lint là bằng chứng giao diện đúng. Kết quả visual chỉ áp dụng cho các vùng đã chụp; xem danh sách trường hợp và sai khác trong `pixel-results.json` cùng ảnh `diff-*.png`.

## Kết quả visual

| Viewport    | Trường hợp đạt | Sai khác lớn nhất |
| ----------- | -------------- | ----------------- |
| 1440 × 1000 | 13/13          | 1.02%             |
| 768 × 1000  | 13/13          | 1.61%             |
| 390 × 1000  | 19/19          | 1.84%             |

45 trường hợp độc lập đều nằm dưới ngưỡng 2%: chín vùng trang chủ ở cả ba kích thước, phần đầu của bốn loại trang con (Coaches, Contacts, retreat Tuscany, Terms) ở cả ba kích thước, và cả sáu card retreat ở mobile. Không tuyên bố đã pixel diff toàn bộ nội dung dài của 11 trang hoặc từng trạng thái animation. Chiều cao `.page-padding` của trang retreat không dùng để kết luận sai lệch vì component liên quan được tách ra ngoài wrapper này trong bản React.

## Route và tương tác

- 11 route `/en` trả HTTP 200, mỗi trang có một H1, không có ảnh lỗi hoặc tràn ngang trong lượt smoke. `/vi` giữ locale và dịch nhãn tương tác.
- Cookie decline được lưu và không xuất hiện lại sau reload.
- Menu mobile đóng/mở, Escape và chuyển trang đúng locale.
- Hồ sơ chuyên gia hỗ trợ focus, Enter, Space và Escape.
- Gallery mobile chọn được ảnh thứ tư; link Food cuộn đến section và cập nhật active state.
- Mục lục pháp lý desktop cuộn đúng heading.
- Form báo lỗi họ tên/email; submit hợp lệ hiện thông báo chưa khả dụng. Không có request POST đến website mẫu/backend.
- Nội dung vẫn hiển thị khi bật reduced motion.
- `/en/template` vẫn dùng `.template-scope`, không có public shell.
- Không ghi nhận page error hoặc console error trong lượt kiểm tra tương tác cuối.

`routes.json`, `interactions.json`, `summary.json`, `pixel-results.json` và `focused-results.json` lưu kết quả chi tiết của bản clone ban đầu. Khi đó, 752 rule selector CSS public được kiểm tra scope; font và keyframe dùng tên riêng.

## Kiểm tra source

Prettier và ESLint chạy trong phạm vi `public-site/`, routes `(public)`, config lint và tài liệu đã sửa. Production build dùng `pnpm build`; không thêm dependency vào ứng dụng. Các process browser/dev server bật để kiểm tra được đóng sau khi dùng.

Giới hạn motion và dữ liệu demo được ghi trong [TEARDOWN](TEARDOWN.md).
