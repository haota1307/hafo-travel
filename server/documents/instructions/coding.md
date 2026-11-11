# Quy ước triển khai

## Phân chia trách nhiệm

- Controller nhận input, gọi service hoặc chuyển tiếp TCP. Không đặt query database hoặc logic nghiệp vụ dài trong controller.
- Service xử lý nghiệp vụ và điều phối; repository thực hiện truy vấn; mapper chuyển dữ liệu rõ từng trường.
- Dùng DTO/contract hiện có hoặc bổ sung vào đúng nhóm `gateway`/`tcp`. Không dùng `any` để né lỗi kiểu; dữ liệu chưa rõ dùng `unknown` và kiểm tra trước khi truy cập.
- Dùng alias `@common/...` cho shared code, import tương đối trong module. Không tự thêm alias chỉ vì một import dài.
- Tên file theo mẫu hiện có: `.controller.ts`, `.service.ts`, `.repository.ts`, `.mapper.ts`, `.util.ts`. Hàm chỉ phục vụ nội bộ class đặt `private` khi phù hợp.

## Response, RPC và lỗi

- TCP controller trả dữ liệu trực tiếp. Không gọi `TcpResponse.success` trong từng handler: `TcpResponseInterceptor` bọc response một lần.
- BFF controller chuyển tiếp bằng `requestTcp<TResult, TInput>(client, pattern, { data, processId })`. `HttpResponseInterceptor` nhận envelope TCP và tạo HTTP `ResponseDto`; không bọc thêm `new ResponseDto` trong controller.
- `HttpResponseInterceptor` hiện không phải bộ bọc dữ liệu raw bất kỳ. Nếu thêm HTTP handler không gọi TCP, cần thiết kế contract tương thích trước, không trả raw rồi giả định interceptor hiểu đúng.
- Client nội bộ dùng `requestTcpData` để lấy dữ liệu. Kiểu trả về có thể là `undefined`; xử lý rõ nếu dữ liệu đó là bắt buộc.
- Dùng `TcpRequest<T>`/`TcpResponse<T>` cho transport; `RequestContext` cho HTTP request. Không nhầm với Request/Response của Express.
- Giữ `processId` xuyên suốt các lời gọi. Dùng message từ `TCP_REQUEST_MESSAGE`, không rải chuỗi pattern trùng lặp.
- Lỗi dùng exception phù hợp và `normalizeError`; không biến exception thành response thành công. Giữ contract status/message đang có.
- RPC mặc định timeout 10 giây. Không tự retry thao tác ghi; timeout không hủy công việc ở service nhận.
- Log chỉ metadata cần thiết, không body/params/token/password/query chứa thông tin đăng nhập.

## Config và bootstrap

- Config app kế thừa `BaseConfiguration`; config con dùng `@ValidateNested()` và `@Type(...)` theo mẫu.
- Khởi tạo qua `createConfiguration(Configuration)`: validate sau khi các field/config con đã được tạo. Không thêm validate lặp trong constructor.
- Cấu hình số dùng `envNumber`, chọn giới hạn phù hợp. Ưu tiên override → environment → mặc định, không dùng `||` làm mất giá trị `0` hợp lệ.
- Khi thêm biến môi trường, cập nhật `.env.example`; đọc cách đặt tên trong config thực tế, không đoán tên biến từ tên app.
- TCP server dùng `connectTcpMicroservice(app, endpointOptions)` để đăng ký logging/response trước khi khởi tạo listener. Không đăng ký lại ở từng controller.
- gRPC cấu hình riêng theo protobuf; không áp envelope TCP vào gRPC.
- Không tự bật TypeORM `synchronize` hoặc chạy seed/migration trong bootstrap.

## Thêm app/module mới

Generator hiện cài có thể tạo app bằng lệnh sau (thay `catalog` bằng tên cần tạo):

```sh
pnpm exec nx g @nx/nest:application apps/catalog --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --useProjectJson
```

Đây chỉ là scaffold, không tự tích hợp convention của dự án. Kiểm tra diff sau generator để tránh dependency/config ngoài phạm vi. Chuyển test sinh ra sang `apps/catalog/tests/`, cập nhật `tsconfig.spec.json` và dùng preset Jest chung. Nếu phiên bản Nx thay đổi, kiểm tra `--help` hoặc schema generator đang cài trước khi dùng option.

Khi app cần TCP, bổ sung enum và property trong `TcpConfiguration`, biến host/port mẫu, message contract và đăng ký `ClientsModule`/`TcpProvider` tại bên gọi. Sao chép cách bootstrap/config của `user-access` rồi chỉ giữ provider thực sự cần. App mới không tự xuất hiện trong danh sách hard-code của script `build`/`dev-lite`; cập nhật khi cần chạy cùng hệ thống.

Với module mới trong app hiện có: đăng ký module/controller/provider, thêm DTO/message/schema theo đúng nhu cầu, xác định chính sách truy cập và kiểm tra cả bên gọi/bên nhận. Không tạo CRUD hoặc permission chưa được yêu cầu.
