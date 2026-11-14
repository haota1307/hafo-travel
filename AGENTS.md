# Hướng dẫn làm việc

- Chỉ lên plan khi được yêu cầu.
- Chỉ dùng computer use khi được yêu cầu.
- Hạn chế các bước test không cần thiết.
- Kill các process đã bật trong quá trình test.

Trước khi sửa code:

- Frontend: đọc `client/documents/instructions.md`.
- Backend: đọc `server/instructions/README.md` và các tài liệu được liên kết.
- API contract, auth hoặc tích hợp FE–BE: đọc cả hai tài liệu.
- Kiểm tra source và tái sử dụng pattern hiện có; giữ thay đổi của người dùng.
- Không tự thêm nghiệp vụ hoặc thay đổi auth/database model ngoài yêu cầu.
- Đặt tên kỹ thuật theo chức năng; không dùng tên dự án hoặc thương hiệu làm tiền tố cho package, biến, class CSS, event hay asset. Tên thương hiệu thuộc nội dung và cấu hình nhận diện.
- Khi thay đổi nền tảng/contract, cập nhật instructions và README liên quan.

## Trình bày code

- Luôn dùng `{}` cho thân `if`/`else` và vòng lặp, kể cả chỉ có một câu lệnh.
- Dùng một dòng trống để phân tách các bước xử lý: chuẩn bị dữ liệu, kiểm tra điều kiện, thực hiện nghiệp vụ và trả kết quả. Các guard cùng mục đích có thể đặt liền nhau.
- Có dòng trống giữa các method, function và các khai báo schema/type độc lập.
- Xuống dòng rõ ràng với điều kiện dài, object nhiều trường và lời gọi hàm nhiều tham số; dùng formatter theo cấu hình repo.
- Giữ comment sát đoạn code được giải thích. Không tách thêm hàm/file chỉ để tạo khoảng cách.
- Trước khi hoàn tất, kiểm tra diff và chạy formatter/lint trong phạm vi đã sửa; giữ nguyên logic khi chỉ chỉnh trình bày.
