TTG Attendance System

Hệ thống chấm công nhân viên bằng GPS dành cho công ty xây dựng.

Demo

GitHub Pages:

https://yourusername.github.io/ttg-attendance-system/

Tính năng

Nhân viên

* Đăng nhập
* Check In
* Check Out
* Xác thực GPS
* Tự động xác định công trình gần nhất
* Giới hạn thiết bị đăng nhập (Device Lock)
* Giao diện tối ưu cho điện thoại
* Đăng xuất

Quản trị

* Dashboard tổng quan
* Quản lý công trình
* Thêm công trình
* Chỉnh sửa công trình
* Khóa công trình
* Quản lý nhân viên
* Thêm nhân viên
* Chỉnh sửa nhân viên
* Khóa nhân viên
* Theo dõi số lượng Check In trong ngày

Công nghệ sử dụng

Frontend

* HTML5
* CSS3
* JavaScript

Backend

* Google Apps Script

Database

* Google Sheets

Hosting

* GitHub Pages

Cấu trúc dự án

ttg-attendance-system
├── index.html
├── login.html
├── admin.html
├── css
│   ├── login.css
│   ├── index.css
│   └── admin.css
├── js
│   ├── attendance.js
│   ├── login.js
│   ├── admin.js
│   ├── employee.js
│   ├── site.js
│   ├── dashboard.js
│   └── common.js
├── images
│   └── logo.jpg
└── README.md

Dashboard

Hiện hỗ trợ:

* Tổng nhân viên
* Tổng công trình
* Đã chấm công hôm nay
* Chưa chấm công

GPS Attendance

Hệ thống tự động:

* Lấy GPS hiện tại
* Tính khoảng cách tới công trình
* Xác định công trình gần nhất
* Kiểm tra bán kính cho phép
* Chỉ cho phép chấm công trong phạm vi

Device Lock

Mỗi tài khoản chỉ được đăng nhập trên một thiết bị.

Thông tin thiết bị được lưu trên Google Sheets.

Admin có thể xóa DeviceID thủ công để cho phép đăng nhập lại.

Roadmap

V1

* Login
* Device Lock
* GPS Attendance
* Dashboard
* Quản lý công trình
* Quản lý nhân viên
* GitHub Pages
* Responsive UI
* Lịch sử chấm công
* Báo cáo tháng
* Xuất Excel

Phiên bản

Current Version:

TTG Attendance V1.0 Beta

License

Internal Use Only

Toàn Thịnh Group © 2026