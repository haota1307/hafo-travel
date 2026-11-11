# Tài liệu dự án Hafo Travel

Ngày đối chiếu source: **11/11/2026**. Bộ tài liệu này mô tả hiện trạng và thiết kế đề xuất cho nền tảng du lịch có backend microservice, Kafka và AI agent. Đây không phải báo cáo hệ thống đã vận hành đầy đủ.

## Cách đọc trạng thái

| Nhãn                   | Ý nghĩa                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Hiện trạng từ source   | Có căn cứ trong mã nguồn tại thời điểm đối chiếu; chưa đồng nghĩa đã kiểm chứng runtime      |
| Định hướng đã xác nhận | Người dùng muốn phát triển dự án, học microservice/Kafka, tích hợp AI agent và xây portfolio |
| Đề xuất thiết kế       | Phương án để thảo luận và triển khai sau; chưa là tính năng hiện có hoặc quyết định đã duyệt |
| Cần xác nhận nghiệp vụ | Chưa đủ thông tin để chốt hành vi sản phẩm                                                   |
| Đã kiểm chứng          | Chỉ dùng khi có môi trường, cách kiểm tra và kết quả thực tế được ghi lại                    |

Các con số về thời gian giữ chỗ, retry, ngân sách AI và hiệu năng trong tài liệu là **giá trị minh họa/đề xuất**, không phải cấu hình hoặc số đo hiện tại. Tên endpoint, event, table và permission mới cũng là thiết kế đề xuất.

## Mục lục

| Tài liệu                                                                | Trả lời câu hỏi                                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [01-PROJECT-OVERVIEW](01-PROJECT-OVERVIEW.md)                           | Sản phẩm là gì, mục tiêu nào đã rõ, source hiện có gì?                 |
| [02-SCOPE-AND-USE-CASES](02-SCOPE-AND-USE-CASES.md)                     | Ai sử dụng, MVP gồm những việc gì, kết quả mong muốn là gì?            |
| [03-BUSINESS-RULES](03-BUSINESS-RULES.md)                               | Giá, chỗ, đơn, thanh toán, hủy và hoàn tiền tuân theo quy tắc nào?     |
| [04-USER-FLOWS](04-USER-FLOWS.md)                                       | Người dùng thao tác thế nào; hệ thống chuyển trạng thái ra sao?        |
| [05-SYSTEM-ARCHITECTURE](05-SYSTEM-ARCHITECTURE.md)                     | Service chia thế nào, phần nào dùng gRPC/HTTP/Kafka?                   |
| [06-DATA-OWNERSHIP](06-DATA-OWNERSHIP.md)                               | Ai sở hữu dữ liệu; transaction và ràng buộc nằm ở đâu?                 |
| [07-API-AND-EVENT-CONTRACTS](07-API-AND-EVENT-CONTRACTS.md)             | Các bên trao đổi dữ liệu theo hợp đồng nào?                            |
| [08-RELIABILITY-AND-OBSERVABILITY](08-RELIABILITY-AND-OBSERVABILITY.md) | Làm thế nào phát hiện lỗi, không mất công việc và phục hồi?            |
| [09-DEVELOPMENT-AND-DEMO](09-DEVELOPMENT-AND-DEMO.md)                   | Chạy phần hiện có thế nào, demo và công bố kết quả ra sao?             |
| [10-AI-ASSISTANT](10-AI-ASSISTANT.md)                                   | Agent giúp việc gì, được quyết định đến đâu?                           |
| [11-AI-KNOWLEDGE-AND-TOOLS](11-AI-KNOWLEDGE-AND-TOOLS.md)               | Agent lấy dữ liệu ở đâu, gọi công cụ nào và với quyền gì?              |
| [12-AI-EVALUATION](12-AI-EVALUATION.md)                                 | Đánh giá độ đúng, độ an toàn, chi phí và chất lượng agent thế nào?     |
| [13-SECURITY-AND-PRIVACY](13-SECURITY-AND-PRIVACY.md)                   | Bảo vệ phiên, dữ liệu khách, webhook và các thao tác của agent ra sao? |
| [14-TESTING-AND-ACCEPTANCE](14-TESTING-AND-ACCEPTANCE.md)               | Những bằng chứng nào đủ để nhận một chức năng là hoàn thành?           |
| [15-GLOSSARY-AND-REFERENCES](15-GLOSSARY-AND-REFERENCES.md)             | Thuật ngữ và tài liệu chính thức để đối chiếu là gì?                   |
| [99-OPEN-QUESTIONS](99-OPEN-QUESTIONS.md)                               | Những quyết định nào chưa được chốt?                                   |
| [DECISIONS](DECISIONS/README.md)                                        | Vì sao chọn phương án kiến trúc này và đánh đổi điều gì?               |

Đọc 01–04 để hiểu sản phẩm; 05–08 để hiểu backend; 10–12 để hiểu AI; 09, 13, 14 để chuẩn bị chạy và kiểm chứng. Tra cứu 99 trước khi triển khai một nghiệp vụ chưa rõ.

## Ranh giới với tài liệu có sẵn

- [README dự án](../README.md): điểm vào và hướng dẫn chạy tổng quát.
- [Frontend instructions](../client/documents/instructions.md): convention, cấu trúc UI, i18n và HTTP hiện tại.
- [Public site](../client/documents/public-site/README.md): giao diện giới thiệu hành trình hiện tại.
- [Backend instructions](../server/instructions/README.md): convention NestJS/Nx và ranh giới code hiện tại.
- [Backend README](../server/README.md): cấu hình, lệnh và giới hạn hiện có.

Thư mục này sở hữu mô tả sản phẩm và thiết kế xuyên service. Instructions sở hữu quy ước triển khai. Contract có thể thực thi trong code là nguồn đối chiếu khi chức năng đã được xây dựng. Không sao chép toàn bộ instructions hoặc version dependency vào nhiều file.

## Quy tắc bảo trì

1. File nội dung dùng tên `NN-UPPERCASE-NAME.md`; `README.md` là mục lục. Tài liệu ADR đặt trong `DECISIONS` với số riêng.
2. Mỗi tài liệu nêu trạng thái, phạm vi và liên kết tới phần liên quan. Dùng ID `UC-xx`, `BR-xx`, `Q-xx` để liên hệ nghiệp vụ, kiểm thử và câu hỏi.
3. Khi chốt câu hỏi, ghi quyết định, ngày và tài liệu bị ảnh hưởng tại 99; cập nhật nội dung tương ứng. Không chỉ xóa câu hỏi.
4. Khi triển khai, bổ sung đường dẫn source và bằng chứng kiểm chứng rồi mới đổi trạng thái. Không coi việc viết tài liệu là triển khai.
5. Khi đổi contract, cập nhật nơi phát, nơi nhận, tài liệu và hướng tương thích. Khi đổi nền tảng, cập nhật README/instructions liên quan.
6. Không đưa secret, dữ liệu khách thật hoặc token vào ví dụ. Fixture phải nhận diện rõ là dữ liệu demo.
7. Chỉ sửa tài liệu thì kiểm tra format, link, tính nhất quán và diff; không cần bật ứng dụng.

## Phạm vi lần biên soạn này

Đã đọc tài liệu và source liên quan đến frontend public, proxy, BFF, user-access và auth; đối chiếu tài liệu kỹ thuật chính thức. Không chạy dịch vụ, migration, thanh toán, Kafka hoặc LLM. Bộ tài liệu không tuyên bố bất kỳ kết quả tích hợp thực tế nào.
