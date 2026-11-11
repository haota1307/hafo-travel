# Độ tin cậy, phục hồi và quan sát hệ thống

Trạng thái: **thiết kế đề xuất**, chưa có cấu hình hoặc kết quả chạy Kafka trong repository. Mục tiêu là giữ đúng dữ liệu nghiệp vụ khi thành phần bị lỗi, đồng thời đủ bằng chứng để điều tra.

## 1. Các cam kết thiết kế

- Booking hợp lệ và event tương ứng được ghi trong một transaction cục bộ.
- Event có thể tới nhiều lần; xử lý ghi dữ liệu phải chống lặp.
- Công việc cần tiếp tục sau restart phải tồn tại trong DB/broker, không chỉ trong timer hoặc memory.
- Timeout tới hệ thống ngoài có thể là kết quả chưa rõ, không mặc định thất bại.
- Có đường đối soát và can thiệp có audit khi không thể tự phục hồi.

Thiết kế chọn at-least-once và idempotent effects. Kafka transaction không tự bao trùm PostgreSQL, cổng thanh toán hoặc email; không tuyên bố exactly-once end-to-end. [Apache Kafka delivery semantics](https://kafka.apache.org/40/design/design/)

## 2. Transactional outbox

Service tạo bản ghi outbox cùng transaction nghiệp vụ. Relay đọc các record chưa phát, lấy lease có thời hạn để tránh hai worker xử lý cùng lúc, gửi broker và chỉ đánh dấu published sau khi có xác nhận phù hợp. Nếu broker lỗi, giữ record và lên lịch thử lại.

Nếu broker đã nhận nhưng process chết trước khi đánh dấu published, event sẽ được gửi lại với cùng eventId. Đây là hành vi phải được consumer chịu được. Không đánh dấu trước rồi gửi, vì có thể mất event khi crash.

Đối với các event cần giữ thứ tự cùng aggregate, relay phải phát theo aggregateVersion, không để worker khác vượt qua record trước chưa hoàn tất. Khóa/lease từng record bằng SKIP LOCKED đơn thuần chưa đủ chứng minh thứ tự theo aggregate. Thiết kế worker cần partition công việc theo aggregate hoặc cơ chế chặn record sau; test phải có nhiều relay.

Baseline dùng polling worker vì dễ quan sát. Debezium Outbox Event Router là lựa chọn CDC về sau, khi đã chốt connector, offset, schema và vận hành. CDC không loại bỏ yêu cầu idempotency ở consumer. [Debezium outbox](https://debezium.io/documentation/reference/transformations/outbox-event-router.html)

## 3. Consumer và inbox

Consumer xác minh schema, loại event và metadata; bắt đầu transaction cục bộ; chèn inbox với unique consumerName/messageId; kiểm tra state/version và cập nhật dữ liệu hoặc lưu work item; commit DB rồi mới xác nhận tiến độ Kafka.

Nếu event đã nằm trong inbox đã commit, có thể coi tác vụ tương ứng đã được ghi nhận và không làm lại side effect. Nếu transaction rollback thì inbox cũng rollback, cho phép retry. Không chèn inbox rồi commit trước nghiệp vụ vì sẽ mất cơ hội xử lý lại.

Crash sau DB commit nhưng trước offset commit dẫn đến redelivery; inbox ngăn tác động lặp. Khi một partition có nhiều message đang xử lý, không commit offset vượt message chưa hoàn tất. Cấu hình auto-commit/concurrency của client phải được kiểm tra thực tế trong implementation; đọc code decorator không đủ chứng minh điều này.

## 4. Side effect bên ngoài

Consumer Payment ghi attempt/job bền vững; worker gọi provider với khóa cố định. Consumer Notification ghi delivery job; worker gọi nhà cung cấp với delivery ID nếu provider hỗ trợ. Transaction DB không thể rollback một email đã gửi hoặc tiền đã thu.

Khi provider timeout, worker lưu UNKNOWN và đối soát theo reference/idempotency key. Chỉ tạo lần thử mới sau khi biết kết quả hoặc có policy xử lý riêng. Nếu nhà cung cấp email không hỗ trợ dedupe/tra cứu, phải ghi nhận khả năng gửi trùng trong cửa sổ crash; không hứa loại bỏ hoàn toàn bằng inbox.

## 5. Retry, backoff và dead-letter topic

| Nhóm lỗi                                  | Hành vi đề xuất                                                      |
| ----------------------------------------- | -------------------------------------------------------------------- |
| DB/broker/provider tạm thời không kết nối | Backoff có jitter, giới hạn số lần/thời gian, giữ công việc bền vững |
| Schema sai/phiên bản không hỗ trợ         | Cách ly, cảnh báo, điều tra contract; không retry nóng vô hạn        |
| Không đủ chỗ, quote hết hạn               | Kết quả nghiệp vụ; phản hồi/event phù hợp, không xem như lỗi hạ tầng |
| Kết quả provider chưa rõ                  | Đối soát; không tự chuyển sang thu/hoàn lần khác                     |
| Event cũ hoặc trùng                       | Bỏ qua có căn cứ và ghi metadata; không ghi đè state mới             |

Các khoảng 1 giây, 5 giây, 30 giây, 2 phút chỉ là ví dụ backoff. Ngưỡng thật phải dựa vào SLA, hạn giữ chỗ và giới hạn provider tại Q-15/Q-20.

DLT đề xuất theo consumer, ví dụ `hafo.booking-payment.dlt.v1`. Record chứa topic/partition/offset gốc, eventId, schemaVersion, errorCode, số lần thử, thời điểm và correlationId; hạn chế payload nhạy cảm. Đưa record vào DLT hoặc lưu công việc cách ly bền vững xong mới commit offset gốc.

DLT không đồng nghĩa nghiệp vụ đã hoàn tất. Có người xem, phân loại nguyên nhân và quyết định sửa/replay/đối soát. Nếu phát sang DLT thành công nhưng commit offset thất bại thì DLT có thể trùng; công cụ xử lý cũng dedupe theo record gốc.

## 6. Thứ tự, gap và replay

Baseline ưu tiên xử lý tuần tự trong partition cho consumer thay đổi state. Nếu dùng retry topic để không chặn partition, chấp nhận khả năng đảo thứ tự và thêm guard version/state cùng cơ chế bù gap. Không bật retry topic rồi vẫn tuyên bố giữ thứ tự tuyệt đối.

Event mới đến trước event cũ có thể cần giữ pending hoặc đọc nguồn chính thức để đối soát. Không bỏ qua message chỉ vì trạng thái chưa tồn tại nếu đó là dependency chưa tới. AggregateVersion chỉ so trong cùng aggregate; callback provider cần quy tắc riêng.

Replay projection có thể dùng consumer group riêng và lưu vào bản index mới. Replay consumer có side effect phải có phạm vi, dry run nếu có, audit và chính sách chống trùng còn hiệu lực. Reset offset production không phải bước debug mặc định. Replay không được tạo eventId mới cho cùng sự thật để vượt inbox.

## 7. Ma trận lỗi và phục hồi

| Điểm lỗi                           | Dữ liệu còn lại                  | Cách phục hồi                | Bằng chứng mong muốn                 |
| ---------------------------------- | -------------------------------- | ---------------------------- | ------------------------------------ |
| Booking commit xong, Kafka tắt     | Đơn + reservation + outbox       | Relay gửi khi broker trở lại | Outbox backlog giảm, chỉ một đơn     |
| Relay gửi xong rồi crash           | Record chưa đánh published       | Gửi lại cùng eventId         | Inbox ngăn tác động lặp              |
| Consumer commit DB rồi crash       | Inbox + dữ liệu/job              | Redelivery bị dedupe         | Counter/trạng thái không đổi lần hai |
| Provider thu tiền rồi worker crash | Attempt có reference/idempotency | Đối soát, ghi SUCCEEDED      | Không có khoản thu mới ngoài ý muốn  |
| PaymentSucceeded đến sau hết hạn   | Đơn terminal, payment thật       | Tạo bù trừ và refund         | Chỗ không bị chiếm lại               |
| Notification provider ngừng        | Delivery job pending/failed      | Retry có hạn                 | Booking vẫn CONFIRMED                |
| Agent stream đứt sau tạo đơn       | Operation và booking tồn tại     | GET operation, không tạo lại | Một confirmation dẫn tới một đơn     |
| Index tri thức bị cũ               | Source version mới, index lag    | Bỏ bản hết hiệu lực, rebuild | Không tư vấn theo policy đã thu hồi  |

## 8. Log và trace

Log có service, environment, severity, timestamp, correlationId, processId/requestId, eventId/operationId khi có, action, duration và errorCode. Không ghi token, password, thẻ thanh toán, body hội thoại đầy đủ hoặc raw tool arguments chứa PII.

Giữ processId cho tương thích code hiện tại; correlationId liên kết một luồng nhiều request/event, còn trace/span phục vụ quan sát kỹ thuật. Truyền trace context qua HTTP/gRPC/Kafka theo adapter được chốt. Background job có thể tạo span mới liên kết event gốc, không giữ một span HTTP mở đến lúc khách thanh toán.

Đề xuất OpenTelemetry cho trace và metrics, nhưng thư viện/exporter/backend lưu trace chưa được chọn. Không khẳng định đã có dashboard hoặc auto-instrumentation trong source.

## 9. Metrics cần quan sát

| Nhóm     | Chỉ số đề xuất                                           | Câu hỏi cần trả lời                              |
| -------- | -------------------------------------------------------- | ------------------------------------------------ |
| HTTP/RPC | Tỷ lệ lỗi, p50/p95 latency, timeout                      | Request chậm ở đâu?                              |
| Outbox   | Số pending, tuổi record cũ nhất, publish failure         | Event có đang bị kẹt?                            |
| Kafka    | Consumer lag, xử lý lỗi, rebalance, DLT count            | Consumer có theo kịp không?                      |
| Booking  | Oversell violation, thời gian pending, expiry-job lag    | Chỗ và thời hạn còn đúng không?                  |
| Payment  | UNKNOWN age, webhook duplicate, refund pending age       | Có nghĩa vụ tài chính chưa rõ không?             |
| AI       | Tool success/denial, groundedness, tokens, cost, timeout | Agent có đúng, hữu ích và trong ngân sách không? |

Không đặt userId/bookingId/conversationId vào metric label vì tạo cardinality cao; dùng log/trace để tìm theo ID. Chỉ gọi một ngưỡng là SLO sau khi thống nhất cách đo, cửa sổ thời gian và mục tiêu. Chưa có số đo hoặc SLO đã cam kết.

## 10. Runbook tối thiểu đề xuất

Khi có đơn kẹt: tìm correlationId → đọc booking và payment bằng công cụ có quyền → xem outbox/inbox/job/lag → phân biệt chưa xử lý với đã xử lý nhưng mất phản hồi → đối soát provider nếu cần → chạy hành động phục hồi có idempotency → kiểm tra invariant và audit.

Không yêu cầu khách thanh toán lại chỉ vì một consumer đang chậm. Không xóa inbox hoặc sửa trạng thái trực tiếp để làm dashboard hết lỗi. Quy trình vận hành cụ thể cần được bổ sung sau khi có implementation và môi trường demo.
