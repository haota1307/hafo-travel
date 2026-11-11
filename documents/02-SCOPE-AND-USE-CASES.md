# Phạm vi và tình huống sử dụng

Trạng thái: **đề xuất MVP**, cần chốt theo [99-OPEN-QUESTIONS](99-OPEN-QUESTIONS.md). Các vai trò dưới đây là vai trò sản phẩm đề xuất, không phải role/permission đã tồn tại trong Keycloak hoặc MongoDB.

## 1. Người sử dụng

| Vai trò                          | Nhu cầu                                     | Ranh giới                                                       |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Khách chưa đăng nhập             | Xem tour, chính sách, hỏi tư vấn            | Chỉ đọc nội dung public; không tra cứu đơn riêng tư             |
| Khách có tài khoản               | Đặt tour, thanh toán, theo dõi đơn của mình | Quyền theo chủ sở hữu; biết mã đơn không đủ để truy cập         |
| Nhân viên vận hành               | Quản lý tour, lịch, xử lý yêu cầu của khách | Quyền theo tác vụ; thao tác nhạy cảm được audit                 |
| Người được giao xử lý thanh toán | Đối soát giao dịch, xử lý hoàn tiền         | Không sửa trực tiếp trạng thái để tạo bằng chứng thanh toán giả |
| Quản trị hệ thống                | Quản lý truy cập và cấu hình vận hành       | Không mặc định có quyền sử dụng dữ liệu khách cho AI            |
| AI assistant                     | Hỗ trợ khách qua các công cụ cho phép       | Không phải chủ thể có quyền độc lập; hành động theo phiên khách |

## 2. Phạm vi MVP đề xuất

| Nhóm      | Có trong thiết kế baseline                                                   | Chưa đưa vào baseline                                               |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Danh mục  | Tour, lịch khởi hành, mô tả vi/en, giá và khả năng đặt                       | Marketplace nhiều nhà cung cấp, giá vé máy bay/hotel thời gian thực |
| Booking   | Báo giá, tạo đơn, giữ chỗ, hết hạn, xem đơn, yêu cầu hủy                     | Đặt nhóm nhiều lịch trong một đơn, đổi tour phức tạp                |
| Payment   | Thanh toán toàn bộ bằng giả lập/sandbox, webhook, đối soát, hoàn tiền bù trừ | Tiền thật, trả góp, nhiều tiền tệ, chia doanh thu                   |
| Thông báo | Xác nhận đơn, thông báo trạng thái, lịch sử gửi                              | Marketing automation và gửi hàng loạt                               |
| AI        | Tìm tour, giải thích chính sách có nguồn, chuẩn bị đơn, tra cứu đơn có quyền | Tự mua dịch vụ bên ngoài, tự hoàn tiền, tự gửi thông điệp tùy ý     |
| Admin     | Thao tác tối thiểu để quản lý dữ liệu demo và ngoại lệ                       | Chuyển toàn bộ template thành tính năng thật                        |

Hoàn tiền bù trừ cho thanh toán muộn thuộc yêu cầu nhất quán của luồng đề xuất. Điều kiện khách tự yêu cầu hủy/hoàn tiền là chính sách kinh doanh riêng cần chốt.

## 3. Use case

### UC-01 — Tìm và xem tour

Khách nhập điểm đến, thời gian, số người hoặc ngân sách. Hệ thống chỉ trả tour được công bố, hiển thị điều kiện giá và lịch phù hợp. Nếu chưa có giá hoặc lịch bán, giao diện nói rõ chưa thể đặt. Không tạo giá hoặc lịch từ nội dung mô tả.

Kết quả: khách có thể chọn tour/lịch hoặc điều chỉnh tiêu chí. Không thay đổi số chỗ. Tiêu chí chấp nhận: không đưa tour chưa công bố vào kết quả public; dữ liệu rỗng có trạng thái rỗng, không giả lập có hàng.

### UC-02 — Tư vấn với assistant

Khách mô tả nhu cầu; assistant hỏi thông tin còn thiếu khi cần, gọi công cụ tìm kiếm và trả lựa chọn có căn cứ. Các câu về chính sách dựa vào tài liệu đang hiệu lực. Khi nguồn thiếu hoặc mâu thuẫn, assistant nói rõ giới hạn và hướng khách tới kênh hỗ trợ đã cấu hình.

Kết quả: danh sách phù hợp và giải thích; chưa có đơn hoặc chỗ giữ. Tiêu chí chấp nhận: tour được giới thiệu có ID thật trong kết quả công cụ; giá/chỗ lấy từ API; gợi ý lịch trình tự tạo được ghi là tham khảo.

### UC-03 — Nhận báo giá và chuẩn bị đặt

Khách chọn lịch, cơ cấu khách và thông tin cần thiết. Booking tính giá, chụp điều kiện áp dụng, trả báo giá có thời hạn. Khách xem tổng tiền và các điều kiện trước khi xác nhận. Khi thay đổi lịch hoặc số người, phải tính lại.

Kết quả: có `quoteId`; chưa giữ chỗ. Tiêu chí chấp nhận: số tiền do server tính; báo giá hết hạn không dùng để tạo đơn. Liên quan BR-03, BR-04 và Q-03/Q-04.

### UC-04 — Xác nhận và tạo đơn

Khách đã đăng nhập xác nhận bản tóm tắt. Booking kiểm tra quyền, báo giá, thời hạn bán và số chỗ trong transaction; tạo đơn, reservation và outbox. Request có khóa idempotency để xử lý việc bấm lại hoặc mất phản hồi.

Kết quả: đơn `PENDING_PAYMENT` với thời hạn giữ chỗ. Không đủ chỗ hoặc giá thay đổi thì không tạo đơn thành công. Nếu phản hồi bị mất, khách tra cứu hoặc gửi lại cùng khóa; không tự tạo yêu cầu mới.

### UC-05 — Thanh toán và nhận kết quả

Payment nhận sự kiện tạo đơn, chuẩn bị phiên thanh toán. Khách mở liên kết do backend trả. Kết quả trên trang quay về chỉ phục vụ hiển thị; webhook đã xác minh hoặc đối soát phía server mới làm căn cứ cập nhật giao dịch.

Kết quả: Payment lưu kết quả tài chính; Booking xác nhận hoặc áp dụng quy tắc muộn/bù trừ. Tiêu chí chấp nhận: callback trùng không tạo hai tác động; UI có trạng thái đang chờ, thất bại, thành công và cần kiểm tra.

### UC-06 — Theo dõi đơn

Khách mở danh sách hoặc chi tiết đơn của mình. Hệ thống trả thông tin tour đã chụp tại lúc đặt, trạng thái đặt chỗ và trạng thái thanh toán/hoàn tiền riêng biệt. Có thể polling khi đang xử lý.

Kết quả: khách hiểu việc còn phải làm và thời hạn liên quan. Một response `404` hoặc `403` theo policy không được làm lộ đơn của người khác. Không đọc trạng thái từ hội thoại AI làm nguồn chính thức.

### UC-07 — Hủy và giải phóng chỗ

Đơn chưa thanh toán có thể được hủy theo điều kiện được chốt; reservation được giải phóng đúng một lần. Với đơn đã xác nhận, hệ thống phải kiểm tra chính sách hủy và số tiền có thể hoàn trước khi nhận xác nhận của khách/nhân viên.

Kết quả: trạng thái đơn và hoàn tiền được hiển thị độc lập. Chưa chốt chính sách thì không mở chức năng tự hủy đơn đã thanh toán. Không dùng quy tắc mẫu trong tài liệu làm cam kết kinh doanh.

### UC-08 — Quản lý tour và lịch khởi hành

Nhân viên có quyền tạo/sửa bản nháp, công bố hoặc ngừng bán lịch. Thay đổi giá chỉ ảnh hưởng báo giá mới theo policy đã chốt. Giảm sức chứa không được làm tổng chỗ giữ và đã xác nhận vượt sức chứa.

Kết quả: dữ liệu có version và audit; đơn cũ giữ snapshot. Tắt bán không đồng nghĩa tự hủy tất cả đơn đã có. Hủy cả chuyến là nghiệp vụ riêng tại Q-09.

### UC-09 — Giải quyết ngoại lệ

Nhân viên có quyền xem các giao dịch không rõ kết quả, thanh toán muộn, hoàn tiền lỗi hoặc notification lỗi. Hệ thống cung cấp mã tham chiếu, lịch sử và hành động cụ thể; mỗi hành động kiểm tra lại trạng thái trước khi chạy.

Kết quả: có kết quả đối soát hoặc trạng thái chờ người xử lý; không sửa DB thủ công làm quy trình mặc định. Replay sự kiện phải có audit và không bỏ qua idempotency.

## 4. Điều kiện dùng chung

- FE, API và agent cùng sử dụng quy tắc nghiệp vụ tại backend.
- Tất cả chức năng ghi phải có xác thực/quyền, kiểm tra trạng thái và đường phục hồi khi mất phản hồi.
- Nội dung vi/en cần cùng ý nghĩa; policy được version hóa để không áp bản mới cho đơn cũ tùy tiện.
- Dữ liệu demo được nhận diện rõ; notification đi tới hộp thư thử nghiệm.
- Tiêu chí nghiệm thu cụ thể ở [14-TESTING-AND-ACCEPTANCE](14-TESTING-AND-ACCEPTANCE.md).
