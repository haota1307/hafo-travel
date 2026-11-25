# Quy ước triển khai

## Phân chia trách nhiệm

- TypeScript bật strict, isolatedModules, NodeNext và ES2023; giữ strictPropertyInitialization: false cho field được framework gán. Type/interface trong decorated signature dùng import type; class DTO/service cần metadata runtime vẫn import giá trị.
- Dùng Node 26.13.0, pnpm 12.18.0 và Nx 24. Compiler CLI TypeScript 7 chạy qua `@typescript/native`; alias API `typescript` dùng TypeScript 6 cho toolchain/editor. Kiểm tra kiểu bằng `pnpm typecheck`.
- ESLint kiểm tra dấu ngoặc và dòng trống giữa các bước; Prettier theo cấu hình server. Tách dòng giữa các method, function và khai báo độc lập.
- Controller nhận input và gọi service/client gRPC. Service điều phối nghiệp vụ; repository truy vấn database; mapper chuyển dữ liệu rõ từng trường.
- Dùng alias `@common/...` cho shared code, import tương đối trong module. Không import controller/service/repository của app khác vào runtime.
- Sắp xếp import theo nhóm: Node.js (`node:...`) → package ngoài → alias `@common/...` → đường dẫn tương đối. Mỗi nhóm cách nhau một dòng trống, các import trong nhóm xếp tăng dần theo đường dẫn. Giữ nguyên `import type` và import có side effect theo yêu cầu khởi tạo. File gRPC sinh tự động theo generator, không sửa tay.
- Tên file theo mẫu controller/service/repository/mapper/util đang có. Không tạo base class, helper hoặc module rỗng trước khi có nhu cầu.

## Trách nhiệm trong luồng xử lý

| Thành phần      | Trách nhiệm khi mở rộng                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| BFF controller  | Nhận DTO/params và request metadata, khai báo Swagger/quyền, gọi typed gRPC client, chọn dữ liệu HTTP cần trả      |
| gRPC controller | Nhận type sinh từ proto, lấy context khi cần gọi tiếp, gọi service và map kết quả thành protobuf response          |
| Service         | Thực hiện điều kiện nghiệp vụ, điều phối repository/service/client, quyết định lỗi nghiệp vụ và thứ tự side effect |
| Repository      | Sở hữu query database, filter/projection/populate và options ghi dữ liệu theo nhu cầu của luồng                    |
| Mapper          | Chuyển dữ liệu rõ từng trường giữa request, schema và profile, xử lý định dạng ID/thời gian                        |
| Module          | Đăng ký controller/provider/model/client và khai báo dependency qua imports/exports                                |

- Truy cập model database qua repository của module. Đặt điều kiện nghiệp vụ trong service sở hữu luồng và giữ mapper là hàm chuyển dữ liệu thuần.
- BFF chuyển tiếp trực tiếp qua `requestGrpc` theo controller mẫu. Chỉ thêm service BFF khi có logic điều phối riêng cần quản lý.
- Trong cùng app, dùng service được module sở hữu export để tái sử dụng nghiệp vụ. Đăng ký model/provider tại module có trách nhiệm với dependency đó.
- Dùng constructor injection cho dependency Nest và `private readonly` khi dependency được gán một lần. Khởi tạo typed gRPC client trong `onModuleInit` theo pattern hiện có.

## Cách viết method và đặt tên

- Đặt tên theo hành động và dữ liệu thực tế, bám từ vựng của module và các method đang có như `getById`, `resolveRoleIds`, `setRoles`, `userProfileMapper`. Phân biệt `userId` của hồ sơ với `id` MongoDB khi truyền tham số và truy vấn.
- Tên kỹ thuật dùng chức năng của thành phần. Tên thương hiệu thuộc nội dung hoặc cấu hình nhận diện.
- Mỗi method thực hiện một tác vụ rõ ràng. Viết các bước theo thứ tự chuẩn bị dữ liệu → kiểm tra điều kiện → thực hiện nghiệp vụ → trả kết quả, có dòng trống phân tách các bước.
- Dùng guard clause cho trường hợp dữ liệu sai hoặc thiếu để giữ luồng chính dễ đọc. Mọi thân `if`/`else` và vòng lặp đều có `{}`.
- Với điều kiện nhiều nhánh, dùng biến có tên thể hiện ý nghĩa hoặc helper khi phần kiểm tra có trách nhiệm riêng. Giữ biểu thức ngắn, dễ đọc và trình bày điều kiện dài trên nhiều dòng.
- Tách private method khi một bước có ý nghĩa độc lập, được dùng lại hoặc làm rõ method gọi nó. Giữ các bước ngắn, chỉ dùng tại một nơi ngay trong luồng khi cách viết đó đã rõ.
- Dùng `async`/`await` khi cần kết quả trung gian, điều phối hoặc bắt lỗi bất đồng bộ. Method chỉ chuyển tiếp Promise có thể trả trực tiếp như repository/service hiện có. Trong `try`/`catch` cần bắt lỗi Promise, dùng `return await`.
- Giữ Observable ở BFF theo `requestGrpc(...).pipe(map(...))` và Promise cho lời gọi nội bộ qua `requestGrpcData`. Chỉ chuyển đổi mô hình bất đồng bộ khi tác vụ có nhu cầu cụ thể.
- Không thêm comment vào code. Dùng tên và cách tổ chức luồng để thể hiện ý nghĩa xử lý.

## Kiểu dữ liệu, validation và mapping

- Tái sử dụng DTO, type sinh từ proto và type schema đúng ranh giới. Type cục bộ phục vụ module nằm gần nơi sử dụng, shared type phục vụ nhiều thành phần đặt trong library phù hợp.
- Dùng `unknown` cùng kiểm tra kiểu cho dữ liệu bên ngoài và lỗi bắt được. Chỉ ép kiểu sau khi có căn cứ từ kiểm tra hoặc contract, giữ strict và quy tắc lint đang có.
- Dùng class-validator/Swagger trên HTTP DTO. Service gRPC tự kiểm tra các điều kiện nghiệp vụ cần thiết vì caller nội bộ có thể gọi trực tiếp. Schema/index giữ ràng buộc lưu trữ theo model hiện tại.
- Chọn rõ trường được phép ghi và trả về khi map dữ liệu. Bám mapper/schema hiện có khi chuyển ObjectId, role đã populate và Date sang protobuf profile.
- Giữ ý nghĩa của trường thiếu, `undefined`, chuỗi rỗng, mảng rỗng và giá trị mặc định theo contract của luồng. Đọc nơi gọi trước khi chuẩn hóa các giá trị này.
- Dùng query cụ thể trong repository. Với cập nhật cần trả dữ liệu mới và kiểm tra schema, dùng `{ new: true, runValidators: true }` như repository hiện có.

## Xử lý lỗi và side effect

- Dùng các exception Nest theo luồng hiện tại, tái sử dụng `CODE_ERROR`/`HTTP_MESSAGE` khi đã có mã phù hợp. Mapping lỗi transport và envelope HTTP đi qua interceptor/util chung.
- Chỉ thêm `try`/`catch` khi cần chuyển một lỗi đã nhận diện, cleanup hoặc xử lý phục hồi theo yêu cầu. Lỗi ngoài trường hợp đã xử lý tiếp tục được ném lên pipeline chung. `RoleService.rethrowWriteError` là mẫu chuyển lỗi duplicate key thành 409.
- Kiểm tra điều kiện đã biết trước side effect bên ngoài, theo thứ tự của service mẫu. Khi sửa luồng nhiều bước, xem cả trường hợp bước sau thất bại và request được gọi lại.
- Khi tác vụ cần retry, rollback bù, transaction hoặc chạy song song các bước, xác định cách giữ dữ liệu nhất quán khi lỗi, gọi lại hoặc có request đồng thời. Đối chiếu deadline/context của RPC khi thay đổi thứ tự gọi.

## Tiêu chí thêm abstraction và pattern

- Bắt đầu từ controller/service/repository/mapper và helper đã có. Tái sử dụng logic có cùng ý nghĩa nghiệp vụ và cùng yêu cầu về input, output, lỗi và side effect.
- Chỉ đưa logic lên `libs` khi có nhu cầu dùng chung thực tế. Giữ logic riêng của nghiệp vụ trong module sở hữu nó.
- Khi cần helper, base/generic hoặc interface mới, xác định cụ thể phần trách nhiệm được gom lại và caller sử dụng. Giữ dependency và luồng dữ liệu dễ truy vết từ entry point.
- CQRS, event bus, generic CRUD repository, repository interface/token riêng và các tầng domain/use-case cần xuất phát từ yêu cầu kiến trúc cụ thể. Luồng hiện có tiếp tục là mẫu mặc định cho nghiệp vụ cùng loại.
- Với refactor, đối chiếu cả đường thành công, lỗi, thứ tự side effect và caller hiện có. Giới hạn diff vào phần đáp ứng yêu cầu, giữ các thay đổi đang có của người dùng.

## Contract gRPC

- RPC nội bộ dùng gRPC. Browser, webhook và API bên ngoài dùng HTTP qua BFF; sự kiện bất đồng bộ dự kiến dùng Kafka, chưa có broker/consumer trong source.
- Nguồn contract: `libs/interfaces/src/lib/proto/<service>/v1/*.proto`. Danh sách package theo từng service nằm trong cây proto.
- Sau khi sửa proto, chạy `pnpm proto:generate`. Buf/ts-proto sinh message, client/controller interfaces và constants tại `libs/interfaces/src/lib/grpc/`. Commit proto cùng output; không sửa tay file sinh.
- Generator giữ phần contract, bỏ helper decorator không dùng và comment, sinh `<SERVICE>_METHODS` từ tên RPC trong proto rồi chạy formatter. Controller dùng `@GrpcMethod(SERVICE_NAME, SERVICE_METHODS.METHOD_NAME)`; không viết tay tên RPC hoặc thêm lại message pattern/envelope TCP. Config dùng `protobufFileName` từ output sinh thay vì lặp đường dẫn proto.
- Không đổi hoặc tái sử dụng field number đã phát hành. Khi bỏ field phải reserve tên/number; thay đổi không tương thích cần package/version mới.
- HTTP DTO thuộc `gateway/`; request/response nội bộ lấy từ type sinh. Không alias transport contract sang DTO HTTP hoặc gửi Mongoose document qua service boundary.
- UserProfile/RoleProfile chứa ID chuỗi và thời gian ISO. userProfileMapper chuyển schema sang protobuf rõ từng trường; lookup không tìm thấy trả response thiếu user.

## Client, metadata và deadline

- Đăng ký client bằng `ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.<SERVICE>)])`. Inject ClientGrpc và gọi `getService<T>(SERVICE_NAME)` trong onModuleInit.
- BFF dùng `requestGrpc(method, request, { processId })` trả Observable. Service nội bộ dùng requestGrpcData trả Promise của protobuf response.
- processId nằm trong metadata x-process-id. Controller có lời gọi tiếp nhận Metadata và ServerUnaryCall, lấy context bằng `grpcCallContext(metadata, call)` rồi truyền xuống service/client.
- Mặc định mỗi lời gọi tối đa 10 giây; deadline là giá trị nhỏ hơn giữa ngân sách cục bộ và deadline nhận vào. Helper truyền native call options và có timeout cục bộ.
- Không tự retry thao tác ghi; channel tắt retry tự động. Hết deadline hoặc unsubscribe có thể hủy RPC đang chờ, nhưng không bảo đảm rollback/dừng transaction hoặc side effect đã chạy.
- Correlation metadata không chứng minh identity/quyền của caller. TLS, xác thực service và delegation cần thiết kế triển khai riêng; không tin user ID chỉ vì caller gửi qua metadata.

## Response và lỗi HTTP

- gRPC controller trả message protobuf trực tiếp. BFF lấy dữ liệu cho HTTP: create-user lấy response.message thành chuỗi.
- HttpResponseInterceptor bọc raw data một lần thành `{ statusCode, message, data, code, processId, duration }`; code thành công là Success. Không bọc ResponseDto trong controller.
- Hai POST hiện trả HTTP 201, body thành công statusCode: 200. Không suy ra HTTP status từ body.
- GrpcLoggingInterceptor đăng ký trước khi listen; chuyển exception thành gRPC status và binary trailer rpc-error-bin giữ HTTP status/message, kể cả mảng validation/Unicode.
- normalizeError đọc trailer khi có; nếu không có thì map UNAUTHENTICATED → 401, PERMISSION_DENIED → 403, NOT_FOUND → 404, UNAVAILABLE → 503, DEADLINE_EXCEEDED → 504; lỗi chưa xác định → 500.
- Log chỉ metadata, method, status và thời gian; không body, password, token, JWT claim hoặc query chứa credentials.
- Validation HTTP trả 400 với message: string[], chưa có field/path hay contract phân trang. Frontend unwrap data.
- BFF mặc định yêu cầu xác thực; endpoint public phải khai báo rõ. User/role API kiểm tra permission theo [RBAC](rbac.md); tạo user yêu cầu đồng thời `user.create` và `user.assign_roles` bằng decorator. User có đúng một role; tạo/thay role nhận mảng `roles` đúng một phần tử. Proxy frontend chưa forward cookie/Authorization.

## Config và bootstrap

- Các app kế thừa `BaseConfiguration` và dùng `@ValidateNested()`, `@Type()` cho từng nhóm cấu hình. `createConfiguration(Configuration)` nạp `.env` nếu có và kiểm tra cấu hình. Các app gRPC khai báo `GRPC_SERV`, `APP_CONFIG` và cấu hình database theo mẫu Identity.
- GrpcConfiguration chứa client options; grpcServerOptions dùng bind host riêng. Identity dùng cổng 5101.
- GRPC_BIND_HOST mặc định 0.0.0.0. IDENTITY_SERVICE_HOST là địa chỉ client gọi tới, mặc định localhost; port theo IDENTITY_SERVICE_PORT.
- Identity dùng NestFactory.createMicroservice, đăng ký interceptor rồi listen; chỉ BFF mở HTTP.
- Các bundle copy toàn bộ cây proto sang dist/apps/<app>/proto, giữ đường dẫn import. Loader dùng camelCase, defaults và includeDirs chung; source/test fallback về cây proto gốc.
- envNumber kiểm tra giá trị/khoảng hợp lệ khi khởi tạo. Khi thêm biến môi trường, cập nhật .env.example. Không tự bật TypeORM synchronize, seed hoặc migration database.

## Thêm app/module mới

Generator tham khảo:

```sh
pnpm exec nx g @nx/nest:application apps/example --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --useProjectJson
```

Đây chỉ là scaffold. Kiểm tra diff, chuyển test sang apps/example/tests, dùng preset Jest chung và cập nhật tsconfig.spec.json. Không tự tạo CRUD/permission chưa được yêu cầu.

Với service gRPC mới: thêm proto/version, chạy generator, đăng ký definition/enum trong grpc.config.ts, biến môi trường, client/provider, bootstrap và copy assets như app hiện có. Cập nhật danh sách build/dev-lite khi cần chạy cùng hệ thống.

Webpack CLI 7 dùng --mode và NODE_ENV theo target. Cấu hình pnpm 12 ở pnpm-workspace.yaml; chỉ cho phép build script đã rà và ngoại lệ peer theo version cụ thể.
