# Xác thực và RBAC

## Mô hình hiện tại

Identity lưu hồ sơ, role và permission trong MongoDB. Hồ sơ mới có `userId` dạng UUID do Identity cấp.

Một user có đúng một role; một role có nhiều permission. Quyền hiệu lực lấy từ role đó. Contract giữ trường `roles` dạng mảng nhưng bắt buộc đúng một phần tử khi tạo user hoặc thay role; kiểm tra tại HTTP DTO, service gRPC và schema MongoDB. Tên `administrator` không tự bỏ qua kiểm tra quyền; seed cấp danh sách permission cụ thể cho role này.

Tên role là khóa động dạng chữ thường, bắt đầu bằng chữ, dùng chữ/số/gạch dưới/gạch ngang và tối đa 64 ký tự. Permission phải thuộc enum `PERMISSION`; thêm nghiệp vụ mới cần bổ sung permission và gắn vào endpoint tương ứng. Một số permission user đã được dự trữ nhưng chưa có API CRUD user tương ứng.

## Cơ chế kiểm tra

- `UserGuard` trả 401 cho route cần xác thực cho đến khi có cơ chế đăng nhập. Chỉ route đánh dấu public và không yêu cầu permission mới qua được guard.
- `PermissionGuard` yêu cầu đủ tất cả permission khai báo, trả 401 khi thiếu xác thực và 403 khi thiếu quyền.
- Role ID phải hợp lệ và tồn tại trước khi gán. Tạo user kiểm tra role trước khi lưu hồ sơ. Mảng role rỗng hoặc nhiều hơn một phần tử trả 400.
- Không xóa role đang được user sử dụng; API trả 409. Cần chuyển user sang role khác trước khi xóa. Role có thể có permission rỗng nếu user không được thực hiện tác vụ quản trị.

## HTTP API

Các route HTTP dưới đây đều đang trả 401. Bảng mô tả contract của controller và quyền đã khai báo, với prefix mẫu `/api`.

| Method | Endpoint              | Quyền                               | Dữ liệu/kết quả                                         |
| ------ | --------------------- | ----------------------------------- | ------------------------------------------------------- |
| GET    | `/user/me`            | Đăng nhập                           | `{ user, permissions }`; user có roles đầy đủ           |
| POST   | `/user`               | `user.create` + `user.assign_roles` | Tạo user với đúng một role; kết quả là chuỗi thông báo  |
| PATCH  | `/user/:userId/roles` | `user.assign_roles`                 | `{ roles: [roleId] }` thay role hiện tại; trả hồ sơ mới |
| GET    | `/role/permissions`   | `role.get_all`                      | Danh sách permission hợp lệ                             |
| GET    | `/role`               | `role.get_all`                      | Danh sách role, chưa phân trang                         |
| GET    | `/role/:id`           | `role.get_by_id`                    | Chi tiết role                                           |
| POST   | `/role`               | `role.create`                       | Tạo role                                                |
| PUT    | `/role/:id`           | `role.update`                       | Thay toàn bộ name/description/permissions               |
| DELETE | `/role/:id`           | `role.delete`                       | Xóa role chưa được sử dụng; role đang được gán trả 409  |

`:userId` là trường `user.userId` của hồ sơ. `:id` và phần tử trong `roles` là ID MongoDB của role.

Body tạo/thay role:

```json
{
  "name": "operator",
  "description": "Nhân viên được tạo hồ sơ người dùng",
  "permissions": ["user.create"]
}
```

Người có `user.assign_roles` có thể cấp mọi role hiện có, gồm administrator. Người có quyền tạo/sửa role có thể cấp mọi permission trong danh mục. Đây là các quyền quản trị nhạy cảm; không tự gán cho vai trò sản phẩm khi chưa chốt yêu cầu.

## Dữ liệu và seed role

Seed tại `apps/identity/src/seeds/role.json` khai báo quyền cho role administrator. Đăng nhập và cấp thông tin đăng nhập sẽ được triển khai sau.

Role name có unique index. Nếu database cũ đã có tên role trùng nhau, cần xử lý dữ liệu trùng trước khi áp dụng index; không tự xóa/merge role. Không chạy seed chế độ prune lên dữ liệu đang sử dụng.

Dữ liệu user cũ chưa có role hoặc có nhiều role cần được chuyển về đúng một role hợp lệ. Thay đổi này không tự chạy migration hoặc sửa dữ liệu đang dùng.

## Ranh giới hiện tại và kiểm chứng

RBAC được áp dụng tại BFF HTTP. gRPC nội bộ chưa có TLS/workload identity hoặc kiểm tra quyền caller riêng; chỉ cho BFF/service tin cậy truy cập cổng 5101, không công bố chúng ra mạng không tin cậy. Khi triển khai service caller bên ngoài ranh giới này, phải bổ sung xác thực và ủy quyền tại service boundary.

Frontend chưa tích hợp session/refresh và proxy chưa chuyển tiếp Authorization; chưa thể coi UI đã đăng nhập thật. Không lưu token vào localStorage để nối tạm luồng này.
