# Kiến trúc và nguồn đối chiếu

Các đường dẫn code dưới đây tính từ root repository. Luôn đọc phiên bản hiện tại của file trước khi áp dụng mẫu.

## Ranh giới thành phần

Nền tảng hiện tại là Node 26 LTS, NestJS 12, Nx 24 và TypeORM 1. Ứng dụng vẫn emit CommonJS qua NodeNext; Node 26 hỗ trợ require ESM của Nest 12. Compiler native TypeScript 7 kiểm tra kiểu, còn API TypeScript 6 phục vụ Nx/webpack/Jest/editor. Cấu hình database chỉ được nâng trong Compose với volume mới theo major; không tự chuyển đổi dữ liệu cũ.

| Thư mục                                 | Trách nhiệm                                                              |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `apps/bff`                              | HTTP gateway, Swagger, validation, guards; chuyển yêu cầu sang gRPC      |
| `apps/authorizer`                       | Đăng nhập, xác thực JWT và giao tiếp Keycloak; RPC gRPC theo protobuf v1 |
| `apps/user-access`                      | Logic người dùng/vai trò và repository MongoDB                           |
| `libs/configuration`                    | Config, validation config, provider kết nối                              |
| `libs/interfaces`                       | HTTP DTO tại `gateway/`, protobuf tại `proto/`, type sinh tại `grpc/`    |
| `libs/constants`                        | Message pattern, permissions và mã/thông báo dùng chung                  |
| `libs/decorators`, `libs/guards`        | Metadata, đọc request, xác thực và phân quyền                            |
| `libs/interceptors`, `libs/middlewares` | Response HTTP, error mapping và logging HTTP/gRPC                        |
| `libs/schemas`, `libs/entities`         | Mongoose schema và TypeORM entity; không dùng thay thế lẫn nhau          |
| `libs/utils`                            | Hàm dùng chung như RPC, chuẩn hóa lỗi, request/string                    |
| `tools`                                 | Công cụ vận hành như seed; không chứa logic xử lý request                |

Không import controller/service/repository của một app vào app khác. Dùng contract trong `libs` và transport hiện có. Alias `@common/<library>/*` được khai báo trong `tsconfig.base.json`.

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
- gRPC nhận: `apps/user-access/src/app/modules/user/controllers/user.controller.ts`.
- Nghiệp vụ/lưu dữ liệu: `services/user.service.ts`, `repositories/user.repository.ts`, `mappers/user-request.mapper.ts` trong module user.
- Contract: HTTP DTO tại `libs/interfaces/src/lib/gateway/user/`; protobuf tại `libs/interfaces/src/lib/proto/authorizer/v1/authorizer.proto` và `libs/interfaces/src/lib/proto/user-access/v1/user-access.proto`; type/constants sinh tại `libs/interfaces/src/lib/grpc/`.
- Bootstrap/config: `apps/user-access/src/main.ts`, `apps/user-access/src/configuration/index.ts`, `libs/configuration/src/lib/create-configuration.ts`.
- Pipeline HTTP/guard: `apps/bff/src/app/app.module.ts`; gRPC logging/error: `libs/interceptors/src/lib/grpc-logging.interceptor.ts`; client/deadline/correlation: `libs/utils/src/lib/rpc.util.ts`.
- Đăng nhập: BFF module authorizer → controller authorizer/keycloak và services tương ứng trong `apps/authorizer/src/app/modules/`.

## Quyền truy cập và dữ liệu

`UserGuard` đọc `Authorization` và yêu cầu xác thực mặc định; metadata method ưu tiên class, permission vẫn buộc xác thực. `PermissionGuard` đọc `Permissions`. Khi thêm endpoint, xác định rõ public/secured và permission theo yêu cầu, đồng thời kiểm tra cả hai guard; enum permission không tự bảo vệ endpoint. Mô hình user → đúng một role → permissions và API quản trị nằm trong [RBAC](rbac.md). Dùng cache JWT vẫn phải đọc user/role hiện tại để áp dụng thu hồi quyền.

Schema user/role nằm tại `libs/schemas/src/lib/`. Mapper user chọn rõ từng trường và chuyển role ID sang `Types.ObjectId`; không đưa password vào dữ liệu MongoDB hoặc response. Role seed tại `apps/user-access/src/seeds/role.json` không tự tạo tài khoản quản trị Keycloak.

Authorizer/User-access chỉ listen gRPC trên cổng mặc định 5100/5101; BFF giữ HTTP và thực thi RBAC. Client target host tách khỏi GRPC_BIND_HOST để container bind 0.0.0.0 và gọi service khác bằng DNS riêng. Proto v1 là contract nội bộ, không trả Mongoose document qua service boundary. gRPC chưa có workload identity/phân quyền caller; phải giới hạn mạng cho service tin cậy. Frontend chưa tích hợp session thật.
