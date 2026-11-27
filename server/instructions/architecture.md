# Kiến trúc và nguồn đối chiếu

Các đường dẫn code dưới đây tính từ root repository. Luôn đọc phiên bản hiện tại của file trước khi áp dụng mẫu.

## Ranh giới thành phần

Nền tảng hiện tại là Node 26 LTS, NestJS 12, Nx 24 và TypeORM 1. Ứng dụng vẫn emit CommonJS qua NodeNext; Node 26 hỗ trợ require ESM của Nest 12. Compiler native TypeScript 7 kiểm tra kiểu, còn API TypeScript 6 phục vụ Nx/webpack/Jest/editor. Compose mặc định bật MongoDB, Redis, PostgreSQL và pgAdmin, lưu dữ liệu trong `server/docker/docker_data` theo thư mục riêng từng major. Cấu hình database chỉ được nâng trong Compose với volume mới theo major; không tự chuyển đổi dữ liệu cũ.

| Thư mục                                 | Trách nhiệm                                                           |
| --------------------------------------- | --------------------------------------------------------------------- |
| `apps/bff`                              | HTTP gateway, Swagger, validation, guards; chuyển yêu cầu sang gRPC   |
| `apps/identity`                         | Logic người dùng/vai trò và repository MongoDB                        |
| `apps/audit`                            | Ghi và tra cứu lịch sử quản trị qua gRPC, lưu MongoDB                  |
| `libs/configuration`                    | Config, validation config, provider kết nối                           |
| `libs/interfaces`                       | HTTP DTO tại `gateway/`, protobuf tại `proto/`, type sinh tại `grpc/` |
| `libs/constants`                        | Message pattern, permissions và mã/thông báo dùng chung               |
| `libs/decorators`, `libs/guards`        | Metadata, đọc request, xác thực và phân quyền                         |
| `libs/interceptors`, `libs/middlewares` | Response HTTP, error mapping và logging HTTP/gRPC                     |
| `libs/schemas`, `libs/entities`         | Mongoose schema và TypeORM entity; không dùng thay thế lẫn nhau       |
| `libs/utils`                            | Hàm dùng chung như RPC, chuẩn hóa lỗi, request/string                 |
| `tools`                                 | Công cụ vận hành như seed; không chứa logic xử lý request             |

Không import controller/service/repository của một app vào app khác trong source runtime. Dùng contract trong `libs` và transport hiện có. `tsconfig.base.json` khai báo alias `@common/<library>/*` cho thư viện chung và alias riêng cho từng app theo [quy ước import](coding.md#phân-chia-trách-nhiệm).

Booking, Payment, Notification, AI Agent và Audit dùng bootstrap gRPC. Notification cung cấp RPC nội bộ `SendEmail` để gửi thư qua Resend. Audit cung cấp `AppendAuditEvent` và `ListAuditEvents`. Xem [trách nhiệm, cổng và luồng gọi của các service](services.md).

## Cấu trúc một module

```text
apps/<app>/
  src/
    main.ts
    configuration/index.ts
    app/
      app.module.ts
      modules/<module>/
        <module>.module.ts
        controllers/<module>.controller.ts
        services/<module>.service.ts
        repositories/<module>.repository.ts
        mappers/<module>-request.mapper.ts
  tests/
    <module>.spec.ts
```

Chỉ tạo các thư mục có nhu cầu. BFF có thể chỉ cần controller và module đăng ký gRPC client, không cần thêm repository/service trung gian chỉ để chuyển tiếp.

## Luồng mẫu cần đọc

- HTTP: `apps/bff/src/app/modules/user/controllers/user.controller.ts` và `user.module.ts` cùng cấp module.
- gRPC nhận: `apps/identity/src/app/modules/user/controllers/user.controller.ts`.
- Nghiệp vụ/lưu dữ liệu: `services/user.service.ts`, `repositories/user.repository.ts`, `mappers/user-request.mapper.ts` trong module user.
- Contract: HTTP DTO tại `libs/interfaces/src/lib/gateway/user/`; protobuf tại `libs/interfaces/src/lib/proto/identity/v1/identity.proto`; type/constants sinh tại `libs/interfaces/src/lib/grpc/`.
- Bootstrap/config: `apps/identity/src/main.ts`, `apps/identity/src/configuration/index.ts`, `libs/configuration/src/lib/create-configuration.ts`.
- Pipeline HTTP/guard: `apps/bff/src/app/app.module.ts`; gRPC logging/error: `libs/interceptors/src/lib/grpc-logging.interceptor.ts`; client/deadline/correlation: `libs/utils/src/lib/rpc.util.ts`.

## Chọn mẫu theo trách nhiệm

Các link dưới đây tính từ tài liệu này. Đọc file mẫu cùng dependency của nó và áp dụng phần phù hợp với tác vụ. Khi source và hướng dẫn khác nhau, đối chiếu yêu cầu hiện tại cùng nơi sử dụng trước khi lựa chọn.

| Phần cần triển khai                   | Source đối chiếu                                                                                                                                                                               | Cách áp dụng                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| HTTP endpoint gọi gRPC                | [BFF RoleController](../apps/bff/src/app/modules/role/controllers/role.controller.ts)                                                                                                          | DTO, permission, processId, typed client và lấy dữ liệu từ protobuf response              |
| gRPC endpoint                         | [UserController](../apps/identity/src/app/modules/user/controllers/user.controller.ts)                                                                                                         | Hằng số method sinh từ proto, gọi service, map profile và truyền context khi gọi RPC tiếp |
| Điều phối nghiệp vụ                   | [UserService](../apps/identity/src/app/modules/user/services/user.service.ts), [RoleService](../apps/identity/src/app/modules/role/services/role.service.ts)                                   | Kiểm tra điều kiện, gọi dependency, xử lý kết quả và lỗi nghiệp vụ                        |
| Truy vấn MongoDB                      | [RoleRepository](../apps/identity/src/app/modules/role/repositories/role.repository.ts)                                                                                                        | Inject model, query cụ thể, `.exec()` và options cập nhật                                 |
| Chuyển request sang dữ liệu lưu       | [user-request.mapper.ts](../apps/identity/src/app/modules/user/mappers/user-request.mapper.ts)                                                                                                 | Chọn từng trường và chuyển ID theo schema                                                 |
| Chuyển dữ liệu sang protobuf          | [user-profile.mapper.ts](../apps/identity/src/app/modules/user/mappers/user-profile.mapper.ts), [role-profile.mapper.ts](../apps/identity/src/app/modules/role/mappers/role-profile.mapper.ts) | Chọn trường response, ID chuỗi và thời gian ISO                                           |
| DTO HTTP                              | [role-request.dto.ts](../libs/interfaces/src/lib/gateway/role/role-request.dto.ts)                                                                                                             | Class với decorator validation và Swagger                                                 |
| Schema MongoDB                        | [role.schema.ts](../libs/schemas/src/lib/role.schema.ts)                                                                                                                                       | BaseSchema, createSchema, model name/type và Destination                                  |
| Dependency giữa module trong cùng app | [RoleModule](../apps/identity/src/app/modules/role/role.module.ts), [UserModule](../apps/identity/src/app/modules/user/user.module.ts)                                                         | Export service từ module sở hữu và import module tại nơi dùng                             |

## Quyền truy cập và dữ liệu

`UserGuard` đọc `Authorization` và yêu cầu xác thực mặc định; metadata method ưu tiên class, permission vẫn buộc xác thực. `PermissionGuard` đọc `Permissions`. Khi thêm endpoint, xác định rõ public/secured và permission theo yêu cầu, đồng thời kiểm tra cả hai guard; enum permission không tự bảo vệ endpoint. Mô hình user → đúng một role → permissions và API quản trị nằm trong [RBAC](rbac.md). Identity ký JWT khi login/refresh. BFF kiểm tra access JWT và quyền ngay tại guard. `GET /user/me` gọi Identity để đọc dữ liệu hồ sơ.

Schema user/role nằm tại `libs/schemas/src/lib/`. Mapper user chọn rõ từng trường và chuyển role ID sang `Types.ObjectId`; Identity lưu hash scrypt với salt riêng và chỉ chọn hash khi kiểm tra mật khẩu. Role seed tại `apps/identity/src/seeds/role.json` không tự tạo tài khoản quản trị.

Identity chỉ listen gRPC trên cổng mặc định 5101; BFF giữ HTTP và thực thi RBAC. Client target host tách khỏi GRPC_BIND_HOST để container bind 0.0.0.0 và gọi service khác bằng DNS riêng. Proto v1 là contract nội bộ, không trả Mongoose document qua service boundary. gRPC chưa có workload identity/phân quyền caller; phải giới hạn mạng cho service tin cậy. Frontend dùng Next route handler giữ token trong cookie HttpOnly.
