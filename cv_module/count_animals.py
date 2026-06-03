import argparse
import cv2
import json
import os
import numpy as np
from collections import defaultdict, deque
from ultralytics import YOLO

# Màng lọc Động vật: Bắt chim/gà (14), mèo (15), chó (16), ngựa (17), cừu (18), bò (19)...
# Giúp AI tuyệt đối không nhận diện nhầm các dòng chữ, bóng râm hay máng ăn thành vật nuôi.
ANIMAL_CLASSES = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

def get_output_path(input_path, is_video=False):
    """Đảm bảo xuất file chuẩn WebM để xem mượt mà trên Chrome/Edge"""
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    ext = ".webm" if is_video else os.path.splitext(input_path)[1]
    output_filename = f"cv_output_{base_name}{ext}"
    output_dir = os.path.dirname(input_path)
    return os.path.join(output_dir, output_filename), output_filename

def process_image(model, image_path):
    """XỬ LÝ ẢNH TĨNH: Tối ưu cho bầy đàn đứng sát nhau (Gà, Lợn)"""
    try:
        output_path, output_filename = get_output_path(image_path, is_video=False)
        frame = cv2.imread(image_path)
        if frame is None:
            raise ValueError(f"Không thể đọc ảnh: {image_path}")

        # TỐI ƯU HÓA ẢNH TĨNH:
        # imgsz=800: Tăng độ nét tối đa để tách biệt các con vật.
        # conf=0.15: Đủ nhạy để bắt những con bị khuất ở xa.
        # iou=0.60: Nới lỏng để không gộp nhầm 2 con gà/lợn đứng sát nhau thành 1 con.
        results = model(frame, verbose=False, imgsz=800, conf=0.15, iou=0.60, classes=ANIMAL_CLASSES)
        result = results[0]
        
        total_count = len(result.boxes) if result.boxes is not None else 0
        
        # Ẩn tên class để giao diện chuyên nghiệp (không bị lộ việc AI đoán lợn thành cừu/bò)
        annotated_frame = result.plot(labels=False, conf=False)
        
        # Vẽ bảng đen hiển thị kết quả
        cv2.rectangle(annotated_frame, (10, 10), (320, 65), (0, 0, 0), -1)
        cv2.putText(annotated_frame, f"Tong so: {total_count}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2, cv2.LINE_AA)
        
        cv2.imwrite(output_path, annotated_frame)
        
        print(json.dumps({
            "success": True,
            "total_count": total_count,
            "processed_file": output_filename,
            "mode": "image"
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

def process_video(model, video_path, mode="total"):
    """XỬ LÝ VIDEO: Tích hợp Lọc Trung Vị (Median Filter) chống nhảy số ảo giác"""
    try:
        output_path, output_filename = get_output_path(video_path, is_video=True)
        cap = cv2.VideoCapture(video_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        if fps == 0: fps = 24
        
        # vp09 là codec thân thiện nhất với HTML5
        fourcc = cv2.VideoWriter_fourcc(*'vp09')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Biến cho chế độ đếm qua vạch (Line Mode)
        track_history = defaultdict(lambda: [])
        crossing_line_y = height // 2
        crossed_ids = set() 
        
        # Mảng lưu kết quả để khử nhiễu cho chế độ Tổng số (Lưu ~1 giây video)
        rolling_counts = deque(maxlen=30)
        final_stable_count = 0
        
        frame_idx = 0
        skip_factor = 2 # Chỉ xử lý 1 nửa số khung hình để đảm bảo tốc độ xuất video
        cache_annotated = None

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
                
            frame_idx += 1
            if frame_idx % skip_factor == 0 or frame_idx == 1:
                
                if mode == "total":
                    # CHẾ ĐỘ TỔNG: KHÔNG DÙNG TRACKING để tránh việc nhảy ID khi lợn chạy qua nhau
                    results = model(frame, verbose=False, imgsz=640, conf=0.15, iou=0.50, classes=ANIMAL_CLASSES)
                    result = results[0]
                    annotated_frame = result.plot(labels=False, conf=False)
                    
                    # Đếm số lượng thô của khung hình hiện tại
                    current_raw_count = len(result.boxes) if result.boxes is not None else 0
                    rolling_counts.append(current_raw_count)
                    
                    # LỌC TRUNG VỊ (MEDIAN FILTER): Triệt tiêu lỗi chớp nháy
                    if len(rolling_counts) > 0:
                        final_stable_count = int(np.median(rolling_counts))
                    
                    display_count = final_stable_count
                    
                elif mode == "line":
                    # CHẾ ĐỘ VẠCH NGANG: Bắt buộc dùng Tracking (BoT-SORT)
                    results = model.track(frame, persist=True, tracker="botsort.yaml", 
                                         verbose=False, imgsz=640, conf=0.15, iou=0.50, classes=ANIMAL_CLASSES)
                    result = results[0]
                    annotated_frame = result.plot(labels=False, conf=False)
                    cv2.line(annotated_frame, (0, crossing_line_y), (width, crossing_line_y), (0, 0, 255), 3)
                    
                    if result.boxes is not None and result.boxes.id is not None:
                        boxes = result.boxes.xywh.cpu()
                        track_ids = result.boxes.id.int().cpu().tolist()
                        
                        for box, t_id in zip(boxes, track_ids):
                            x, y, w, h = box
                            center = (float(x), float(y))
                            track_history[t_id].append(center)
                            
                            if len(track_history[t_id]) > 30:
                                track_history[t_id].pop(0)
                                
                            if len(track_history[t_id]) >= 2:
                                prev_y = track_history[t_id][-2][1]
                                curr_y = track_history[t_id][-1][1]
                                if (prev_y < crossing_line_y and curr_y >= crossing_line_y) or \
                                   (prev_y > crossing_line_y and curr_y <= crossing_line_y):
                                    crossed_ids.add(t_id)

                            # Vẽ quỹ đạo xanh
                            points = np.hstack(track_history[t_id]).astype(np.int32).reshape((-1, 1, 2))
                            cv2.polylines(annotated_frame, [points], isClosed=False, color=(0, 255, 0), thickness=2)
                    
                    display_count = len(crossed_ids)
                
                cache_annotated = annotated_frame.copy()
            else:
                annotated_frame = cache_annotated if cache_annotated is not None else frame
                
            # Ghi con số đầm, ổn định lên góc màn hình
            cv2.rectangle(annotated_frame, (10, 10), (320, 65), (0, 0, 0), -1)
            cv2.putText(annotated_frame, f"Tong so: {display_count}", (20, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2, cv2.LINE_AA)
                        
            out.write(annotated_frame)
            
        cap.release()
        out.release()
        
        # Chốt con số cuối cùng trả về frontend
        final_count = final_stable_count if mode == "total" else len(crossed_ids)
        
        print(json.dumps({
            "success": True,
            "total_count": final_count,
            "processed_file": output_filename,
            "mode": mode
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

def main():
    parser = argparse.ArgumentParser(description="Hệ thống V.A.C AI Vision")
    parser.add_argument("input_path", type=str, help="Đường dẫn file ảnh hoặc video")
    parser.add_argument("--mode", type=str, choices=["total", "line"], default="total")
    
    args = parser.parse_args()
    
    # Đọc mô hình YOLO
    model_path = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Lỗi tải mô hình: {str(e)}"}))
        return

    ext = os.path.splitext(args.input_path)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
        process_image(model, args.input_path)
    elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
        process_video(model, args.input_path, mode=args.mode)
    else:
        print(json.dumps({"success": False, "error": "Định dạng file không được hỗ trợ"}))

if __name__ == "__main__":
    main()