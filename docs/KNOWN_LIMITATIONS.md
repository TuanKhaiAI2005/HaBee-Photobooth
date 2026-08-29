# Known Limitations

- Âm thanh thông báo phụ thuộc browser autoplay policy và chế độ im lặng của điện thoại. Hệ thống dùng thao tác `Đăng ký` để unlock Web Audio trong im lặng, chỉ phát chuông khi vé được gọi; nếu khách reload/mở lại trang thì browser có thể thu hồi quyền.
- Rung phụ thuộc thiết bị và trình duyệt. Nếu API không hỗ trợ, UI vẫn hiển thị thông báo trực quan.
- Không có notification khi trang đã đóng hoặc trình duyệt không còn mở trang ticket/admin.
- Không có background Web Push.
- Không có SMS.
- Không có Zalo.
- Không có email notification.
- Không có app native.
- Không có chuyển ticket trực tiếp giữa phòng.
- Không có analytics.
- Không có export Excel/CSV.
- Hệ thống hiện phục vụ một chi nhánh nhỏ, không có quản lý nhiều chi nhánh.
- STT chỉ duy nhất trong phạm vi một phòng và một `businessDate` tại `Asia/Ho_Chi_Minh`, không phải mã định danh duy nhất toàn hệ thống. Khi đối soát cần dùng đủ phòng, ngày và STT.
- STT đã cấp được giữ bất biến và không tái sử dụng, kể cả khi ticket bị hủy hoặc lịch sử bị xóa; các dòng `QueueNumberCounter` được giữ làm trạng thái cấp số theo ngày.
- Dữ liệu lịch sử có trước migration STT không được tự backfill nếu không đủ thông tin và sẽ hiển thị `STT —`.
- Icon chuyên biệt chỉ áp dụng cho tên Phòng 1, Phòng 2 và Phòng 3; phòng có tên tùy chỉnh vẫn hiển thị nhãn chữ nhưng không có một trong ba icon quy ước.
