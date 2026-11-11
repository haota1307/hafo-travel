# ADR-01: Ranh giới service cho Hafo Travel

Ngày: 11/11/2026. Trạng thái: **Proposed**. Implementation: chưa triển khai các service mới.

## Bối cảnh

Repository có BFF, authorizer và user-access trên NestJS/Nx. Chủ dự án muốn học microservice, Kafka và AI, đồng thời cần sản phẩm đủ nhỏ để tự triển khai và demo. Chưa có nghiệp vụ booking/payment.

## Quyết định đề xuất

Giữ các app hiện có. Thêm Booking, Payment, Notification và AI Assistant theo trách nhiệm ở [kiến trúc hệ thống](../05-SYSTEM-ARCHITECTURE.md). Booking chứa module tour, lịch, quote, inventory/reservation và đơn. Không tách từng bảng thành service.

Mỗi service sở hữu logic và dữ liệu; không import repository/entity/service nội bộ của nhau. Dùng contract typed và version hóa. Nx monorepo giúp quản lý source nhưng không được coi là lý do bỏ khả năng tương thích giữa các lần deploy.

## Phương án thay thế

| Phương án                                 | Ưu điểm                                           | Chi phí/lý do chưa chọn                                                            |
| ----------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Modular monolith                          | Ít vận hành, transaction dễ, phù hợp sản phẩm nhỏ | Ít cơ hội thực hành lỗi giao tiếp và deployment độc lập theo mục tiêu học hiện tại |
| Tách catalog/inventory/booking riêng ngay | Boundary chuyên biệt, học saga sâu hơn            | Tăng số luồng phân tán trước khi nghiệp vụ rõ; khó hoàn thành demo                 |
| Mỗi chức năng CRUD một service            | Dễ chia file/app ban đầu                          | Boundary yếu, nhiều cuộc gọi và coupling dữ liệu                                   |

## Hệ quả

Giữ chỗ và tạo đơn có transaction cục bộ nên dễ chứng minh không oversell. Payment tách riêng để học giao tiếp bất đồng bộ và xử lý provider. Notification và AI có thể lỗi mà không phải làm hỏng đơn.

Đổi lại, Booking có phạm vi khá rộng và hệ thống vẫn có nhiều process cho một người vận hành. Không coi kiến trúc này tối ưu mọi sản phẩm nhỏ; đây là đánh đổi có chủ đích phục vụ mục tiêu học đã nêu.

## Điều kiện xem xét lại

Chỉ tách inventory khi có nhu cầu chia sẻ chỗ cho nhiều sản phẩm/kênh hoặc vòng đời độc lập rõ. Có thể gộp worker/deployment để giảm tài nguyên nếu vẫn giữ boundary logic và không chia sẻ DB trái thiết kế. Quyết định triển khai cần chốt Q-01/Q-02/Q-22.
