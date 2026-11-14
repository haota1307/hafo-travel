# Quy ước triển khai

## Phân chia trách nhiệm

- TypeScript bật strict, isolatedModules, NodeNext và ES2023; giữ strictPropertyInitialization: false cho field được framework gán. Type/interface trong decorated signature dùng import type; class DTO/service cần metadata runtime vẫn import giá trị.
- Dùng Node 26.13.0, pnpm 12.18.0 và Nx 24. Compiler CLI TypeScript 7 chạy qua `@typescript/native`; alias API `typescript` dùng TypeScript 6 cho toolchain/editor. Kiểm tra kiểu bằng `pnpm typecheck`.
- ESLint kiểm tra dấu ngoặc và dòng trống giữa các bước; Prettier theo cấu hình server. Tách dòng giữa các method, function và khai báo độc lập.
- Controller nhận input và gọi service/client gRPC. Service điều phối nghiệp vụ; repository truy vấn database; mapper chuyển dữ liệu rõ từng trường.
- Dùng alias `@common/...` cho shared code, import tương đối trong module. Không import controller/service/repository của app khác vào runtime.
- Sắp xếp import theo nhóm: Node.js (`node:...`) → package ngoài → alias `@common/...` → đường dẫn tương đối. Mỗi nhóm cách nhau một dòng trống, các import trong nhóm xếp tăng dần theo đường dẫn. Giữ nguyên `import type` và import có side effect theo yêu cầu khởi tạo. File gRPC sinh tự động theo generator, không sửa tay.
- Kiểm tra header Location trước khi đọc ID user từ Keycloak; config bắt buộc dùng getOrThrow. Không dùng any để né lỗi kiểu.
- Tên file theo mẫu controller/service/repository/mapper/util đang có. Không tạo base class, helper hoặc module rỗng trước khi có nhu cầu.

## Contract gRPC

- RPC nội bộ dùng gRPC. Browser, webhook và API bên ngoài dùng HTTP qua BFF; sự kiện bất đồng bộ dự kiến dùng Kafka, chưa có broker/consumer trong source.
- Nguồn contract: `libs/interfaces/src/lib/proto/<service>/v1/*.proto`. Package hiện có: `authorizer.v1` và `useraccess.v1`.
- Sau khi sửa proto, chạy `pnpm proto:generate`. Buf/ts-proto sinh message, client/controller interfaces và constants tại `libs/interfaces/src/lib/grpc/`. Commit proto cùng output; không sửa tay file sinh.
- Generator giữ phần contract, bỏ helper decorator không dùng và comment, sinh `<SERVICE>_METHODS` từ tên RPC trong proto rồi chạy formatter. Controller dùng `@GrpcMethod(SERVICE_NAME, SERVICE_METHODS.METHOD_NAME)`; không viết tay tên RPC hoặc thêm lại message pattern/envelope TCP. Config dùng `protobufFileName` từ output sinh thay vì lặp đường dẫn proto.
- Không đổi hoặc tái sử dụng field number đã phát hành. Khi bỏ field phải reserve tên/number; thay đổi không tương thích cần package/version mới.
- HTTP DTO thuộc `gateway/`; request/response nội bộ lấy từ type sinh. Không alias transport contract sang DTO HTTP hoặc gửi Mongoose document qua service boundary.
- UserProfile/RoleProfile chứa ID chuỗi và thời gian ISO. userProfileMapper chuyển schema sang protobuf rõ từng trường; lookup không tìm thấy trả response thiếu user.
- Claim JWT đã xác minh được truyền qua jwtJson để giữ các claim động. Guard parse object, giữ cấu trúc AuthorizeResponse.MetadataKeys cho request/cache hiện có; không log claim/token.

## Client, metadata và deadline

- Đăng ký client bằng `ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.<SERVICE>)])`. Inject ClientGrpc và gọi `getService<T>(SERVICE_NAME)` trong onModuleInit.
- BFF dùng `requestGrpc(method, request, { processId })` trả Observable. Service nội bộ dùng requestGrpcData trả Promise của protobuf response.
- processId nằm trong metadata x-process-id. Controller có lời gọi tiếp nhận Metadata và ServerUnaryCall, lấy context bằng `grpcCallContext(metadata, call)` rồi truyền xuống service/client.
- Mặc định mỗi lời gọi tối đa 10 giây; deadline là giá trị nhỏ hơn giữa ngân sách cục bộ và deadline nhận vào. Helper truyền native call options và có timeout cục bộ.
- Không tự retry thao tác ghi; channel tắt retry tự động. Hết deadline hoặc unsubscribe có thể hủy RPC đang chờ, nhưng không bảo đảm rollback/dừng transaction hoặc side effect đã chạy.
- Correlation metadata không chứng minh identity/quyền của caller. TLS, xác thực service và delegation cần thiết kế triển khai riêng; không tin user ID chỉ vì caller gửi qua metadata.

## Response và lỗi HTTP

- gRPC controller trả message protobuf trực tiếp. BFF lấy dữ liệu cho HTTP: login trả token object, create-user lấy response.message thành chuỗi.
- HttpResponseInterceptor bọc raw data một lần thành `{ statusCode, message, data, code, processId, duration }`; code thành công là Success. Không bọc ResponseDto trong controller.
- Hai POST hiện trả HTTP 201, body thành công statusCode: 200. Không suy ra HTTP status từ body.
- GrpcLoggingInterceptor đăng ký trước khi listen; chuyển exception thành gRPC status và binary trailer rpc-error-bin giữ HTTP status/message, kể cả mảng validation/Unicode.
- normalizeError đọc trailer khi có; nếu không có thì map UNAUTHENTICATED → 401, PERMISSION_DENIED → 403, NOT_FOUND → 404, UNAVAILABLE → 503, DEADLINE_EXCEEDED → 504; lỗi chưa xác định → 500.
- Log chỉ metadata, method, status và thời gian; không body, password, token, JWT claim hoặc query chứa credentials.
- Validation HTTP trả 400 với message: string[], chưa có field/path hay contract phân trang. Frontend unwrap data.
- BFF mặc định yêu cầu xác thực; endpoint public phải khai báo rõ. User/role API kiểm tra permission theo [RBAC](rbac.md); tạo user yêu cầu đồng thời `user.create` và `user.assign_roles` bằng decorator. User có đúng một role; tạo/thay role nhận mảng `roles` đúng một phần tử. Proxy frontend chưa forward cookie/Authorization.

## Config và bootstrap

- Config app kế thừa BaseConfiguration, dùng ValidateNested/Type và createConfiguration để validate một lần sau khi khởi tạo đủ config con.
- GrpcConfiguration chứa client options; grpcServerOptions dùng bind host riêng. Authorizer mặc định cổng 5100, User-access cổng 5101.
- GRPC_BIND_HOST mặc định 0.0.0.0. AUTHORIZER_SERVICE_HOST/USER_ACCESS_SERVICE_HOST là địa chỉ client gọi tới, mặc định localhost; port theo AUTHORIZER_SERVICE_PORT/USER_ACCESS_SERVICE_PORT.
- Các biến port TCP và HTTP của hai app nội bộ đã bỏ. Authorizer/User-access dùng NestFactory.createMicroservice, đăng ký interceptor rồi listen; chỉ BFF mở HTTP.
- Cả ba bundle copy toàn bộ cây proto sang dist/apps/<app>/proto, giữ đường dẫn import. Loader dùng camelCase, defaults và includeDirs chung; source/test fallback về cây proto gốc.
- envNumber kiểm tra giá trị/khoảng hợp lệ khi khởi tạo. Khi thêm biến môi trường, cập nhật .env.example. Không tự bật TypeORM synchronize, seed hoặc migration database.

## Thêm app/module mới

Generator tham khảo:

```sh
pnpm exec nx g @nx/nest:application apps/catalog --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --useProjectJson
```

Đây chỉ là scaffold. Kiểm tra diff, chuyển test sang apps/catalog/tests, dùng preset Jest chung và cập nhật tsconfig.spec.json. Không tự tạo CRUD/permission chưa được yêu cầu.

Với service gRPC mới: thêm proto/version, chạy generator, đăng ký definition/enum trong grpc.config.ts, biến môi trường, client/provider, bootstrap và copy assets như app hiện có. Cập nhật danh sách build/dev-lite khi cần chạy cùng hệ thống.

Webpack CLI 7 dùng --mode và NODE_ENV theo target. Cấu hình pnpm 12 ở pnpm-workspace.yaml; chỉ cho phép build script đã rà và ngoại lệ peer theo version cụ thể.
