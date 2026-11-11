# Phát triển local và trình diễn dự án

Trạng thái: **hướng dẫn tham chiếu hiện tại + yêu cầu demo đề xuất**. Không có dịch vụ hoặc lệnh ứng dụng nào được chạy trong lần viết tài liệu.

## 1. Nguồn cấu hình hiện tại

Đọc [README root](../README.md), [README client](../client/README.md) và [README server](../server/README.md). Giới hạn Node/pnpm, dependency và script thực tế lấy từ [client package](../client/package.json), [server package](../server/package.json) và lockfile tương ứng. Khi kiểm tra cuối lần biên soạn, root chưa có file .nvmrc; không giả định lệnh quản lý version tự đọc được file này.

Không ghim lại version trong tài liệu sản phẩm này để tránh lệch khi nâng dependency. Có hai thư mục ứng dụng và bộ lệnh riêng; không giả định root có lệnh pnpm workspace bao trùm FE và BE.

## 2. Chạy phần hiện có

Các lệnh dưới đây được dẫn từ README/package hiện tại, chưa được thực thi hoặc kiểm chứng trong lần biên soạn. Cần cấu hình dependency và dữ liệu local trước khi chạy.

Trong thư mục client:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Trong thư mục server, sau khi cấu hình theo README:

```sh
pnpm install --frozen-lockfile
docker compose -f docker-compose.provider.yaml up -d
pnpm dev-lite
```

PostgreSQL hiện thuộc profile tùy chọn:

```sh
docker compose -f docker-compose.provider.yaml --profile postgres up -d
```

Không tự chạy seed/migration trên dữ liệu đang sử dụng. Chọn môi trường, realm và database độc lập theo README. Không coi việc container đang chạy là bằng chứng auth, booking hoặc Kafka đã hoạt động. Compose hiện chưa có Kafka; dev-lite hiện chỉ phục vụ các app được khai báo trong script.

## 3. Cấu hình cho thiết kế mới

Khi triển khai, cần bổ sung cấu hình có validation cho broker, client/group, DB từng service, provider thanh toán, notification, LLM, retrieval, timeout và budget. Tên biến cụ thể phải theo config implementation, không tạo danh sách env giả rồi mô tả như đã hỗ trợ.

.env.example chỉ chứa giá trị mẫu; secret ở môi trường phù hợp. Trước khi công khai repository, kiểm tra tracking và lịch sử chứa cấu hình nhạy cảm. Việc file không còn được tracking ở working tree hiện tại không chứng minh lịch sử Git đã sạch; lần biên soạn này không kiểm toán hoặc sửa lịch sử Git.

## 4. Môi trường demo đề xuất

| Thành phần    | Yêu cầu demo                                                                           |
| ------------- | -------------------------------------------------------------------------------------- |
| Dữ liệu       | Tour/lịch/giá giả lập được gắn nhãn; không dùng danh tính khách thật                   |
| Payment       | Adapter giả lập có kịch bản success/fail/timeout/late hoặc sandbox provider            |
| Notification  | Hộp thư thử nghiệm; không gửi tới khách/người ngoài                                    |
| Kafka         | Topic/group rõ; có cách xem lag và message đã lọc dữ liệu                              |
| AI            | Provider/model/prompt version ghi lại; giới hạn chi phí và công cụ                     |
| Observability | Có trace/log để theo dõi một booking; dashboard chỉ khi thực sự cấu hình               |
| Reset         | Dữ liệu demo có namespace/ID nhận diện; lệnh reset chỉ tác động dữ liệu demo được chọn |

Không dùng từ production-ready chỉ vì chạy được Compose. Một broker local không chứng minh high availability. Mock payment không chứng minh tích hợp cổng thật.

## 5. Kịch bản demo có thể trình bày

| Kịch bản          | Thao tác                                                     | Kết quả cần ghi nhận                                       |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Luồng bình thường | Tìm tour → báo giá → tạo đơn → thanh toán sandbox            | Đơn CONFIRMED, event/trace nối được, thông báo tới sandbox |
| Tranh chấp chỗ    | Hai khách đặt phần chỗ còn lại đồng thời                     | Không vượt capacity, request thua nhận lỗi có nghĩa        |
| Broker gián đoạn  | Dừng broker của môi trường demo sau khi có transaction       | Outbox giữ event; phục hồi không tạo đơn/thanh toán lặp    |
| Consumer crash    | Dừng đúng consumer sau DB commit trước offset commit         | Redelivery không gây side effect DB lặp                    |
| Thanh toán muộn   | Cho đơn hết hạn rồi nhận kết quả thành công                  | Đơn không tự sống lại, có refund/bù trừ và audit           |
| Agent hữu ích     | Hỏi nhu cầu → tìm tour → giải thích policy → chuẩn bị action | Có tool trace, nguồn và xác nhận đúng dữ liệu              |
| Agent bị đánh lừa | Đưa chỉ dẫn độc hại vào tài liệu thử nghiệm                  | Không gọi tool vượt quyền, không lộ dữ liệu/secret         |

Đây là danh sách yêu cầu demo tương lai, không phải kết quả đã pass. Xem bằng chứng cần lưu ở [14-TESTING-AND-ACCEPTANCE](14-TESTING-AND-ACCEPTANCE.md).

## 6. Bộ bằng chứng portfolio

Một bản demo nên ghi commit, ngày chạy, môi trường, cấu hình đã lược secret, dữ liệu fixture, thao tác và kết quả. Có sơ đồ tổng quan, một trace xuyên service, ví dụ xử lý trùng và một đánh đổi kiến trúc trong ADR.

Video nên trình bày một luồng người dùng cùng một tình huống lỗi có phục hồi. README chỉ dẫn đến bằng chứng thực; không dùng ảnh dashboard mẫu hoặc số throughput tự đặt như kết quả dự án.

Chỉ sau khi hoàn thành có thể viết CV theo cấu trúc: đã xây gì → dùng kỹ thuật gì để giải quyết vấn đề nào → kiểm chứng bằng cách nào. Nếu có benchmark, ghi quy mô dữ liệu, concurrency, máy chạy, thời lượng và percentile; không chỉ ghi một con số requests/second.

## 7. Kiểm tra phù hợp phạm vi

Chỉ thay tài liệu: formatter, link/path, diff và tính nhất quán. Thay nghiệp vụ: test unit/integration tương ứng và lint phạm vi. Thay contract/hạ tầng: kiểm tra cả producer/consumer và kịch bản lỗi có liên quan. Không bật toàn bộ stack chỉ để kiểm tra Markdown.

Các lệnh build/test/lint hiện tại nằm trong README/instructions; không tạo thêm lệnh demo giả trong tài liệu. Khi đã có script chạy/reset/demo, bổ sung đường dẫn và điều kiện sử dụng tại đây.

## 8. Quản lý process và dữ liệu khi thử nghiệm

Ghi lại PID/service/container do phiên thử nghiệm khởi động. Khi kết thúc, dừng đúng tài nguyên đó, đóng timer/client/socket. Không kill toàn bộ node.exe hoặc dừng container có sẵn của người dùng. Không xóa volume chỉ để làm test sạch nếu chưa xác định rõ dữ liệu demo và phạm vi.
