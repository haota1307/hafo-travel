# Bản ghi quyết định kiến trúc

Các ADR ở đây ghi lý do và đánh đổi cho thiết kế Hafo Travel. Ngày lập: 11/11/2026. Tất cả ADR ban đầu là **Proposed**, chưa khẳng định đã duyệt hoặc đã triển khai.

## Trạng thái

| Trạng thái | Ý nghĩa                                                        |
| ---------- | -------------------------------------------------------------- |
| Proposed   | Phương án đang đề xuất                                         |
| Accepted   | Đã có quyết định chọn; vẫn cần ghi implementation status riêng |
| Superseded | Được thay bằng ADR khác có liên kết                            |
| Rejected   | Không chọn; giữ lý do để tránh thảo luận lặp                   |

## Mục lục

| ADR                                                   | Quyết định đề xuất                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| [01-SERVICE-BOUNDARIES](01-SERVICE-BOUNDARIES.md)     | Giữ nền hiện có, tách theo trách nhiệm nghiệp vụ, đặt inventory trong Booking |
| [02-KAFKA-AND-OUTBOX](02-KAFKA-AND-OUTBOX.md)         | Kafka cho event/command bất đồng bộ, outbox và idempotent consumer            |
| [03-DATABASE-OWNERSHIP](03-DATABASE-OWNERSHIP.md)     | Dữ liệu giao dịch mới dùng PostgreSQL riêng theo service                      |
| [04-AI-AGENT-BOUNDARY](04-AI-AGENT-BOUNDARY.md)       | Một agent với công cụ giới hạn, backend thực thi quyền và confirmation        |
| [05-BOOKING-COMPENSATION](05-BOOKING-COMPENSATION.md) | Booking điều phối trạng thái, payment muộn đi vào bù trừ                      |

## Cách ghi một ADR mới

Ghi ID/tên, ngày, trạng thái, bối cảnh, lực tác động/giới hạn, quyết định đề xuất, phương án thay thế, hệ quả thuận lợi/bất lợi, điều kiện xem xét lại, câu hỏi liên quan và bằng chứng implementation nếu đã có.

Không sửa lịch sử quyết định cũ thành như chưa từng có. Khi thay lựa chọn đã Accepted, tạo ADR mới, đánh dấu Superseded ở bản cũ và cập nhật tài liệu thiết kế. Không dùng ADR để đưa thêm nghiệp vụ ngoài phạm vi đã xác nhận.
