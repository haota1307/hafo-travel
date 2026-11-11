# ADR-05: Điều phối booking và bù trừ thanh toán

Ngày: 11/11/2026. Trạng thái: **Proposed, phụ thuộc xác nhận Q-07/Q-08/Q-20**. Implementation: chưa có máy trạng thái hoặc provider adapter mới.

## Bối cảnh

Giữ chỗ có hạn, thanh toán và message có thể trễ. Booking không thể rollback giao dịch đã xảy ra ở provider. Hệ thống cần phân biệt trạng thái đặt chỗ với sự thật tài chính và xử lý được race expiry/payment.

## Quyết định đề xuất

Booking sở hữu state machine và điều phối bù trừ bằng state/command bền vững. Payment sở hữu attempt/refund và sự thật tài chính. Transaction Booking kiểm tra deadline bằng giờ DB; chỉ xác nhận đơn còn hợp lệ khi xử lý kết quả. Đơn hết hạn/hủy không tự mở lại khi có tiền đến muộn; lưu nghĩa vụ bù trừ và RequestRefund.

Chọn baseline này để đơn giản hóa invariant chỗ. Nó có thể hoàn tiền cả khoản provider thu trước hạn nhưng sự kiện tới sau hạn. Đây là đánh đổi kinh doanh cần chủ dự án chốt, không phải quy tắc bắt buộc của Kafka hoặc payment.

## Phương án thay thế

| Phương án                                         | Ưu điểm                                | Chi phí/lý do chưa chọn                                                       |
| ------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Chấp nhận theo provider paidAt                    | Thuận lợi cho khách thanh toán sát hạn | Cần grace period/giữ chỗ hoặc xử lý đã bán lại; tin cậy timestamp và đối soát |
| Giữ chỗ vô hạn đến khi payment chắc chắn kết thúc | Giảm trường hợp trả tiền nhưng hết chỗ | Khóa inventory lâu khi provider mất kết nối                                   |
| Tự đặt lại nếu còn chỗ                            | Có thể giảm hoàn tiền                  | Cần xác nhận giá/điều kiện và race mới; thay đổi đơn terminal phức tạp        |
| Coordinator giữ state trong BFF memory            | Ít bảng ban đầu                        | Mất tiến trình khi restart, không phù hợp luồng dài                           |

## Hệ quả

State rõ, counter chỗ có thể bảo vệ bằng transaction. Eventual consistency có thể khiến UI thấy đã thu tiền nhưng đơn chưa xác nhận hoặc đang hoàn. Cần giải thích trạng thái, theo dõi nghĩa vụ và công cụ đối soát; DLT không tự giải quyết nghĩa vụ tài chính.

Refund cần idempotency/provider reconciliation. Hoàn tiền thất bại không được làm mất obligation hoặc đánh dấu booking thành công. Không gọi saga này là rollback atomic.

## Điều kiện xem xét lại

Nếu ưu tiên trải nghiệm trả sát hạn hoặc provider có guarantee phù hợp, chốt Q-07 và thay cả state/expiry/contract/test. Mở hủy đơn đã CONFIRMED chỉ sau khi có Q-08; không suy ra chính sách hủy từ cơ chế hoàn tiền bù trừ.
