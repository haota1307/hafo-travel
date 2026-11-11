# Thiết kế AI assistant

Trạng thái: **định hướng tích hợp AI đã xác nhận; hành vi chi tiết là đề xuất**. Chưa chọn provider/model/framework và chưa có agent runtime trong source được đối chiếu.

## 1. Vai trò trong sản phẩm

Assistant giúp khách chuyển nhu cầu tự nhiên thành lựa chọn có dữ liệu: đi đâu, khi nào, bao nhiêu người, ngân sách và mong muốn trải nghiệm. Agent được gọi công cụ để tìm tour, lấy giá/chỗ, tra cứu policy và chuẩn bị đơn. Mọi cam kết kinh doanh vẫn do backend quyết định.

Một câu trả lời tự nhiên không đủ để gọi là agent hữu ích. Hệ thống phải chứng minh đã chọn công cụ phù hợp, dùng kết quả thật, biết dừng khi thiếu thông tin và không thực hiện thao tác ngoài quyền của khách.

## 2. Phạm vi khả năng

| Khả năng            | Hành vi mong muốn                                      | Giới hạn                                             |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| Khai thác nhu cầu   | Hỏi ngắn gọn thông tin thiếu ảnh hưởng kết quả         | Không yêu cầu PII không cần thiết                    |
| Tìm tour            | Gọi search với bộ lọc có schema                        | Không bịa tour/ID hoặc khẳng định còn chỗ từ trí nhớ |
| Giải thích lựa chọn | Nêu điểm phù hợp với yêu cầu, giá/điều kiện lấy từ API | Không hứa chất lượng hoặc ưu đãi chưa có nguồn       |
| Trả lời chính sách  | Dẫn đúng tài liệu/version đang áp dụng                 | Thiếu nguồn thì nói chưa xác định                    |
| Gợi ý lịch trình    | Gắn nhãn tham khảo và tách khỏi lịch tour bán          | Không khẳng định đã đặt dịch vụ bên ngoài            |
| Chuẩn bị đặt        | Lấy quote, tạo action preview có cấu trúc              | Chưa tạo booking cho đến khi khách xác nhận          |
| Tra cứu đơn         | Gọi công cụ theo identity đã xác minh                  | Không xem đơn khác dù khách biết bookingId           |

Tự hoàn tiền, thay giá, sửa inventory, quản trị user, gửi email tùy ý, duyệt web tùy ý, chạy shell/SQL và truy cập file hệ thống không nằm trong toolset baseline. Chức năng hủy qua agent chỉ mở sau khi chính sách hủy và cơ chế xác nhận được triển khai.

## 3. Vòng xử lý một lượt

1. Nhận message và context phiên đã xác minh; kiểm tra quyền hội thoại, quota và kích thước đầu vào.
2. Nạp lịch sử cần thiết đã giới hạn; chọn toolset theo quyền và trạng thái hiện tại.
3. Mô hình đề xuất câu trả lời hoặc tool call có cấu trúc.
4. Runtime kiểm tra tên tool, schema, quyền, ngân sách, số vòng và confirmation nếu cần.
5. Tool adapter gọi service nghiệp vụ; kết quả được lọc trước khi đưa về mô hình.
6. Mô hình diễn đạt từ kết quả; runtime kiểm tra citation, ID/action và dữ liệu có cấu trúc trước khi gửi UI.
7. Lưu message, tool-run metadata, usage và trạng thái kết thúc; không lưu raw chain-of-thought.

Không coi lời nhắc hệ thống là hàng rào quyền. Backend phải từ chối tool call không hợp lệ ngay cả khi mô hình liên tục yêu cầu thực hiện.

## 4. Đối thoại mẫu mong muốn

Khách: “Tôi muốn đi nghỉ ba ngày cùng gia đình, khoảng 8 triệu.” Assistant cần xác định ngân sách cho cả đoàn hay mỗi người, số người/nhóm tuổi và thời gian dự kiến nếu chúng ảnh hưởng tìm kiếm. Không mặc định trẻ em là người lớn hoặc lấy ngày hiện tại làm ngày đi.

Sau khi có kết quả công cụ, assistant trả vài lựa chọn thật và lý do phù hợp. Nếu chưa có lịch/giá bán, nói rõ chỉ có hành trình tham khảo và hướng khách tới kênh liên hệ hiện có. Không chuyển `price: null` thành một con số tự nghĩ.

Khách: “Chọn tour thứ hai, đặt giúp tôi.” Assistant gọi quote, UI hiển thị lịch, số khách, tổng tiền, điều kiện và hạn dùng từ structured data. Khách xác nhận bằng action của UI. Kết quả backend mới là căn cứ để nói “đã tạo đơn”.

## 5. Xác nhận hành động

Confirmation phải ràng buộc user, conversation, action type, quote/version, request hash và expiresAt. Backend phát sinh ID/token; mô hình không tự tạo hay sửa giá trị này. Sau khi dùng thành công, không dùng lại để thực hiện action khác.

Đề xuất UI hiển thị nút xác nhận có dữ liệu được server ký/ràng buộc. Câu “OK” trong chat không đủ nếu có nhiều action, báo giá đã đổi hoặc scope không rõ. Khi mất mạng, client tra operation đã lưu. Hủy stream không đồng nghĩa hủy một giao dịch đã commit.

Giá thay đổi, quote hết hạn hoặc chỗ không còn làm action cũ hết hiệu lực; agent trình dữ liệu mới và cần xác nhận mới. Không tự chấp nhận phần tiền tăng trong giới hạn do mô hình suy đoán.

## 6. Hội thoại và bộ nhớ

Conversation được phân quyền theo user/session. Dữ liệu tool và tài liệu truy xuất được coi là dữ liệu không tin cậy về mặt chỉ dẫn. Khi tóm tắt lịch sử, giữ nguồn gốc và không nâng lời khách thành instruction hệ thống.

Baseline chưa có long-term memory xuyên hội thoại. Muốn lưu sở thích phải chốt mục đích, quyền sửa/xóa và thời gian lưu. Không lưu thông tin nhạy cảm chỉ vì khách vô tình cung cấp. Anonymous session chuyển sang tài khoản cần binding rõ; không gộp lịch sử theo email khách tự nhập.

## 7. Timeout, chi phí và dừng vòng lặp

Runtime giới hạn số tool call, tổng số vòng, token đầu vào/đầu ra, thời gian một lượt và ngân sách theo session/user. Ví dụ tối đa 5 tool call hoặc 30 giây chỉ là giá trị thử nghiệm cần đo tại Q-15. Không cho model tự gia hạn budget.

Provider timeout/rate limit: dừng có kiểm soát, lưu trạng thái và cho khách dùng UI thông thường. Tool ghi UNKNOWN: tra operation thay vì retry với khóa mới. Nếu đổi model fallback, phải giữ policy và toolset tương đương; không bỏ confirmation để trả lời nhanh hơn.

## 8. Chất lượng câu trả lời

- Nêu giá, số chỗ và thời điểm kiểm tra khi dữ liệu có thể thay đổi.
- Policy có tên tài liệu, phiên bản/ngày hiệu lực và link phù hợp quyền.
- Thiếu dữ liệu hoặc nguồn mâu thuẫn thì nói rõ; không tự chọn quy tắc thuận lợi nhất.
- Không đưa raw lỗi kỹ thuật, prompt hoặc reasoning nội bộ cho khách.
- Dùng ngôn ngữ hội thoại phù hợp locale; nội dung thương mại phải giữ đúng nghĩa.
- Khi không thể xử lý, đưa kênh hỗ trợ có thật; chưa có API chuyển nhân viên thì không nói “đã chuyển yêu cầu”.

## 9. Phòng ngừa hành động vượt phạm vi

Thiết kế dùng tool allowlist, kiểm tra quyền tại service, giới hạn đầu vào và xác nhận gắn hành động để giảm rủi ro agent bị điều khiển bằng nội dung ngoài. Đây là nhiều lớp kiểm soát, không phải cam kết prompt injection đã được giải quyết. [OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)

Các kiểm tra bắt buộc và tình huống tấn công thử nghiệm nằm trong [12-AI-EVALUATION](12-AI-EVALUATION.md). Kiến trúc một agent được giải thích tại [ADR AI](DECISIONS/04-AI-AGENT-BOUNDARY.md).
