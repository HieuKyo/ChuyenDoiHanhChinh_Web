# File: app.py (Đã xóa dòng lỗi)

from flask import Flask, render_template, jsonify, request
import json
import os
import sys

app = Flask(__name__)

# --- PHẦN QUAN TRỌNG: TÌM ĐƯỜNG DẪN TUYỆT ĐỐI ---
try:
    base_path = sys._MEIPASS
except Exception:
    base_path = os.path.dirname(os.path.abspath(__file__))

# --- HÀM TẢI DỮ LIỆU ĐÃ NÂNG CẤP ---
def load_json_data(filename):
    file_path = os.path.join(base_path, filename)
    if not os.path.exists(file_path):
        print(f"CẢNH BÁO: Không tìm thấy file tại '{file_path}'")
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f) or {}
    except Exception as e:
        print(f"LỖI: Không thể tải file '{filename}': {e}")
        return {}

# Tải dữ liệu một lần khi ứng dụng khởi động
hierarchy_data = load_json_data("dia_danh.json")
conversion_data = load_json_data("chuyen_doi.json")

# --- CÁC ĐƯỜNG DẪN (ROUTES) CỦA WEB ---
# (Toàn bộ phần code còn lại của app.py giữ nguyên như cũ)

@app.route("/")
def index():
    tinh_list = list(hierarchy_data.keys())
    return render_template("index.html", tinh_list=tinh_list)

@app.route("/get_huyen/<tinh>")
def get_huyen(tinh):
    if tinh in hierarchy_data:
        huyen_list = list(hierarchy_data[tinh].keys())
        return jsonify(huyen_list)
    return jsonify([])

@app.route("/get_xa/<tinh>/<huyen>")
def get_xa(tinh, huyen):
    if tinh in hierarchy_data and huyen in hierarchy_data[tinh]:
        xa_list = list(hierarchy_data[tinh][huyen].keys())
        return jsonify(xa_list)
    return jsonify([])

@app.route("/get_khom/<tinh>/<huyen>/<xa>")
def get_khom(tinh, huyen, xa):
    if tinh in hierarchy_data and huyen in hierarchy_data[tinh] and xa in hierarchy_data[tinh][huyen]:
        khom_list = hierarchy_data[tinh][huyen][xa]
        return jsonify(khom_list)
    return jsonify([])

@app.route("/convert", methods=["POST"])
def convert():
    data = request.json
    tinh = data.get("tinh", "").strip()
    huyen = data.get("huyen", "").strip()
    xa = data.get("xa", "").strip()
    khom = data.get("khom", "").strip()

    hamlet_prefix = "Khóm " if xa.startswith("Phường") else "Ấp "
    full_hamlet_name = f"{hamlet_prefix}{khom}" if khom else ""

    full_address_khom = f"{full_hamlet_name}, {xa}, {huyen}, {tinh}" if khom else ""
    full_address_xa = f"{xa}, {huyen}, {tinh}"
    full_address_huyen = f"{huyen}, {tinh}"

    new_address = ""
    if khom and full_address_khom in conversion_data:
        new_address = conversion_data[full_address_khom]
    elif full_address_xa in conversion_data:
        new_address = conversion_data[full_address_xa]
    elif full_address_huyen in conversion_data:
        new_address = conversion_data[full_address_huyen]
    else:
        new_address = full_address_khom if khom else full_address_xa

    return jsonify({"new_address": new_address})

# --- ROUTE MỚI ĐỂ NHẬN BÁO CÁO LỖI ---
@app.route("/report_error", methods=["POST"])
def report_error():
    try:
        data = request.json
        old_address = data.get("old_address", "N/A")
        new_address = data.get("new_address", "N/A")
        comments = data.get("comments", "").strip()

        # Lấy thời gian hiện tại
        from datetime import datetime
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Định dạng nội dung báo cáo
        report_content = f"""
-----------------------------------------
Thời gian: {now}
Địa chỉ cũ: {old_address}
Địa chỉ mới (lỗi): {new_address}
Ghi chú: {comments if comments else "Không có."}
-----------------------------------------
"""
        # Ghi vào file log
        log_file_path = os.path.join(base_path, "error_reports.log")
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(report_content)
        
        return jsonify({"success": True, "message": "Gửi báo cáo thành công!"})

    except Exception as e:
        print(f"Lỗi khi ghi báo cáo: {e}")
        return jsonify({"success": False, "message": "Có lỗi xảy ra khi gửi báo cáo."}), 500


# --- CHẠY ỨNG DỤNG ---
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)