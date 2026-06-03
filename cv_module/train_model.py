import os
from ultralytics import YOLO

def train_yolo():
    print("=== CHƯƠNG TRÌNH HUẤN LUYỆN (TRAIN) MÔ HÌNH AI ===")
    print("Khởi tạo mô hình cơ sở YOLOv8n...")

    # Load mô hình pre-trained nhỏ nhất (yolov8n) để train nhanh và nhẹ
    model = YOLO("yolov8n.pt")  

    # CẤU HÌNH TẬP DỮ LIỆU (DATASET)
    # Hiện tại để mẫu là 'coco8.yaml' (tập dữ liệu 8 tấm ảnh mẫu của Ultralytics để test code).
    # NẾU BẠN CÓ DATASET RIÊNG: Hãy sửa 'coco8.yaml' thành đường dẫn file YAML của bạn (Ví dụ: 'my_dataset/data.yaml')
    dataset_path = "coco8.yaml"  
    
    print(f"Đang sử dụng tập dữ liệu (dataset): {dataset_path}")
    print("Lưu ý: Nếu bạn có dataset tải từ Roboflow, hãy giải nén và trỏ đường dẫn biến dataset_path tới file .yaml của dataset đó!\n")

    try:
        print("Đang bắt đầu quá trình huấn luyện... (Có thể mất một lúc)")
        # Bắt đầu huấn luyện (Train)
        results = model.train(
            data=dataset_path,
            epochs=50,               # Số vòng lặp huấn luyện. 50 là mức cơ bản, nếu mô hình chưa chuẩn hãy tăng lên 100 hoặc 200.
            imgsz=640,               # Kích thước ảnh đầu vào.
            batch=16,                # Số lượng ảnh xử lý cùng lúc. Nếu máy báo lỗi bộ nhớ, hãy giảm xuống 8 hoặc 4.
            device="",               # Để rỗng để tự động chọn GPU (nếu có) hoặc CPU. Hoặc nhập 'cpu'.
            project="train_results", # Thư mục gốc lưu kết quả.
            name="animal_model"      # Thư mục lưu trọng số sau khi train xong.
        )
        
        print("\n=== HOÀN TẤT HUẤN LUYỆN ===")
        print("Trọng số mô hình tốt nhất đã được lưu tại thư mục: train_results/animal_model/weights/best.pt")
        print("Hướng dẫn sử dụng:")
        print("1. Vào thư mục 'train_results/animal_model/weights/'")
        print("2. Đổi tên file 'best.pt' thành 'yolov8n.pt'")
        print("3. Chép đè file đó vào thư mục hiện tại (cv_module/) để bắt đầu sử dụng bản nâng cấp của AI.")
        
    except Exception as e:
        print(f"\n[LỖI]: Quá trình huấn luyện thất bại. Vui lòng kiểm tra lại cấu hình dataset.")
        print(f"Chi tiết lỗi: {str(e)}")

if __name__ == "__main__":
    train_yolo()
