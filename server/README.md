# Backend starter

Bộ khung Nx + NestJS microservices để phát triển nghiệp vụ mới.

Hướng dẫn cho AI và quy ước phát triển: [instructions](instructions/README.md). Test nằm trong `apps/<app>/tests/` hoặc `libs/<lib>/tests/`, tách khỏi source runtime.

## Thành phần giữ lại

- `apps/bff`: HTTP gateway, Swagger, validation, logging và guards.
- `apps/authorizer`: đăng nhập Keycloak, kiểm tra JWT, gRPC theo protobuf v1.
- `apps/user-access`: tạo/tra cứu người dùng, lưu người dùng và vai trò trong MongoDB.
- `libs`: cấu hình, constants, decorators, entities, guards, interceptors, interfaces, middlewares, schemas và utils.
- BaseEntity + TypeORM/PostgreSQL cho module mới; BaseSchema + MongoDB cho dữ liệu hiện tại.
- Redis, Docker providers, seed vai trò, ESLint, Prettier và Jest.

Đã bỏ nghiệp vụ hóa đơn/sản phẩm, API và các hợp đồng dữ liệu tương ứng, quyền kế toán, e2e hóa đơn và liên kết Nx Cloud cũ.

## Cấu hình và chạy

Dùng Node.js 26.13.0 LTS và pnpm 12.18.0 theo `.nvmrc` ở root. Với nvm-windows, chạy `nvm use 26.13.0`; cài `npm install -g pnpm@12.18.0` nếu chưa có. `engines` giới hạn Node 26/pnpm 12 và `packageManager` khóa phiên bản pnpm.

Dependency được ghim stable trong `package.json` và `pnpm-lock.yaml`: Nx 24.0.6, NestJS 12.4.2, TypeORM 1.1.2, Mongoose 9.12.1 và ESLint 10.14.0. Compiler TypeScript 7.0.2 cài qua `@typescript/native`; alias `typescript` trỏ tới `@typescript/typescript6@6.0.2` cho programmatic API của Nx, ts-loader, ts-jest và editor theo [hướng dẫn Nx](https://nx.dev/docs/kb/typescript-7). Khi nâng tiếp, chạy migration và kiểm tra tương thích cả toolchain.

Cấu hình pnpm 12 nằm trong `pnpm-workspace.yaml`, gồm `allowBuilds` và các ngoại lệ version được ghim. Override schematics của `@nx/nest` lên 12.0.13; peer ngoại lệ chỉ cho phép Nest 12.4.2 với `@nx/nest` và webpack-dev-server 6.1.0 với `@nx/webpack` vì metadata Nx 24.0.6 còn khai báo major cũ. Giữ kiểm tra peer chung và kiểm chứng build/test/generator khi sửa các ngoại lệ. Công cụ seed dùng MongoDB driver từ `mongoose.mongo`.

1. Chạy `pnpm install --frozen-lockfile`.
2. Tạo `.env` từ `.env.example`, điền thông tin kết nối và cấu hình Keycloak. Dùng database/realm riêng để giữ dữ liệu độc lập; chỉ đưa `.env.example` vào Git.
3. Chạy `docker compose -f docker-compose.provider.yaml up -d` khi đã sẵn sàng dùng database mới. Compose ghim MongoDB 9.0.4, Keycloak 26.8.2, Redis 8.10.3, PostgreSQL 18.6 và pgAdmin 9.19.0. Dữ liệu nằm trong các thư mục riêng theo major ở `docker/backend_data`; không tự dùng lại hoặc chuyển đổi dữ liệu cũ. Các cổng mặc định cần còn trống.
4. Trong Keycloak tại http://localhost:8180, tạo realm/client khớp .env. Luồng hiện có dùng client secret, client_credentials và password grant: cấu hình client authentication, service account có quyền quản lý người dùng và direct access grants tương ứng. Realm/client không được tự seed.
5. Seed quyền vào database mới bằng `node --env-file=.env tools/seed.js apps/user-access/src/seeds migrate`. Seed chỉ chứa administrator với quyền user/role, không tự tạo tài khoản quản trị. Không dùng seed này để chuyển đổi database cũ.
6. Chạy `pnpm dev-lite` để bật ba service bff, user-access và authorizer.

Swagger theo cấu hình mẫu: http://localhost:3300/api/docs.

PostgreSQL/pgAdmin là tùy chọn: `docker compose -f docker-compose.provider.yaml --profile postgres up -d`.

PostgreSQL 18 mount volume tại `/var/lib/postgresql`; Keycloak 26 dùng `KC_BOOTSTRAP_ADMIN_USERNAME`/`KC_BOOTSTRAP_ADMIN_PASSWORD`. Các thư mục dữ liệu cũ được giữ nguyên. Nếu cần dữ liệu cũ, thực hiện backup và migration riêng trước khi đổi volume; seed role chỉ chạy lên database mới được chọn rõ.

## Phát triển nghiệp vụ mới

Thêm module/service theo cấu trúc controller → service → repository. Contract ở `libs/interfaces/src/lib/proto/<service>/v1`; chạy `pnpm proto:generate` và commit type sinh trong `libs/interfaces/src/lib/grpc`. Buf/ts-proto giữ contract, bỏ helper decorator/comment không dùng và chạy formatter.

Authorizer và User-access dùng `NestFactory.createMicroservice`, chỉ mở gRPC. BFF giữ HTTP/Swagger, lấy typed client qua `GrpcProvider` và `ClientGrpc.getService` trong `onModuleInit`. Controller dùng `@GrpcMethod`, package/service/method khớp proto.

Các app dùng `createConfiguration(Configuration)` để validate một lần. `GrpcConfiguration` chứa client options; `grpcServerOptions` chọn bind host riêng. Cả ba bundle copy cây proto vào `dist/apps/<app>/proto`, giữ đường dẫn import. HTTP DTO thuộc `gateway`; schema MongoDB được map rõ sang UserProfile/RoleProfile trước khi trả gRPC.

BFF dùng `requestGrpc` lấy raw protobuf response; `HttpResponseInterceptor` bọc một lần thành `ResponseDto`. Create-user lấy `response.message` để giữ data dạng chuỗi. Service nội bộ dùng `requestGrpcData` trả Promise. Metadata `x-process-id` giữ correlation ID; `grpcCallContext(metadata, call)` truyền deadline còn lại qua các chặng.

RPC mặc định tối đa 10 giây, không vượt deadline nhận vào và không tự retry. Hủy RPC đang chờ không bảo đảm rollback/dừng side effect đã chạy. `GrpcLoggingInterceptor` chuyển exception thành gRPC status cùng trailer `rpc-error-bin`; `normalizeError` khôi phục HTTP status/message, giữ mảng validation/Unicode. Status gRPC chuẩn được map sang HTTP, gồm UNAUTHENTICATED → 401, UNAVAILABLE → 503, DEADLINE_EXCEEDED → 504. Log chỉ metadata, method, status và thời gian.

`Authorization({ secured: false })` bỏ yêu cầu xác thực cho handler được đánh dấu; metadata ở method ưu tiên hơn class. Cache xác thực tối đa 30 phút và không vượt thời hạn JWT; token không có `exp` được xác thực mỗi lần và không cache. Redis lỗi thì xác thực qua authorizer. Cấu hình số dùng `envNumber`: ưu tiên tham số truyền vào, sau đó biến môi trường, rồi mặc định; giá trị sai bị từ chối lúc khởi tạo.

TypeORM đã bỏ entity sản phẩm và dùng autoLoadEntities. Đăng ký entity mới qua TypeOrmModule.forFeature và bổ sung TYPEORM_CONFIG/TypeOrmProviders ở service sử dụng. synchronize mặc định tắt; quản lý schema bằng migration của dự án mới.

Giữ nguyên phạm vi xác thực/phân quyền hiện có: UserGuard chỉ kiểm tra handler được đánh dấu secured; PermissionGuard đọc decorator Permissions. Endpoint tạo người dùng hiện chưa gắn các decorator này; module role chưa có API CRUD hoàn chỉnh. Enum/seed quyền không có nghĩa là mọi API đã được triển khai hoặc bảo vệ. Khi thêm endpoint cần khai báo rõ cơ chế truy cập.

## Kiểm tra

App và library dùng TypeScript strict chung; ESLint kiểm tra dấu ngoặc và khoảng cách giữa các bước. Test Keycloak response ở `apps/authorizer/tests/` dùng mock HTTP, không gọi hệ thống thật.

- `pnpm build`: build ba service còn lại.
- `pnpm typecheck`: dùng compiler TypeScript 7 để kiểm tra toàn bộ app/library/spec.
- `pnpm lint`: kiểm tra lint workspace.
- `pnpm test`: chạy suite BFF/authorizer/interceptors qua Nx; HTTP/Swagger/validation và hai server gRPC dùng localhost, MongoDB/Keycloak/JWKS/cache được mock.
- `pnpm exec nx run-many -t test`: chạy các test được bổ sung cho dự án mới.

Nâng cấp toolchain đã chạy migration Nx; không chạy seed/migration database, không khởi động container và không xóa dữ liệu hiện có.

Source ứng dụng giữ CommonJS, dùng `module`/`moduleResolution: nodenext` và target ES2023; Node 26 hỗ trợ require ESM của Nest 12. Các target Webpack CLI 7 dùng `--mode` và `NODE_ENV` rõ ràng cho production/development. Jest 30 bật VM Modules qua target default trong `nx.json`; spec dùng `isolatedModules: true` cho ts-jest, kiểm tra kiểu đầy đủ bằng `pnpm typecheck`.

## Tích hợp frontend

Client ở [../client](../client/README.md), cấu hình mẫu `API_URL=http://localhost:3300/api` theo `PORT=3300`, `GLOBAL_PREFIX=api` của `.env.example`. Nếu đổi cấu hình backend, cập nhật URL phía client tương ứng.

BFF hiện có `POST /api/authorizer/login` và `POST /api/user`, chưa có `GET /api`. Response HTTP thành công là `{ statusCode, message, data, code, processId, duration }`, giữ `code: Success`. Frontend unwrap `data`; validation 400 trả mảng chuỗi, chưa có field/path hoặc contract phân trang. UI frontend chưa tích hợp auth thật và proxy chưa chuyển tiếp cookie/Authorization.

Client gọi Authorizer bằng `AUTHORIZER_SERVICE_HOST`/`AUTHORIZER_SERVICE_PORT` (mặc định `localhost:5100`), User-access bằng `USER_ACCESS_SERVICE_HOST`/`USER_ACCESS_SERVICE_PORT` (`localhost:5101`). Server bind bằng `GRPC_BIND_HOST`, mặc định `0.0.0.0`. Các biến `TCP_*`, `AUTHORIZER_PORT`, `USER_ACCESS_PORT` cũ không còn dùng; cập nhật `.env` theo `.env.example`, giữ secret/kết nối riêng. Transport nội bộ hiện chưa cấu hình TLS/service identity; cần chốt trước production.
