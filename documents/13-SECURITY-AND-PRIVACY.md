# Bảo mật và dữ liệu riêng tư

Trạng thái: **yêu cầu thiết kế đề xuất + các khoảng trống hiện tại**. Đây không phải chứng nhận bảo mật hoặc tuyên bố tuân thủ pháp lý.

## 1. Hiện trạng cần lưu ý

Frontend chưa có auth thật; proxy hiện chỉ chuyển các header được liệt kê trong source, không chuyển cookie/Authorization. BFF tạo user hiện chưa có decorator xác thực/phân quyền. Các thông tin này có căn cứ tại [tài liệu hiện trạng](01-PROJECT-OVERVIEW.md); chưa được sửa trong nhiệm vụ viết tài liệu.

Đăng nhập/xác thực backend có Keycloak và guard nhưng không đồng nghĩa mọi route được bảo vệ. Tạo user qua Keycloak rồi lưu MongoDB có thể lỗi một phần; cần quy trình reconciliation riêng nếu mở đăng ký thật. Không tự coi đây là transaction atomic.

## 2. Ranh giới tin cậy

Browser và mọi input khách gửi là dữ liệu không tin cậy. BFF xác minh phiên; service nghiệp vụ xác minh caller nội bộ và quyền trên tài nguyên. Kafka message đáng tin ở mức nguồn phát được cấp quyền, nhưng payload vẫn cần validate và kiểm tra nghiệp vụ. Webhook cần xác minh nhà cung cấp. LLM và nội dung retrieval không được quyền quyết định authorization.

Không nhận header userId/role từ browser rồi chuyển tiếp như identity đã xác thực. Nội bộ cần service identity và delegation context có thể kiểm chứng. Cơ chế cụ thể là Q-12; “ở cùng Docker network” không đủ để thay thế xác thực.

## 3. Session frontend đề xuất

Đề xuất cookie HTTP-only với cấu hình Secure/SameSite phù hợp môi trường và cơ chế lưu/refresh token phía server. Chi tiết session store, logout, refresh rotation, thời hạn và route callback chưa chốt tại Q-11. Không đưa access/refresh token vào localStorage như giải pháp mặc định.

Thao tác ghi dùng cookie cần chống CSRF theo kiến trúc đã chọn; kiểm tra Origin/CSRF token theo policy, không giả định CORS một mình đủ. Reverse proxy chỉ chuyển header cần thiết, không forward tùy ý toàn bộ header/cookie.

Auth streaming phải được thiết kế cùng session; không đưa bearer token vào query string có thể lọt log. Khi quyền bị thu hồi, tool call tiếp theo vẫn kiểm tra quyền, không tiếp tục dùng quyết định cũ chỉ vì hội thoại đang mở.

## 4. Ma trận truy cập tối thiểu đề xuất

| Tài nguyên/hành động | Khách public                    | Chủ tài nguyên       | Nhân viên có quyền          | Agent                          |
| -------------------- | ------------------------------- | -------------------- | --------------------------- | ------------------------------ |
| Tour đã công bố      | Đọc                             | Đọc                  | Đọc/sửa theo quyền          | Đọc bằng tool                  |
| Tour nháp            | Không                           | Không                | Theo quyền                  | Không trong baseline           |
| Tạo đơn              | Không theo baseline             | Có sau xác thực      | Theo use case riêng đã chốt | Chỉ sau confirmation của khách |
| Xem booking          | Không                           | Có                   | Theo quyền tác nghiệp       | Scope đúng khách hiện tại      |
| Refund               | Không                           | Chưa mở tự thực hiện | Quy trình được duyệt        | Không có tool baseline         |
| Conversation         | Theo anonymous session của mình | Có                   | Không mặc định được xem     | Chỉ context hội thoại hiện tại |
| Replay/DLT           | Không                           | Không                | Quyền vận hành riêng        | Không                          |

Tên permission và mapping role phải được thiết kế khi triển khai. Ẩn nút trên UI không phải bảo vệ API. Test IDOR phải thử truy cập trực tiếp bằng ID của người khác.

## 5. Thanh toán và webhook

Lưu raw body theo nhu cầu xác minh chữ ký trước khi biến đổi; thuật toán, timestamp window, retry response và key rotation theo provider đã chọn. Không tự thiết kế chữ ký riêng hoặc tin IP duy nhất làm bằng chứng.

Sau xác minh, đối chiếu provider transaction/reference, booking/payment, amount và currency. Dedupe callback bằng khóa ổn định. Chỉ trả success acknowledgement sau khi đã lưu sự kiện/công việc đủ bền vững theo contract provider. Khi DB lỗi, phản hồi phải cho phép cơ chế retry/đối soát phù hợp.

Không lưu thông tin thẻ trong ứng dụng baseline. Redirect/payment URL chỉ từ provider adapter được duyệt. Callback không được mở quyền tạo user hoặc thay đổi đơn tùy ý.

## 6. Kafka, database và secrets

Local chỉ mở port cần cho phát triển. Môi trường dùng dữ liệu thật cần quyết định TLS, xác thực broker, ACL producer/consumer, database credential theo service và network exposure. Booking được phát booking events/refund commands; service khác không mặc định được phát thay.

Secret không nằm trong source, prompt, event, log, fixture hoặc ảnh demo. Phân biệt cấu hình mẫu với credential hoạt động. Nếu phát hiện secret đã public, cần thay credential theo phạm vi ảnh hưởng; xóa dòng khỏi file hiện tại không xóa lịch sử.

Không chạy migration/seed/reset trên DB chưa xác định. Công cụ admin/replay phải có permission và audit, không cấp cho toolset của LLM.

## 7. Phân loại dữ liệu

| Loại     | Ví dụ                                        | Xử lý đề xuất                               |
| -------- | -------------------------------------------- | ------------------------------------------- |
| Public   | Tour công bố, policy public                  | Có thể index; vẫn giữ nguồn và version      |
| Nội bộ   | Outbox/DLT metadata, config không secret     | Giới hạn quyền vận hành                     |
| Cá nhân  | Họ tên, email, điện thoại, chi tiết đơn/chat | Tối thiểu hóa, lọc quyền, hạn lưu được chốt |
| Nhạy cảm | Token, API key, chữ ký webhook               | Không đưa tới LLM/log/event thông thường    |

Thông tin sức khỏe, giấy tờ và trẻ em chưa nằm trong baseline thu thập. Nếu nghiệp vụ yêu cầu, cần chốt mục đích, quyền và cách bảo vệ trước khi thêm field. Không dùng dữ liệu khách thật cho evaluation/portfolio mặc định.

## 8. Dữ liệu qua LLM và retrieval

Runtime chỉ gửi dữ liệu cần cho tác vụ; đơn và payment dùng response đã lọc. Document ACL áp dụng trước và sau retrieval. Cache retrieval phải có scope/locale/version phù hợp, không chia sẻ kết quả private giữa user.

Tài liệu ngoài hoặc message có thể chứa prompt injection. Không cấp thêm tool hoặc quyền vì nội dung đó yêu cầu. Confirmation và kiểm tra quyền nằm ngoài mô hình. Prompt, input filter và model refusal chỉ là một phần kiểm soát, không thay thế backend enforcement. [OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)

## 9. Audit và retention

Audit ghi actor thật, delegated subject nếu có, action, resource, result, reason, thời gian và correlationId. Với action AI, thêm confirmationId/operationId/tool version; không lưu raw reasoning hoặc toàn bộ prompt để làm audit mặc định.

Thời gian lưu chat, raw webhook, audit, DLT và dataset còn mở tại Q-17/Q-18. Yêu cầu xóa dữ liệu phải xét cả DB nguồn, index, cache, log và backup theo policy; không hứa xóa tuyệt đối ngay lập tức khi chưa có quy trình.

## 10. Các kiểm tra ưu tiên

Kiểm tra quyền ngang giữa hai user, quyền dọc khách/nhân viên, webhook giả/trùng, confirmation hết hạn/đổi payload, tool ngoài allowlist, truy xuất private document và rò rỉ log. Chạy trong môi trường fixture/sandbox; không dùng dữ liệu hoặc tài khoản thật của người ngoài.
