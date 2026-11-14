# Xác thực và RBAC

## Mô hình hiện tại

Keycloak quản lý thông tin đăng nhập và phát hành token. MongoDB lưu hồ sơ ứng dụng, role và permission. Quyền ứng dụng không lấy từ role trong JWT Keycloak.

Một user có đúng một role; một role có nhiều permission. Quyền hiệu lực lấy từ role đó. Contract giữ trường `roles` dạng mảng nhưng bắt buộc đúng một phần tử khi tạo user hoặc thay role; kiểm tra tại HTTP DTO, service gRPC và schema MongoDB. Tên `administrator` không tự bỏ qua kiểm tra quyền; seed cấp danh sách permission cụ thể cho role này.

Tên role là khóa động dạng chữ thường, bắt đầu bằng chữ, dùng chữ/số/gạch dưới/gạch ngang và tối đa 64 ký tự. Permission phải thuộc enum `PERMISSION`; thêm nghiệp vụ mới cần bổ sung permission và gắn vào endpoint tương ứng. Một số permission user đã được dự trữ nhưng chưa có API CRUD user tương ứng.

## Cơ chế kiểm tra

- `UserGuard` yêu cầu token mặc định. Endpoint public phải gắn `Authorization({ secured: false })`; login là public. Endpoint có `Permissions` vẫn cần xác thực dù được đánh dấu public.
- `PermissionGuard` yêu cầu đủ tất cả permission khai báo, trả 401 khi thiếu xác thực và 403 khi thiếu quyền.
- Redis cache kết quả xác minh JWT tối đa 30 phút, không vượt `exp`. Khi dùng cache, guard vẫn gọi User-access để lấy user/role/permission mới. Token không có `exp` không được cache.
- Đổi role hoặc sửa permission có hiệu lực với lần kiểm tra quyền tiếp theo; không chờ token hết hạn. Request đã vượt qua guard trước thay đổi có thể tiếp tục xử lý.
- Role ID phải hợp lệ và tồn tại trước khi gán. Tạo user kiểm tra role trước khi tạo tài khoản Keycloak. Mảng role rỗng hoặc nhiều hơn một phần tử trả 400.
- Không xóa role đang được user sử dụng; API trả 409. Cần chuyển user sang role khác trước khi xóa. Role có thể có permission rỗng nếu user không được thực hiện tác vụ quản trị.

## HTTP API

Đường dẫn dưới đây dùng prefix mẫu `/api`. Response giữ envelope chung, `data` chứa dữ liệu nêu trong bảng.

| Method | Endpoint              | Quyền                               | Dữ liệu/kết quả                                         |
| ------ | --------------------- | ----------------------------------- | ------------------------------------------------------- |
| POST   | `/authorizer/login`   | Public                              | `{ username, password }` → accessToken/refreshToken     |
| GET    | `/user/me`            | Đăng nhập                           | `{ user, permissions }`; user có roles đầy đủ           |
| POST   | `/user`               | `user.create` + `user.assign_roles` | Tạo user với đúng một role; kết quả là chuỗi thông báo  |
| PATCH  | `/user/:userId/roles` | `user.assign_roles`                 | `{ roles: [roleId] }` thay role hiện tại; trả hồ sơ mới |
| GET    | `/role/permissions`   | `role.get_all`                      | Danh sách permission hợp lệ                             |
| GET    | `/role`               | `role.get_all`                      | Danh sách role, chưa phân trang                         |
| GET    | `/role/:id`           | `role.get_by_id`                    | Chi tiết role                                           |
| POST   | `/role`               | `role.create`                       | Tạo role                                                |
| PUT    | `/role/:id`           | `role.update`                       | Thay toàn bộ name/description/permissions               |
| DELETE | `/role/:id`           | `role.delete`                       | Xóa role chưa được sử dụng; role đang được gán trả 409  |

`:userId` là ID tài khoản Keycloak, tương ứng `user.userId`, không phải `user.id` của MongoDB. `:id` và phần tử trong `roles` là ID MongoDB của role.

Body tạo/thay role:

```json
{
  "name": "operator",
  "description": "Nhân viên được tạo hồ sơ người dùng",
  "permissions": ["user.create"]
}
```

Người có `user.assign_roles` có thể cấp mọi role hiện có, gồm administrator. Người có quyền tạo/sửa role có thể cấp mọi permission trong danh mục. Đây là các quyền quản trị nhạy cảm; không tự gán cho vai trò sản phẩm khi chưa chốt yêu cầu.

## Khởi tạo quản trị đầu tiên

Không mở API public để tạo admin đầu tiên. Tạo tài khoản trong realm Keycloak đã cấu hình, đặt mật khẩu và lấy ID tài khoản. Công cụ dưới đây liên kết hồ sơ MongoDB với ID được cung cấp; không gọi Keycloak để xác minh hoặc tạo tài khoản.

Trong `.env` riêng, điền `MONGODB_URL`, `MONGODB_DB_NAME` và bốn biến `BOOTSTRAP_ADMIN_KEYCLOAK_ID`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME`. Không commit file này. Chạy từ `server` khi đã chọn đúng database:

```sh
node --env-file=.env tools/bootstrap-admin.cjs
```

Công cụ cập nhật/tạo role administrator bằng danh sách permission trong seed, bao gồm `user.assign_roles`, và đặt role duy nhất của user được chỉ định thành administrator. Role trước đó của user được thay thế. Việc cập nhật role ảnh hưởng mọi user đang mang role administrator. Công cụ từ chối khi email/Keycloak ID xung đột với hồ sơ có sẵn. Chạy lại với cùng đầu vào không tạo thêm user/role trong trường hợp dữ liệu hiện tại không trùng khóa. Công cụ không chạy tự động khi app khởi động và chưa được chạy trên dữ liệu thật trong thay đổi này.

Role name có unique index. Nếu database cũ đã có tên role trùng nhau, cần xử lý dữ liệu trùng trước khi áp dụng index; không tự xóa/merge role. Không chạy seed chế độ prune lên dữ liệu đang sử dụng.

Dữ liệu user cũ chưa có role hoặc có nhiều role cần được chuyển về đúng một role hợp lệ. Thay đổi này không tự chạy migration hoặc sửa dữ liệu đang dùng.

Sau đó đăng nhập qua `/authorizer/login`, dùng `Authorization: Bearer <accessToken>` gọi `/user/me`, rồi quản lý role/user qua API hoặc Swagger.

## Ranh giới hiện tại và kiểm chứng

RBAC được áp dụng tại BFF HTTP. gRPC nội bộ chưa có TLS/workload identity hoặc kiểm tra quyền caller riêng; chỉ cho BFF/service tin cậy truy cập cổng 5100/5101, không công bố chúng ra mạng không tin cậy. Khi triển khai service caller bên ngoài ranh giới này, phải bổ sung xác thực và ủy quyền tại service boundary.

Frontend chưa tích hợp session/refresh và proxy chưa chuyển tiếp Authorization; chưa thể coi UI đã đăng nhập thật. Không lưu token vào localStorage để nối tạm luồng này.

Test BFF chạy HTTP và gRPC thật trên localhost, dùng JWT ký bằng key test; MongoDB, Keycloak/JWKS và Redis được mock. Test kiểm tra 401/403, CRUD role, validation role, gán/thu hồi quyền và cache. Kết quả local không chứng minh cấu hình dịch vụ thật đã hoạt động. Luồng tạo Keycloak rồi lưu MongoDB vẫn không có transaction chung.
