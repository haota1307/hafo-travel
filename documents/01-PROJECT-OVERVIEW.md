# Tổng quan dự án Hafo Travel

Trạng thái: **hiện trạng từ source + định hướng đã xác nhận + đề xuất sản phẩm**. Ngày đối chiếu nền: 11/11/2026; cập nhật RBAC: 14/11/2026.

## 1. Định hướng

Hafo Travel hướng tới trải nghiệm tìm hiểu hành trình, chọn tour và quản lý đặt tour. AI assistant hỗ trợ người dùng diễn đạt nhu cầu, tra cứu lựa chọn và hiểu chính sách. Backend chịu trách nhiệm về giá, chỗ, đơn và thanh toán.

Phần thương mại này là đề xuất mở rộng. Giao diện hiện tại giới thiệu các hành trình Việt Nam; chưa đủ căn cứ để kết luận Hafo Travel đã là hệ thống bán tour có lịch khởi hành và giá thực tế.

## 2. Hai nhóm mục tiêu

| Nhóm                 | Kết quả mong muốn                                                    | Bằng chứng phù hợp                                                |
| -------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Sản phẩm             | Khách tìm được lựa chọn phù hợp, hiểu điều kiện và theo dõi được đơn | Luồng sử dụng hoàn chỉnh, thông tin nhất quán, lỗi có hướng xử lý |
| Học tập và portfolio | Hiểu microservice, Kafka, tính nhất quán phân tán và AI tool calling | Source, ADR, contract, test lỗi, trace, demo có thể chạy lại      |

Không dùng số lượng service hoặc số công nghệ làm tiêu chí hoàn thành. Một service mới phải có trách nhiệm, dữ liệu hoặc vòng đời xử lý đủ rõ để giải thích vì sao tồn tại.

## 3. Hiện trạng có căn cứ

| Hạng mục        | Quan sát từ source                                                                      | Giới hạn                                                                               |
| --------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Frontend public | Next.js, nội dung vi/en, trang hành trình, liên hệ và các trang thông tin               | Nội dung giới thiệu không chứng minh tồn kho hoặc khả năng đặt tour                    |
| Giá hành trình  | Các dữ liệu retreat hiện dùng `price: null`                                             | Không được coi là miễn phí hoặc tự gán giá bán                                         |
| Form liên hệ    | Có validation; submit chuyển sang thông báo chưa khả dụng                               | Chưa gửi yêu cầu tới API liên hệ                                                       |
| Template admin  | Có bộ màn hình mẫu độc lập                                                              | Không coi các bảng và nút demo là nghiệp vụ thật                                       |
| BFF             | Login, hồ sơ hiện tại, tạo user, gán role và CRUD role; thực thi RBAC, chuyển tiếp gRPC | Chưa có API booking/payment/AI trong các module hiện tại                               |
| Authorizer      | Tích hợp Keycloak, đăng nhập và xác thực; phục vụ gRPC theo contract v1                 | Chỉ có RPC auth/user; chưa có RPC booking/payment/AI                                   |
| User-access     | Tạo/tra cứu user, gán role và CRUD role động trong MongoDB                              | Quyền nghiệp vụ booking/payment/AI chưa triển khai; gRPC cần ranh giới service tin cậy |
| Hạ tầng         | Compose có MongoDB, Redis, Keycloak; PostgreSQL thuộc profile tùy chọn                  | Chưa thấy Kafka hoặc vector store trong cấu hình provider hiện có                      |
| Auth frontend   | Có HTTP wrapper và proxy backend                                                        | Proxy hiện không forward cookie/Authorization; UI chưa tích hợp auth thật              |
| Kiểm thử        | Có các suite backend/frontend trong repository                                          | Chưa chạy trong lần biên soạn này; không khẳng định đang pass                          |

## 4. Nguồn đối chiếu trong repository

- [Cấu trúc backend](../server/instructions/architecture.md), [quy ước backend](../server/instructions/coding.md).
- [Controller đăng nhập BFF](../server/apps/bff/src/app/modules/authorizer/controllers/authorizer.controller.ts).
- [Controller user BFF](../server/apps/bff/src/app/modules/user/controllers/user.controller.ts).
- [RBAC hiện tại](../server/instructions/rbac.md): mô hình quyền, API quản trị, cache và khởi tạo admin.
- [User service](../server/apps/user-access/src/app/modules/user/services/user.service.ts): tạo tài khoản Keycloak rồi lưu MongoDB; không có transaction chung.
- [Proxy Next.js](../client/app/api/backend/[[...path]]/route.ts): danh sách header được chuyển tiếp hiện tại.
- [Form liên hệ](../client/features/public-site/components/contact-form.tsx).
- [Dữ liệu hành trình](../client/features/public-site/data/retreats), [hướng dẫn public](../client/documents/public-site/README.md).
- [Provider Compose](../server/docker-compose.provider.yaml), [dependency backend](../server/package.json).

Những giới hạn trên được ghi để định hướng công việc tiếp theo, không phải yêu cầu tự sửa auth hoặc thay nghiệp vụ trong phạm vi viết tài liệu.

## 5. Hình dung sản phẩm đề xuất

Khách có thể tự tìm tour bằng bộ lọc hoặc hỏi assistant. Hai cách đều truy cập cùng nguồn dữ liệu tour. Khi chọn lịch khởi hành, khách xem báo giá có hạn sử dụng và điều kiện áp dụng. Sau khi xác nhận, hệ thống tạo đơn và giữ chỗ theo quy tắc đã chốt. Thanh toán được xử lý qua môi trường giả lập hoặc sandbox; trạng thái đơn có thể cập nhật sau một khoảng trễ.

Nhân viên có thể quản lý tour/lịch khởi hành, xem đơn và giải quyết ngoại lệ theo quyền. Không mặc định nhân viên được xem mọi hội thoại AI hoặc tự thay đổi kết quả thanh toán.

## 6. Phạm vi công nghệ đề xuất

- Giữ Next.js, NestJS và Nx hiện có; chưa đặt yêu cầu đổi ngôn ngữ backend.
- Thêm booking, payment, notification và ai-assistant theo ranh giới ở tài liệu 05.
- PostgreSQL phục vụ dữ liệu giao dịch mới; MongoDB user hiện tại không bị chuyển đổi chỉ vì tài liệu này.
- Kafka trao đổi sự kiện nghiệp vụ; HTTP/gRPC xử lý yêu cầu cần trả kết quả trực tiếp.
- Một agent có công cụ được giới hạn và nguồn tri thức được duyệt; chưa cần multi-agent.
- Lựa chọn LLM provider/model, thư viện agent và vector store còn mở; không khóa theo thương hiệu trước khi đánh giá.

## 7. Tiêu chí thành công dự kiến

Khách hiểu trạng thái thực của đơn, không nhận thông báo thành công giả. Hệ thống có cơ chế chống đặt vượt chỗ và xử lý lặp. Thanh toán muộn hoặc không rõ kết quả đi vào đối soát/bù trừ thay vì bị bỏ qua. Assistant dùng dữ liệu có nguồn, không vượt quyền và không tự nhận thao tác thành công khi công cụ chưa xác nhận.

Portfolio có hướng dẫn chạy, sơ đồ, lý do lựa chọn, kết quả test thực và giới hạn. Mọi số đo hiệu năng/chi phí phải kèm môi trường và cách đo. Xem [tiêu chí nghiệm thu](14-TESTING-AND-ACCEPTANCE.md).

## 8. Các giả định cần xác nhận

Tour theo lịch khởi hành, thanh toán toàn bộ, yêu cầu đăng nhập khi đặt, một đơn vị vận hành và VND là phương án baseline để mô tả nhất quán. Đây chưa phải nghiệp vụ đã chốt. Không tự thêm multi-company, marketplace hoặc chức năng của hệ thống khác. Xem Q-01 đến Q-10 tại [danh sách câu hỏi](99-OPEN-QUESTIONS.md).
