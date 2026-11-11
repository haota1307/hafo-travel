# Kiến trúc và nguồn đối chiếu

Các đường dẫn code dưới đây tính từ root repository. Luôn đọc phiên bản hiện tại của file trước khi áp dụng mẫu.

## Ranh giới thành phần

| Thư mục | Trách nhiệm |
| --- | --- |
| `apps/bff` | HTTP gateway, Swagger, validation, guards; chuyển yêu cầu sang TCP |
| `apps/authorizer` | Đăng nhập, xác thực JWT và giao tiếp Keycloak; TCP, cấu hình gRPC riêng |
| `apps/user-access` | Logic người dùng/vai trò và repository MongoDB |
| `libs/configuration` | Config, validation config, provider kết nối |
| `libs/interfaces` | HTTP DTO tại `gateway/`, TCP contract tại `tcp/`, protobuf tại `proto/` |
| `libs/constants` | Message pattern, permissions và mã/thông báo dùng chung |
| `libs/decorators`, `libs/guards` | Metadata, đọc request, xác thực và phân quyền |
| `libs/interceptors`, `libs/middlewares` | Response/error/logging và bootstrap TCP dùng chung |
| `libs/schemas`, `libs/entities` | Mongoose schema và TypeORM entity; không dùng thay thế lẫn nhau |
| `libs/utils` | Hàm dùng chung như RPC, chuẩn hóa lỗi, request/string |
| `tools` | Công cụ vận hành như seed; không chứa logic xử lý request |

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

Chỉ tạo các thư mục có nhu cầu. BFF có thể chỉ cần controller và module đăng ký TCP client, không cần thêm repository/service trung gian chỉ để chuyển tiếp.

## Luồng mẫu cần đọc

- HTTP: `apps/bff/src/app/modules/user/controllers/user.controller.ts` và `user.module.ts` cùng cấp module.
- TCP nhận: `apps/user-access/src/app/modules/user/controllers/user.controller.ts`.
- Nghiệp vụ/lưu dữ liệu: `services/user.service.ts`, `repositories/user.repository.ts`, `mappers/user-request.mapper.ts` trong module user.
- Contract: `libs/interfaces/src/lib/gateway/user/`, `libs/interfaces/src/lib/tcp/user/`; message tại `libs/constants/src/lib/enum/tcp-request-message.enum.ts`.
- Bootstrap/config: `apps/user-access/src/main.ts`, `apps/user-access/src/configuration/index.ts`, `libs/configuration/src/lib/create-configuration.ts`.
- Pipeline HTTP/guard: `apps/bff/src/app/app.module.ts`; TCP: `libs/interceptors/src/lib/connect-tcp-microservice.ts`.
- Đăng nhập: BFF module authorizer → controller authorizer/keycloak và services tương ứng trong `apps/authorizer/src/app/modules/`.

## Quyền truy cập và dữ liệu

`UserGuard` đọc `Authorization`; metadata method ưu tiên class. `PermissionGuard` đọc `Permissions`. Khi thêm endpoint, xác định rõ public/secured và permission theo yêu cầu, đồng thời kiểm tra cả hai guard; enum permission không tự bảo vệ endpoint.

Schema user/role nằm tại `libs/schemas/src/lib/`. Mapper user chọn rõ từng trường và chuyển role ID sang `Types.ObjectId`; không đưa password vào dữ liệu MongoDB hoặc response. Role seed tại `apps/user-access/src/seeds/role.json` không tự tạo tài khoản quản trị Keycloak.
