<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
   Quản lý dữ liệu trang trại thông minh trên nền tảng Blockchain
</h2>
<div align="center">
    <p align="center">
        <img alt="AIoTLab Logo" width="170" src="https://github.com/user-attachments/assets/711a2cd8-7eb4-4dae-9d90-12c0a0a208a2" />
        <img alt="AIoTLab Logo" width="180" src="https://github.com/user-attachments/assets/dc2ef2b8-9a70-4cfa-9b4b-f6c2f25f1660" />
        <img alt="DaiNam University Logo" width="200" src="https://github.com/user-attachments/assets/77fe0fd1-2e55-4032-be3c-b1a705a1b574" />
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

## 📖 1. Giới thiệu
Hệ thống quản lý và truy xuất nguồn gốc (V.A.C Smart Farm) là một ứng dụng minh chứng cho sức mạnh của công nghệ chuỗi khối (Blockchain) trong việc lưu trữ dữ liệu phi tập trung và minh bạch. Hệ thống được thiết kế với kiến trúc **Permissioned Blockchain** sử dụng nền tảng Hyperledger Fabric, bao gồm các thành phần chính: **Client Application (Node.js)**, **Smart Contract (Chaincode)**, và **Mạng lưới các Peers/Orderers**.

- **Smart Contract (Chaincode)**: Được cài đặt trên các Peers, chứa các logic nghiệp vụ để khởi tạo, truy vấn và cập nhật trạng thái tài sản (ví dụ: nhật ký mùa vụ, thông tin kiểm đếm từ hệ thống AI Camera/IoT) lên sổ cái (Ledger).
- **Client Application**: Đóng vai trò là Gateway, cung cấp API để người dùng hoặc các thiết bị phần cứng có thể gửi yêu cầu giao dịch (Invoke) hoặc truy vấn (Query) dữ liệu từ mạng lưới Blockchain một cách an toàn.

Nguyên lý hoạt động của hệ thống dựa trên cơ chế đồng thuận **Execute-Order-Validate** đặc trưng của Hyperledger Fabric. Khi một giao dịch được gửi đi, nó sẽ được chạy mô phỏng (Endorse) bởi các Peers, sắp xếp thành các khối (Blocks) bởi Orderer, và cuối cùng được xác thực để ghi vĩnh viễn vào State Database.

**Ưu điểm nổi bật:**
- **Minh bạch và Bất biến**: Dữ liệu một khi đã đóng khối ghi lên sổ cái sẽ không thể bị sửa đổi hoặc giả mạo.
- **Bảo mật cao**: Là mạng riêng tư (Private Blockchain), mọi thành viên tham gia đều phải được phân quyền.
- **Hiệu năng tối ưu**: Tốc độ xử lý giao dịch cao, cực kỳ phù hợp cho các luồng dữ liệu cập nhật liên tục từ thiết bị IoT nông nghiệp.

## 🔧 2. Công nghệ và Công cụ sử dụng
- **Nền tảng "Hyperledger Fabric":** Nền tảng Blockchain doanh nghiệp mã nguồn mở, cung cấp cơ chế bảo mật khắt khe và không tiêu tốn phí Gas.
- **Ngôn ngữ "Node.js & JavaScript":** Toàn bộ Smart Contract (Chaincode) và Backend API đều được phát triển bằng JavaScript/Node.js.
- **Cơ sở dữ liệu "CouchDB":** Được sử dụng làm State Database để lưu trữ trạng thái hiện tại của tài sản dưới định dạng JSON.
- **Công cụ "Docker & Docker Compose":** Toàn bộ mạng lưới Blockchain được đóng gói và triển khai trên các container.
- **Tích hợp "AI & IoT":** Kết hợp mô hình Thị giác máy tính (YOLOv8) và thiết bị vi điều khiển (ESP8266/MQTT) để tự động hóa thu thập dữ liệu lên Blockchain.

## 🚀 3. Hình ảnh các chức năng
<p align="center">
  <img width="800" src="https://github.com/caovan-huy/quan_ly_du_lieu_trang_trai_thong_minh_tren_nen_tang_blockchain/blob/main/dashboard.png" alt="Giao diện Dashboard" /> 
</p>
<p align="center"><i>Ảnh 1: Giao diện Quản lý Tài sản & Hệ sinh thái V.A.C</i></p>

<p align="center">
  <img width="800" src="https://via.placeholder.com/800x400.png?text=Hinh+anh+Lich+su+Blockchain+cua+ban+(Thay+link+vao+day)" alt="Lịch sử Blockchain" />
</p>
<p align="center"><i>Ảnh 2: Tra cứu Lịch sử Giao dịch và Truy xuất nguồn gốc trên Sổ cái (Ledger)</i></p>

## 📦 4. Các bước cài đặt
### Yêu cầu hệ thống
- Nền tảng: Linux/Ubuntu hoặc Windows (Bắt buộc cấu hình WSL2)
- Docker & Docker Compose (bản mới nhất)
- Node.js (phiên bản 18.x hoặc 20.x)
- Git đã cài trên máy

**Bước 1: Clone project từ GitHub**
```bash
git clone [https://github.com/](https://github.com/)[username]/[ten-repo-cua-ban].git
cd [ten-repo-cua-ban]
```
**Bước 2: Khởi tạo mạng lưới Blockchain (Fabric Network)**

```bash
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca
```
**Bước 3: Cài đặt và triển khai Smart Contract (Chaincode)**
```bash
./network.sh deployCC -ccn vacledger -ccp ../../chaincode_vac/ -ccl javascript
```
**Bước 4: Khởi động Backend Application (Tích hợp AI & IoT)**
```bash
cd ../../chatbot_backend
npm install
node server.js
```
**Bước 5: Khởi động Giao diện Frontend**
```bash
cd ../frontend
# Mở file index.html qua Live Server hoặc chạy lệnh khởi động tương ứng
```
## 📱 5. Liên hệ

- **Họ và tên:** Cao Văn Huy
- **Mã sinh viên:** 1671020135
- **Đơn vị:** Khoa Công nghệ Thông tin
- **📧 Email:** huyhechbn@gmail.com
- **☎️ Điện thoại:** 0964611204

---
*© 2026 Faculty of Information Technology. All rights reserved.*
