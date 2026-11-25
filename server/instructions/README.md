# Hướng dẫn phát triển dự án dành cho AI

Đây là bộ khung backend Nx + NestJS, gồm BFF, hồ sơ người dùng và phân quyền. Phạm vi nghiệp vụ dựa trên yêu cầu hiện tại và source; không suy diễn từ tên repository hoặc mã kế thừa.

## Cách sử dụng

1. Đọc [kiến trúc và nguồn đối chiếu](architecture.md) trước khi sửa một luồng.
2. Đọc [quy ước triển khai](coding.md) trước khi sửa code, gồm cách chọn pattern, phân trách nhiệm và giữ code dễ đọc.
3. Đọc [quy ước test và kiểm chứng](testing.md) khi thay đổi test, cấu hình hoặc xác nhận kết quả.
4. Xem [README backend](../README.md) để cài đặt và chạy local. Phiên bản thực tế lấy từ `package.json` và `pnpm-lock.yaml`.
5. Đọc [xác thực và RBAC](rbac.md) khi thay đổi user, role, permission hoặc truy cập endpoint.

## Giữ nhất quán khi AI coding

- Mỗi thay đổi phải bám yêu cầu hiện tại và pattern của luồng tương tự trong source. Dùng [bảng mẫu theo trách nhiệm](architecture.md#chọn-mẫu-theo-trách-nhiệm) để chọn file cần đọc trước khi triển khai.
- Đọc cả method cần sửa, nơi gọi, module đăng ký dependency và type liên quan. Khi thêm luồng, đối chiếu một luồng hoàn chỉnh đang có cùng transport và cách lưu dữ liệu.
- Mở rộng module/helper hiện có khi chúng đáp ứng yêu cầu. Việc thêm tầng, dependency hoặc pattern kiến trúc cần giải quyết một nhu cầu cụ thể của tác vụ và có lý do trong báo cáo kết quả.
- Khi các file có cách viết khác nhau, dùng trách nhiệm của thành phần và quy ước trong bộ instructions để lựa chọn. Giữ phạm vi chỉnh sửa gắn với yêu cầu, kể cả khi phát hiện code lân cận có thể cải thiện.
- Chỉ lập plan hoặc dùng computer use khi người dùng yêu cầu. Không thêm comment vào code.

## Tự rà trước khi hoàn tất

- Đối chiếu diff với yêu cầu và luồng mẫu đã đọc, kiểm tra từng file/tầng/helper mới có trách nhiệm cần thiết.
- Kiểm tra controller, service, repository và mapper thực hiện đúng trách nhiệm trong [quy ước triển khai](coding.md#trách-nhiệm-trong-luồng-xử-lý).
- Kiểm tra các nơi sử dụng khi đổi signature/type, cùng response, lỗi, validation, quyền và side effect bị tác động. Với refactor, đối chiếu hành vi trước và sau.
- Chạy formatter trong phạm vi file đã sửa và chọn lint/test theo [phạm vi kiểm chứng](testing.md#chọn-kiểm-tra-theo-thay-đổi). Dừng process do mình bật sau kiểm tra.
- Báo ngắn gọn thay đổi, kiểm chứng đã chạy và phần còn chưa xác minh. Nêu lý do nếu cần dùng pattern mới hoặc phát hiện khác biệt giữa tài liệu và source.

## Nguyên tắc không suy diễn

- Yêu cầu hiện tại của người dùng xác định phạm vi công việc. Tài liệu mô tả hiện trạng, không tự cấp quyền thay đổi nghiệp vụ khác.
- Đọc code của bên gọi và bên nhận: HTTP DTO → BFF → proto/client gRPC → controller → service → repository/schema. Tìm các nơi sử dụng trước khi đổi contract hoặc tên export.
- Nếu tài liệu khác source, nêu rõ khác biệt. Không sửa code chỉ để khớp một mô tả cũ. Khi chưa có căn cứ về nghiệp vụ, ghi **Chưa xác định từ source** và hỏi phần ảnh hưởng đến triển khai; tiếp tục phần độc lập đã rõ.
- Không coi enum, DTO, seed hoặc file rỗng là bằng chứng một API đã được triển khai. Không coi có guard toàn cục là mọi endpoint được bảo vệ.
- Phân biệt refactor giữ hành vi với thay đổi hành vi. Không tự đổi response, status, validation, quyền truy cập, cách lưu dữ liệu hoặc retry trong một yêu cầu clean code.
- Không thêm tầng base/generic, thư viện hay service mới nếu cấu trúc đang có đủ đáp ứng. Logic riêng của module nằm trong module; chỉ đưa phần dùng chung thực sự vào `libs`.
- Không ghi token, password, client secret hoặc nội dung `.env` vào tài liệu/log. `.env.example` chỉ chứa giá trị mẫu. Không tự chạy seed/migration lên dữ liệu đang dùng.
- Sau thay đổi cấu trúc hoặc convention, cập nhật tài liệu liên quan và link mẫu. Không ghi kết quả kiểm thử dự kiến thành kết quả đã chạy.

## Giới hạn hiện trạng cần biết

- BFF trả 401 cho API cần xác thực trong khi chờ triển khai đăng nhập. Xem [RBAC](rbac.md).
- Identity quản lý hồ sơ, gán role và CRUD role trong MongoDB.
- [Bản đồ service và module](services.md) ghi rõ phần chạy được và phần thiết kế cho Booking, Payment và AI Agent.
- TypeORM/BaseEntity là phần nền dùng lại; không có nghĩa các service hiện đang lưu user bằng PostgreSQL.
- Build/lint/test local không chứng minh tích hợp MongoDB hoặc Redis thật đã hoạt động.
