# 🚀 HƯỚNG DẪN TÍCH HỢP ADDRESS SELECTOR VÀO MAUBIEU7202

## 📋 MỤC LỤC

1. [Giới thiệu](#giới-thiệu)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt từng bước](#cài-đặt-từng-bước)
4. [Cấu trúc file](#cấu-trúc-file)
5. [Sử dụng trong form](#sử-dụng-trong-form)
6. [Sử dụng biến trong Word](#sử-dụng-biến-trong-word)
7. [Tùy chỉnh](#tùy-chỉnh)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 GIỚI THIỆU

Hướng dẫn này giúp bạn tích hợp component **Address Selector** (từ ChuyenDoiHanhChinh_Web)
vào dự án **MauBieu7202** (Django) để:

- ✅ Chọn địa chỉ bằng combobox cascade 4 cấp (Tỉnh → Huyện → Xã → Khóm)
- ✅ Tự động điền vào các field địa chỉ trong form
- ✅ Lưu vào database Django
- ✅ Sử dụng biến địa chỉ trong mẫu Word

**Demo live**: Mở file `demo_component.html` trong trình duyệt để xem hoạt động

---

## ⚙️ YÊU CẦU HỆ THỐNG

- Python 3.8+
- Django 5.2.7 (hoặc tương thích)
- Bootstrap 5 (đã có trong MauBieu7202)
- Browser hỗ trợ ES6+ (Chrome, Firefox, Edge, Safari hiện đại)

---

## 📦 CÀI ĐẶT TỪNG BƯỚC

### Bước 1: Clone hoặc Download Files

Clone repo ChuyenDoiHanhChinh_Web:

```bash
git clone https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web.git
cd ChuyenDoiHanhChinh_Web
```

### Bước 2: Copy Files vào MauBieu7202

Giả sử cấu trúc MauBieu7202 của bạn như sau:

```
MauBieu7202/
├── templates_app/
├── wordgen/
├── static/
└── manage.py
```

**Copy các file sau:**

```bash
# Tạo thư mục nếu chưa có
cd /path/to/MauBieu7202

mkdir -p static/js
mkdir -p static/data

# Copy JavaScript component
cp /path/to/ChuyenDoiHanhChinh_Web/address_selector_component.js static/js/

# Copy dữ liệu JSON
cp /path/to/ChuyenDoiHanhChinh_Web/dia_danh.json static/data/

# Copy template mẫu (tùy chọn)
cp /path/to/ChuyenDoiHanhChinh_Web/django_integration_example.html templates/
```

### Bước 3: Cập nhật Django Settings

Mở file `wordgen/settings.py` và đảm bảo:

```python
# settings.py

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Khi deploy production
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Language
LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
```

Sau đó chạy:

```bash
python manage.py collectstatic
```

### Bước 4: Cập nhật Model

Mở file `templates_app/models.py` và thêm/cập nhật model:

```python
from django.db import models

class Document(models.Model):
    """Model cho mẫu biểu với thông tin địa chỉ"""

    # Thông tin cơ bản
    name = models.CharField(max_length=200, verbose_name="Tên văn bản")
    created_date = models.DateField(verbose_name="Ngày tạo")

    # ============ THÔNG TIN ĐỊA CHỈ (MỚI) ============
    province = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Tỉnh/Thành phố"
    )
    district = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Quận/Huyện"
    )
    ward = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Phường/Xã"
    )
    hamlet = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Ấp/Khóm"
    )
    full_address = models.TextField(
        blank=True,
        verbose_name="Địa chỉ đầy đủ"
    )
    # ================================================

    # Các field khác của bạn...
    notes = models.TextField(blank=True, verbose_name="Ghi chú")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Mẫu biểu"
        verbose_name_plural = "Mẫu biểu"
```

Chạy migration:

```bash
python manage.py makemigrations
python manage.py migrate
```

### Bước 5: Tạo/Cập nhật Form

Tạo/cập nhật file `templates_app/forms.py`:

```python
from django import forms
from .models import Document

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = '__all__'
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'created_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),

            # Hidden fields - sẽ được điền tự động bởi component
            'province': forms.HiddenInput(),
            'district': forms.HiddenInput(),
            'ward': forms.HiddenInput(),
            'hamlet': forms.HiddenInput(),
            'full_address': forms.HiddenInput(),

            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3
            }),
        }
```

### Bước 6: Cập nhật View

Cập nhật file `templates_app/views.py`:

```python
from django.shortcuts import render, redirect, get_object_or_404
from .models import Document
from .forms import DocumentForm

def document_create(request):
    """Tạo mẫu biểu mới"""
    if request.method == 'POST':
        form = DocumentForm(request.POST)
        if form.is_valid():
            document = form.save()
            return redirect('document_detail', pk=document.pk)
    else:
        form = DocumentForm()

    return render(request, 'document_form.html', {
        'form': form,
        'title': 'Tạo mẫu biểu mới',
        'is_edit': False
    })

def document_update(request, pk):
    """Chỉnh sửa mẫu biểu"""
    document = get_object_or_404(Document, pk=pk)

    if request.method == 'POST':
        form = DocumentForm(request.POST, instance=document)
        if form.is_valid():
            form.save()
            return redirect('document_detail', pk=document.pk)
    else:
        form = DocumentForm(instance=document)

    return render(request, 'document_form.html', {
        'form': form,
        'title': 'Chỉnh sửa mẫu biểu',
        'is_edit': True
    })
```

### Bước 7: Tạo Template

Tạo file `templates/document_form.html`:

```django
{% load static %}
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-4">
        <div class="card">
            <div class="card-header">
                <h3>{{ title }}</h3>
            </div>

            <div class="card-body">
                <form method="post" id="documentForm">
                    {% csrf_token %}

                    {# Thông tin cơ bản #}
                    <div class="mb-3">
                        <label class="form-label">Tên văn bản</label>
                        {{ form.name }}
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Ngày tạo</label>
                        {{ form.created_date }}
                    </div>

                    {# ========== COMPONENT ĐỊA CHỈ ========== #}
                    <hr class="my-4">
                    <h4>Thông tin địa chỉ</h4>

                    <div id="address-container"></div>

                    {# Hidden fields #}
                    {{ form.province }}
                    {{ form.district }}
                    {{ form.ward }}
                    {{ form.hamlet }}
                    {{ form.full_address }}

                    {# Preview #}
                    <div class="alert alert-secondary mt-3">
                        <strong>Địa chỉ đã chọn:</strong>
                        <div id="address-preview" class="mt-2">
                            <em class="text-muted">Chưa chọn</em>
                        </div>
                    </div>

                    {# Ghi chú #}
                    <div class="mb-3">
                        <label class="form-label">Ghi chú</label>
                        {{ form.notes }}
                    </div>

                    {# Buttons #}
                    <div class="d-flex justify-content-end gap-2">
                        <a href="javascript:history.back()" class="btn btn-secondary">Hủy</a>
                        <button type="submit" class="btn btn-primary">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {# ========== JAVASCRIPT ========== #}
    <script src="{% static 'js/address_selector_component.js' %}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const selector = new AddressSelector('#address-container', {
                dataUrl: '{% static "data/dia_danh.json" %}',
                showKhom: true,
                autoFill: function(fullAddress, parts) {
                    // Điền vào hidden fields
                    document.getElementById('id_province').value = parts.province || '';
                    document.getElementById('id_district').value = parts.district || '';
                    document.getElementById('id_ward').value = parts.ward || '';
                    document.getElementById('id_hamlet').value = parts.hamlet || '';
                    document.getElementById('id_full_address').value = fullAddress || '';

                    // Update preview
                    const preview = document.getElementById('address-preview');
                    preview.innerHTML = fullAddress
                        ? `<strong>${fullAddress}</strong>`
                        : '<em class="text-muted">Chưa chọn</em>';
                },
                onLoad: function(instance) {
                    // Nếu đang edit, set giá trị sẵn
                    {% if is_edit %}
                    instance.setValue({
                        tinh: '{{ form.instance.province }}',
                        huyen: '{{ form.instance.district }}',
                        xa: '{{ form.instance.ward }}',
                        khom: '{{ form.instance.hamlet }}'
                    });
                    {% endif %}
                }
            });

            // Validation
            document.getElementById('documentForm').addEventListener('submit', function(e) {
                const fullAddress = document.getElementById('id_full_address').value;
                if (!fullAddress) {
                    e.preventDefault();
                    alert('Vui lòng chọn địa chỉ!');
                    return false;
                }
            });
        });
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### Bước 8: Cập nhật URLs

Cập nhật file `templates_app/urls.py` (hoặc `wordgen/urls.py`):

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... các URL khác

    # URLs cho Document
    path('document/create/', views.document_create, name='document_create'),
    path('document/<int:pk>/edit/', views.document_update, name='document_update'),
]
```

### Bước 9: Đăng ký Model vào Admin (Optional)

Cập nhật `templates_app/admin.py`:

```python
from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_date', 'full_address', 'created_at']
    list_filter = ['created_date', 'province', 'district']
    search_fields = ['name', 'full_address', 'province', 'district']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'created_date')
        }),
        ('Địa chỉ', {
            'fields': ('province', 'district', 'ward', 'hamlet', 'full_address')
        }),
        ('Khác', {
            'fields': ('notes', 'created_at', 'updated_at')
        })
    )
```

---

## 📁 CẤU TRÚC FILE SAU KHI TÍCH HỢP

```
MauBieu7202/
├── templates_app/
│   ├── models.py                    ← Đã cập nhật (thêm địa chỉ fields)
│   ├── forms.py                     ← Đã cập nhật
│   ├── views.py                     ← Đã cập nhật
│   ├── urls.py                      ← Đã cập nhật
│   └── admin.py                     ← Đã cập nhật
│
├── templates/
│   └── document_form.html           ← MỚI (template với component)
│
├── static/
│   ├── js/
│   │   └── address_selector_component.js    ← MỚI
│   └── data/
│       └── dia_danh.json                    ← MỚI
│
├── wordgen/
│   ├── settings.py                  ← Kiểm tra STATIC settings
│   └── urls.py                      ← Include templates_app URLs
│
└── manage.py
```

---

## 💼 SỬ DỤNG TRONG FORM

### Khởi tạo Component

```javascript
const selector = new AddressSelector('#container-id', {
    dataUrl: '/static/data/dia_danh.json',  // Required
    showKhom: true,                          // Hiển thị cấp Khóm (default: true)

    // Callback khi chọn địa chỉ
    autoFill: function(fullAddress, parts) {
        // fullAddress: "Khóm 1, Phường 1, Thị xã Giá Rai, Tỉnh Bạc Liêu"
        // parts: { province, district, ward, hamlet, hamletWithPrefix }
        document.querySelector('[name="address"]').value = fullAddress;
    },

    // Callback khi component load xong
    onLoad: function(instance) {
        console.log('Loaded!');
    }
});
```

### Lấy giá trị

```javascript
const value = selector.getValue();
console.log(value);
// {
//   raw: { tinh: '...', huyen: '...', xa: '...', khom: '...' },
//   parts: { province: '...', district: '...', ward: '...', hamlet: '...' },
//   fullAddress: '...'
// }
```

### Set giá trị (khi edit)

```javascript
selector.setValue({
    tinh: 'Tỉnh Bạc Liêu',
    huyen: 'Thị xã Giá Rai',
    xa: 'Phường 1',
    khom: '1'
});
```

### Reset

```javascript
selector.reset();
```

### Validate

```javascript
if (selector.isValid()) {
    console.log('Địa chỉ hợp lệ');
} else {
    alert('Vui lòng chọn đầy đủ địa chỉ');
}
```

---

## 📄 SỬ DỤNG BIẾN TRONG WORD

Sau khi lưu dữ liệu vào database, bạn có thể sử dụng các biến sau trong file Word template:

### Biến có sẵn

```
{{ province }}         → Tỉnh Bạc Liêu
{{ district }}         → Thị xã Giá Rai
{{ ward }}             → Phường 1
{{ hamlet }}           → 1
{{ full_address }}     → Khóm 1, Phường 1, Thị xã Giá Rai, Tỉnh Bạc Liêu
```

### Ví dụ trong Word

**Văn bản mẫu:**

```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

Kính gửi: Ủy ban nhân dân {{ ward }}

Địa chỉ: {{ full_address }}

Ngân hàng Agribank Chi nhánh Giá Rai xin báo cáo...

Địa chỉ chi tiết:
- Tỉnh/Thành phố: {{ province }}
- Quận/Huyện: {{ district }}
- Phường/Xã: {{ ward }}
- Khóm/Ấp: {{ hamlet }}
```

**Kết quả khi render:**

```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------

Kính gửi: Ủy ban nhân dân Phường 1

Địa chỉ: Khóm 1, Phường 1, Thị xã Giá Rai, Tỉnh Bạc Liêu

Ngân hàng Agribank Chi nhánh Giá Rai xin báo cáo...

Địa chỉ chi tiết:
- Tỉnh/Thành phố: Tỉnh Bạc Liêu
- Quận/Huyện: Thị xã Giá Rai
- Phường/Xã: Phường 1
- Khóm/Ấp: 1
```

---

## 🎨 TÙY CHỈNH

### Thay đổi label

```javascript
new AddressSelector('#container', {
    labels: {
        tinh: 'Tỉnh',
        huyen: 'Huyện',
        xa: 'Xã',
        khom: 'Thôn'
    }
});
```

### Ẩn cấp Khóm

```javascript
new AddressSelector('#container', {
    showKhom: false  // Chỉ hiển thị 3 cấp: Tỉnh → Huyện → Xã
});
```

### Custom CSS

```css
/* Trong file CSS của bạn */
.address-selector .form-label {
    font-weight: bold;
    color: #333;
}

.address-selector .form-select {
    border-radius: 8px;
}
```

### Sử dụng API thay vì JSON file

Nếu bạn muốn load dữ liệu từ API Django thay vì file JSON:

**1. Tạo view API:**

```python
# views.py
from django.http import JsonResponse
import json
import os
from django.conf import settings

def get_address_hierarchy(request):
    json_path = os.path.join(settings.STATIC_ROOT, 'data', 'dia_danh.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return JsonResponse(data)
```

**2. Thêm URL:**

```python
# urls.py
path('api/address-hierarchy/', views.get_address_hierarchy, name='address_hierarchy'),
```

**3. Sửa component:**

```javascript
// Sửa loadHierarchyData() trong address_selector_component.js
async loadHierarchyData() {
    const response = await fetch('/api/address-hierarchy/');
    this.hierarchyData = await response.json();
}
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot find module 'dia_danh.json'"

**Nguyên nhân:** File JSON chưa được copy đúng vị trí

**Giải pháp:**
```bash
# Kiểm tra file tồn tại
ls static/data/dia_danh.json

# Nếu không có, copy lại
cp /path/to/ChuyenDoiHanhChinh_Web/dia_danh.json static/data/

# Chạy collectstatic
python manage.py collectstatic --noinput
```

### Lỗi: "AddressSelector is not defined"

**Nguyên nhân:** File JS chưa được include

**Giải pháp:**
```django
{% load static %}
<script src="{% static 'js/address_selector_component.js' %}"></script>
```

### Lỗi: Component hiển thị nhưng không có dữ liệu

**Nguyên nhân:** CORS hoặc đường dẫn JSON sai

**Giải pháp:**
```javascript
// Kiểm tra console log
console.log('Data URL:', '{% static "data/dia_danh.json" %}');

// Debug trong component
const selector = new AddressSelector('#container', {
    dataUrl: '{% static "data/dia_danh.json" %}',
    onLoad: function(instance) {
        console.log('Loaded data:', instance.hierarchyData);
    }
});
```

### Lỗi: Hidden fields không được submit

**Nguyên nhân:** ID của hidden input không khớp

**Giải pháp:**
```javascript
// Django tự động thêm prefix "id_" cho các field
// Nếu field name là "province", ID sẽ là "id_province"

document.getElementById('id_province').value = parts.province;
document.getElementById('id_district').value = parts.district;
// ...
```

### Lỗi: Không thể edit (set giá trị không hoạt động)

**Nguyên nhân:** setValue() được gọi trước khi component load xong

**Giải pháp:**
```javascript
const selector = new AddressSelector('#container', {
    onLoad: function(instance) {
        // Set giá trị SAU KHI component load xong
        {% if is_edit %}
        instance.setValue({
            tinh: '{{ form.instance.province }}',
            huyen: '{{ form.instance.district }}',
            xa: '{{ form.instance.ward }}',
            khom: '{{ form.instance.hamlet }}'
        });
        {% endif %}
    }
});
```

### Static files không load (Production)

**Giải pháp:**
```python
# settings.py
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
```

```bash
# Chạy lệnh
python manage.py collectstatic --noinput

# Nếu dùng Nginx, cấu hình:
location /static/ {
    alias /path/to/MauBieu7202/staticfiles/;
}
```

---

## 📞 HỖ TRỢ

### Files tham khảo

- `demo_component.html` - Demo standalone component
- `django_integration_example.html` - Template Django đầy đủ
- `address_selector_component.js` - Source code component
- `PHAN_TICH_TICH_HOP.md` - Phân tích chi tiết

### Kiểm tra

```bash
# Chạy development server
python manage.py runserver

# Truy cập
http://localhost:8000/document/create/

# Mở Console (F12) để xem log
```

### Debug mode

Bật debug trong template:

```django
{% if debug %}
<div class="alert alert-warning">
    <h4>Debug Info</h4>
    <pre>
    Province: {{ form.instance.province }}
    District: {{ form.instance.district }}
    Ward: {{ form.instance.ward }}
    Hamlet: {{ form.instance.hamlet }}
    Full: {{ form.instance.full_address }}
    </pre>
</div>
{% endif %}
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Copy `address_selector_component.js` vào `static/js/`
- [ ] Copy `dia_danh.json` vào `static/data/`
- [ ] Cập nhật Model (thêm 5 fields địa chỉ)
- [ ] Chạy `makemigrations` và `migrate`
- [ ] Tạo/cập nhật Form
- [ ] Tạo/cập nhật Views
- [ ] Tạo/cập nhật Template
- [ ] Cập nhật URLs
- [ ] Chạy `collectstatic`
- [ ] Test tạo mới document
- [ ] Test chỉnh sửa document
- [ ] Test render Word với biến địa chỉ
- [ ] Đăng ký Admin (optional)

---

## 🎉 HOÀN THÀNH!

Sau khi hoàn thành các bước trên, bạn đã tích hợp thành công hệ thống chọn địa chỉ vào MauBieu7202!

**Các tính năng đã có:**
- ✅ Combobox cascade 4 cấp
- ✅ Tự động điền vào form
- ✅ Lưu vào database
- ✅ Sử dụng biến trong Word
- ✅ Validation
- ✅ Edit mode
- ✅ Django Admin integration

**Repo gốc:**
- ChuyenDoiHanhChinh_Web: https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web
- MauBieu7202: https://github.com/HieuKyo/MauBieu7202

---

**Chúc bạn thành công! 🚀**
