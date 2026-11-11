# Hướng dẫn phát triển dự án dành cho AI

Đây là bộ khung backend Nx + NestJS, giữ đăng nhập, phân quyền và người dùng. Nghiệp vụ invoice/product cũ đã được bỏ. Không tự phục hồi hoặc suy diễn nghiệp vụ từ tên thư mục repository `einvoice`.

## Cách sử dụng

1. Đọc [kiến trúc và nguồn đối chiếu](architecture.md) trước khi sửa một luồng.
2. Đọc [quy ước triển khai](coding.md) khi thêm hoặc refactor code.
3. Đọc [quy ước test và kiểm chứng](testing.md) khi thay đổi test, cấu hình hoặc xác nhận kết quả.
4. Xem [README ở root](../../README.md) để cài đặt và chạy local. Phiên bản thực tế lấy từ `package.json` và `pnpm-lock.yaml`.

## Nguyên tắc không suy diễn

- Yêu cầu hiện tại của người dùng xác định phạm vi công việc. Tài liệu mô tả hiện trạng, không tự cấp quyền thay đổi nghiệp vụ khác.
- Đọc code của bên gọi và bên nhận: HTTP DTO → BFF → TCP contract/message → controller → service → repository/schema. Tìm các nơi sử dụng trước khi đổi contract hoặc tên export.
- Nếu tài liệu khác source, nêu rõ khác biệt. Không sửa code chỉ để khớp một mô tả cũ. Khi chưa có căn cứ về nghiệp vụ, ghi **Chưa xác định từ source** và hỏi phần ảnh hưởng đến triển khai; tiếp tục phần độc lập đã rõ.
- Không coi enum, DTO, seed hoặc file rỗng là bằng chứng một API đã được triển khai. Không coi có guard toàn cục là mọi endpoint được bảo vệ.
- Phân biệt refactor giữ hành vi với thay đổi hành vi. Không tự đổi response, status, validation, quyền truy cập, cách lưu dữ liệu hoặc retry trong một yêu cầu clean code.
- Không thêm tầng base/generic, thư viện hay service mới nếu cấu trúc đang có đủ đáp ứng. Logic riêng của module nằm trong module; chỉ đưa phần dùng chung thực sự vào `libs`.
- Không ghi token, password, client secret hoặc nội dung `.env` vào tài liệu/log. `.env.example` chỉ chứa giá trị mẫu. Không tự chạy seed/migration lên dữ liệu đang dùng.
- Sau thay đổi cấu trúc hoặc convention, cập nhật tài liệu liên quan và link mẫu. Không ghi kết quả kiểm thử dự kiến thành kết quả đã chạy.

## Giới hạn hiện trạng cần biết

- BFF tạo người dùng hiện chưa gắn decorator xác thực/phân quyền. Không mặc định đây là chính sách đúng cho nghiệp vụ mới; không tự đổi chính sách trong refactor.
- Module role chưa có API CRUD hoàn chỉnh.
- Authorizer có cấu hình gRPC nhưng `AuthorizerService` trong protobuf hiện chưa khai báo RPC.
- Tạo user gọi Keycloak rồi lưu MongoDB; không có transaction chung giữa hai hệ thống. Không mô tả luồng này là atomic.
- TypeORM/BaseEntity là phần nền dùng lại; không có nghĩa các service hiện đang lưu user bằng PostgreSQL.
- Build/lint/test local không chứng minh tích hợp MongoDB, Redis hoặc Keycloak thật đã hoạt động.
