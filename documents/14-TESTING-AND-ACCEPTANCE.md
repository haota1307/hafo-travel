# Kiểm thử và tiêu chí nghiệm thu

Trạng thái: **tiêu chí đề xuất, chưa có kết quả chạy**. Tài liệu này không yêu cầu chạy toàn bộ kiểm thử cho mọi thay đổi; lựa chọn theo phạm vi và rủi ro thực tế.

## 1. Phân biệt bằng chứng

| Mức                              | Chứng minh được                                                      | Không chứng minh được                    |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| Đọc source                       | Có logic/contract/pattern trong code                                 | Tích hợp ngoài đã hoạt động              |
| Formatter/lint/typecheck/build   | Cú pháp, kiểu, quy tắc hoặc khả năng đóng gói trong phạm vi kiểm tra | Nghiệp vụ đúng với dữ liệu thật          |
| Unit test có mock                | Các nhánh logic trong điều kiện fixture                              | Kafka/DB/provider thật có cùng hành vi   |
| Integration với dependency local | Transaction, transport và hành vi dependency đã chạy                 | Khả năng chịu tải/HA production          |
| Sandbox end-to-end               | Luồng qua các thành phần sandbox                                     | Thanh toán tiền thật và vận hành thực tế |
| Browser interaction              | Tương tác UI thực tế trong môi trường đã thử                         | Mọi trình duyệt/mọi kích thước màn hình  |

Không dùng “No tests found” làm kết quả pass. Ghi rõ chạy mới hay lấy cache khi cần bằng chứng. Computer use chỉ thực hiện khi người dùng yêu cầu; không tự bật browser automation trong nhiệm vụ tài liệu.

## 2. Ma trận nghiệm thu chức năng

| Use case / quy tắc | Kiểm tra cần thiết                                                | Điều kiện đạt                                           |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| UC-01, BR-01/05    | Tìm kiếm public, tour nháp, price null, kết quả rỗng              | Không lộ nháp, không bịa giá, trạng thái rỗng rõ        |
| UC-03, BR-03/04    | Giá/currency, quote hết hạn, thay số khách                        | Server tính đúng fixture; dữ liệu đổi phải báo giá lại  |
| UC-04, BR-06/07    | Request đồng thời, transaction rollback                           | Không vượt capacity; đơn/reservation/outbox đồng bộ     |
| UC-04, BR-14       | Cùng key/cùng payload, cùng key/khác payload, khác key/cùng quote | Không tạo lặp; conflict có nghĩa; unique quote được giữ |
| UC-05, BR-16/18    | Webhook giả, trùng, sai amount/currency                           | Từ chối/cách ly đúng; không xác nhận đơn sai            |
| UC-05, BR-17       | Provider timeout sau khi nhận request                             | UNKNOWN và đối soát; không thu lần hai mù               |
| UC-06, BR-12       | User A đọc đơn của B qua HTTP/tool                                | Không trả dữ liệu B                                     |
| UC-07, BR-08/19    | Hủy/hết hạn trùng, cạnh tranh payment success                     | Chuyển state hợp lệ; chỗ không cộng/trừ hai lần         |
| BR-20/21/22        | Thanh toán muộn, refund trùng/timeout/vượt tiền                   | Nghĩa vụ bù trừ được lưu; không hoàn vượt tiền          |
| BR-23              | Notification lỗi                                                  | Booking giữ kết quả đúng; delivery có thể phục hồi      |
| BR-26/27/28        | Agent viết chưa xác nhận, xác nhận stale, tool timeout            | Backend chặn; không báo thành công giả hoặc tạo lặp     |

Các chính sách chưa chốt không thể nghiệm thu hành vi kinh doanh cuối cùng. Ví dụ chưa biết phí hủy thì chỉ nghiệm thu rằng hệ thống không tự áp phí mẫu hoặc hoàn tiền tùy ý.

## 3. Unit và contract test có giá trị

Ưu tiên chuyển trạng thái hợp lệ/không hợp lệ, tính tiền theo quy tắc đã duyệt, kiểm tra quyền, validation schema và mapping lỗi. Không viết test chỉ để khẳng định một hàm gọi đúng hàm khác khi không bảo vệ contract hoặc nhánh quan trọng.

Contract test đọc fixture event phiên bản hỗ trợ và từ chối phiên bản không biết theo policy. Kiểm tra error envelope hiện tại không bị đổi khi thêm endpoint. SSE cần kiểm tra frame/headers riêng, không dùng test envelope JSON để suy ra streaming hoạt động.

## 4. Integration transaction và concurrency

Test Booking với PostgreSQL thật trong môi trường độc lập: nhiều request tranh số chỗ cuối cùng, quote dùng lại, lỗi giữa bước update counter và insert outbox, race expiry/payment. Assert dữ liệu cuối cùng và invariant, không chỉ HTTP status.

Test Payment với provider adapter giả lập có thể tạo kết quả UNKNOWN, callback đảo thứ tự và trùng. Giả lập chỉ chứng minh ứng dụng xử lý mô hình lỗi đó; nếu có provider sandbox phải thêm test chữ ký/reference theo contract thật.

Fixture có thời gian điều khiển được để kiểm tra ranh giới expiresAt; tránh test ngủ dài dễ flake. Khi dùng clock giả cần tách test xác minh timestamp DB thật. Không tạo lượng test tải lớn chỉ để sửa tài liệu hoặc UI nhỏ.

## 5. Kafka và phục hồi

| Case   | Điểm tiêm lỗi                             | Assert                                                         |
| ------ | ----------------------------------------- | -------------------------------------------------------------- |
| REL-01 | Broker unavailable sau transaction        | Outbox còn record, phục hồi gửi được                           |
| REL-02 | Relay crash sau publish trước đánh dấu    | Cùng eventId được gửi lại; consumer không ghi lặp              |
| REL-03 | Consumer crash sau DB commit trước offset | Inbox và state vẫn đúng sau restart                            |
| REL-04 | Message schema sai                        | Cách ly bền vững, offset xử lý theo policy, có cảnh báo        |
| REL-05 | Hai relay cùng aggregate                  | Không phát version sau vượt version trước                      |
| REL-06 | Consumer xử lý lâu/rebalance              | Không mất công việc; commit không vượt message chưa hoàn tất   |
| REL-07 | Replay trong cửa sổ hỗ trợ                | Projection đúng; side effect không lặp                         |
| REL-08 | Job hết hạn restart                       | Công việc được đọc lại từ DB, chỗ được giải phóng đúng một lần |

Chọn bài test tương ứng với implementation được thay đổi. Chưa có Kafka trong repo thì các case này là yêu cầu tương lai, không tạo test rỗng chỉ để đủ tên.

## 6. Frontend và AI

Frontend cần xử lý pending, conflict, expired, UNKNOWN và eventual consistency; không chỉ màn hình happy path. Kiểm tra i18n vi/en, ngày/tiền và hành vi không gửi lặp khi pending. Template mock không thay thế nghiệp vụ có API.

AI dùng bộ case [12-AI-EVALUATION](12-AI-EVALUATION.md), với assert backend cho quyền/side effect và đánh giá nội dung riêng. Test agent không được gửi email thật hoặc tạo giao dịch tiền thật. Nếu dùng LLM thật phải ghi provider/model và usage; nếu mock phải nói rõ giới hạn.

## 7. Hiệu năng và tải

Chưa có mục tiêu throughput/latency chính thức. Khi đo, xác định endpoint/luồng, dữ liệu, concurrency, thời lượng, warmup, máy chạy, phiên bản và metric. Báo p50/p95, tỷ lệ lỗi và tài nguyên; không extrapolate một máy local thành khả năng scale production.

Tải booking phải kiểm tra invariant cùng throughput. Tải Kafka theo dõi lag và thời gian phục hồi. Tải AI cần ngân sách và giới hạn provider; không benchmark trả phí vô hạn để có biểu đồ đẹp.

## 8. Điều kiện hoàn thành một chức năng

Chức năng có use case/rule đã chốt, contract và quyền rõ, code theo convention, kiểm tra phù hợp đạt, đường lỗi/timeout được xử lý, tài liệu hiện trạng cập nhật, và bằng chứng đủ cho phạm vi tuyên bố. Không còn process thử nghiệm do phiên làm việc khởi động bị bỏ quên.

Với tác vụ chỉ viết tài liệu, điều kiện là tên/format đúng, link hợp lệ, source-backed current state, đề xuất và câu hỏi được phân biệt, contract/state nhất quán. Không yêu cầu pass build ứng dụng khi code không đổi.

## 9. Mẫu ghi kết quả

| Trường                   | Nội dung cần ghi                                                    |
| ------------------------ | ------------------------------------------------------------------- |
| Ngày, commit, môi trường | Mốc tái hiện                                                        |
| Phạm vi                  | Chức năng/contract được kiểm tra                                    |
| Cách chạy                | Lệnh thực hoặc thao tác thực                                        |
| Dependency               | Mock/local thật/sandbox/provider thật                               |
| Kết quả                  | Pass/fail và evidence; số case thực sự chạy                         |
| Giới hạn                 | Chưa kiểm tra gì, lỗi còn lại                                       |
| Dọn tài nguyên           | Process/container tự bật đã dừng; dữ liệu demo giữ/xóa theo phạm vi |

Không điền bảng bằng kết quả dự kiến. Báo lỗi còn tồn tại thay vì bỏ test hoặc gắn nhãn hoàn thành quá sớm.
