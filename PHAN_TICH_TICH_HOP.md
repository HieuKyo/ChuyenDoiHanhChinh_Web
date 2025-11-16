# PHÂN TÍCH VÀ ĐỀ XUẤT TÍCH HỢP HỆ THỐNG ĐỊA CHỈ

## 📋 TỔNG QUAN

Tài liệu này phân tích cách tích hợp hệ thống chọn địa chỉ từ **ChuyenDoiHanhChinh_Web** (Flask) sang **MauBieu7202** (Django).

---

## 🔍 PHÂN TÍCH HỆ THỐNG HIỆN TẠI

### A. ChuyenDoiHanhChinh_Web (Repo này)

**Công nghệ**: Python Flask + Vanilla JavaScript + Bootstrap 5

**Cấu trúc dữ liệu**:
```
Tỉnh Bạc Liêu
  ├─ Thành phố Bạc Liêu
  │   ├─ Phường 1
  │   │   ├─ Khóm 1
  │   │   ├─ Khóm 5
  │   │   └─ ...
  │   └─ Phường 2
  │       └─ ...
  └─ Thị xã Giá Rai
      └─ ...
```

**Components chính**:

| File | Vai trò | Mô tả |
|------|---------|-------|
| `app.py` | Backend API | Flask routes xử lý dữ liệu địa chỉ |
| `dia_danh.json` | Database | Cấu trúc phân cấp 4 cấp: Tỉnh → Huyện → Xã → Khóm |
| `chuyen_doi.json` | Mapping | Ánh xạ địa chỉ cũ → mới (519 entries) |
| `static/script.js` | Frontend Logic | Xử lý cascade combobox, AJAX calls |
| `templates/index.html` | UI | 4 select elements cascade |

**API Endpoints**:
```python
GET  /get_huyen/<tinh>              # Lấy danh sách huyện
GET  /get_xa/<tinh>/<huyen>         # Lấy danh sách xã
GET  /get_khom/<tinh>/<huyen>/<xa>  # Lấy danh sách khóm
POST /convert                        # Chuyển đổi địa chỉ
```

**Workflow người dùng**:
```
1. Chọn Tỉnh → Load Huyện
2. Chọn Huyện → Load Xã
3. Chọn Xã → Load Khóm
4. Chọn Khóm (optional)
5. Nhấn "Chuyển đổi" → Hiển thị địa chỉ mới
6. Copy kết quả hoặc báo cáo lỗi
```

---

### B. MauBieu7202 (Repo đích)

**Công nghệ**: Django 5.2.7 + Bootstrap 5 + SQLite

**Chức năng**: Quản lý mẫu biểu Word với biến động (dynamic forms)

**Thiếu**: Không có hệ thống nhập địa chỉ bằng combobox cascade

**Nhu cầu**: Tích hợp combobox địa chỉ và tự động điền vào field/biến địa chỉ

---

## 🎯 CHIẾN LƯỢC TÍCH HỢP

### Option 1: Component Frontend Độc Lập (Khuyến nghị ⭐)

**Ưu điểm**:
- ✅ Không cần thay đổi backend nhiều
- ✅ Tái sử dụng được cho nhiều form
- ✅ Dễ maintain và debug
- ✅ Có thể tích hợp vào bất kỳ template Django nào

**File cần chuyển**:
```
📦 MauBieu7202/
├── static/
│   ├── js/
│   │   └── address_selector.js        ← Copy từ script.js (cải tiến)
│   └── data/
│       └── dia_danh.json              ← Copy nguyên file
│
├── templates/
│   └── components/
│       └── address_form.html          ← Component mới
│
└── templates_app/
    └── views.py                        ← Thêm API endpoints
```

**Code mẫu - address_selector.js**:
```javascript
/**
 * Address Selector Component
 * Usage: new AddressSelector('#container-id', options)
 */
class AddressSelector {
    constructor(containerId, options = {}) {
        this.container = document.querySelector(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api/address',
            onSelect: options.onSelect || null,
            autoFill: options.autoFill || null, // Callback để tự động điền
            showKhom: options.showKhom !== false,
            ...options
        };

        this.data = {
            tinh: '',
            huyen: '',
            xa: '',
            khom: ''
        };

        this.init();
    }

    async init() {
        await this.loadHierarchyData();
        this.render();
        this.bindEvents();
    }

    async loadHierarchyData() {
        // Load dữ liệu từ static file hoặc API
        const response = await fetch('/static/data/dia_danh.json');
        this.hierarchyData = await response.json();
    }

    render() {
        this.container.innerHTML = `
            <div class="address-selector">
                <div class="mb-2">
                    <label class="form-label">Tỉnh/Thành phố</label>
                    <select class="form-select" data-level="tinh">
                        <option value="">-- Chọn --</option>
                        ${this.getTinhOptions()}
                    </select>
                </div>
                <div class="mb-2">
                    <label class="form-label">Quận/Huyện</label>
                    <select class="form-select" data-level="huyen" disabled>
                        <option value="">-- Chọn --</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label class="form-label">Phường/Xã</label>
                    <select class="form-select" data-level="xa" disabled>
                        <option value="">-- Chọn --</option>
                    </select>
                </div>
                ${this.options.showKhom ? `
                <div class="mb-2">
                    <label class="form-label">Ấp/Khóm</label>
                    <select class="form-select" data-level="khom" disabled>
                        <option value="">-- Chọn --</option>
                    </select>
                </div>
                ` : ''}
            </div>
        `;
    }

    getTinhOptions() {
        return Object.keys(this.hierarchyData)
            .map(tinh => `<option value="${tinh}">${tinh}</option>`)
            .join('');
    }

    bindEvents() {
        const selects = this.container.querySelectorAll('select');

        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleChange(e.target.dataset.level, e.target.value);
            });
        });
    }

    handleChange(level, value) {
        this.data[level] = value;

        switch(level) {
            case 'tinh':
                this.populateHuyen(value);
                this.resetSelect('xa');
                this.resetSelect('khom');
                break;
            case 'huyen':
                this.populateXa(this.data.tinh, value);
                this.resetSelect('khom');
                break;
            case 'xa':
                this.populateKhom(this.data.tinh, this.data.huyen, value);
                break;
        }

        // Trigger callback để tự động điền
        if (this.options.autoFill) {
            const fullAddress = this.getFullAddress();
            this.options.autoFill(fullAddress, this.data);
        }
    }

    populateHuyen(tinh) {
        const select = this.container.querySelector('[data-level="huyen"]');
        if (!tinh || !this.hierarchyData[tinh]) {
            select.disabled = true;
            return;
        }

        const huyens = Object.keys(this.hierarchyData[tinh]);
        select.innerHTML = `
            <option value="">-- Chọn --</option>
            ${huyens.map(h => `<option value="${h}">${h}</option>`).join('')}
        `;
        select.disabled = false;
    }

    populateXa(tinh, huyen) {
        const select = this.container.querySelector('[data-level="xa"]');
        if (!tinh || !huyen || !this.hierarchyData[tinh]?.[huyen]) {
            select.disabled = true;
            return;
        }

        const xas = Object.keys(this.hierarchyData[tinh][huyen]);
        select.innerHTML = `
            <option value="">-- Chọn --</option>
            ${xas.map(x => `<option value="${x}">${x}</option>`).join('')}
        `;
        select.disabled = false;
    }

    populateKhom(tinh, huyen, xa) {
        if (!this.options.showKhom) return;

        const select = this.container.querySelector('[data-level="khom"]');
        if (!tinh || !huyen || !xa || !this.hierarchyData[tinh]?.[huyen]?.[xa]) {
            select.disabled = true;
            return;
        }

        const khoms = this.hierarchyData[tinh][huyen][xa];
        select.innerHTML = `
            <option value="">-- Chọn --</option>
            ${khoms.map(k => `<option value="${k}">${k}</option>`).join('')}
        `;
        select.disabled = false;
    }

    resetSelect(level) {
        const select = this.container.querySelector(`[data-level="${level}"]`);
        if (select) {
            select.innerHTML = '<option value="">-- Chọn --</option>';
            select.disabled = true;
            this.data[level] = '';
        }
    }

    getFullAddress() {
        const { tinh, huyen, xa, khom } = this.data;
        let address = '';

        if (khom) {
            const prefix = xa.startsWith('Phường') ? 'Khóm' : 'Ấp';
            address = `${prefix} ${khom}, `;
        }
        if (xa) address += `${xa}, `;
        if (huyen) address += `${huyen}, `;
        if (tinh) address += tinh;

        return address.trim();
    }

    getValue() {
        return {
            data: { ...this.data },
            fullAddress: this.getFullAddress()
        };
    }

    setValue(data) {
        // Set giá trị từ bên ngoài
        if (data.tinh) {
            this.container.querySelector('[data-level="tinh"]').value = data.tinh;
            this.handleChange('tinh', data.tinh);
        }
        // ... tương tự cho các level khác
    }
}

// Export để sử dụng
window.AddressSelector = AddressSelector;
```

**Sử dụng trong Django template**:
```django
{% load static %}

<!-- Include component -->
<div id="address-container"></div>
<input type="hidden" id="full_address_field" name="address">

<script src="{% static 'js/address_selector.js' %}"></script>
<script>
    // Khởi tạo component
    const addressSelector = new AddressSelector('#address-container', {
        showKhom: true,
        autoFill: function(fullAddress, data) {
            // Tự động điền vào input
            document.getElementById('full_address_field').value = fullAddress;

            // Hoặc điền vào nhiều field riêng biệt
            document.querySelector('[name="province"]').value = data.tinh;
            document.querySelector('[name="district"]').value = data.huyen;
            document.querySelector('[name="ward"]').value = data.xa;
            document.querySelector('[name="hamlet"]').value = data.khom;
        }
    });
</script>
```

---

### Option 2: Django App Hoàn Chỉnh

**Ưu điểm**:
- ✅ Dữ liệu trong database, dễ quản lý qua Admin
- ✅ Có thể CRUD địa danh
- ✅ Tích hợp tốt với Django ORM

**Cấu trúc**:
```python
# models.py
from django.db import models

class Province(models.Model):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name

class District(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('province', 'name')

class Ward(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('district', 'name')

class Hamlet(models.Model):
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('ward', 'name')

class AddressMapping(models.Model):
    """Bảng ánh xạ địa chỉ cũ → mới"""
    old_address = models.TextField(unique=True)
    new_address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

**Views API**:
```python
# views.py
from django.http import JsonResponse
from .models import Province, District, Ward, Hamlet

def get_districts(request, province_id):
    districts = District.objects.filter(province_id=province_id).values('id', 'name')
    return JsonResponse(list(districts), safe=False)

def get_wards(request, district_id):
    wards = Ward.objects.filter(district_id=district_id).values('id', 'name')
    return JsonResponse(list(wards), safe=False)

def get_hamlets(request, ward_id):
    hamlets = Hamlet.objects.filter(ward_id=ward_id).values('id', 'name')
    return JsonResponse(list(hamlets), safe=False)
```

**URLs**:
```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/districts/<int:province_id>/', views.get_districts),
    path('api/wards/<int:district_id>/', views.get_wards),
    path('api/hamlets/<int:ward_id>/', views.get_hamlets),
]
```

**Script import dữ liệu từ JSON**:
```python
# management/commands/import_addresses.py
from django.core.management.base import BaseCommand
import json
from address_app.models import Province, District, Ward, Hamlet

class Command(BaseCommand):
    def handle(self, *args, **options):
        with open('dia_danh.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        for province_name, districts in data.items():
            province, _ = Province.objects.get_or_create(name=province_name)

            for district_name, wards in districts.items():
                district, _ = District.objects.get_or_create(
                    province=province,
                    name=district_name
                )

                for ward_name, hamlets in wards.items():
                    ward, _ = Ward.objects.get_or_create(
                        district=district,
                        name=ward_name
                    )

                    for hamlet_name in hamlets:
                        Hamlet.objects.get_or_create(
                            ward=ward,
                            name=hamlet_name
                        )

        self.stdout.write('Import thành công!')
```

---

### Option 3: Hybrid - JSON + Django API

**Ưu điểm**:
- ✅ Nhanh nhất để triển khai
- ✅ Không cần migration database
- ✅ Vẫn tận dụng Django routing

**Cách làm**:

1. **Copy file JSON vào Django static**:
```
MauBieu7202/static/data/dia_danh.json
```

2. **Tạo view Django đơn giản**:
```python
# views.py
import json
import os
from django.conf import settings
from django.http import JsonResponse

# Load dữ liệu 1 lần khi server start
HIERARCHY_DATA = None

def get_hierarchy_data():
    global HIERARCHY_DATA
    if HIERARCHY_DATA is None:
        json_path = os.path.join(settings.STATIC_ROOT, 'data', 'dia_danh.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            HIERARCHY_DATA = json.load(f)
    return HIERARCHY_DATA

def get_districts(request, province):
    data = get_hierarchy_data()
    if province in data:
        return JsonResponse(list(data[province].keys()), safe=False)
    return JsonResponse([], safe=False)
```

3. **Frontend giống Option 1**

---

## 🚀 KHUYẾN NGHỊ TRIỂN KHAI

### Cho MauBieu7202 - Dự án mẫu biểu Word

**Bước 1**: Sử dụng **Option 1 (Component Frontend)**

**Lý do**:
- Đơn giản, nhanh
- Không ảnh hưởng đến cấu trúc DB hiện tại
- Dễ tích hợp vào form Django hiện có

**Bước 2**: Tạo field "Địa chỉ" trong Django model

```python
# models.py (trong templates_app)
class Document(models.Model):
    # ... các field khác

    # Địa chỉ chi tiết
    province = models.CharField(max_length=200, blank=True, verbose_name="Tỉnh")
    district = models.CharField(max_length=200, blank=True, verbose_name="Huyện")
    ward = models.CharField(max_length=200, blank=True, verbose_name="Xã")
    hamlet = models.CharField(max_length=200, blank=True, verbose_name="Khóm/Ấp")

    # Địa chỉ đầy đủ (tự động từ combobox)
    full_address = models.TextField(blank=True, verbose_name="Địa chỉ đầy đủ")
```

**Bước 3**: Tích hợp vào template form

```django
<!-- form.html -->
<form method="post">
    {% csrf_token %}

    <!-- Các field khác của form -->

    <h3>Thông tin địa chỉ</h3>
    <div id="address-container"></div>

    <!-- Hidden fields để submit -->
    <input type="hidden" name="province" id="province">
    <input type="hidden" name="district" id="district">
    <input type="hidden" name="ward" id="ward">
    <input type="hidden" name="hamlet" id="hamlet">
    <input type="hidden" name="full_address" id="full_address">

    <button type="submit">Lưu</button>
</form>

<script src="{% static 'js/address_selector.js' %}"></script>
<script>
    const selector = new AddressSelector('#address-container', {
        autoFill: function(fullAddress, data) {
            document.getElementById('province').value = data.tinh;
            document.getElementById('district').value = data.huyen;
            document.getElementById('ward').value = data.xa;
            document.getElementById('hamlet').value = data.khom;
            document.getElementById('full_address').value = fullAddress;
        }
    });
</script>
```

**Bước 4**: Sử dụng biến trong mẫu Word

Trong file Word template, tạo các biến:
```
{{ province }}       → Tỉnh Bạc Liêu
{{ district }}       → Thị xã Giá Rai
{{ ward }}           → Phường 1
{{ hamlet }}         → Khóm 1
{{ full_address }}   → Khóm 1, Phường 1, Thị xã Giá Rai, Tỉnh Bạc Liêu
```

---

## 📦 CHECKLIST CHUYỂN ĐỔI

### Files cần copy sang MauBieu7202:

- [ ] `dia_danh.json` → `static/data/dia_danh.json`
- [ ] `chuyen_doi.json` → `static/data/chuyen_doi.json` (nếu cần chuyển đổi)
- [ ] `static/script.js` → Chuyển thành `static/js/address_selector.js` (refactor thành class)
- [ ] HTML template → Tạo `templates/components/address_form.html`

### Nếu cần chức năng chuyển đổi địa chỉ:

- [ ] Tạo Django view `/api/convert_address/`
- [ ] Load `chuyen_doi.json` trong view
- [ ] Implement logic tương tự `app.py:convert()`

### Testing:

- [ ] Test cascade select hoạt động
- [ ] Test auto-fill vào các field
- [ ] Test submit form và lưu database
- [ ] Test render biến vào Word template

---

## 💡 LƯU Ý KHI TÍCH HỢP

### 1. Xử lý tiếng Việt

Django settings.py cần có:
```python
LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
```

### 2. Static files

Chạy lệnh collect static:
```bash
python manage.py collectstatic
```

### 3. CSRF Token

Khi gọi POST API từ JavaScript:
```javascript
fetch('/api/endpoint/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(data)
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

**Code hiện tại**:
- Backend: `/home/user/ChuyenDoiHanhChinh_Web/app.py`
- Frontend: `/home/user/ChuyenDoiHanhChinh_Web/static/script.js`
- Template: `/home/user/ChuyenDoiHanhChinh_Web/templates/index.html`
- Data: `/home/user/ChuyenDoiHanhChinh_Web/dia_danh.json`

**Repo đích**: https://github.com/HieuKyo/MauBieu7202

---

## 🎯 ROADMAP TRIỂN KHAI

### Phase 1: Basic Integration (1-2 ngày)
- Copy files cần thiết
- Tạo AddressSelector component
- Test standalone

### Phase 2: Django Integration (2-3 ngày)
- Tạo models cho địa chỉ
- Tạo forms và views
- Tích hợp vào template hiện có

### Phase 3: Advanced Features (1-2 ngày)
- Thêm chức năng chuyển đổi địa chỉ (nếu cần)
- Validation
- Error handling
- UI/UX improvements

### Phase 4: Testing & Deploy (1 ngày)
- Unit tests
- Integration tests
- Deploy lên production

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: Có cần database không?**
A: Không bắt buộc cho phase 1. Dùng JSON file là đủ. Sau này có thể migrate sang DB.

**Q: Có tương thích với Django Admin không?**
A: Có, nếu dùng Option 2 (Django models). Option 1 thì không cần Admin.

**Q: Performance như thế nào?**
A: JSON file < 1MB, load rất nhanh. Nếu lo ngại, có thể cache trong memory hoặc Redis.

**Q: Làm sao để mở rộng cho nhiều tỉnh?**
A: Thêm dữ liệu vào `dia_danh.json`. Component tự động support.

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ tích hợp, hãy cung cấp:
1. Cấu trúc form hiện tại của MauBieu7202
2. Models cần tích hợp
3. Template cần nhúng component

---

**Tác giả**: Phân tích từ ChuyenDoiHanhChinh_Web
**Ngày tạo**: 2025-11-16
**Version**: 1.0
