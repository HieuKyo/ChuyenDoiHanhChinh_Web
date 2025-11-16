document.addEventListener('DOMContentLoaded', function() {
    // ... (toàn bộ code cũ từ trên xuống dưới đến hết hàm copyBtn) ...
    const tinhSelect = document.getElementById('tinh');
    const huyenSelect = document.getElementById('huyen');
    const xaSelect = document.getElementById('xa');
    const khomSelect = document.getElementById('khom');
    const convertBtn = document.getElementById('convertBtn');
    const resultDiv = document.getElementById('result');
    const copyBtn = document.getElementById('copyBtn');
    const reportBtn = document.getElementById('reportBtn'); 
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;
    const updateIcon = (theme) => { if (theme === 'dark') { themeIcon.classList.remove('bi-sun-fill'); themeIcon.classList.add('bi-moon-stars-fill'); } else { themeIcon.classList.remove('bi-moon-stars-fill'); themeIcon.classList.add('bi-sun-fill'); } };
    const applyTheme = (theme) => { htmlElement.setAttribute('data-bs-theme', theme); updateIcon(theme); };
    themeToggleBtn.addEventListener('click', () => { const currentTheme = htmlElement.getAttribute('data-bs-theme'); const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); applyTheme(newTheme); });
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    function populateSelect(selectElement, items, placeholder) { selectElement.innerHTML = `<option value="">-- ${placeholder} --</option>`; items.forEach(item => { const option = document.createElement('option'); option.value = item; option.textContent = item; selectElement.appendChild(option); }); selectElement.disabled = items.length === 0; }
    tinhSelect.addEventListener('change', async function() { const selectedTinh = this.value; huyenSelect.innerHTML = ''; huyenSelect.disabled = true; xaSelect.innerHTML = ''; xaSelect.disabled = true; khomSelect.innerHTML = ''; khomSelect.disabled = true; if (selectedTinh) { const response = await fetch(`/get_huyen/${selectedTinh}`); const data = await response.json(); populateSelect(huyenSelect, data, 'Chọn Quận/Huyện'); } });
    huyenSelect.addEventListener('change', async function() { const selectedTinh = tinhSelect.value; const selectedHuyen = this.value; xaSelect.innerHTML = ''; xaSelect.disabled = true; khomSelect.innerHTML = ''; khomSelect.disabled = true; if (selectedHuyen) { const response = await fetch(`/get_xa/${selectedTinh}/${selectedHuyen}`); const data = await response.json(); populateSelect(xaSelect, data, 'Chọn Phường/Xã'); } });
    xaSelect.addEventListener('change', async function() { const selectedTinh = tinhSelect.value; const selectedHuyen = huyenSelect.value; const selectedXa = this.value; khomSelect.innerHTML = ''; khomSelect.disabled = true; if (selectedXa) { const response = await fetch(`/get_khom/${selectedTinh}/${selectedHuyen}/${selectedXa}`); const data = await response.json(); populateSelect(khomSelect, data, 'Chọn Ấp/Khóm'); } });
    convertBtn.addEventListener('click', async function() { const addressData = { tinh: tinhSelect.value, huyen: huyenSelect.value, xa: xaSelect.value, khom: khomSelect.value }; if (!addressData.tinh || !addressData.huyen || !addressData.xa) { resultDiv.textContent = 'Vui lòng chọn đầy đủ thông tin.'; return; } const response = await fetch('/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressData), }); const data = await response.json(); resultDiv.textContent = data.new_address || 'Không có thông tin chuyển đổi.'; });
    copyBtn.addEventListener('click', function() { const textToCopy = resultDiv.textContent; if (textToCopy && textToCopy !== 'Vui lòng chọn đầy đủ thông tin.' && textToCopy !== 'Không có thông tin chuyển đổi.') { navigator.clipboard.writeText(textToCopy).then(() => { const originalIcon = copyBtn.innerHTML; copyBtn.innerHTML = '<i class="bi bi-check-lg text-success"></i>'; copyBtn.title = 'Đã sao chép!'; setTimeout(() => { copyBtn.innerHTML = originalIcon; copyBtn.title = 'Sao chép kết quả'; }, 2000); }).catch(err => { console.error('Lỗi khi sao chép: ', err); }); } });

    // --- LOGIC MỚI CHO NÚT BÁO CÁO (DÙNG MODAL) ---
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    const reportOldAddress = document.getElementById('report-old-address');
    const reportNewAddress = document.getElementById('report-new-address');
    const reportComments = document.getElementById('report-comments');
    const submitReportBtn = document.getElementById('submit-report-btn');
    const reportStatus = document.getElementById('report-status');

    copyBtn.addEventListener('click', function() {
        const textToCopy = resultDiv.textContent;
        if (!textToCopy || textToCopy.includes('Vui lòng chọn') || textToCopy.includes('Không có thông tin')) {
            return; // Không làm gì nếu không có nội dung hợp lệ
        }

        // Tạo một thẻ textarea tạm thời
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        
        // Ẩn nó đi
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = 0;
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy'); // Lệnh sao chép cũ

            // Phản hồi cho người dùng
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="bi bi-check-lg text-success"></i>';
            copyBtn.title = 'Đã sao chép!';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.title = 'Sao chép kết quả';
            }, 2000);

        } catch (err) {
            console.error('Lỗi khi sao chép: ', err);
        }

        document.body.removeChild(textArea); // Xóa thẻ tạm thời
    });
    
    // Khi nhấn nút Báo cáo (lá cờ)
    reportBtn.addEventListener('click', function() {
        const tinh = tinhSelect.value;
        const huyen = huyenSelect.value;
        const xa = xaSelect.value;
        const khom = khomSelect.value;
        const newAddress = resultDiv.textContent;

        if (!newAddress || newAddress.includes('Vui lòng chọn') || newAddress.includes('Không có thông tin')) {
            alert('Vui lòng thực hiện một lượt chuyển đổi có kết quả trước khi báo cáo.');
            return;
        }

        const oldAddress = `${khom}, ${xa}, ${huyen}, ${tinh}`;
        
        // Điền thông tin vào form trong modal
        reportOldAddress.value = oldAddress;
        reportNewAddress.value = newAddress;
        reportComments.value = '';
        reportStatus.innerHTML = ''; // Xóa trạng thái cũ

        // Mở modal
        reportModal.show();
    });

    // Khi nhấn nút "Gửi Báo cáo" trong modal
    submitReportBtn.addEventListener('click', async function() {
        const reportData = {
            old_address: reportOldAddress.value,
            new_address: reportNewAddress.value,
            comments: reportComments.value
        };

        // Gửi dữ liệu về backend
        const response = await fetch('/report_error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });

        const result = await response.json();

        if (result.success) {
            reportStatus.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => {
                reportModal.hide();
            }, 2000); // Tự động đóng modal sau 2 giây
        } else {
            reportStatus.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
        }
    });
});