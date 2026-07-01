# Hướng Dẫn Sử Dụng Trang Quản Trị GPCLUB Vietnam

Phiên bản: Tài liệu hướng dẫn theo quy trình quản trị cuối cùng
Đối tượng: Quản trị viên và nhân sự vận hành nội dung GPCLUB Vietnam
Đường dẫn quản trị: `/admin`
Đường dẫn đăng nhập: `/auth`
Các trang công khai cần kiểm tra: `/`, `/products`, `/catalog`, `/events`, `/contact`

---

## 1. Mục Đích Của Trang Quản Trị

Trang quản trị GPCLUB dùng để cập nhật website Vietnam mà không cần chỉnh sửa mã nguồn. Quản trị viên có thể quản lý nội dung trang chủ, sản phẩm, catalog sản phẩm, hồ sơ đại lý, yêu cầu liên hệ, chatbot, sự kiện, popup, FAQ và thông tin liên hệ công ty.

Sử dụng trang quản trị khi cần:

- Đăng hoặc ẩn sản phẩm trên website.
- Tạo catalog sản phẩm cho đối tác B2B.
- Xem và xử lý hồ sơ đăng ký đại lý.
- Xem và xử lý yêu cầu liên hệ từ khách hàng.
- Cập nhật nội dung trang chủ và các trang nội dung.
- Thêm sự kiện, thông báo sản phẩm mới, popup và FAQ.
- Cập nhật kiến thức, tài liệu và kịch bản nút bấm cho chatbot.
- Cập nhật thông tin liên hệ công ty.

---

## 2. Đăng Nhập Và Quyền Truy Cập

1. Mở trang đăng nhập quản trị: `/auth`.
2. Đăng nhập bằng tài khoản quản trị được cấp quyền.
3. Sau khi đăng nhập thành công, hệ thống sẽ chuyển đến `/admin`.
4. Nếu tài khoản chưa có quyền quản trị, hệ thống sẽ hiển thị thông báo từ chối truy cập.
5. Dùng bộ chọn ngôn ngữ ở góc trên bên phải để đổi ngôn ngữ giao diện quản trị.
6. Bấm **Sign out** khi hoàn tất công việc.

Lưu ý quan trọng:

- Không dùng chung tài khoản quản trị.
- Nếu đăng nhập được nhưng không vào được `/admin`, tài khoản cần được cấp vai trò `admin`.
- Dữ liệu được lưu vào Supabase. Hãy chờ thông báo lưu thành công trước khi đóng trang.

---

## 3. Cấu Trúc Menu Quản Trị

Trang quản trị có năm khu vực chính:

1. **Dashboard**
2. **Product Management**
   - Products
   - Catalog Management
3. **Customer Management**
   - Dealers
   - Contacts
4. **Content Management**
   - Home
   - Events
   - Popups
   - FAQs
   - Chatbot
5. **Settings**

---

## 4. Dashboard

Dashboard dùng để xem nhanh tình trạng vận hành.

Có thể kiểm tra:

- Số hồ sơ đăng ký đại lý.
- Số hồ sơ mới/chưa xử lý.
- Số yêu cầu liên hệ chung.
- Số FAQ đã xuất bản.
- Số popup.
- Số sự kiện.
- Số dữ liệu huấn luyện chatbot.

Cách sử dụng:

1. Mở **Dashboard**.
2. Xem các thẻ thống kê.
3. Bấm **Refresh** để tải dữ liệu mới nhất.

Khuyến nghị:

- Kiểm tra Dashboard vào đầu mỗi ngày làm việc.
- Nếu có hồ sơ đại lý hoặc liên hệ mới, chuyển sang **Customer Management** để xử lý.

---

## 5. Product Management > Products

Khu vực này quản lý sản phẩm hiển thị trên trang chủ, trang danh sách sản phẩm và trang chi tiết sản phẩm.

Các trang công khai bị ảnh hưởng:

- `/`
- `/products`
- `/products/{productId}`
- `/catalog`
- `/catalog/{catalogId}`

### 5.1 Danh Sách Sản Phẩm

Bảng sản phẩm hiển thị:

- Trạng thái xuất bản.
- Tên thương hiệu.
- Tên sản phẩm.
- Loại sản phẩm.
- Nhãn trạng thái như Live, Draft, Featured.
- Nút chỉnh sửa và xóa.

Chức năng có sẵn:

- Tìm kiếm theo tên sản phẩm, thương hiệu, loại sản phẩm hoặc mô tả ngắn.
- Lọc theo thương hiệu.
- Bật/tắt trạng thái xuất bản.
- Chỉnh nhanh tên sản phẩm và loại sản phẩm ngay trong bảng.
- Mở popup chỉnh sửa đầy đủ.
- Xóa sản phẩm.

### 5.2 Thêm Sản Phẩm Mới

1. Vào **Product Management > Products**.
2. Bấm **New Product**.
3. Nhập thông tin sản phẩm.
4. Bật/tắt các công tắc trạng thái.
5. Thêm nội dung chi tiết, media và điều kiện hiển thị.
6. Bấm **Save**.
7. Kiểm tra sản phẩm trên `/products`.

### 5.3 Các Trường Sản Phẩm

Thông tin chính:

- **Brand Name**: Tên thương hiệu, ví dụ JMsolution, JMella hoặc Trois Touch.
- **Product Name**: Tên đầy đủ của sản phẩm hiển thị cho người xem.
- **Product Type**: Nhóm sản phẩm như Sheet Mask, Skincare, Body Care, Hair Care, Makeup, Fragrance.
- **Order / Sort Order**: Số càng cao thì sản phẩm càng được ưu tiên hiển thị trước.
- **Short Intro**: Mô tả ngắn hiển thị trên thẻ sản phẩm.
- **Cover Image**: URL ảnh chính của sản phẩm.

Công tắc trạng thái:

- **Published**: Bật để sản phẩm hiển thị công khai.
- **New Product**: Gắn nhãn sản phẩm mới.
- **Popular Product**: Đánh dấu sản phẩm phổ biến.
- **Featured Product**: Làm nổi bật sản phẩm ở các khu vực quan trọng.

Nội dung chi tiết:

- Dùng trình chỉnh sửa chi tiết để thêm mô tả, lợi ích, hướng dẫn sử dụng hoặc nội dung HTML.
- Nội dung nên rõ ràng, phù hợp với khách hàng B2B.

Media:

- Thêm URL hình ảnh hoặc media.
- Dùng URL công khai và ổn định.
- Nên thêm alt text nếu có thể.

Conditions:

- Dùng cho thông tin như giá tham khảo, MOQ, thời gian giao hàng hoặc tình trạng hàng.
- Không đưa thông tin nội bộ hoặc nhạy cảm vào trường công khai.

### 5.4 Checklist Trước Khi Xuất Bản Sản Phẩm

Trước khi bật Published:

- Tên sản phẩm chính xác.
- Tên thương hiệu đúng và nhất quán.
- Loại sản phẩm phù hợp.
- URL ảnh chính hoạt động.
- Mô tả ngắn không quá dài.
- Nội dung chi tiết chính xác.
- Chỉ bật Published khi sản phẩm đã sẵn sàng.
- Kiểm tra giao diện desktop và mobile.

---

## 6. Product Management > Catalog Management

Catalog Management dùng để tạo catalog B2B từ các sản phẩm đã đăng trong Product Management.

Các trang công khai bị ảnh hưởng:

- `/catalog`
- `/catalog/{catalogId}`
- Liên kết tải catalog trên trang chủ nếu catalog đại diện được chọn.

### 6.1 Danh Sách Catalog

Danh sách catalog hiển thị:

- Tiêu đề catalog.
- Loại template.
- Số lượng sản phẩm đã chọn.
- Trạng thái catalog đại diện.
- Nút xem trước/tải xuống/chỉnh sửa/xóa.

### 6.2 Tạo Catalog

1. Vào **Product Management > Catalog Management**.
2. Bấm **New Catalog**.
3. Nhập tiêu đề, phụ đề và mô tả catalog.
4. Chọn template:
   - **Premium**: Phù hợp cho tài liệu B2B chuyên nghiệp.
   - **Compact**: Phù hợp cho danh sách sản phẩm ngắn.
   - **Lineup**: Phù hợp để so sánh dòng sản phẩm.
5. Chọn sản phẩm cần đưa vào catalog.
6. Nếu cần, đánh dấu **Representative Catalog**.
7. Bấm **Save**.
8. Bấm Preview hoặc mở `/catalog/{catalogId}` để kiểm tra.

### 6.3 Representative Catalog

Representative Catalog là catalog chính được website ưu tiên liên kết.

Quy tắc:

- Chỉ nên có một catalog đại diện.
- Khi chọn catalog mới làm đại diện, catalog cũ sẽ không còn là đại diện.
- Dùng catalog đại diện cho bộ sản phẩm B2B chính thức hiện tại.

### 6.4 Checklist Catalog

Trước khi gửi catalog cho đối tác:

- Tất cả sản phẩm được chọn đã chính xác.
- Thứ tự sản phẩm hợp lý.
- Tiêu đề và phụ đề chuyên nghiệp.
- Template phù hợp với mục đích sử dụng.
- Trang xem trước mở đúng.
- Giao diện mobile dễ đọc.

---

## 7. Customer Management > Dealers

Khu vực này quản lý hồ sơ đăng ký đại lý B2B gửi từ website.

Nguồn dữ liệu:

- Form đăng ký đại lý trên website.

Bảng dealer hiển thị:

- Công ty.
- Người liên hệ.
- Thành phố.
- Sản lượng/tháng.
- Trạng thái.
- Ngày gửi.

### 7.1 Xem Hồ Sơ Đại Lý

1. Vào **Customer Management > Dealers**.
2. Tìm hồ sơ trong bảng.
3. Bấm **View**.
4. Xem công ty, chức vụ, thành phố, kênh bán hàng, sản lượng/tháng, thương hiệu quan tâm, tên liên hệ, email, số điện thoại và lời nhắn.
5. Thêm ghi chú nội bộ nếu cần.
6. Đổi trạng thái xử lý.
7. Lưu ghi chú.

### 7.2 Quy Trình Trạng Thái Đề Xuất

Nên dùng trạng thái nhất quán:

- **New**: Hồ sơ mới, chưa xem.
- **In Progress / Reviewing**: Đang kiểm tra.
- **Contacted**: Đã liên hệ khách hàng.
- **Approved**: Có thể tiếp tục làm đối tác/đại lý.
- **Rejected / Closed**: Không tiếp tục hoặc đã hoàn tất xử lý.

Lưu ý vận hành:

- Sau khi gọi điện hoặc gửi email, nên ghi lại ghi chú ngắn.
- Không xóa hồ sơ trừ khi là spam hoặc bản ghi trùng.
- Thông tin cá nhân của khách hàng phải được giữ bí mật.

---

## 8. Customer Management > Contacts

Khu vực này quản lý bản ghi liên hệ/chatbot và các yêu cầu chung.

Có thể:

- Xem tin nhắn khách hàng.
- Lọc hoặc nhóm các bản ghi liên hệ.
- Cập nhật trạng thái xử lý.
- Xóa spam hoặc bản ghi trùng.

Quy trình khuyến nghị:

1. Vào **Customer Management > Contacts**.
2. Xem các tin nhắn mới trước.
3. Cập nhật trạng thái sau khi xử lý.
4. Giữ lại các bản ghi quan trọng để tham khảo.
5. Chỉ xóa spam hoặc bản ghi trùng không đúng.

---

## 9. Content Management > Home

Khu vực này chỉnh nội dung trang chủ và một số trang nội dung.

Các trang công khai bị ảnh hưởng:

- `/`
- Các trang nội dung/thương hiệu tùy theo mục được chọn.

### 9.1 Chọn Trang Cần Chỉnh

1. Vào **Content Management > Home**.
2. Dùng mục **Page to Edit**.
3. Chọn **Home** hoặc trang cần chỉnh khác.
4. Chỉnh các trường nội dung.
5. Bấm **Save Home**.
6. Kiểm tra trang công khai.

### 9.2 Các Khu Vực Có Thể Chỉnh Trên Trang Chủ

Các khu vực thường gồm:

- Hero section.
- Số liệu thống kê trong hero.
- Partner hook section.
- Trust section.
- Process section.
- URL hình ảnh và alt text.
- Nội dung CTA.

Các trường thường gặp:

- **Kicker**: Dòng nhỏ phía trên tiêu đề.
- **Title**: Tiêu đề chính.
- **Subtitle**: Mô tả hỗ trợ.
- **Primary CTA**: Nội dung nút chính.
- **Secondary CTA**: Nội dung nút phụ.
- **Image URL**: Địa chỉ ảnh công khai.
- **Image Alt**: Mô tả ảnh.

### 9.3 Reload Và Reset

- **Reload**: Tải lại dữ liệu đã lưu từ database.
- **Reset**: Đưa nội dung trong trình chỉnh sửa về mặc định. Cần dùng cẩn thận.
- **Save Home**: Lưu nội dung hiện tại.

Lưu ý:

- Reset chưa công khai ngay cho đến khi bấm Save, nhưng có thể làm mất nội dung đang sửa trong editor.
- Luôn kiểm tra trang chủ sau khi lưu.

---

## 10. Content Management > Events

Khu vực này quản lý sự kiện và bài thông báo sản phẩm mới.

Trang công khai bị ảnh hưởng:

- `/events`

### 10.1 Danh Sách Events

Bảng events hiển thị:

- Tiêu đề tiếng Anh và tiếng Việt.
- Loại nội dung.
- Loại media.
- Ngày.
- Trạng thái featured.
- Công tắc published.

### 10.2 Thêm Event Hoặc Bài Sản Phẩm Mới

1. Vào **Content Management > Events**.
2. Bấm **New Event**.
3. Chọn loại nội dung:
   - **Event**
   - **New Product Spotlight**
4. Nhập tiêu đề tiếng Việt và tiếng Anh.
5. Nhập tóm tắt tiếng Việt và tiếng Anh.
6. Nhập nội dung chi tiết nếu cần.
7. Thêm media URL và loại media.
8. Thêm CTA label và CTA URL nếu cần.
9. Thiết lập ngày sự kiện, sort order, featured và published.
10. Bấm **Save**.
11. Kiểm tra `/events`.

Trường bắt buộc:

- Tiêu đề tiếng Việt.
- Tiêu đề tiếng Anh.

Mẹo xuất bản:

- Dùng **Featured** cho thông báo quan trọng.
- Chỉ bật **Published** sau khi cả hai ngôn ngữ đã được kiểm tra.
- Dùng media URL rõ ràng cho hình ảnh hoặc video sự kiện.

---

## 11. Content Management > Popups

Khu vực này quản lý popup khuyến mãi hoặc thông báo cho người truy cập website.

### 11.1 Danh Sách Popup

Mỗi thẻ popup hiển thị:

- Ảnh xem trước nếu có.
- Tiêu đề.
- Độ ưu tiên.
- Nội dung ngắn.
- Thời gian bắt đầu/kết thúc.
- Trạng thái: Live, Scheduled, Expired hoặc Off.
- Công tắc Active.

### 11.2 Tạo Popup

1. Vào **Content Management > Popups**.
2. Bấm **New Popup**.
3. Nhập tiêu đề và nội dung.
4. Thêm image URL nếu cần.
5. Thêm CTA label và CTA URL nếu popup cần liên kết đến trang khác.
6. Thiết lập thời gian bắt đầu và kết thúc nếu muốn hẹn lịch.
7. Thiết lập priority. Số cao hơn được ưu tiên hiển thị trước.
8. Bật **Active**.
9. Bấm **Save**.
10. Kiểm tra website công khai.

Lưu ý:

- Popup có thể Active nhưng không hiển thị nếu thời gian bắt đầu ở tương lai hoặc thời gian kết thúc đã qua.
- Không nên dùng quá nhiều popup vì có thể gây khó chịu cho người truy cập.
- Chỉ xóa popup hết hạn sau khi xác nhận không còn cần dùng.

---

## 12. Content Management > FAQs

Khu vực này quản lý nội dung câu hỏi thường gặp.

### 12.1 Bộ Lọc Ngôn Ngữ

FAQ được lọc theo ngôn ngữ như Korean, English và Vietnamese.

Bảng FAQ hiển thị:

- Câu hỏi.
- Danh mục.
- Thứ tự sắp xếp.
- Trạng thái Published.
- Nút chỉnh sửa/xóa.

### 12.2 Thêm FAQ

1. Vào **Content Management > FAQs**.
2. Chọn bộ lọc ngôn ngữ cần quản lý.
3. Bấm **New FAQ**.
4. Nhập câu hỏi và câu trả lời.
5. Nhập category.
6. Thiết lập sort order.
7. Bật **Published** khi sẵn sàng.
8. Bấm **Save**.
9. Kiểm tra khu vực FAQ công khai nếu website đang hiển thị.

Trường bắt buộc:

- Question.
- Answer.

Mẹo viết FAQ:

- Câu trả lời nên ngắn, rõ và thực tế.
- Dùng category nhất quán.
- Sau khi lưu, kiểm tra lại thứ tự hiển thị trên trang công khai.

---

## 13. Content Management > Chatbot

Khu vực này quản lý kiến thức chatbot, thư viện tài liệu và kịch bản dạng nút bấm.

Có bốn chức năng chính:

1. Training entries.
2. Product information entries.
3. Document library.
4. Tree mode scenarios.

### 13.1 Training Entries: Q&A

Dùng Q&A cho các câu trả lời chính thức cần chatbot trả lời chính xác.

Cách thêm:

1. Vào **Content Management > Chatbot**.
2. Bấm **New Training Entry** trong khu vực Q&A.
3. Nhập question và answer.
4. Thêm tags nếu cần.
5. Giữ **Enabled** ở trạng thái bật.
6. Bấm **Save**.

Nên dùng cho:

- Câu hỏi thường gặp của khách hàng.
- Câu trả lời chính thức từ công ty.
- Giải thích ngắn về chính sách.

### 13.2 Product Info Entries

Dùng Product Info cho thông tin sản phẩm, lợi ích, vấn đề da phù hợp và gợi ý tư vấn.

Cách thêm:

1. Bấm **Product Info**.
2. Nhập title và nội dung sản phẩm.
3. Thêm tags.
4. Giữ **Enabled** ở trạng thái bật.
5. Bấm **Save**.

Nội dung khuyến nghị:

- Tên sản phẩm.
- Thương hiệu.
- Lợi ích chính.
- Nhóm khách hàng phù hợp.
- Hướng dẫn sử dụng.
- Ghi chú B2B nếu liên quan.

### 13.3 Document Library

Document Library lưu tài liệu dài và tự động chia nội dung thành các phần nhỏ để chatbot sử dụng.

Các trường tài liệu:

- Title.
- Description.
- Raw content.
- Language.
- Category.
- Source type.
- File URL.
- Status.
- Enabled.
- Version.
- Tags.

Cách thêm tài liệu:

1. Bấm **New Document**.
2. Nhập title và raw content.
3. Chọn language và category.
4. Thêm tags nếu cần.
5. Bấm **Save**.
6. Hệ thống sẽ xử lý tài liệu thành chunks.
7. Dùng preview/chunks view để xác nhận tài liệu đã được xử lý.

Lưu ý:

- Title và raw content là bắt buộc.
- Sau khi lưu, chờ hệ thống xử lý hoàn tất.
- Nếu sửa nội dung, hãy lưu lại để chunks được tạo lại.

### 13.4 Tree Mode Scenarios

Tree mode tạo luồng chatbot dạng nút bấm.

Các trường chính:

- Scenario key.
- Parent ID.
- Sort order.
- Nhãn nút bằng Korean, English, Vietnamese.
- Câu trả lời bằng Korean, English, Vietnamese.
- Action type.
- Linked training ID.
- Linked document ID.
- Enabled.

Cách tạo nút scenario:

1. Bấm **Tree Scenario**.
2. Nhập scenario key, ví dụ `default`.
3. Nhập nhãn nút bằng ít nhất một ngôn ngữ.
4. Nhập câu trả lời hoặc liên kết đến training/document.
5. Thiết lập sort order.
6. Giữ **Enabled** ở trạng thái bật.
7. Bấm **Save**.

Mẹo:

- Nhãn nút nên ngắn.
- Dùng scenario key nhất quán.
- Chỉ dùng parent ID khi tạo luồng nhiều cấp.
- Kiểm tra chatbot sau khi chỉnh tree scenario.

---

## 14. Settings

Settings quản lý thông tin liên hệ công ty dùng trên website.

Các khu vực công khai có thể bị ảnh hưởng:

- Header/footer.
- Trang contact.
- Liên kết CTA.

Cách cập nhật:

1. Vào **Settings**.
2. Chỉnh các trường liên hệ.
3. Bấm **Save Changes**.
4. Kiểm tra footer và trang contact.

Lưu ý:

- Số điện thoại, email, địa chỉ, Zalo và WhatsApp phải chính xác.
- Nên dùng URL đầy đủ cho liên kết bên ngoài.
- Không nhập thông tin liên hệ nội bộ nếu không muốn công khai.

---

## 15. Lưu, Xuất Bản Và Kiểm Tra

Sau mỗi lần chỉnh sửa:

1. Bấm đúng nút Save.
2. Chờ thông báo lưu thành công.
3. Mở trang công khai trong tab mới.
4. Refresh trình duyệt.
5. Kiểm tra giao diện desktop và mobile.
6. Kiểm tra nội dung tiếng Anh và tiếng Việt nếu là nội dung song ngữ.

Các trang nên kiểm tra:

- Trang chủ: `/`
- Sản phẩm: `/products`
- Chi tiết sản phẩm: `/products/{productId}`
- Danh sách catalog: `/catalog`
- Chi tiết catalog: `/catalog/{catalogId}`
- Events: `/events`
- Contact: `/contact`

---

## 16. Quy Tắc Chất Lượng Nội Dung

Áp dụng cho mọi nội dung quản trị:

- Ý nghĩa tiếng Anh và tiếng Việt phải nhất quán.
- Không xuất bản bản dịch máy nếu chưa kiểm tra.
- Ưu tiên ngôn ngữ rõ ràng, phù hợp B2B.
- Không dùng tiêu đề quá dài.
- Dùng hình ảnh chất lượng và URL ổn định.
- Kiểm tra khả năng đọc trên mobile sau khi chỉnh nội dung.
- Không đăng giá, chứng nhận, tuyên bố hiệu quả hoặc quan hệ đối tác khi chưa xác nhận.
- Ghi chú nội bộ và thông tin cá nhân khách hàng phải được giữ riêng tư.

---

## 17. Xử Lý Sự Cố

### Không đăng nhập được

- Kiểm tra email và mật khẩu.
- Thử lại trang `/auth`.
- Nếu đăng nhập được nhưng không vào được admin, yêu cầu người quản lý hệ thống kiểm tra quyền admin.

### Nội dung đã lưu nhưng không hiển thị

- Kiểm tra đã bấm Save chưa.
- Refresh trang công khai.
- Kiểm tra Published hoặc Active đã bật chưa.
- Với popup hẹn lịch, kiểm tra thời gian bắt đầu/kết thúc.
- Với sản phẩm, kiểm tra công tắc Published.

### Hình ảnh không hiển thị

- Kiểm tra URL ảnh có công khai không.
- Mở trực tiếp URL ảnh trên trình duyệt.
- Ưu tiên dùng URL HTTPS.

### Catalog không hiển thị đúng sản phẩm

- Kiểm tra sản phẩm đã được chọn trong catalog chưa.
- Kiểm tra sản phẩm còn tồn tại trong Product Management không.
- Kiểm tra sản phẩm có Published nếu cần hiển thị công khai.
- Mở `/catalog/{catalogId}` để kiểm tra.

### Chatbot không dùng nội dung tài liệu mới

- Lưu lại tài liệu.
- Chờ xử lý hoàn tất.
- Kiểm tra chunks đã được tạo.
- Kiểm tra tài liệu đang Enabled và Active.

---

## 18. Checklist Vận Hành

Hằng ngày:

- Kiểm tra Dashboard.
- Xem hồ sơ đại lý mới.
- Xem bản ghi liên hệ/chatbot mới.
- Kiểm tra không còn popup khẩn cấp đã hết hạn nhưng vẫn active.

Hằng tuần:

- Kiểm tra sản phẩm đang xuất bản.
- Kiểm tra representative catalog.
- Kiểm tra events và thông báo sản phẩm mới.
- Kiểm tra Q&A và document library của chatbot.

Trước chiến dịch lớn:

- Kiểm tra hero và CTA trang chủ.
- Kiểm tra thẻ sản phẩm và trang chi tiết sản phẩm.
- Kiểm tra catalog preview/download.
- Kiểm tra lịch popup.
- Kiểm tra bài event.
- Kiểm tra thông tin liên hệ.
- Kiểm tra giao diện mobile.

---

## 19. Lưu Ý An Toàn

- Xóa bản ghi thường là thao tác vĩnh viễn. Chỉ xóa khi thật sự cần.
- Không nhập giá bí mật hoặc điều khoản kinh doanh nội bộ vào trường công khai.
- Không chia sẻ thông tin cá nhân khách hàng cho người không có quyền.
- Không đăng tuyên bố pháp lý, chứng nhận hoặc hiệu quả sản phẩm nếu chưa được phê duyệt.
- Với cập nhật quan trọng, nên chụp màn hình sau khi kiểm tra trên trang công khai.
