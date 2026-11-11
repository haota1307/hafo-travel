# Backend starter

Bộ khung Nx + NestJS microservices để phát triển nghiệp vụ mới.

Hướng dẫn cho AI và quy ước phát triển: [documents/instructions](documents/instructions/README.md). Test nằm trong `apps/<app>/tests/` hoặc `libs/<lib>/tests/`, tách khỏi source runtime.

## Thành phần giữ lại

- `apps/bff`: HTTP gateway, Swagger, validation, logging và guards.
- `apps/authorizer`: đăng nhập Keycloak, kiểm tra JWT, TCP và gRPC.
- `apps/user-access`: tạo/tra cứu người dùng, lưu người dùng và vai trò trong MongoDB.
- `libs`: cấu hình, constants, decorators, entities, guards, interceptors, interfaces, middlewares, schemas và utils.
- BaseEntity + TypeORM/PostgreSQL cho module mới; BaseSchema + MongoDB cho dữ liệu hiện tại.
- Redis, Docker providers, seed vai trò, ESLint, Prettier, Jest và CI.

Đã bỏ nghiệp vụ hóa đơn/sản phẩm, API và các hợp đồng dữ liệu tương ứng, quyền kế toán, e2e hóa đơn và liên kết Nx Cloud cũ.

## Cấu hình và chạy

Dùng Node.js 22 (từ 22.13) hoặc Node.js 24 và pnpm 10.29.3. `packageManager` khóa phiên bản pnpm dùng chung với CI.

Dependency được ghim phiên bản cụ thể trong `package.json` và `pnpm-lock.yaml`. Nền tảng hiện tại dùng Nx 22.7.12, NestJS 11.2.6, TypeScript 5.9.3 và ESLint 10. Khi nâng cấp tiếp, chạy migration của Nx và kiểm tra tương thích trước khi chuyển major của NestJS/TypeScript/TypeORM.

Override `@nestjs/swagger>js-yaml` lên 5.4.1 để áp dụng bản vá bảo mật trong cùng major; có thể bỏ override khi Swagger cập nhật dependency này. Công cụ seed dùng MongoDB driver được Mongoose cung cấp qua `mongoose.mongo`, không cần cài driver trực tiếp riêng.

1. Chạy `pnpm install --frozen-lockfile`.
2. Tạo `.env` từ `.env.example` cho dự án mới, điền cấu hình Keycloak. File .env hiện tại vẫn giữ thông tin kết nối local, chỉ bỏ biến service đã xóa. Đổi database/realm để dùng dữ liệu độc lập. **.env đã được Git theo dõi từ dự án gốc; .gitignore không tự bỏ tracking. Khi tạo repository mới, chỉ đưa .env.example vào Git.**
3. Chạy `docker compose -f docker-compose.provider.yaml up -d`. Compose dùng thư mục docker/backend_data mới, không sửa/xóa docker/docker_data cũ. Các cổng mặc định cần còn trống.
4. Trong Keycloak tại http://localhost:8180, tạo realm/client khớp .env. Luồng hiện có dùng client secret, client_credentials và password grant: cấu hình client authentication, service account có quyền quản lý người dùng và direct access grants tương ứng. Realm/client không được tự seed.
5. Seed quyền vào database mới bằng `node --env-file=.env tools/seed.js apps/user-access/src/seeds migrate`. Seed chỉ chứa administrator với quyền user/role, không tự tạo tài khoản quản trị. Không dùng seed này để chuyển đổi database cũ.
6. Chạy `pnpm dev-lite` để bật ba service bff, user-access và authorizer.

Swagger theo cấu hình mẫu: http://localhost:3300/api/docs.

PostgreSQL/pgAdmin là tùy chọn: `docker compose -f docker-compose.provider.yaml --profile postgres up -d`.

## Phát triển nghiệp vụ mới

Thêm module/service theo cấu trúc controller → service → repository đang có. DTO dùng chung nằm trong libs/interfaces; tên TCP service/message nằm trong libs/configuration và libs/constants.

Controller TCP trả dữ liệu trực tiếp, không gọi `TcpResponse.success`. Khi tạo service TCP mới, dùng `connectTcpMicroservice(app, tcpOptions)` theo `apps/user-access/src/main.ts`: helper đăng ký logging/response interceptor trước khi Nest khởi tạo listener. gRPC vẫn được cấu hình riêng theo contract protobuf.

Các app tạo config bằng `createConfiguration(Configuration)` để validate một lần sau khi khởi tạo đủ config con. Kiểu truyền TCP là `TcpRequest<T>`/`TcpResponse<T>`, tách biệt với Request/Response của Express. Các file tiện ích dùng hậu tố `.util.ts`.

Controller BFF gọi `requestTcp` để chuyển tiếp nguyên response TCP. `HttpResponseInterceptor` chuyển envelope TCP thành `ResponseDto` và thêm `processId`/`duration`; không gọi `new ResponseDto` trong controller. Client nội bộ dùng `requestTcpData` để lấy `.data`. Hai helper có timeout mặc định 10 giây, có thể truyền timeout riêng; timeout không hủy công việc đã chạy ở service nhận và không tự retry thao tác ghi.

`normalizeError` dùng chung cho HTTP/TCP, chỉ chấp nhận status số 400–599; lỗi kết nối trả 503, timeout trả 504, lỗi chưa xác định trả 500. `TcpLoggingInterceptor` được đăng ký chung tại bootstrap TCP. Logging chỉ ghi metadata, không ghi body, params hay query string chứa thông tin đăng nhập.

`Authorization({ secured: false })` bỏ yêu cầu xác thực cho handler được đánh dấu; metadata ở method ưu tiên hơn class. Cache xác thực tối đa 30 phút và không vượt thời hạn JWT; token không có `exp` được xác thực mỗi lần và không cache. Redis lỗi thì xác thực qua authorizer. Cấu hình số dùng `envNumber`: ưu tiên tham số truyền vào, sau đó biến môi trường, rồi mặc định; giá trị sai bị từ chối lúc khởi tạo.

TypeORM đã bỏ entity sản phẩm và dùng autoLoadEntities. Đăng ký entity mới qua TypeOrmModule.forFeature và bổ sung TYPEORM_CONFIG/TypeOrmProviders ở service sử dụng. synchronize mặc định tắt; quản lý schema bằng migration của dự án mới.

Giữ nguyên phạm vi xác thực/phân quyền hiện có: UserGuard chỉ kiểm tra handler được đánh dấu secured; PermissionGuard đọc decorator Permissions. Endpoint tạo người dùng hiện chưa gắn các decorator này; module role chưa có API CRUD hoàn chỉnh. Enum/seed quyền không có nghĩa là mọi API đã được triển khai hoặc bảo vệ. Khi thêm endpoint cần khai báo rõ cơ chế truy cập.

## Kiểm tra

- `pnpm build`: build ba service còn lại.
- `pnpm lint`: kiểm tra lint workspace.
- `pnpm exec nx run-many -t test`: chạy các test được bổ sung cho dự án mới.

Việc dọn source không chạy seed/migration, không khởi động container và không xóa dữ liệu database hiện có.
