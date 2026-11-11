# Thuật ngữ và nguồn tham khảo

Trạng thái: **tài liệu tra cứu**. Nguồn ngoài được đối chiếu ngày 11/11/2026; kiểm tra lại tài liệu tương ứng với dependency thực tế khi triển khai. Các lựa chọn cho Hafo Travel là đề xuất của dự án, không phải yêu cầu bắt buộc của nhà cung cấp công nghệ.

## 1. Thuật ngữ sản phẩm

| Thuật ngữ       | Nghĩa dùng trong tài liệu                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| Tour            | Sản phẩm mô tả hành trình; chưa tự mang một ngày khởi hành cụ thể            |
| Departure       | Một lịch khởi hành của tour, có sức chứa và điều kiện bán                    |
| Quote           | Báo giá có hạn, được server tính cho một yêu cầu; không giữ chỗ              |
| Booking         | Đơn đặt tour với snapshot, chủ sở hữu và trạng thái                          |
| Reservation     | Phần chỗ giữ/xác nhận cho một đơn                                            |
| Payment attempt | Một lần thử thanh toán của đơn; một đơn có thể có nhiều attempt              |
| Refund          | Giao dịch hoàn tiền với vòng đời riêng                                       |
| Reconciliation  | Đối soát khi dữ liệu hoặc kết quả từ hệ thống ngoài chưa rõ                  |
| Compensation    | Hành động bù trừ cho một phần công việc đã hoàn tất, như hoàn khoản thu muộn |
| Snapshot        | Bản dữ liệu/điều kiện tại thời điểm cam kết, không tự đổi theo danh mục      |

## 2. Thuật ngữ kiến trúc

| Thuật ngữ            | Nghĩa dùng trong dự án                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| BFF                  | Backend phục vụ contract frontend và điều phối request                      |
| Service boundary     | Ranh giới trách nhiệm và quyền sở hữu dữ liệu                               |
| Event                | Sự thật nghiệp vụ đã xảy ra và được commit                                  |
| Command              | Yêu cầu một bên thực hiện hành động có thể bị từ chối                       |
| Outbox               | Record phát message được ghi cùng transaction nghiệp vụ                     |
| Inbox                | Dấu nhận xử lý theo consumer/message để chống tác động lặp                  |
| Idempotency          | Gửi lại cùng thao tác hợp lệ không tạo thêm tác động nghiệp vụ ngoài ý muốn |
| At-least-once        | Có khả năng nhận/xử lý lại thông điệp; ứng dụng phải chịu được trùng        |
| Consumer group       | Nhóm instance phối hợp xử lý luồng cho cùng một mục đích                    |
| Partition key        | Giá trị dùng trong phân vùng; không phải bảo đảm thứ tự toàn hệ thống       |
| DLT/DLQ              | Nơi cách ly thông điệp không xử lý được theo policy; vẫn cần vận hành       |
| Saga                 | Quy trình nhiều transaction cục bộ với điều phối/bù trừ                     |
| Eventual consistency | Các bản sao/trạng thái liên quan có thể hội tụ sau một khoảng trễ           |
| Projection           | Dữ liệu đọc được dựng từ nguồn/event để phục vụ một mục đích                |
| Correlation ID       | Mã liên kết các bước của cùng luồng                                         |
| ADR                  | Bản ghi bối cảnh, quyết định kiến trúc, phương án khác và hệ quả            |

## 3. Thuật ngữ AI

| Thuật ngữ          | Nghĩa dùng trong dự án                                                     |
| ------------------ | -------------------------------------------------------------------------- |
| LLM                | Mô hình xử lý/sinh ngôn ngữ; không là nguồn sự thật nghiệp vụ              |
| Agent              | Runtime dùng mô hình để chọn bước/công cụ trong giới hạn được cấp          |
| Tool calling       | Mô hình đề xuất lời gọi có cấu trúc; runtime validate và thực thi          |
| RAG                | Truy xuất nguồn liên quan rồi dùng chúng để hỗ trợ câu trả lời             |
| Embedding          | Biểu diễn số phục vụ tìm kiếm tương đồng; không chứng minh nội dung đúng   |
| Groundedness       | Mức các khẳng định được hỗ trợ bởi nguồn/kết quả công cụ                   |
| Provenance         | Dấu vết nguồn, version và vị trí nội dung                                  |
| Prompt injection   | Nội dung không tin cậy cố điều khiển mô hình hoặc hành động ngoài mục đích |
| Human confirmation | Người dùng xác nhận một hành động cụ thể với dữ liệu đã ràng buộc          |
| Evaluation         | Đo hành vi trên case có tiêu chí; không chỉ thử một vài câu chat           |
| Token budget       | Giới hạn lượng sử dụng mô hình; cần runtime thực thi                       |

## 4. Nguồn kỹ thuật chính thức

| Nguồn                                                                                                                                | Dùng để đối chiếu                                                  | Liên hệ thiết kế                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [NestJS Kafka](https://docs.nestjs.com/microservices/kafka)                                                                          | Transport Kafka, event pattern, tên client/group và xử lý consumer | Tài liệu 05, 07; kiểm tra lại với phiên bản package thực tế                                   |
| [Apache Kafka design](https://kafka.apache.org/40/design/design/)                                                                    | Partition/order và giới hạn delivery semantics                     | Tài liệu 07, 08; URL là trang thiết kế phiên bản cụ thể, không phải khuyến nghị cài Kafka 4.0 |
| [Debezium Outbox Event Router](https://debezium.io/documentation/reference/transformations/outbox-event-router.html)                 | Cách chuyển outbox bằng CDC                                        | Lựa chọn mở rộng trong tài liệu 08; chưa được cài                                             |
| [OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)                         | Tool scope, authorization, confirmation và kiểm thử agent          | Tài liệu 10, 13; dùng làm tham khảo, không là chứng nhận                                      |
| [OWASP Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | Rủi ro chỉ dẫn từ dữ liệu ngoài và các lớp giảm thiểu              | Tài liệu 11, 12                                                                               |

Chưa chọn LLM provider, cổng thanh toán hoặc vector store nên chưa đưa SDK/API và giá cụ thể. Khi chọn, bổ sung tài liệu chính thức của provider, giới hạn, version và kết quả đánh giá tại ADR tương ứng.

## 5. Nguồn nội bộ

- [Frontend instructions](../client/documents/instructions.md): convention và giới hạn FE–BE hiện tại.
- [Backend architecture](../server/instructions/architecture.md): ranh giới app/library hiện tại.
- [Backend coding](../server/instructions/coding.md): contract HTTP/gRPC, config và bootstrap.
- [Backend testing](../server/instructions/testing.md): mức kiểm chứng và tài nguyên thử nghiệm.
- [Public site README](../client/documents/public-site/README.md): giới hạn nội dung và form public.
- [Mục lục ADR](DECISIONS/README.md): lý do các lựa chọn đề xuất.

Khi tài liệu mâu thuẫn source, ghi rõ điểm lệch và kiểm tra bên gọi/bên nhận. Không sửa code chỉ để biến thiết kế đề xuất thành hiện trạng.
