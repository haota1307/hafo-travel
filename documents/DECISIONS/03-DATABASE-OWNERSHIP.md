# ADR-03: Database theo quyền sở hữu service

Ngày: 11/11/2026. Trạng thái: **Proposed**. Implementation: PostgreSQL mới cho booking/payment chưa được tạo.

## Bối cảnh

User hiện lưu MongoDB, repository có nền TypeORM/PostgreSQL tùy chọn. Booking và Payment cần unique constraint, transaction, kiểm tra trạng thái và truy vấn đối soát. Không có yêu cầu chuyển dữ liệu user hiện tại.

## Quyết định đề xuất

Dùng PostgreSQL cho dữ liệu giao dịch mới. Mỗi service sở hữu database/user riêng; local có thể dùng cùng instance. Giữ MongoDB cho user hiện tại. Entity/repository mới nằm trong service sở hữu; chia sẻ contract thay vì persistence model.

AI có kho conversation/operation riêng; lựa chọn vector extension hoặc vector store độc lập chờ đánh giá. Không cho AI query trực tiếp DB nghiệp vụ.

## Phương án thay thế

| Phương án                             | Ưu điểm                           | Chi phí/lý do chưa chọn                                                                 |
| ------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Một DB/schema chia sẻ cho mọi service | Join và transaction xuyên bảng dễ | Mất ownership, migration/deploy phụ thuộc nhau                                          |
| MongoDB cho mọi dữ liệu               | Giảm số công nghệ lưu trữ         | Không tận dụng mục tiêu học constraint/transaction SQL; vẫn cần thiết kế concurrency kỹ |
| Chuyển user sang PostgreSQL luôn      | Đồng nhất công nghệ               | Migration ngoài phạm vi, tăng rủi ro mà chưa có yêu cầu                                 |

## Hệ quả

Owner kiểm soát schema, quyền và invariant. Báo cáo xuyên service phải dùng API/projection và chấp nhận trễ phù hợp. Không có foreign key/transaction xuyên DB; cần ID, event và reconciliation.

Một instance local tiết kiệm tài nguyên nhưng vẫn là điểm lỗi chung. Chỉ tách database logic không chứng minh fault isolation hoặc HA hạ tầng.

## Điều kiện xem xét lại

Chốt workload/query thực tế, môi trường và nhu cầu thống kê trước khi thêm warehouse/search store. Thay đổi ownership phải có migration và contract tương thích, không chỉ đổi connection string. Xem Q-17/Q-22 và [mô hình dữ liệu](../06-DATA-OWNERSHIP.md).
