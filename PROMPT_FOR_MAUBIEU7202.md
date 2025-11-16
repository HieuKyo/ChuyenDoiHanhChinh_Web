# TÍCH HỢP HỆ THỐNG CHỌN ĐỊA CHỈ VÀO MAUBIEU7202

Xin chào! Tôi cần bạn giúp tích hợp hệ thống chọn địa chỉ cascade (Tỉnh → Huyện → Xã → Khóm) vào dự án MauBieu7202 này.

## 📋 THÔNG TIN NGUỒN

**Repo nguồn:** https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web
**Branch:** claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj

**Các file cần lấy từ repo nguồn:**
1. `address_selector_component.js` - Component JavaScript
2. `dia_danh.json` - Dữ liệu địa danh (570 dòng)
3. `django_integration_example.html` - Template mẫu tham khảo

**Link trực tiếp các file:**
- https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web/blob/claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj/address_selector_component.js
- https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web/blob/claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj/dia_danh.json
- https://github.com/HieuKyo/ChuyenDoiHanhChinh_Web/blob/claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj/django_integration_example.html

---

## 🎯 YÊU CẦU

Hãy thực hiện **9 BƯỚC** sau để tích hợp hoàn chỉnh:

### BƯỚC 1: Tải các file cần thiết từ repo nguồn

Sử dụng WebFetch hoặc các công cụ phù hợp để tải 3 file trên về:

1. **address_selector_component.js** → Lưu vào `static/js/address_selector_component.js`
2. **dia_danh.json** → Lưu vào `static/data/dia_danh.json`
3. **django_integration_example.html** → Tham khảo (không nhất thiết phải copy)

---

### BƯỚC 2: Cập nhật Django Model

Tìm model chính của dự án (có thể là `Document`, `Template`, hoặc tương tự trong `templates_app/models.py`).

**Thêm 5 fields sau vào model:**

```python
# Thông tin địa chỉ chi tiết
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
```

**Sau đó chạy migration:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

### BƯỚC 3: Cập nhật Django Form

Tìm form tương ứng (có thể trong `templates_app/forms.py`).

**Thêm các field vào form với widget HiddenInput:**

```python
from django import forms

class YourForm(forms.ModelForm):
    class Meta:
        model = YourModel
        fields = [..., 'province', 'district', 'ward', 'hamlet', 'full_address']
        widgets = {
            # ... các widget khác

            # Hidden fields - sẽ được điền tự động bởi component
            'province': forms.HiddenInput(),
            'district': forms.HiddenInput(),
            'ward': forms.HiddenInput(),
            'hamlet': forms.HiddenInput(),
            'full_address': forms.HiddenInput(),
        }
```

---

### BƯỚC 4: Tạo/Cập nhật Template

Tìm template form hiện tại hoặc tạo template mới.

**Thêm vào template:**

```django
{% load static %}

{# Trong <head> hoặc trước </body> #}
<script src="{% static 'js/address_selector_component.js' %}"></script>

{# Trong form #}
<form method="post" id="mainForm">
    {% csrf_token %}

    {# ... Các field khác ... #}

    {# PHẦN ĐỊA CHỈ #}
    <hr class="my-4">
    <h4>Thông tin địa chỉ</h4>

    {# Container cho component #}
    <div id="address-selector-container"></div>

    {# Hidden fields #}
    {{ form.province }}
    {{ form.district }}
    {{ form.ward }}
    {{ form.hamlet }}
    {{ form.full_address }}

    {# Preview địa chỉ #}
    <div class="alert alert-secondary mt-3">
        <strong>Địa chỉ đã chọn:</strong>
        <div id="address-preview" class="mt-2">
            <em class="text-muted">Chưa chọn địa chỉ</em>
        </div>
    </div>

    <button type="submit" class="btn btn-primary">Lưu</button>
</form>

{# Script khởi tạo component #}
<script>
document.addEventListener('DOMContentLoaded', function() {
    const selector = new AddressSelector('#address-selector-container', {
        dataUrl: '{% static "data/dia_danh.json" %}',
        showKhom: true,

        autoFill: function(fullAddress, parts) {
            // Điền vào hidden fields
            // Django tự động thêm prefix "id_" cho field IDs
            document.getElementById('id_province').value = parts.province || '';
            document.getElementById('id_district').value = parts.district || '';
            document.getElementById('id_ward').value = parts.ward || '';
            document.getElementById('id_hamlet').value = parts.hamlet || '';
            document.getElementById('id_full_address').value = fullAddress || '';

            // Update preview
            const preview = document.getElementById('address-preview');
            preview.innerHTML = fullAddress
                ? `<strong>${fullAddress}</strong>`
                : '<em class="text-muted">Chưa chọn địa chỉ</em>';
        },

        onLoad: function(instance) {
            console.log('Address Selector loaded!');

            // Nếu đang edit (có giá trị sẵn), set lại
            {% if form.instance.province %}
            instance.setValue({
                tinh: '{{ form.instance.province }}',
                huyen: '{{ form.instance.district }}',
                xa: '{{ form.instance.ward }}',
                khom: '{{ form.instance.hamlet }}'
            });
            {% endif %}
        }
    });

    // Validation trước khi submit
    document.getElementById('mainForm').addEventListener('submit', function(e) {
        const fullAddress = document.getElementById('id_full_address').value;
        if (!fullAddress || fullAddress.trim() === '') {
            e.preventDefault();
            alert('Vui lòng chọn đầy đủ thông tin địa chỉ!');
            return false;
        }
    });
});
</script>
```

---

### BƯỚC 5: Cập nhật Views (nếu cần)

Kiểm tra views hiện tại. Thông thường không cần thay đổi gì vì form đã xử lý.

Nhưng nếu cần, đảm bảo view xử lý đúng:

```python
def your_view(request):
    if request.method == 'POST':
        form = YourForm(request.POST)
        if form.is_valid():
            instance = form.save()
            # instance.full_address đã được điền từ form
            return redirect('success_page')
    else:
        form = YourForm()

    return render(request, 'your_template.html', {'form': form})
```

---

### BƯỚC 6: Cập nhật URLs (nếu cần)

Đảm bảo URLs đã được cấu hình đúng cho views.

---

### BƯỚC 7: Cập nhật Django Admin (Optional)

Trong `templates_app/admin.py`:

```python
from django.contrib import admin
from .models import YourModel

@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'full_address', 'created_at']
    list_filter = ['province', 'district']
    search_fields = ['name', 'full_address']

    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', ...)
        }),
        ('Địa chỉ', {
            'fields': ('province', 'district', 'ward', 'hamlet', 'full_address')
        }),
    )
```

---

### BƯỚC 8: Collect Static Files

```bash
python manage.py collectstatic --noinput
```

---

### BƯỚC 9: Test

1. Chạy server:
```bash
python manage.py runserver
```

2. Truy cập form tạo/edit

3. Kiểm tra:
   - [ ] Component hiển thị đúng
   - [ ] Chọn Tỉnh → Load Huyện
   - [ ] Chọn Huyện → Load Xã
   - [ ] Chọn Xã → Load Khóm
   - [ ] Preview hiển thị địa chỉ
   - [ ] Submit form → Lưu vào database
   - [ ] Edit form → Hiển thị lại giá trị đã chọn

---

## 📦 NỘI DUNG CÁC FILE CẦN TẠO

### File 1: static/data/dia_danh.json

<details>
<summary>Xem nội dung đầy file (click để mở rộng)</summary>

Tải từ link: https://raw.githubusercontent.com/HieuKyo/ChuyenDoiHanhChinh_Web/claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj/dia_danh.json

Hoặc dùng WebFetch để lấy nội dung file.

Cấu trúc:
```json
{
  "Tỉnh Bạc Liêu": {
    "Thành phố Bạc Liêu": {
      "Phường 1": ["1", "5", "6", "7", "8", "9", "10"],
      "Phường 2": ["1", "2", "3", "4", "5", "6"],
      ...
    },
    "Thị xã Giá Rai": {
      "Phường 1": [...],
      ...
    },
    ...
  }
}
```

</details>

---

### File 2: static/js/address_selector_component.js

<details>
<summary>Xem code (click để mở rộng)</summary>

Tải từ link: https://raw.githubusercontent.com/HieuKyo/ChuyenDoiHanhChinh_Web/claude/review-code-migration-01FhfKC8epXCQjouEdSxRCsj/address_selector_component.js

Đây là JavaScript class có sẵn, chỉ cần copy nguyên văn.

</details>

---

## 🎨 SỬ DỤNG BIẾN TRONG WORD TEMPLATE

Sau khi tích hợp xong, bạn có thể sử dụng các biến sau trong file Word template (.docx):

```
{{ province }}         → Tỉnh Bạc Liêu
{{ district }}         → Thị xã Giá Rai
{{ ward }}             → Phường 1
{{ hamlet }}           → 1
{{ full_address }}     → Khóm 1, Phường 1, Thị xã Giá Rai, Tỉnh Bạc Liêu
```

Ví dụ trong Word:
```
Kính gửi: Ủy ban nhân dân {{ ward }}
Địa chỉ: {{ full_address }}
```

---

## ✅ CHECKLIST HOÀN THÀNH

Sau khi làm xong, hãy kiểm tra:

- [ ] File `static/js/address_selector_component.js` đã tồn tại
- [ ] File `static/data/dia_danh.json` đã tồn tại
- [ ] Model đã có 5 fields: province, district, ward, hamlet, full_address
- [ ] Migration đã chạy thành công
- [ ] Form có hidden inputs cho 5 fields
- [ ] Template có component container và script khởi tạo
- [ ] Collectstatic đã chạy
- [ ] Test create: Chọn địa chỉ → Submit → Lưu thành công
- [ ] Test edit: Mở lại form → Hiển thị đúng địa chỉ đã chọn
- [ ] Test Word: Render biến địa chỉ vào file Word

---

## 🐛 TROUBLESHOOTING

**Lỗi: Component không hiển thị**
→ Kiểm tra Console (F12), xem có lỗi load file JS không
→ Đảm bảo đã chạy `collectstatic`

**Lỗi: Không có data trong dropdown**
→ Kiểm tra file `dia_danh.json` đã copy đúng vị trí
→ Kiểm tra đường dẫn trong `dataUrl`

**Lỗi: Submit form nhưng địa chỉ không được lưu**
→ Kiểm tra ID của hidden inputs (phải là `id_province`, `id_district`, etc.)
→ Xem Network tab trong DevTools khi submit

**Lỗi: Edit form không hiển thị giá trị cũ**
→ Kiểm tra `onLoad` callback có `setValue()` chưa
→ Kiểm tra template có `{% if form.instance.province %}` chưa

---

## 📞 YÊU CẦU ĐẶC BIỆT

1. **Tạo commit rõ ràng** cho từng bước quan trọng
2. **Test kỹ** trước khi push
3. **Báo cáo** nếu có file/model nào không tìm thấy hoặc cấu trúc khác dự kiến
4. **Hỏi tôi** nếu có điều gì không rõ

---

## 🚀 BẮT ĐẦU

Hãy bắt đầu từ **BƯỚC 1** và làm tuần tự đến **BƯỚC 9**.

Sau mỗi bước quan trọng (tạo file, cập nhật model, etc.), hãy commit với message rõ ràng.

Chúc bạn thành công! 🎉
