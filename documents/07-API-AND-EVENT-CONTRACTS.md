# Hợp đồng API, sự kiện và command

Trạng thái: **contract hiện tại có dẫn nguồn + bản thiết kế contract mới**. Toàn bộ endpoint booking/payment/AI và topic dưới đây chưa được triển khai. Không dùng ví dụ làm tài liệu API đang chạy.

## 1. Contract hiện tại

BFF hiện có `POST /api/authorizer/login` và `POST /api/user` theo global prefix mẫu. Envelope HTTP thành công là `{ statusCode, message, data, code, processId, duration }`, với `code: Success`; `message` có thể là chuỗi hoặc mảng. Frontend unwrap `data`. Validation hiện trả 400 với mảng chuỗi, chưa có mapping field/path hoặc pagination chung.

Đối chiếu [frontend instructions](../client/documents/instructions.md), [backend coding](../server/instructions/coding.md) và controller được liên kết tại tài liệu 01. Giữ contract hiện tại cho endpoint cũ. Không thay envelope hàng loạt vì cần thêm streaming hoặc lỗi mới.

## 2. Quy ước đề xuất cho API mới

- ID là chuỗi opaque; client không suy diễn quyền hoặc thứ tự từ ID.
- Timestamp dùng ISO 8601 có timezone; tiền dùng chuỗi số nguyên và currency rõ ràng.
- Status HTTP phản ánh kết quả HTTP; dữ liệu nằm trong `data` theo envelope đang có.
- Pagination đề xuất `{ items, page, limit, total }`, bắt đầu page 1; giới hạn limit được validate. Đây chưa phải convention đang triển khai.
- Thao tác ghi chấp nhận `Idempotency-Key`; lưu scope principal + operation + key và request hash.
- HTTP 201 nghĩa tài nguyên đã tạo; 202 nghĩa công việc đã được tiếp nhận bền vững, chưa hoàn tất. Không trả 202 trước khi lưu công việc.
- Lỗi nghiệp vụ có code ổn định; label hiển thị do frontend dịch. Không đưa stack, raw provider response hoặc secret ra response.
- Dịch vụ xác minh owner/permission tại nơi sở hữu tài nguyên, kể cả request từ agent.

## 3. Danh mục endpoint đề xuất

| Method và đường dẫn dưới /api              | Chủ thể                    | Dữ liệu và kết quả                                                   |
| ------------------------------------------ | -------------------------- | -------------------------------------------------------------------- |
| GET /tours                                 | Public                     | Bộ lọc, phân trang → tour đã công bố                                 |
| GET /tours/:id                             | Public                     | Nội dung công bố; không lộ bản nháp                                  |
| GET /tours/:id/departures                  | Public                     | Lịch mở bán, thông tin giá/chỗ tại lúc đọc                           |
| POST /booking-quotes                       | Khách đăng nhập            | departureId, cơ cấu khách → quoteId, tổng tiền, điều kiện, expiresAt |
| POST /bookings                             | Khách đăng nhập            | quoteId, thông tin khách được phép → đơn PENDING_PAYMENT             |
| GET /bookings                              | Khách đăng nhập            | Chỉ danh sách đơn thuộc user; filter có whitelist                    |
| GET /bookings/:id                          | Chủ đơn/nhân viên có quyền | Snapshot và trạng thái đặt chỗ                                       |
| POST /bookings/:id/cancellations           | Chủ đơn/quyền phù hợp      | Yêu cầu hủy theo điều kiện; dùng idempotency                         |
| GET /bookings/:id/payment                  | Chủ đơn/quyền phù hợp      | Phiên và trạng thái thanh toán đã lọc dữ liệu                        |
| POST /bookings/:id/payment-attempts        | Chủ đơn/quyền phù hợp      | Tạo lần thử mới khi attempt trước đã rõ kết quả và đơn còn hợp lệ    |
| POST /payments/webhooks/:provider          | Nhà cung cấp có xác minh   | Ghi nhận callback bền vững; không dùng session khách                 |
| POST /assistant/conversations              | Khách/session hợp lệ       | Tạo hội thoại đúng scope                                             |
| POST /assistant/conversations/:id/messages | Chủ hội thoại              | Message → response hoặc stream theo contract được chốt               |
| POST /assistant/actions/:id/confirm        | Chủ action đã đăng nhập    | Xác nhận hành động cụ thể → operationId/result                       |
| GET /assistant/operations/:id              | Chủ operation              | Tra cứu kết quả sau timeout/reconnect                                |

API admin chưa liệt kê thành CRUD tự động; chỉ thiết kế endpoint khi use case và permission tương ứng được chốt. Refund không là tool/endpoint public tự do trong baseline.

## 4. Ví dụ response tạo đơn

Ví dụ dữ liệu demo, chưa phải response chạy thực tế:

```json
{
  "statusCode": 201,
  "message": "BOOKING_CREATED",
  "data": {
    "id": "booking_demo_001",
    "status": "PENDING_PAYMENT",
    "totalAmount": "6000000",
    "currency": "VND",
    "expiresAt": "2026-11-11T03:15:00Z"
  },
  "processId": "request_demo_001",
  "duration": "42 ms"
}
```

Giá và thời gian chỉ minh họa. `duration` là chuỗi dạng số mili giây kèm hậu tố `ms` theo [HTTP response interceptor hiện tại](../server/libs/interceptors/src/lib/http-response.interceptor.ts); không dùng giá trị mẫu này làm số đo demo.

## 5. Mã lỗi đề xuất

| Code                   | HTTP dự kiến                        | Cách xử lý client                             |
| ---------------------- | ----------------------------------- | --------------------------------------------- |
| QUOTE_EXPIRED          | 409                                 | Lấy báo giá mới và xác nhận lại               |
| PRICE_CHANGED          | 409                                 | Hiển thị thay đổi, không tự chấp nhận giá mới |
| INSUFFICIENT_CAPACITY  | 409                                 | Đổi lịch/số người, không retry vô hạn         |
| BOOKING_STATE_CONFLICT | 409                                 | Đọc lại trạng thái đơn                        |
| IDEMPOTENCY_KEY_REUSED | 409                                 | Không dùng lại khóa cho nội dung khác         |
| PAYMENT_RESULT_UNKNOWN | 409 hoặc trạng thái dữ liệu khi GET | Tra cứu/đối soát, không tạo lần thu mới mù    |
| CONFIRMATION_EXPIRED   | 409                                 | Tạo action mới và xác nhận lại                |
| RATE_LIMITED           | 429                                 | Tôn trọng Retry-After nếu được cung cấp       |

401/403/404 do policy auth và chống lộ tài nguyên quyết định. Không biến mọi lỗi provider thành 400. gRPC deadline hiện được map thành HTTP 504 nhưng không bảo đảm rollback transaction/side effect đã chạy; idempotency vẫn cần ở service nhận.

## 6. Event envelope đề xuất

```json
{
  "eventId": "event_demo_001",
  "eventType": "BookingCreated",
  "schemaVersion": 1,
  "producer": "booking",
  "occurredAt": "2026-11-11T03:00:00Z",
  "aggregateType": "Booking",
  "aggregateId": "booking_demo_001",
  "aggregateVersion": 1,
  "correlationId": "flow_demo_001",
  "causationId": "request_demo_001",
  "payload": {
    "bookingId": "booking_demo_001",
    "ownerId": "user_demo_001",
    "departureId": "departure_demo_001",
    "amount": "6000000",
    "currency": "VND",
    "expiresAt": "2026-11-11T03:15:00Z"
  }
}
```

Kafka message key của event này là bookingId. Trace context đi trong header theo quy ước được chốt; correlationId không phải token xác thực. Không đưa password, access token, toàn bộ hồ sơ hành khách hoặc lịch sử chat vào event.

`schemaVersion` mô tả cấu trúc payload; `aggregateVersion` mô tả tiến trình của đúng thực thể. Không dùng chúng thay thế nhau. Relay gửi lại cùng sự kiện phải giữ eventId.

## 7. Topic và event catalog

| Topic đề xuất       | Key       | Producer | Loại thông điệp                                                                     | Consumer group nghiệp vụ                    |
| ------------------- | --------- | -------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| booking.events.v1   | bookingId | Booking  | BookingCreated, BookingConfirmed, BookingExpired, BookingCancelled                  | payment-booking-v1, notification-booking-v1 |
| payment.events.v1   | bookingId | Payment  | PaymentSessionReady, PaymentSucceeded, PaymentFailed, RefundSucceeded, RefundFailed | booking-payment-v1                          |
| payment.commands.v1 | bookingId | Booking  | RequestRefund                                                                       | payment-refund-v1                           |
| catalog.events.v1   | tourId    | Booking  | TourPublished, TourUpdated, TourUnpublished                                         | ai-catalog-index-v1                         |

Payment events mang aggregateType PaymentAttempt hoặc Refund và aggregateId/version tương ứng; key bookingId chỉ để phân vùng, không biến chúng thành version của Booking. Payload PaymentSucceeded cần bookingId, paymentId, providerReference đã lọc, amount, currency, paidAt. Refund result cần refundId, paymentId, compensationId, amount và trạng thái đã xác minh.

Topic/group ở bảng là tên logic. NestJS có thể thêm hậu tố cho client/group; phải kiểm tra groupId thực tế trong cấu hình và vận hành. Các instance cùng chức năng dùng chung group; chức năng độc lập dùng group khác. [NestJS Kafka naming conventions](https://docs.nestjs.com/microservices/kafka)

Kafka giữ thứ tự record trong partition, không tạo thứ tự toàn cục giữa topic. Cùng key chỉ giữ quan hệ phân vùng khi cấu hình partitioner/partition không bị thay đổi ngoài thiết kế. Retry topic và xử lý song song có thể làm tác động nghiệp vụ lệch thứ tự. [Apache Kafka design](https://kafka.apache.org/40/design/design/)

## 8. Command khác event

Event mô tả sự thật đã commit, ví dụ PaymentSucceeded. Command yêu cầu chủ thể khác thực hiện việc có thể bị từ chối, ví dụ RequestRefund.

RequestRefund chứa commandId, commandType, schemaVersion, correlationId, causationId, issuedAt và payload gồm compensationId, bookingId, paymentId, amount, currency, reason. Payment kiểm tra số tiền thực thu và ngân sách hoàn; không làm theo amount chỉ vì command đến từ Kafka. ACL broker giới hạn ai được phát command.

Booking ghi command vào outbox cùng nghĩa vụ bù trừ. Payment nhận command ghi inbox + refund/work item trong transaction, rồi worker gọi provider. Kết quả qua RefundSucceeded/RefundFailed; UNKNOWN tiếp tục đối soát, không phát thất bại cuối cùng chỉ vì timeout.

## 9. Version và tương thích

Thêm field optional chỉ được coi tương thích nếu consumer thực tế bỏ qua field lạ và có default phù hợp. Xóa/đổi nghĩa/đổi kiểu trường là breaking change; tạo phiên bản mới, chạy song song và có điểm dừng phiên bản cũ. Dedupe xuyên phiên bản phải tránh một sự thật gây hai side effect nếu dual publish.

JSON schema/runtime validation cần ở cả producer và consumer. TypeScript interface không kiểm tra message mạng. Contract test dùng fixture của phiên bản cũ và mới. Chưa bắt buộc Schema Registry/Avro; quyết định tại Q-13.

## 10. Contract streaming AI

Đề xuất các frame có type: message-start, text-delta, tool-status, action-required, message-complete, error. Frame có messageId và sequence để client phát hiện lặp/thiếu. Không gửi prompt hệ thống, raw reasoning hoặc secret tool ra stream.

Message-complete xác nhận kết thúc câu trả lời, không thay thế kết quả nghiệp vụ. Reconnect đọc lại message/operation đã lưu; không tự phát lại công cụ ghi. SSE là response chuyên biệt, không bọc từng frame bằng JSON envelope HTTP hiện tại. Chi tiết kỹ thuật phải được chốt khi triển khai Q-16.

## Contract gRPC nội bộ hiện có

Protobuf v1 và type sinh nằm tại `server/libs/interfaces/src/lib/proto/` và `server/libs/interfaces/src/lib/grpc/`. Authorizer cung cấp Login, VerifyUserToken, CreateKeycloakUser; User-access cung cấp CreateUser, GetUserById. Metadata x-process-id nối correlation; deadline truyền qua các chặng. gRPC trả message raw; BFF bọc HTTP envelope, giữ status/body hiện có. Claim JWT động dùng jwtJson, user/role dùng field protobuf rõ ràng. Xác thực service/delegation vẫn cần chốt; correlation metadata không chứng minh identity.
