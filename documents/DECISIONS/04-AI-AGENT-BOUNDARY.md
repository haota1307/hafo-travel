# ADR-04: Một agent với công cụ và quyền giới hạn

Ngày: 11/11/2026. Trạng thái: **Proposed**. Implementation: chưa có agent/provider được tích hợp.

## Bối cảnh

AI cần hữu ích cho khách tìm và đặt tour, đồng thời không làm sai giá/chỗ/quyền hoặc tự tạo giao dịch. Công cụ, dữ liệu retrieval và hội thoại có thể lỗi hoặc bị thao túng. Chủ dự án chưa chọn model/framework.

## Quyết định đề xuất

Một AI Assistant service điều phối LLM, retrieval và tool allowlist. Giá/chỗ/đơn lấy từ API nghiệp vụ. Policy lấy từ nguồn được duyệt. Model chuẩn bị action; người dùng xác nhận qua UI với payload/version ràng buộc; backend tạo operation và thực thi idempotent.

Provider-neutral ở contract ứng dụng, nhưng không xây framework adapter tổng quát trước khi cần. Provider/model được chọn bằng evaluation với dataset Hafo Travel. Chưa có multi-agent, shell, SQL hoặc browser tool tùy ý.

## Phương án thay thế

| Phương án                             | Ưu điểm                    | Chi phí/lý do chưa chọn                                                       |
| ------------------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Chatbot chỉ prompt                    | Dễ làm giao diện           | Không có dữ liệu thời gian thực, khó chứng minh giá trị nghiệp vụ             |
| Workflow hoàn toàn định sẵn           | Dễ kiểm soát và kiểm thử   | Hạn chế cách khách diễn đạt; vẫn là phương án tốt cho các bước ghi quan trọng |
| Multi-agent ngay                      | Thử nhiều vai trò/phối hợp | Tăng chi phí, tracing, state và surface lỗi trước khi có use case cần         |
| Cho agent truy cập DB hoặc HTTP tùy ý | Linh hoạt                  | Quyền quá rộng, khó ràng buộc và kiểm chứng tác động                          |

## Hệ quả

Có thể demo sự kết hợp ngôn ngữ tự nhiên và dữ liệu thật; quyền và invariant được bảo vệ ngoài mô hình. Đổi lại phải xây tool schema, confirmation, operation recovery, citation và evaluation. Prompt tốt không thay thế các thành phần này.

Tính tự chủ bị giới hạn có chủ đích ở thao tác tạo cam kết. Agent unavailable không làm mất khả năng đặt tour qua UI thông thường.

## Điều kiện xem xét lại

Chỉ thêm agent chuyên biệt khi đo được lợi ích và có boundary/trace/budget rõ. Chỉ thêm công cụ ghi mới khi use case, quyền, confirmation, idempotency và test lỗi đã có. Chốt Q-14/Q-15/Q-18/Q-19/Q-21; xem [thiết kế agent](../10-AI-ASSISTANT.md).
