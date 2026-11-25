# Xác thực và RBAC

## Mô hình hiện tại

Identity lưu hồ sơ, role và permission trong MongoDB. Hồ sơ mới có `userId` dạng UUID do Identity cấp.

Một user có đúng một role; một role có nhiều permission. Quyền hiệu lực lấy từ role đó. Contract giữ trường `roles` dạng mảng nhưng bắt buộc đúng một phần tử khi tạo user hoặc thay role; kiểm tra tại HTTP DTO, service gRPC và schema MongoDB. Tên `administrator` không tự bỏ qua kiểm tra quyền; seed cấp danh sách permission cụ thể cho role này.

Tên role là khóa động dạng chữ thường, bắt đầu bằng chữ, dùng chữ/số/gạch dưới/gạch ngang và tối đa 64 ký tự. Permission phải thuộc enum `PERMISSION`; thêm nghiệp vụ mới cần bổ sung permission và gắn vào endpoint tương ứng. Một số permission user đã được dự trữ nhưng chưa có API CRUD user tương ứng.

## Cơ chế kiểm tra

- `UserGuard` yêu cầu bearer token cho route bảo vệ. BFF xác minh chữ ký HS256, issuer, audience và thời hạn. Access JWT chứa `sub`, `profileId` và `roleId` tại thời điểm cấp. BFF tra role hiện tại theo `userId` và permissions theo `roleId`. Hai giá trị được cache riêng trong Redis để các user cùng role dùng chung danh sách quyền. Route public có khai báo permission vẫn yêu cầu xác thực.
- Khi thiếu cache, BFF lấy dữ liệu từ Identity qua gRPC. Identity đánh dấu key trước khi ghi thay đổi role hoặc gán lại role cho user. Trong lúc ghi, request đọc trực tiếp từ Identity. Khi ghi xong, Identity xóa key liên quan. Request sau đó nhận quyền mới ngay cả khi dùng access token đã cấp. Kết quả đọc bắt đầu trước khi đổi quyền không thể ghi đè cache mới.
- BFF và Identity phải dùng chung Redis trong cùng môi trường. TTL của cache phân quyền lấy từ `REDIS_TTL` (giây). Nếu Redis lỗi khi đọc quyền, guard tra Identity. Nếu Identity không thể đánh dấu key trên Redis trước khi ghi, thao tác thay đổi phân quyền trả 503.
- `PermissionGuard` yêu cầu đủ tất cả permission khai báo, trả 401 khi thiếu xác thực và 403 khi thiếu quyền.
- Role ID phải hợp lệ và tồn tại trước khi gán. Tạo user kiểm tra role trước khi lưu hồ sơ. Mảng role rỗng hoặc nhiều hơn một phần tử trả 400.
- Không xóa role đang được user sử dụng; API trả 409. Cần chuyển user sang role khác trước khi xóa. Role có thể có permission rỗng nếu user không được thực hiện tác vụ quản trị.

## HTTP API

Các route dưới đây yêu cầu bearer hợp lệ và dùng prefix mẫu `/api`.

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

### Cấp thông tin đăng nhập

Chạy công cụ từ `server` bằng Node trong phiên bản dự án. Hai biến `MONGODB_URL` và `IDENTITY_MONGODB_DB_NAME` chọn database đích. Truyền mật khẩu qua môi trường riêng của process hoặc secret manager. Bỏ biến mật khẩu sau khi chạy.

1. Chạy `node tools/auth-storage.cjs migrate` trước khi khởi động phiên bản mới. Migration tạo collection phiên, các index tra cứu token, TTL và index bảo đảm một tài khoản bootstrap. Có thể chạy lại. Nếu có xung đột index hoặc email trùng, công cụ dừng để người vận hành đối chiếu dữ liệu.
2. Trên DB mới, chạy `pnpm exec nx run identity:seed` để tạo role administrator. Với DB đang sử dụng, kiểm tra role đã tồn tại trước khi seed.
3. Để tạo tài khoản quản trị đầu tiên, đặt `ADMIN_ACCOUNT` (email), `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` rồi chạy `node tools/provision-credentials.cjs administrator`. Email phải chưa thuộc hồ sơ khác. Lần chạy lại cùng tài khoản giữ nguyên mật khẩu.
4. Để cấp mật khẩu lần đầu cho hồ sơ có sẵn, đặt `AUTH_PROFILE_ID` bằng MongoDB `_id` và `AUTH_PROFILE_PASSWORD`, chạy `node tools/provision-credentials.cjs profile`. Công cụ giữ nguyên role và mật khẩu đã cấp. Hồ sơ cần có email hợp lệ, `userId` và đúng một role tồn tại. Mật khẩu mới cho cả quản trị viên và người dùng cần ít nhất 8 ký tự và tối đa 1.024 byte UTF-8.

### Khóa ký JWT

Identity ký JWT bằng HS256 với hai khóa riêng. `AC_TOKEN_KEY` dùng để ký access JWT và được cấp cho BFF để xác minh audience `bff`. Chỉ Identity cần `RF_TOKEN_KEY` để ký và xác minh refresh JWT có audience `identity-refresh` và `tokenUse=refresh`.

Khi chạy local, đặt hai giá trị khác nhau trong `server/.env`. Sinh độc lập mỗi khóa từ ít nhất 32 byte ngẫu nhiên cho từng môi trường. Có thể chạy `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` hai lần. Khi chuyển từ khóa dùng chung, có thể giữ giá trị cũ cho `AC_TOKEN_KEY` và sinh mới `RF_TOKEN_KEY`. Access JWT đã cấp còn hiệu lực đến hạn. Người dùng có refresh JWT ký bằng khóa cũ cần đăng nhập lại khi gia hạn phiên.

### API đăng nhập và vòng đời phiên

| HTTP tại BFF | Dữ liệu gửi | Kết quả trong `data` |
| --- | --- | --- |
| `POST /api/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, accessExpiresIn, refreshExpiresIn }` |
| `POST /api/auth/refresh` | `{ refreshToken }` | Cặp token mới và thời gian còn lại tính bằng giây |
| `GET /api/user/me` | Header `Authorization: Bearer <accessToken>` | Hồ sơ và role hiện tại từ Identity, `permissions` cấp cao nhất là quyền hiệu lực của role hiện tại |
| `POST /api/auth/logout` | `{ refreshToken }` | `{ loggedOut: true }`, có thể gọi lặp với cùng token |

Login ưu tiên email khớp chính xác của hồ sơ cũ. Tài khoản tự đăng ký dùng email chữ thường. Email chưa có tài khoản, hồ sơ chưa cấp mật khẩu và mật khẩu sai đều trả 401 với cùng mã. Redis giới hạn mặc định 100 request mỗi phút theo địa chỉ kết nối và endpoint, riêng login thêm 10 lần mỗi phút theo email. Sau reverse proxy, nhiều người có thể dùng chung hạn mức IP. BFF trả 429 khi vượt hạn mức.

Identity băm mật khẩu bằng scrypt với salt riêng. Khi login hoặc refresh, Identity đọc hồ sơ cùng role hiện tại rồi ký access JWT cho BFF. `AUTH_ACCESS_TTL_SECONDS` mặc định 300, thời hạn thực tế tối đa 5 phút và được giới hạn bởi thời gian còn lại của phiên.

Refresh JWT có `jti` riêng cho mỗi lần cấp. `AUTH_REFRESH_TTL_SECONDS` mặc định 604800 (7 ngày), tính từ lần đăng nhập. Xoay token giữ nguyên mốc hết hạn đó. Khi refresh, Identity kiểm tra chữ ký và các claim rồi dùng bản băm SHA-256 của toàn bộ refresh JWT để tìm phiên còn hiệu lực trong MongoDB. Bản ghi phiên giữ bản băm refresh, ID hồ sơ và thời hạn. TTL index dọn phiên hết hạn.

Hai yêu cầu refresh cùng token chỉ có một yêu cầu thành công. Sau refresh, chỉ refresh token mới có thể gia hạn tiếp. Access JWT đã cấp tiếp tục dùng được đến `exp`, kể cả sau logout. Khi role hoặc quyền thay đổi, BFF áp dụng quyền mới ở request kế tiếp. Cookie ở trình duyệt được xóa sau khi logout thành công. Trong 30 giây, refresh token ngay trước đó vẫn có thể thu hồi cùng phiên để xử lý logout đồng thời. Mất kết nối ngay sau khi server xoay token có thể yêu cầu người dùng đăng nhập lại. Mỗi lần đăng nhập tạo phiên độc lập, logout chỉ thu hồi phiên được gửi.

Trình duyệt gọi Next `POST /api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` trên cùng origin. Hai route sau đọc refresh cookie phía server. Cookie dùng HttpOnly, SameSite=Lax và trong production có Secure cùng tiền tố `__Host-`. Next chỉ trả trạng thái trong JSON. Xem [cấu hình client](../../client/README.md).

### Tự đăng ký và khôi phục tài khoản

| POST tại BFF | Body | Kết quả |
| --- | --- | --- |
| `/api/auth/register` | `email, locale?` | Gửi liên kết xác thực cho email mới qua Notification. |
| `/api/auth/verify-email` | `token, firstName, lastName, password` | Tạo tài khoản đã xác thực với đúng role `client`. |
| `/api/auth/forgot-password` | `email, locale?` | Gửi liên kết cho tài khoản có mật khẩu. Response thành công giống nhau khi email không đủ điều kiện. |
| `/api/auth/reset-password` | `token, password` | Đổi mật khẩu và phiên bản thông tin đăng nhập trong cùng thao tác MongoDB. |
| `/api/auth/google` | `credential, emailToken?, locale?` | Xác minh ID token Google cho đúng client ID và cấp cặp token phiên hiện có. |

Identity ký token liên kết 30 phút với audience riêng cho từng thao tác. Token nằm trong fragment của liên kết để Next chỉ nhận token qua POST khi người dùng gửi form. Đăng ký lưu email chữ thường, tạo hồ sơ khi người nhận chọn mật khẩu. Unique index email ngăn tạo lại tài khoản. Yêu cầu mới được gửi từ màn hình đăng ký hoặc quên mật khẩu. Sau khi đổi mật khẩu, các liên kết khôi phục và refresh token phiên bản cũ hết hiệu lực. Access token đã cấp còn hiệu lực tối đa 5 phút.

Với tài khoản Google dùng địa chỉ bên thứ ba ngoài Gmail và Google Workspace, lần đăng ký đầu tiên cần mở liên kết email rồi chọn lại đúng tài khoản Google.

Google tra tài khoản bằng `sub` đã được xác minh. Tài khoản Google mới phải có email Google đã xác minh và được gán role `client`. Trùng email của một tài khoản khác trả 409 để người dùng đăng nhập bằng phương thức hiện có. Tài khoản chỉ dùng Google khôi phục quyền truy cập qua Google.

Migration `node tools/auth-storage.cjs migrate` tạo index duy nhất cho Google subject và thêm role `client` với danh sách quyền rỗng nếu thiếu. Seed cho DB mới chứa cả `administrator` và `client`. Hai endpoint gửi mail dùng cùng giới hạn theo email như login.

Role name có unique index. Nếu database cũ đã có tên role trùng nhau, cần xử lý dữ liệu trùng trước khi áp dụng index; không tự xóa/merge role. Không chạy seed chế độ prune lên dữ liệu đang sử dụng.

Dữ liệu user cũ chưa có role hoặc có nhiều role cần được chuyển về đúng một role hợp lệ. Thay đổi này không tự chạy migration hoặc sửa dữ liệu đang dùng.

## Ranh giới hiện tại và kiểm chứng

RBAC được áp dụng tại BFF HTTP. gRPC nội bộ chưa có TLS/workload identity hoặc kiểm tra quyền caller riêng; chỉ cho BFF/service tin cậy truy cập cổng 5101, không công bố chúng ra mạng không tin cậy. Khi triển khai service caller bên ngoài ranh giới này, phải bổ sung xác thực và ủy quyền tại service boundary.

Next nhận thông tin đăng nhập qua route cùng origin và trả cookie HttpOnly. Browser gọi `/api/backend/user/me` để lấy hồ sơ. Khi vận hành, đặt Next sau HTTPS và chỉ cho các service tin cậy truy cập BFF, Identity và MongoDB. Ở máy phát triển, dùng `GRPC_BIND_HOST=127.0.0.1`. Trong container, chỉ bind lên mạng nội bộ có kiểm soát.
