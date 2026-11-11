# Các câu hỏi và quyết định còn mở

Trạng thái: **cần xác nhận**. Ngày lập: 11/11/2026. Mục tiêu là có bản thiết kế đủ cụ thể để đánh giá mà không tự quyết định chính sách kinh doanh thay chủ dự án.

## 1. Những định hướng đã xác nhận trong trao đổi

- Phát triển Hafo Travel với mục tiêu học công nghệ và xây portfolio/CV.
- Muốn backend microservice kết hợp Kafka.
- Muốn tích hợp AI agent.
- Muốn bộ tài liệu chi tiết trong documents, tên nội dung dạng NN-UPPERCASE-NAME.md.

Những điều này không đồng nghĩa đã chốt số service, provider, chính sách bán tour, refund hoặc mọi giá trị ví dụ trong tài liệu.

## 2. Câu hỏi sản phẩm và nghiệp vụ

| ID   | Cần xác nhận                                                                    | Baseline đang dùng để mô tả                     | Ảnh hưởng nếu chọn khác                                    |
| ---- | ------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Q-01 | Hafo bán tour trực tiếp, chỉ nhận tư vấn hay làm trung gian nhiều nhà cung cấp? | Một đơn vị vận hành bán tour demo               | Ownership, settlement, admin, hợp đồng và phạm vi sản phẩm |
| Q-02 | Tour theo lịch khởi hành cố định hay khách chọn ngày riêng?                     | Lịch khởi hành có capacity                      | Inventory, tìm kiếm, quote và mô hình dữ liệu              |
| Q-03 | Giá theo người/nhóm tuổi/cả đoàn? Thuế/phụ phí/làm tròn?                        | Có price lines phía server; chưa chốt công thức | Price engine, UI và test số tiền                           |
| Q-04 | Trẻ em/em bé tính giá và chiếm chỗ thế nào?                                     | Cơ cấu khách tách khỏi seatCount                | Chống oversell và thông tin hành khách                     |
| Q-05 | Có guest checkout hoặc quote trước đăng nhập không?                             | Đặt và quote dùng để đặt cần đăng nhập          | Session, nhận diện chủ đơn, phục hồi giỏ/quote             |
| Q-06 | Giữ chỗ bao lâu? Có gia hạn không?                                              | Có expiresAt, không tự gia hạn                  | Job hết hạn, payment session, UI countdown                 |
| Q-07 | Tiền thu trước hạn nhưng event tới sau hạn có được xác nhận không?              | Kiểm tra hạn lúc Booking xử lý; muộn thì bù trừ | Grace period, reservation và đối soát                      |
| Q-08 | Khách hủy sau thanh toán khi nào, phí và số tiền hoàn bao nhiêu?                | Chưa mở tự hủy CONFIRMED                        | State machine, refund, confirmation và policy              |
| Q-09 | Nhân viên hủy cả chuyến/đổi lịch thì xử lý đơn ra sao?                          | Chưa đưa vào baseline                           | Bulk compensation, thông báo, lựa chọn khách               |
| Q-10 | Thu thập thông tin hành khách nào là bắt buộc?                                  | Thông tin tối thiểu cho demo                    | Form, privacy, retention và dữ liệu gửi LLM                |

Không triển khai phép tính tiền, chính sách hủy hoặc hành vi tạo cam kết với khách bằng cách tự điền câu trả lời cho Q-01–Q-10. Có thể xây hạ tầng độc lập đã rõ và dùng fixture được ghi nhãn trong lúc chờ quyết định.

## 3. Câu hỏi kiến trúc và tích hợp

| ID   | Cần xác nhận                                                   | Đề xuất hiện tại                                                        | Ảnh hưởng                                        |
| ---- | -------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| Q-11 | Session frontend, refresh/logout và luồng đăng nhập mục tiêu?  | Ưu tiên session/cookie HTTP-only, chưa chốt chi tiết                    | Proxy, CSRF, SSE, FE–BE và Keycloak              |
| Q-12 | Xác thực service-to-service và delegation identity thế nào?    | Caller identity có thể xác minh, quyền kiểm tra tại owner               | HTTP/gRPC, tool adapter, deployment              |
| Q-13 | Kafka client/version, partition, schema và runtime validation? | Event JSON version hóa, consumer group thường, chưa cần Schema Registry | Ordering, offset, retry, vận hành                |
| Q-14 | LLM/provider/model/framework/vector store nào?                 | Provider-neutral, một agent với tool có schema                          | Chi phí, SDK, data handling, evaluation          |
| Q-15 | Ngân sách AI, quota, timeout và số vòng tối đa?                | Runtime giới hạn; chưa có giá trị được duyệt                            | UX, chi phí, retry/fallback                      |
| Q-16 | Có cần chat streaming ngay không? Cách reconnect/session?      | HTTP response trước hoặc SSE riêng khi cần                              | BFF/proxy, auth, frame contract, test            |
| Q-17 | Retention/replay cho event, inbox, idempotency, log và audit?  | Không xóa trước cửa sổ replay hỗ trợ                                    | Dung lượng, dedupe, phục hồi                     |
| Q-18 | Retention chat, dữ liệu gửi provider, quyền xóa và evaluation? | Tối thiểu hóa, chưa dùng dữ liệu thật                                   | Privacy, index/cache/backup và provider contract |
| Q-19 | Ai duyệt nội dung/policy, nguồn gốc và cách xuất bản?          | Nguồn version hóa có người duyệt; không index doc đề xuất thành policy  | RAG, admin/CMS, hiệu lực và citation             |
| Q-20 | Cổng thanh toán, full payment/đặt cọc, callback và refund API? | Full payment bằng giả lập/sandbox                                       | State machine, amount, thời hạn và adapter       |
| Q-21 | Dataset và ngưỡng chất lượng AI được chấp nhận?                | Case quyền/ghi/chống lặp bắt buộc; chất lượng nội dung cần chốt         | Release gate, chọn model và chi phí eval         |
| Q-22 | Môi trường deploy, tài nguyên máy và mục tiêu vận hành?        | Local Compose; chưa cam kết HA/SLO                                      | Số container, monitoring, backup và bảo mật      |

## 4. Khoảng trống hiện trạng không được bỏ qua

| ID     | Hiện trạng từ source/tài liệu nội bộ                          | Điều cần làm rõ khi triển khai                                                 |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| GAP-01 | Proxy chưa forward auth, UI login chưa thật                   | Hoàn chỉnh Q-11 trước API booking riêng tư                                     |
| GAP-02 | Endpoint tạo user chưa gắn decorator bảo vệ                   | Quyết định public registration hay thao tác admin; không tự đổi trong refactor |
| GAP-03 | Tạo Keycloak user rồi lưu MongoDB không atomic                | Đối soát/khắc phục partial failure                                             |
| GAP-04 | Role CRUD chưa hoàn chỉnh                                     | Không coi tính năng đã có từ enum/proto                                        |
| GAP-05 | Giá retreat null, form liên hệ chưa gửi API                   | Không dùng dữ liệu hiện tại làm catalog thương mại đã sẵn sàng                 |
| GAP-06 | Chưa có Kafka/booking/payment/AI runtime trong phần đối chiếu | Tất cả contract mới vẫn là đề xuất                                             |
| GAP-07 | Chưa kiểm toán lịch sử Git về secret                          | Kiểm tra trước khi công khai; không suy ra lịch sử sạch chỉ từ working tree    |

## 5. Cách chốt và cập nhật

Khi chốt một Q, giữ lại dòng với trạng thái đã chốt, ghi người quyết định, ngày, câu trả lời và link ADR nếu có. Cập nhật các tài liệu bị ảnh hưởng trong cùng thay đổi. Nếu đổi baseline, sửa tất cả flow/state/contract/test tương ứng, không chỉ thêm một ghi chú ở đây.

Ví dụ thay Q-07 từ kiểm tra lúc xử lý sang thời điểm provider thu tiền sẽ ảnh hưởng ít nhất tài liệu 03, 04, 06, 07, 08 và 14. Cần quyết định giữ chỗ trong khoảng chờ thế nào trước khi sửa code xác nhận.

## 6. Nhật ký quyết định nghiệp vụ

Chưa có quyết định nghiệp vụ chi tiết nào được ghi là đã duyệt tại thời điểm biên soạn. Các ADR trong DECISIONS đang mang trạng thái Proposed. Việc đồng ý viết tài liệu không tự chuyển chúng thành Accepted.
