# Quyền sở hữu và mô hình dữ liệu

Trạng thái: **mô hình khái niệm đề xuất**. Tên bảng/trường dưới đây không phải migration đã tạo. User/role MongoDB hiện tại giữ nguyên.

## 1. Ma trận sở hữu

| Service      | Dữ liệu nguồn                                                         | Dữ liệu có thể lưu bản sao                     | Kho lưu đề xuất                                 |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| User Access  | Hồ sơ người dùng và quyền ứng dụng                                    | Tham chiếu subject Keycloak                    | MongoDB hiện tại                                |
| Booking      | Tour, departure, quote, booking, reservation, vòng đời đặt chỗ        | Payment summary đã tiêu thụ theo event         | PostgreSQL riêng                                |
| Payment      | Payment attempt, provider callback, refund, reconciliation            | Booking ID, owner ID, số tiền/tiền tệ snapshot | PostgreSQL riêng                                |
| Notification | Delivery job, template version, kết quả gửi                           | Dữ liệu tối thiểu để tạo thông báo             | PostgreSQL riêng hoặc kho bền vững được chốt    |
| AI Assistant | Conversation, message, tool run, action confirmation, knowledge index | Nội dung public được phép lập chỉ mục          | PostgreSQL riêng; vector extension/store còn mở |

Database riêng có thể nằm trên một instance ở local. User DB của service này không được đọc bảng service khác. Quan hệ xuyên service dùng ID và contract; không có foreign key xuyên DB hoặc join trực tiếp để xây màn hình.

## 2. Booking

| Đối tượng    | Trường khái niệm chính                                                                                    | Ràng buộc                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tour         | id, slug, publicationStatus, contentVersion, nội dung vi/en                                               | Slug/ID ổn định; nội dung nháp không public                 |
| Departure    | id, tourId, startsAt/date, bookingClosesAt, capacity, held, confirmed, version                            | Số đếm không âm, held + confirmed không vượt capacity       |
| Quote        | id, ownerId, departureId, passengerBreakdown, priceLines, totalAmount, currency, policyVersion, expiresAt | Server tạo, gắn chủ thể/yêu cầu; không là reservation       |
| Booking      | id, ownerId, departureId, quoteId, status, expiresAt, snapshot, version, acceptedPaymentId                | Một đơn chỉ dùng một quote; idempotency bảo vệ request lặp  |
| Reservation  | id, bookingId, departureId, seatCount, status, expiresAt                                                  | Unique bookingId; chuyển trạng thái có kiểm tra             |
| Compensation | id, bookingId, paymentId, reason, status, version                                                         | Unique lý do/nghĩa vụ theo payment để không sinh refund lặp |

Với quote tạo trước đăng nhập, cần binding anonymous session và chuyển quyền sở hữu rõ ràng; baseline đơn giản yêu cầu xác thực ở bước tạo quote dùng để đặt. Guest tư vấn vẫn được nhận kết quả tìm kiếm/giá tham khảo từ API. Q-05 quyết định việc cho guest giữ báo giá.

Đề xuất quote dùng một lần cho một booking. Cố tạo lại bằng idempotency key khác vẫn bị unique quoteId chặn; muốn đặt thêm thì tạo quote mới. Đây là thiết kế chống lặp, không phải giới hạn số tour một khách được đặt.

## 3. Transaction chống vượt chỗ

Tạo đơn khóa dòng departure hoặc dùng update có điều kiện và kiểm tra số dòng bị ảnh hưởng. Trong cùng transaction: kiểm tra hạn bán/quote, kiểm tra capacity, tăng held, tạo booking/reservation và outbox. Nếu bất kỳ bước nào thất bại, rollback toàn bộ.

Xác nhận/giải phóng khóa theo cùng thứ tự đã quy định, chẳng hạn departure → booking → reservation, để giảm deadlock. Khi xác nhận: giảm held và tăng confirmed đúng seatCount. Khi hết hạn/hủy: giảm held đúng một lần. Dùng check constraint, unique constraint và state guard làm lớp bảo vệ cuối, không chỉ kiểm tra trước ở application.

Mức isolation và cách retry deadlock phải được chốt trong implementation. Retry transaction dùng lại operation/idempotency key; không lặp lại lời gọi provider bên trong transaction. Có kiểm tra invariant định kỳ để phát hiện lệch giữa counter và reservation; không tự sửa lệch mà không audit.

## 4. Payment và hoàn tiền

| Đối tượng         | Trường khái niệm                                                                              | Ràng buộc                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| PaymentAttempt    | id, bookingId, ownerId, amount, currency, provider, providerReference, idempotencyKey, status | Unique provider/reference; retry request không tạo attempt tùy tiện           |
| ProviderEvent     | provider, eventId, receivedAt, verificationResult, payloadDigest                              | Unique provider/eventId; dữ liệu thô nếu cần phải được bảo vệ và giới hạn lưu |
| Refund            | id, paymentId, compensationId, amount, reason, providerReference, status                      | Unique compensationId; không vượt số tiền có thể hoàn                         |
| ReconciliationJob | targetId, kind, nextAttemptAt, attemptCount, lastErrorCode, lease                             | Công việc chưa rõ kết quả tồn tại qua restart                                 |

Payment lưu request intent trước khi gọi provider. Nếu chết sau khi provider tạo giao dịch nhưng trước khi ghi kết quả, worker dùng cùng khóa/tham chiếu để tìm lại. Một unique constraint ở DB không tự ngăn provider thu tiền hai lần nếu gọi bằng hai khóa khác nhau.

Refund dùng transaction khóa payment/balance hoặc tương đương để giữ ngân sách hoàn. Lỗi hoặc UNKNOWN không tự giải phóng ngân sách khi chưa biết provider có thực hiện hay chưa.

## 5. Bảng hạ tầng cục bộ

| Thành phần              | Thông tin tối thiểu                                                                                | Mục đích                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Outbox                  | eventId, aggregateId, aggregateVersion, topic, key, payload, createdAt, publishedAt, lease/attempt | Ghi ý định phát event cùng dữ liệu nghiệp vụ       |
| Inbox/processed message | consumerName, messageId, processedAt, resultReference                                              | Unique consumerName + messageId để chống xử lý lặp |
| API idempotency         | principalId, operation, key, requestHash, status, resourceId/result, expiresAt                     | Xử lý gửi lại HTTP/gRPC có cùng ý nghĩa            |
| Audit                   | actor, action, resourceId, before/after metadata, reason, correlationId, time                      | Truy vết hành động; tránh lưu toàn bộ PII          |

Không dùng một inbox chung cho mọi consumer: cùng event được Booking và Notification xử lý là hợp lệ. Thời gian giữ inbox/idempotency phải bao phủ cửa sổ replay cho phép. Xóa sớm rồi replay có thể gây tác động lặp; xem Q-17.

## 6. Dữ liệu AI và tri thức

Conversation thuộc một user hoặc anonymous session đã ràng buộc. Message và tool run tham chiếu conversation; truy vấn luôn kèm scope chủ sở hữu. Không dùng conversationId như bằng chứng quyền.

Knowledge document có sourceId, version, locale, status, effectiveFrom/effectiveTo, ACL và checksum. Chunk có documentVersion, chunkId và provenance. Embedding/index là dữ liệu dẫn xuất, có thể xây lại từ nguồn được duyệt. Xóa/ngừng hiệu lực nguồn phải làm chunk cũ không còn được truy xuất.

Confirmation lưu action, requestHash, quoteId/version, principalId, conversationId, expiresAt, consumedAt và operationId. Việc tiêu thụ confirmation và tạo operation bền vững phải atomic trong phạm vi AI; thao tác Booking ở DB khác vẫn cần idempotency và phục hồi, không giả định có transaction xuyên service.

## 7. Snapshot, projection và nguồn sự thật

Snapshot đơn là bản dữ liệu nghiệp vụ tại thời điểm cam kết; không tự cập nhật khi tour đổi tên/giá. Projection payment ở Booking là bản sao có thể trễ; Payment vẫn là nguồn xác minh giao dịch. Search/vector index cũng có thể trễ; không dùng để xác nhận giá hoặc còn chỗ.

Projection cập nhật theo version của đúng aggregate; version booking và version payment không so sánh trực tiếp. Khi phát hiện gap hoặc sự kiện không phù hợp, giữ công việc đối soát thay vì ghi đè mù.

## 8. Lưu trữ và xóa

Chưa chốt thời gian lưu đơn, audit, webhook, chat và dữ liệu đánh giá. Không đưa số ngày lưu tùy ý thành yêu cầu pháp lý. Chọn chính sách tại Q-17/Q-18 trước khi đưa dữ liệu khách thật vào hệ thống. Cần phân biệt xóa nội dung chat, xóa index và nghĩa vụ giữ chứng từ giao dịch.

Migration của service chỉ đổi DB service đó. Mọi migration phải có hướng triển khai tương thích, backup/khôi phục phù hợp; không bật schema synchronize ở môi trường có dữ liệu cần giữ.
