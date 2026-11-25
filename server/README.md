# Backend starter

Bộ khung Nx + NestJS microservices để phát triển nghiệp vụ mới.

Hướng dẫn cho AI và quy ước phát triển: [instructions](instructions/README.md). Test nằm trong `apps/<app>/tests/` hoặc `libs/<lib>/tests/`, tách khỏi source runtime.

## Thành phần giữ lại

- `apps/bff`: HTTP gateway, Swagger, validation, logging và guards.
- `apps/identity`: tạo/tra cứu người dùng, gán role và CRUD role, lưu MongoDB.
- Ba app gRPC `booking`, `payment` và `ai-agent` đã có khung module nghiệp vụ. [Sơ đồ và trách nhiệm từng module](instructions/services.md).
- `apps/notification`: app gRPC gửi email qua Resend.
- `libs`: cấu hình, constants, decorators, entities, guards, interceptors, interfaces, middlewares, schemas và utils.
- BaseEntity + TypeORM/PostgreSQL cho module mới; BaseSchema + MongoDB cho dữ liệu hiện tại.
- Redis, Docker providers, seed vai trò, ESLint, Prettier và Jest.

Đã bỏ nghiệp vụ hóa đơn/sản phẩm, API và các hợp đồng dữ liệu tương ứng, quyền kế toán, e2e hóa đơn và liên kết Nx Cloud cũ.

## Cấu hình và chạy

Dùng Node.js 26.13.0 LTS và pnpm 12.18.0 theo `.nvmrc` ở root. Với nvm-windows, chạy `nvm use 26.13.0`; cài `npm install -g pnpm@12.18.0` nếu chưa có. `engines` giới hạn Node 26/pnpm 12 và `packageManager` khóa phiên bản pnpm.

Dependency được ghim stable trong `package.json` và `pnpm-lock.yaml`: Nx 24.0.6, NestJS 12.4.2, TypeORM 1.1.2, Mongoose 9.12.1 và ESLint 10.14.0. Compiler TypeScript 7.0.2 cài qua `@typescript/native`; alias `typescript` trỏ tới `@typescript/typescript6@6.0.2` cho programmatic API của Nx, ts-loader, ts-jest và editor theo [hướng dẫn Nx](https://nx.dev/docs/kb/typescript-7). Khi nâng tiếp, chạy migration và kiểm tra tương thích cả toolchain.

Cấu hình pnpm 12 nằm trong `pnpm-workspace.yaml`, gồm `allowBuilds` và các ngoại lệ version được ghim. Override schematics của `@nx/nest` lên 12.0.13; peer ngoại lệ chỉ cho phép Nest 12.4.2 với `@nx/nest` và webpack-dev-server 6.1.0 với `@nx/webpack` vì metadata Nx 24.0.6 còn khai báo major cũ. Giữ kiểm tra peer chung và kiểm chứng build/test/generator khi sửa các ngoại lệ. Công cụ seed dùng MongoDB driver từ `mongoose.mongo`.

1. Chạy `pnpm install --frozen-lockfile`.
2. Tạo `.env` từ `.env.example`, điền thông tin kết nối và [hai khóa riêng cho access JWT và refresh JWT](instructions/rbac.md#khóa-ký-jwt). Dùng database riêng để giữ dữ liệu độc lập; chỉ đưa `.env.example` vào Git.
3. Chạy `docker compose -f docker-compose.provider.yaml up -d` để bật đủ MongoDB 9.0.4, Redis 8.10.3, PostgreSQL 18.6 và pgAdmin 9.19.0. Dữ liệu nằm trong `docker/docker_data`, với các thư mục `mongodb-9`, `redis-8`, `postgresql-18` và `pgadmin-9`. Các cổng mặc định cần còn trống.
4. Chạy `pnpm dev-lite` để bật BFF, Identity và Notification.

Từ thư mục `server`, dùng `pnpm exec nx serve booking` để xem riêng một app mới hoặc `pnpm dev` để chạy cả sáu app. Booking, Payment và AI Agent chỉ cần Node và các dependency đã cài. BFF và Identity dùng Redis/MongoDB theo cấu hình bên trên.

Các app dùng chung `server/.env`. Identity chọn database qua `IDENTITY_MONGODB_DB_NAME`, AI Agent qua `AI_AGENT_MONGODB_DB_NAME`. Từ thư mục `server` có thể chạy bundle đã build bằng `node dist/apps/booking/main.js`. [Cấu hình theo service](instructions/services.md#cấu-hình-và-seed).

Để gửi email, điền `RESEND_API_KEY` có quyền gửi và `RESEND_FROM_EMAIL` là địa chỉ gửi trên domain đã xác minh với Resend vào `server/.env`. Chạy riêng app bằng `pnpm exec nx serve notification`. App lắng nghe gRPC ở cổng `5105`. Khi chưa cấu hình Resend, app vẫn khởi động và trả `UNAVAILABLE` cho yêu cầu gửi.

Đăng ký và khôi phục tài khoản dùng `AUTH_PUBLIC_ORIGIN` để tạo liên kết về client. Chạy `node tools/auth-storage.cjs migrate` để chuẩn bị index và role `client`. Đăng nhập Google dùng `GOOGLE_CLIENT_ID` cùng giá trị với `NEXT_PUBLIC_GOOGLE_CLIENT_ID` của client. Xem [luồng tự đăng ký và khôi phục](instructions/rbac.md#tự-đăng-ký-và-khôi-phục-tài-khoản).

RPC nội bộ `notification.v1.NotificationService/SendEmail` nhận `to`, `subject`, ít nhất một trong hai trường `text` hoặc `html`, và `idempotencyKey`. Dùng một khóa riêng cho mỗi email và giữ cùng khóa cùng nội dung khi thử lại. `emailId` là mã Resend trả về khi tiếp nhận thư. [Contract gRPC](libs/interfaces/src/lib/proto/notification/v1/notification.proto) · [API gửi email của Resend](https://resend.com/docs/api-reference/emails/send-email) · [Quy tắc chống gửi trùng](https://resend.com/docs/dashboard/emails/idempotency-keys).

Khi nâng cấp môi trường đang có dữ liệu Identity, đổi tên biến `MONGODB_DB_NAME` thành `IDENTITY_MONGODB_DB_NAME` và giữ giá trị hiện tại. Nếu môi trường cũ dùng mặc định, đặt `IDENTITY_MONGODB_DB_NAME=backend_app` để tiếp tục đọc dữ liệu cũ. Môi trường mới mặc định dùng `identity`.

Swagger theo cấu hình mẫu: http://localhost:3300/api/docs.

Compose mặc định bật bốn dịch vụ, không cần profile. MongoDB dùng cổng 27017, Redis 6379, PostgreSQL 5432, và pgAdmin http://localhost:5050.

PostgreSQL 18 mount volume tại `/var/lib/postgresql`. Các thư mục dữ liệu cũ như `postgres_data` (PostgreSQL 17) được giữ nguyên trong `docker/docker_data`. Nếu cần dữ liệu cũ, thực hiện backup và migration riêng trước khi đổi volume; seed role chỉ chạy lên database mới được chọn rõ. Khi chuyển thư mục dữ liệu đang dùng, dừng container trước khi di chuyển và giữ đúng phiên bản database.

## Phát triển nghiệp vụ mới

Thêm module/service theo cấu trúc controller → service → repository. Contract ở `libs/interfaces/src/lib/proto/<service>/v1`; chạy `pnpm proto:generate` và commit type sinh trong `libs/interfaces/src/lib/grpc`. Buf/ts-proto giữ contract, bỏ helper decorator/comment không dùng, sinh hằng số tên RPC `<SERVICE>_METHODS` từ proto và chạy formatter.

Identity dùng `NestFactory.createMicroservice`, chỉ mở gRPC. BFF giữ HTTP/Swagger, lấy typed client qua `GrpcProvider` và `ClientGrpc.getService` trong `onModuleInit`. Controller dùng `@GrpcMethod(SERVICE_NAME, SERVICE_METHODS.METHOD_NAME)`, package/service/method khớp proto; config lấy đường dẫn từ `protobufFileName` được sinh cùng contract.

Các app dùng `createConfiguration(Configuration)` để khởi tạo và kiểm tra cấu hình. Các app gRPC khai báo `GRPC_SERV` và `APP_CONFIG` theo mẫu Identity. Mỗi app chọn địa chỉ lắng nghe bằng `grpcServerOptions` tại `src/main.ts`. Các bundle copy cây proto vào `dist/apps/<app>/proto`, giữ đường dẫn import. HTTP DTO thuộc `gateway`; schema MongoDB được map rõ sang UserProfile/RoleProfile trước khi trả gRPC.

BFF dùng `requestGrpc` lấy raw protobuf response; `HttpResponseInterceptor` bọc một lần thành `ResponseDto`. Create-user lấy `response.message` để giữ data dạng chuỗi. Service nội bộ dùng `requestGrpcData` trả Promise. Metadata `x-process-id` giữ correlation ID; `grpcCallContext(metadata, call)` truyền deadline còn lại qua các chặng.

RPC mặc định tối đa 10 giây, không vượt deadline nhận vào và không tự retry. Hủy RPC đang chờ không bảo đảm rollback/dừng side effect đã chạy. `GrpcLoggingInterceptor` giữ thông báo lỗi nghiệp vụ 4xx và dùng `INTERNAL_SERVER_ERROR` cho chi tiết lỗi nội bộ. BFF đọc status và message từ trailer `rpc-error-bin`, kể cả mảng validation Unicode. Status gRPC chuẩn được map sang HTTP, gồm UNAUTHENTICATED → 401, UNAVAILABLE → 503, DEADLINE_EXCEEDED → 504. Log chỉ metadata, method, status và thời gian.

BFF cung cấp `POST /api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` và tự xác minh access JWT bằng secret dùng chung trước khi chạy API bảo vệ. BFF và Identity dùng chung Redis để cache role hiện tại theo user và permissions theo role. Sửa role hoặc gán lại role qua Identity có hiệu lực từ request kế tiếp. Redis cũng giới hạn tần suất request. Trước khi sử dụng, chạy migration, seed role trên DB mới và cấp credential theo [hướng dẫn vận hành Authentication](instructions/rbac.md#cấp-thông-tin-đăng-nhập).

TypeORM đã bỏ entity sản phẩm và dùng autoLoadEntities. Đăng ký entity mới qua TypeOrmModule.forFeature và bổ sung TYPEORM_CONFIG/TypeOrmProviders ở service sử dụng. synchronize mặc định tắt; quản lý schema bằng migration của dự án mới.

RBAC theo user → đúng một role → nhiều permission, kiểm tra bằng `PermissionGuard` và decorator `Permissions`. Tạo user cần đồng thời `user.create` và `user.assign_roles`; đổi role cần `user.assign_roles`. Trường `roles` giữ dạng mảng nhưng bắt buộc đúng một phần tử. Không xóa role đang được user sử dụng. Role có CRUD và danh mục permission. Tên administrator không có bypass đặc biệt. Xem [contract và quyền truy cập](instructions/rbac.md). gRPC chưa kiểm tra quyền caller, phải nằm trong mạng riêng cho service tin cậy.

## Kiểm tra

App và library dùng TypeScript strict chung; ESLint kiểm tra dấu ngoặc và khoảng cách giữa các bước. Import chia nhóm Node.js → package ngoài → `@common/...` → đường dẫn tương đối, cách nhóm bằng một dòng trống và xếp theo đường dẫn trong mỗi nhóm; xem [quy ước triển khai](instructions/coding.md).

- `pnpm build`: build cả sáu app.
- `pnpm typecheck`: dùng compiler TypeScript 7 để kiểm tra toàn bộ app/library/spec.
- `pnpm lint`: kiểm tra lint workspace.
- `pnpm test` chạy các suite BFF, Identity và interceptors. Suite BFF dùng HTTP và gRPC trên localhost với repository MongoDB được mock.
- `pnpm exec nx run-many -t test`: chạy các test được bổ sung cho dự án mới.

Nâng cấp toolchain đã chạy migration Nx; không chạy seed/migration database, không khởi động container và không xóa dữ liệu hiện có.

Source ứng dụng giữ CommonJS, dùng `module`/`moduleResolution: nodenext` và target ES2023; Node 26 hỗ trợ require ESM của Nest 12. Các target Webpack CLI 7 dùng `--mode` và `NODE_ENV` rõ ràng cho production/development. Jest 30 bật VM Modules qua target default trong `nx.json`; spec dùng `isolatedModules: true` cho ts-jest, kiểm tra kiểu đầy đủ bằng `pnpm typecheck`.

## Tích hợp frontend

Client ở [../client](../client/README.md), cấu hình mẫu `API_URL=http://localhost:3300/api` theo `PORT=3300`, `GLOBAL_PREFIX=api` của `.env.example`. Nếu đổi cấu hình backend, cập nhật URL phía client tương ứng.

BFF có `GET /api/user/me`, tạo user, thay role user và CRUD role theo [bảng API RBAC](instructions/rbac.md). Chưa có `GET /api`. Response HTTP thành công là `{ statusCode, message, data, code, processId, duration }`, giữ `code: Success`. Frontend unwrap `data`; validation 400 trả mảng chuỗi, chưa có field/path hoặc contract phân trang. Next lấy access token từ cookie HttpOnly cho request BFF.

BFF gọi Identity qua `IDENTITY_SERVICE_HOST` và `IDENTITY_SERVICE_PORT` (mặc định `localhost:5101`). Identity bind theo `GRPC_BIND_HOST`. Chỉ cho service tin cậy truy cập cổng gRPC nội bộ.
