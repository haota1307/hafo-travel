# Quy tắc nghiệp vụ

Trạng thái: **đề xuất baseline**, chưa phải chính sách bán tour chính thức. Quy tắc bất biến kỹ thuật bên dưới mô tả điều cần bảo đảm nếu chọn baseline; các lựa chọn thương mại còn mở được dẫn tới [99-OPEN-QUESTIONS](99-OPEN-QUESTIONS.md).

## 1. Đối tượng và quy ước

Tour là sản phẩm mô tả hành trình. Lịch khởi hành là một lần tổ chức tour có thời gian, sức chứa và điều kiện giá. Báo giá là kết quả tính tiền có hạn sử dụng. Đơn đặt tour ghi lại cam kết của khách và trạng thái phục vụ. Reservation giữ một số chỗ cho đơn. Payment attempt là một lần thử thanh toán, không đồng nghĩa với đơn.

Một đơn baseline chỉ thuộc một lịch khởi hành. Số người và số chỗ chiếm dụng có thể khác nếu trẻ nhỏ không chiếm chỗ; quy tắc này chưa chốt, không tự dùng số hành khách làm số chỗ cho mọi trường hợp.

## 2. Danh mục, lịch và giá

| ID    | Thao tác và điều kiện                             | Dữ liệu/ảnh hưởng                                           | Kết quả mong muốn                                                       |
| ----- | ------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| BR-01 | Công bố tour khi có nội dung và dữ liệu bắt buộc  | Ghi người thay đổi, version và thời điểm công bố            | Public chỉ thấy nội dung được phép công bố                              |
| BR-02 | Đặt trên lịch còn mở bán, chưa qua hạn nhận khách | Kiểm tra tại backend; giờ server là căn cứ                  | Lịch hết hạn hoặc ngừng bán không nhận đơn mới                          |
| BR-03 | Tính tiền theo bảng giá/nhóm khách đã chốt        | Server lưu từng dòng giá, tiền tệ, tổng tiền, phiên bản giá | FE/agent không truyền tổng tiền để backend tin trực tiếp                |
| BR-04 | Báo giá còn hạn và khớp yêu cầu lúc xác nhận      | Snapshot số người, lịch, giá, điều kiện và hạn dùng         | Thay thông tin hoặc giá không còn được bảo đảm thì yêu cầu xác nhận lại |
| BR-05 | Giá chưa xác định                                 | Không suy ra từ giá tham khảo hoặc từ LLM                   | Hiển thị liên hệ/chưa thể đặt; `null` không phải 0                      |

Đề xuất dùng VND và số nguyên theo đơn vị tiền nhỏ nhất mà hệ thống quy định; không dùng float để cộng tiền. Contract truyền tiền dạng chuỗi số nguyên để tránh mất chính xác khi đi qua JavaScript/JSON. Thuế, phụ phí, giảm giá, độ tuổi và quy tắc làm tròn thuộc Q-03/Q-04; chưa đưa chương trình khuyến mãi vào baseline.

## 3. Chỗ và giữ chỗ

| ID    | Quy tắc đề xuất                                                             | Ý nghĩa                                                 |
| ----- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| BR-06 | `held + confirmed <= capacity` tại thời điểm commit                         | Không bán vượt chỗ, kể cả nhiều request đồng thời       |
| BR-07 | Tạo đơn, tạo reservation, tăng chỗ giữ và ghi outbox trong cùng transaction | Không có đơn hợp lệ mà không có reservation tương ứng   |
| BR-08 | Reservation chỉ chuyển `HELD → CONFIRMED` hoặc `HELD → RELEASED` một lần    | Tránh cộng/trừ chỗ lặp khi nhận sự kiện trùng           |
| BR-09 | Báo giá không giữ chỗ                                                       | Khách xem giá lâu vẫn có thể gặp hết chỗ lúc xác nhận   |
| BR-10 | Hết hạn giữ chỗ được xử lý bằng job bền vững dựa trên DB                    | Restart service không làm mất lịch hết hạn              |
| BR-11 | Giảm capacity phải kiểm tra chỗ đã cam kết; không sửa âm số chỗ             | Nếu không đáp ứng phải từ chối và xử lý nghiệp vụ riêng |

Thời gian giữ chỗ chưa chốt. Ví dụ 15 phút chỉ dùng để giải thích UI/demo, không là chính sách mặc định đã được triển khai. Dù job hết hạn chạy trễ, transaction xác nhận vẫn kiểm tra `expiresAt`; không xác nhận chỉ vì reservation vẫn mang nhãn HELD.

## 4. Đơn và quyền sở hữu

BR-12: baseline yêu cầu đăng nhập để tạo đơn. Chủ đơn lấy từ security context đã xác minh; không nhận `userId` tùy ý từ body hoặc công cụ AI. Guest checkout là Q-05.

BR-13: lưu snapshot tên tour, lịch, giá, các dòng tiền và phiên bản chính sách. Sửa tour sau đó không viết lại nội dung đơn đã xác nhận. Chi tiết cần thiết của hành khách do Q-10 quyết định; tránh thu thập giấy tờ không cần cho demo.

BR-14: mọi thao tác tạo đơn có idempotency key, gắn với người dùng và thao tác. Gửi lại cùng khóa/cùng nội dung trả lại cùng kết quả; cùng khóa/khác nội dung bị từ chối. Một request timeout không chứng minh transaction đã thất bại.

## 5. Thanh toán

BR-15: chỉ tạo phiên thanh toán cho đơn hợp lệ, đúng tổng tiền/tiền tệ và chưa hết điều kiện thanh toán. Payment dùng snapshot đáng tin cậy từ Booking; không dùng giá do browser/LLM cung cấp.

BR-16: trang quay về từ nhà cung cấp không phải bằng chứng đã trả tiền. Payment xác minh webhook hoặc gọi đối soát từ server, đối chiếu mã giao dịch, đơn, số tiền và tiền tệ trước khi ghi kết quả.

BR-17: timeout khi gọi nhà cung cấp là kết quả chưa rõ. Lưu attempt và khóa idempotency trước khi gọi; đối soát bằng mã tham chiếu trước khi tạo lần thử mới. Không ghi FAILED chỉ vì timeout mạng.

BR-18: callback/sự kiện trùng không tăng doanh thu, không tạo hai xác nhận, không giải phóng chỗ hai lần. Một đơn có thể có nhiều attempt nhưng chỉ có một kết quả thanh toán được dùng để xác nhận đơn. Khoản thu thành công dư phải đi vào xử lý riêng, không bỏ qua.

## 6. Thanh toán muộn và tranh chấp với hết hạn

Baseline đề xuất quyết định theo khả năng giữ chỗ tại thời điểm Booking xử lý, không tự khôi phục đơn đã hết hạn:

1. Payment ghi nhận tiền đã thu đúng sự thật và phát `PaymentSucceeded`.
2. Booking khóa đơn/reservation và kiểm tra trạng thái cùng thời hạn bằng giờ DB.
3. Nếu đơn còn PENDING_PAYMENT, reservation còn HELD và chưa hết hạn, chuyển sang CONFIRMED.
4. Nếu đơn đã EXPIRED/CANCELLED hoặc đã qua hạn, không chiếm lại chỗ. Ghi yêu cầu bù trừ bền vững và chuyển yêu cầu hoàn tiền sang Payment.
5. Nếu tiền đã thu trước hạn nhưng sự kiện đến sau hạn, baseline vẫn xử lý là muộn. Đây là đánh đổi cần xác nhận tại Q-07; phương án chấp nhận theo giờ nhà cung cấp cần thêm khoảng chờ và chiến lược giữ chỗ khác.

BR-19: job hết hạn và consumer thanh toán dùng cùng cơ chế khóa/kiểm tra version; chỉ một chuyển trạng thái thắng. Sự kiện đến muộn không đảo trạng thái terminal.

BR-20: hoàn tiền là giao dịch bù trừ độc lập, không phải rollback xuyên database. Đơn EXPIRED có thể có payment SUCCEEDED và refund PENDING cùng lúc; UI phải giải thích được tình huống này.

## 7. Hủy đơn và hoàn tiền

Đề xuất cho đơn chưa thanh toán: khách xác nhận hủy, Booking chuyển CANCELLED và giải phóng chỗ một lần. Phiên thanh toán cũ vẫn có thể phát sinh callback; xử lý theo BR-19/20, không giả định đóng phiên loại bỏ mọi khả năng thu tiền.

Với đơn đã xác nhận, điều kiện hủy, phí và mốc thời gian chưa chốt. Không tự áp dụng hủy miễn phí hoặc hoàn toàn bộ. Khi chưa chốt, UI chỉ cho gửi yêu cầu để nhân viên xử lý theo quy trình được duyệt.

BR-21: tổng hoàn tiền thành công cộng khoản hoàn đang giữ ngân sách không vượt số tiền thực thu được phép hoàn. Một refund request có ID/khóa riêng; request trùng không gọi hoàn tiền lặp.

BR-22: chỉ hiển thị đã hoàn khi có xác nhận từ nhà cung cấp/đối soát. Lỗi hoàn tiền giữ nghĩa vụ cần xử lý, có người phụ trách và audit; không biến thành thành công để đóng quy trình.

## 8. Thông báo, ngôn ngữ và thời gian

BR-23: notification lỗi không hủy một booking đã xác nhận. Trạng thái nghiệp vụ và trạng thái gửi thông báo độc lập. Không cam kết email gửi đúng một lần nếu nhà cung cấp không hỗ trợ chống trùng/đối soát.

BR-24: dữ liệu lưu timestamp có timezone/UTC; UI hiển thị theo Asia/Ho_Chi_Minh cho baseline. Ngày khởi hành thuần ngày không được vô tình trừ/cộng ngày khi chuyển timezone.

BR-25: nội dung chính sách vi/en dùng version thống nhất. Nếu thiếu bản dịch đã duyệt, trả bản có sẵn kèm thông báo ngôn ngữ; không coi bản dịch tức thời của AI là chính sách chính thức.

## 9. Quy tắc dành cho agent

BR-26: agent được tìm và giải thích; giá/chỗ/quyền/trạng thái cuối cùng do API quyết định. Nội dung truy xuất là dữ liệu tham khảo, không được thay đổi quyền gọi công cụ.

BR-27: trước thao tác ghi, khách xác nhận bản tóm tắt có ID và version. Xác nhận gắn với người dùng, hành động, dữ liệu và thời hạn cụ thể. Đổi lịch, số người hoặc giá làm xác nhận cũ không còn hiệu lực.

BR-28: assistant chỉ nói đã tạo đơn/hủy đơn khi backend trả kết quả tương ứng. Khi timeout, báo chưa xác định và tra cứu operation; không tự bấm lại bằng khóa mới.

Chi tiết ở [10-AI-ASSISTANT](10-AI-ASSISTANT.md) và [11-AI-KNOWLEDGE-AND-TOOLS](11-AI-KNOWLEDGE-AND-TOOLS.md).
