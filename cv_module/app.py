import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
# from ultralytics import YOLO # Bỏ comment khi có file mô hình thật

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Khởi tạo model YOLO
# model = YOLO('best.pt') 

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({"error": "Không tìm thấy file"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "File rỗng"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # --- CODE XỬ LÝ ẢNH THẬT SẼ ĐẶT Ở ĐÂY ---
    # results = model(filepath)
    
    # --- DỮ LIỆU GIẢ LẬP DEMO ---
    mock_result = {
        "status": "success",
        "detected_object": "Bệnh đốm lá cà chua (Vườn)",
        "confidence": "89%",
        "recommendation": "Cần phun thuốc trừ nấm gốc Đồng. Cách ly khu vực luống A2."
    }

    return jsonify(mock_result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)