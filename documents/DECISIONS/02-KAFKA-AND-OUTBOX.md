# ADR-02: Kafka, outbox và xử lý lặp

Ngày: 11/11/2026. Trạng thái: **Proposed**. Implementation: chưa có Kafka/outbox runtime trong source được đối chiếu.

## Bối cảnh

Đặt tour cần phát sự kiện sau khi ghi DB, Payment và Notification xử lý độc lập. Broker hoặc consumer có thể lỗi. Chủ dự án muốn học Kafka; việc chọn Kafka ở đây cũng phục vụ mục tiêu học, chưa dựa trên nhu cầu throughput đã đo.

## Quyết định đề xuất

Dùng Kafka cho integration event và command bù trừ có owner rõ. Giữ HTTP/gRPC cho request cần kết quả trực tiếp. Ghi outbox cùng transaction nghiệp vụ, relay polling, consumer có inbox và state guard. Side effect ngoài DB dùng work item bền vững, provider idempotency và reconciliation.

Không dùng event sourcing làm nguồn lưu chính. Database nghiệp vụ vẫn giữ state hiện tại; Kafka không thay thế backup hoặc transaction DB. Chi tiết tại [độ tin cậy](../08-RELIABILITY-AND-OBSERVABILITY.md).

## Phương án thay thế

| Phương án                    | Ưu điểm                           | Chi phí/lý do chưa chọn                                                       |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Gọi đồng bộ tất cả           | Luồng dễ theo dõi ban đầu         | Payment/notification lỗi kéo dài request, khó tách phục hồi                   |
| Ghi DB rồi publish trực tiếp | Ít bảng/worker                    | Crash giữa hai bước có thể mất event                                          |
| Broker dạng hàng đợi khác    | Có thể phù hợp xử lý job đơn giản | Không đáp ứng trực tiếp mục tiêu học Kafka; cần so khi bài toán thực thay đổi |
| Debezium CDC ngay            | Tránh tự viết polling relay       | Thêm connector/offset/vận hành khi chưa có outbox nghiệp vụ                   |

## Hệ quả

Có thể giữ ý định phát sự kiện khi broker gián đoạn. Consumer chịu được redelivery. Đổi lại có thêm bảng, worker, retention, lag, DLT và quy trình replay. Outbox không tự bảo đảm thứ tự giữa worker hoặc exactly-once với provider.

Topic/group/key/version phải được quản lý như contract. Retry topic có đánh đổi về thứ tự; baseline không dùng lại cấu hình retry chung cho mọi consumer mà chưa xem invariant.

## Điều kiện xem xét lại

Xem xét CDC khi polling là nút thắt đã đo hoặc mục tiêu học mở rộng sang CDC. Xem xét broker khác nếu nhu cầu thực chỉ là job queue và vận hành Kafka không còn phù hợp. Chốt Q-13/Q-17 trước khi tuyên bố thiết kế vận hành hoàn chỉnh.
