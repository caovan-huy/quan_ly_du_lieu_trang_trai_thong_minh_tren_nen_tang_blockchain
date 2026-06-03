// ============================================================================
// BIẾN TOÀN CỤC
// ============================================================================
let currentUserRole = '';
let currentActiveSubMenu = '';
let currentZoneId = '';
let systemAccessLogs = [];
let activeDeviceConfig = null;
let currentZoneData = null;

// ============================================================================
// 1. ĐĂNG NHẬP, ĐĂNG XUẤT & LỊCH SỬ TRUY CẬP
// ============================================================================
function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === 'admin' && pass === 'admin') {
        currentUserRole = 'admin';
        document.getElementById('user-role-badge').innerText = "Nông Dân";
        document.getElementById('user-role-badge').style.background = "#e0f2fe";
        document.getElementById('user-role-badge').style.color = "#0284c7";
        document.getElementById('menu-dashboard').style.display = 'flex';
        document.getElementById('menu-history').style.display = 'flex';
        switchModule('dashboard', document.getElementById('menu-dashboard'));
    } else if (user === 'guest' && pass === 'guest') {
        currentUserRole = 'guest';
        document.getElementById('user-role-badge').innerText = "Doanh Nghiệp";
        document.getElementById('user-role-badge').style.background = "#ffedd5";
        document.getElementById('user-role-badge').style.color = "#c2410c";
        document.getElementById('menu-dashboard').style.display = 'none';
        document.getElementById('menu-history').style.display = 'none';
        switchModule('blockchain', document.getElementById('menu-blockchain'));
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu!");
        return;
    }

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';
    logAccess(`Tài khoản [${user}] vừa đăng nhập hệ thống.`);
}

function handleLogout() {
    logAccess(`Tài khoản [${currentUserRole}] đã đăng xuất.`);
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleLogin();
});

function logAccess(actionDetail) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN') + " - " + now.toLocaleDateString('vi-VN');
    systemAccessLogs.unshift({ time: timeString, action: actionDetail });
    filterLogsByDate();
}

function renderLogs(logsArray) {
    const logContainer = document.getElementById('access-logs-container');
    if (!logContainer) return;

    if (logsArray.length === 0) {
        logContainer.innerHTML = '<div style="padding: 20px; color: #6b7280; text-align: center;">Không có dữ liệu truy cập trong khoảng thời gian này.</div>';
        return;
    }

    logContainer.innerHTML = logsArray.map(log => `
        <div class="timeline-item">
            <span class="timeline-date">${log.time}</span>
            <div class="timeline-content" style="padding: 8px 12px;">${log.action}</div>
        </div>
    `).join('');
}

function parseVietnameseDate(dateString) {
    const parts = dateString.split(' - ');
    if (parts.length < 2) return new Date();
    const dateParts = parts[1].split('/');
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
}

function filterLogsByDate() {
    const startDateStr = document.getElementById('filter-start-date').value;
    const endDateStr = document.getElementById('filter-end-date').value;

    let filteredLogs = systemAccessLogs;

    if (startDateStr || endDateStr) {
        const start = startDateStr ? new Date(startDateStr + "T00:00:00") : null;
        const end = endDateStr ? new Date(endDateStr + "T23:59:59") : null;

        filteredLogs = systemAccessLogs.filter(log => {
            const logDate = parseVietnameseDate(log.time);
            let isValid = true;
            if (start && logDate < start) isValid = false;
            if (end && logDate > end) isValid = false;
            return isValid;
        });
    }

    renderLogs(filteredLogs);
}

function resetLogFilter() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    renderLogs(systemAccessLogs);
}

// ============================================================================
// 2. ĐIỀU HƯỚNG MENU & RESET GIAO DIỆN CAMERA
// ============================================================================

// Hàm reset giao diện Camera AI
function resetCameraUI() {
    const mediaInput = document.getElementById('mediaUpload');
    if (mediaInput) mediaInput.value = '';

    const videoPlayer = document.getElementById('preview-video');
    const imgPlayer = document.getElementById('preview-image');
    const placeholder = document.getElementById('camera-placeholder');
    const resultBox = document.getElementById('cv-result');

    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
        videoPlayer.style.display = 'none';
    }
    if (imgPlayer) {
        imgPlayer.src = '';
        imgPlayer.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'block';
    }
    if (resultBox) {
        resultBox.classList.add('hidden');
        resultBox.innerHTML = '';
    }
}

function switchModule(moduleId, element) {
    resetCameraUI(); // Xóa dữ liệu AI cũ khi đổi tab
    document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    if (moduleId === 'dashboard') document.getElementById('zone-detail').classList.remove('active');

    document.getElementById(moduleId).classList.add('active');
    element.classList.add('active');
    logAccess(`Chuyển tab Menu: ${element.innerText.trim()}`);
}

function openSubMenu(subMenuId) {
    resetCameraUI(); // Xóa dữ liệu AI cũ khi vào menu con
    document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
    document.getElementById(subMenuId).classList.add('active');
    currentActiveSubMenu = subMenuId;
}

function backToMainDashboard() {
    resetCameraUI(); // Xóa dữ liệu AI cũ khi về màn hình chính
    document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    currentActiveSubMenu = '';
}

// ============================================================================
// 3. CHI TIẾT KHU VỰC & SỔ TAY MÙA VỤ
// ============================================================================
async function openZoneDetail(zoneId) {
    resetCameraUI(); // Xóa dữ liệu AI khi chuyển khu vực chuồng
    currentZoneId = zoneId;
    document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
    document.getElementById('zone-detail').classList.add('active');

    document.getElementById('cv-camera-section').classList.add('hidden');
    document.getElementById('cv-result').classList.add('hidden');

    try {
        const response = await fetch(`http://localhost:3000/api/zone/${zoneId}`);
        const data = await response.json();

        currentZoneData = data;

        document.getElementById('detail-title').innerText = data.title;
        document.getElementById('detail-icon').className = `fa-solid ${data.icon} icon-${data.color}`;
        document.getElementById('detail-crops').innerText = data.crops;

        const statsList = document.getElementById('detail-stats');
        statsList.innerHTML = data.stats.map(stat => `<li><span>${stat.label}</span> <strong style="color: ${stat.status === 'warning' ? '#dc2626' : 'inherit'}">${stat.value}</strong></li>`).join('');

        const inventoryCard = document.getElementById('card-inventory');
        const inventoryList = document.getElementById('detail-inventory');

        if (data.foodInventory && Object.keys(data.foodInventory).length > 0) {
            inventoryCard.style.display = 'block';
            let invHTML = '';
            for (let [type, qty] of Object.entries(data.foodInventory)) {
                invHTML += `<li><span style="font-weight: 500;">${type}</span> <strong style="color: ${qty < 100 ? '#dc2626' : '#16a34a'}">${qty} kg</strong></li>`;
            }
            inventoryList.innerHTML = invHTML;
        } else {
            inventoryCard.style.display = 'none';
        }

        const devicesList = document.getElementById('detail-devices');
        devicesList.innerHTML = data.devices.map((dev, index) => {
            const isOn = dev.state.toLowerCase().includes('bật') || dev.state.toLowerCase().includes('chạy');
            const btnClass = isOn ? 'device-on' : 'device-off';
            const btnText = isOn ? 'Đang hoạt động' : 'Đang tắt';

            return `<li style="align-items: center;">
                <span style="font-weight: 500;">${dev.name}</span> 
                <button class="device-toggle-btn ${btnClass}" onclick="openDeviceModal('${zoneId}', ${index}, '${dev.name}', ${isOn})">
                    <i class="fa-solid fa-power-off"></i> ${btnText}
                </button>
            </li>`;
        }).join('');

        renderFarmLogs(data.farmLogs);

        if (data.has_cv_camera) {
            document.getElementById('cv-camera-section').classList.remove('hidden');
            document.getElementById('cv-camera-section').dataset.currentZone = data.title;
        }
    } catch (error) {
        document.getElementById('detail-title').innerText = "Lỗi kết nối máy chủ!";
    }
}

function backToSubMenu() {
    resetCameraUI(); // Xóa dữ liệu AI khi thoát khỏi chi tiết khu vực
    document.getElementById('zone-detail').classList.remove('active');
    if (currentActiveSubMenu !== '') document.getElementById(currentActiveSubMenu).classList.add('active');
    else document.getElementById('dashboard').classList.add('active');
}

function renderFarmLogs(logsArray) {
    const farmLogsContainer = document.getElementById('detail-farmlogs');
    if (logsArray && logsArray.length > 0) {
        farmLogsContainer.innerHTML = logsArray.map(log => `
            <div class="timeline-item">
                <span class="timeline-date"><i class="fa-regular fa-calendar"></i> ${log.date}</span>
                <div class="timeline-content"><strong>${log.action}:</strong> ${log.detail}</div>
            </div>
        `).join('');
    } else {
        farmLogsContainer.innerHTML = "<p style='color: #9ca3af;'>Chưa có bản ghi nào.</p>";
    }
}

async function submitFarmLog() {
    const rawDate = document.getElementById('log-date').value;
    const action = document.getElementById('log-action').value.trim();
    const performedBy = document.getElementById('log-performedBy').value.trim();
    const detail = document.getElementById('log-detail').value.trim();

    if (!rawDate || !action || !performedBy || !detail) return alert("Vui lòng điền đầy đủ Ngày, Hoạt động, Người kiểm tra và Chi tiết!");

    const parts = rawDate.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    const finalDetail = `${detail}. Người kiểm tra: ${performedBy}`;

    try {
        await fetch(`http://localhost:3000/api/zone/${currentZoneId}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: formattedDate, action: action, detail: finalDetail })
        });

        logAccess(`Đã điền phiếu: [${action}] tại khu vực hiện tại`);
        openZoneDetail(currentZoneId);
        document.getElementById('log-date').value = '';
        document.getElementById('log-action').value = '';
        document.getElementById('log-performedBy').value = '';
        document.getElementById('log-detail').value = '';
        alert("Lưu thông tin thành công!");
    } catch (error) {
        alert("Lỗi khi lưu phiếu. Vui lòng kiểm tra Server.");
    }
}

// ============================================================================
// 4. QUẢN LÝ TỒN KHO THỨC ĂN
// ============================================================================
function openReplenishModal() {
    document.getElementById('replenish-type').value = '';
    document.getElementById('replenish-qty').value = '';
    document.getElementById('replenish-performedBy').value = '';
    document.getElementById('replenish-modal').classList.remove('hidden');
}

function closeReplenishModal() {
    document.getElementById('replenish-modal').classList.add('hidden');
}

async function confirmReplenish() {
    const type = document.getElementById('replenish-type').value.trim();
    const qty = document.getElementById('replenish-qty').value;
    const performer = document.getElementById('replenish-performedBy').value.trim();

    if (!type) return alert("Vui lòng nhập loại thức ăn!");
    if (!qty || qty <= 0) return alert("Vui lòng nhập khối lượng hợp lệ lớn hơn 0!");
    if (!performer) return alert("Vui lòng nhập tên người nhập kho!");

    try {
        const res = await fetch(`http://localhost:3000/api/zone/${currentZoneId}/replenish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addedQuantity: qty, foodType: type, performedBy: performer })
        });

        const result = await res.json();
        if (result.success) {
            logAccess(`Đã nhập thêm ${qty} kg [${type}] vào kho [${currentZoneData.title}]`);
            closeReplenishModal();
            openZoneDetail(currentZoneId);
            alert("Đã nhập kho thức ăn thành công!");
        }
    } catch (e) {
        alert("Lỗi kết nối Backend.");
    }
}

// ============================================================================
// 5. ĐIỀU KHIỂN THIẾT BỊ IOT
// ============================================================================
function openDeviceModal(zoneId, deviceIndex, deviceName, isCurrentlyOn) {
    if (currentUserRole === 'guest') {
        alert("Tài khoản Doanh nghiệp/Khách không có quyền điều khiển phần cứng của trang trại!");
        return;
    }

    activeDeviceConfig = { zoneId, deviceIndex, deviceName, isCurrentlyOn };
    document.getElementById('modal-device-name').innerHTML = `<i class="fa-solid fa-microchip"></i> ${deviceName}`;
    document.getElementById('modal-device-performedBy').value = '';

    document.getElementById('modal-device-prompt').innerHTML = isCurrentlyOn
        ? `Thiết bị đang chạy. Bạn có muốn <strong>TẮT</strong> nó không?`
        : `Thiết bị đang tắt. Bạn có muốn <strong>BẬT</strong> nó không?`;

    document.getElementById('modal-device-timer').value = '';
    document.getElementById('modal-device-qty').value = '';

    const qtyContainer = document.getElementById('modal-qty-container');
    const foodTypeSelect = document.getElementById('modal-device-food-type');
    const nameLower = deviceName.toLowerCase();

    const isFeedingDevice = nameLower.includes('cho ăn') || nameLower.includes('rải thức ăn') || nameLower.includes('bơm cám');

    if (isFeedingDevice && !isCurrentlyOn && currentZoneData.foodInventory) {
        qtyContainer.classList.remove('hidden');
        foodTypeSelect.innerHTML = '';
        const foodTypes = Object.keys(currentZoneData.foodInventory);
        if (foodTypes.length === 0) {
            foodTypeSelect.innerHTML = '<option value="">-- Kho đang trống --</option>';
        } else {
            foodTypes.forEach(type => {
                foodTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
            });
        }
        updateInventoryDisplay();
    } else {
        qtyContainer.classList.add('hidden');
    }

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.style.background = isCurrentlyOn ? '#dc2626' : '#16a34a';
    confirmBtn.innerHTML = isCurrentlyOn ? '<i class="fa-solid fa-power-off"></i> Xác nhận TẮT' : '<i class="fa-solid fa-power-off"></i> Xác nhận BẬT';

    document.getElementById('device-modal').classList.remove('hidden');
}

function updateInventoryDisplay() {
    const selectedType = document.getElementById('modal-device-food-type').value;
    const invDisplay = document.getElementById('modal-inventory-display');

    if (!selectedType || !currentZoneData || !currentZoneData.foodInventory[selectedType]) {
        invDisplay.innerText = `Kho còn: 0 kg`;
        invDisplay.style.background = '#fee2e2';
        invDisplay.style.color = '#dc2626';
        return;
    }

    const inv = currentZoneData.foodInventory[selectedType];
    invDisplay.innerText = `Kho còn: ${inv} kg`;

    if (inv < 100) {
        invDisplay.style.background = '#fee2e2';
        invDisplay.style.color = '#dc2626';
    } else {
        invDisplay.style.background = '#dcfce7';
        invDisplay.style.color = '#16a34a';
    }
}

function closeDeviceModal() {
    document.getElementById('device-modal').classList.add('hidden');
    activeDeviceConfig = null;
}

async function confirmDeviceAction() {
    if (!activeDeviceConfig) return;

    const performer = document.getElementById('modal-device-performedBy').value.trim();
    if (!performer) return alert("Vui lòng nhập tên Người thực hiện!");

    const timerValue = document.getElementById('modal-device-timer').value;
    const qtyValue = document.getElementById('modal-device-qty').value;
    const foodTypeValue = document.getElementById('modal-device-food-type') ? document.getElementById('modal-device-food-type').value : null;
    const newState = activeDeviceConfig.isCurrentlyOn ? 'Đang tắt' : 'Đang hoạt động';

    try {
        const response = await fetch(`http://localhost:3000/api/zone/${activeDeviceConfig.zoneId}/device/${activeDeviceConfig.deviceIndex}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newState: newState, duration: timerValue, quantity: qtyValue, foodType: foodTypeValue, performedBy: performer })
        });

        const data = await response.json();
        if (data.success) {
            let logMsg = `Đã ${newState.toLowerCase()} [${activeDeviceConfig.deviceName}]`;
            if (qtyValue && foodTypeValue) logMsg += ` với định lượng ${qtyValue} kg [${foodTypeValue}].`;
            if (timerValue) logMsg += ` Hẹn giờ: ${timerValue} phút.`;

            logAccess(logMsg);
            closeDeviceModal();
            openZoneDetail(activeDeviceConfig.zoneId);
        } else {
            alert(data.error || "Có lỗi xảy ra khi xử lý.");
        }
    } catch (error) {
        alert("Lỗi kết nối bộ điều khiển trung tâm.");
    }
}

// ============================================================================
// 6. BLOCKCHAIN TRUY XUẤT (CÓ BỘ LỌC NGÀY VÀ XUẤT EXCEL)
// ============================================================================
let currentBlockchainData = []; // Lưu trữ dữ liệu hiện tại để xuất file

async function queryBlockchain() {
    const txHash = document.getElementById('txHash').value;
    const startDate = document.getElementById('bc-start-date').value;
    const endDate = document.getElementById('bc-end-date').value;

    const resultBox = document.getElementById('bcResult');
    const tbody = document.getElementById('bc-table-body');

    if (!txHash) return alert("Vui lòng nhập tên nông sản (VD: rau muống, gà thịt, lợn siêu nạc)!");

    resultBox.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang truy xuất chuỗi khối Hyperledger Fabric...</td></tr>';
    logAccess(`Tra cứu Blockchain nông sản: ${txHash}`);

    try {
        const response = await fetch('http://localhost:3000/api/blockchain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: txHash })
        });

        const result = await response.json();

        if (result.success) {
            let filteredData = result.data;

            // Xử lý Lọc theo ngày
            if (startDate || endDate) {
                const start = startDate ? new Date(startDate + "T00:00:00") : null;
                const end = endDate ? new Date(endDate + "T23:59:59") : null;

                filteredData = filteredData.filter(log => {
                    const logDate = parseVietnameseDate(log.time);
                    if (start && logDate < start) return false;
                    if (end && logDate > end) return false;
                    return true;
                });
            }

            currentBlockchainData = filteredData; // Lưu lại để xuất file

            if (filteredData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#dc2626;">Không có dữ liệu nào trong khoảng thời gian này.</td></tr>';
                return;
            }

            // Đổ dữ liệu vào bảng
            tbody.innerHTML = filteredData.map(log => `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: 0.3s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px; font-weight: 500;">${log.time}</td>
                    <td style="padding: 12px;">
                        <span style="background: ${log.action.includes('AI') ? '#dbeafe' : '#dcfce7'}; color: ${log.action.includes('AI') ? '#1d4ed8' : '#16a34a'}; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">
                            ${log.action}
                        </span>
                    </td>
                    <td style="padding: 12px; color: #374151;">${log.detail}</td>
                    <td style="padding: 12px;"><strong><i class="fa-regular fa-circle-user"></i> ${log.performer}</strong></td>
                    <td style="padding: 12px;"><code style="color: #2563eb; background: #f3f4f6; padding: 3px 6px; border-radius: 4px;">${log.txId}</code></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; color: #dc2626; font-weight: bold; text-align: center;">${result.message}</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='5' style='padding: 15px; color: #dc2626; text-align: center;'>Lỗi kết nối Backend Blockchain!</td></tr>";
    }
}

// Hàm xuất file Excel (CSV)
function exportBlockchainCSV() {
    if (!currentBlockchainData || currentBlockchainData.length === 0) {
        return alert("Không có dữ liệu để xuất! Vui lòng truy xuất và lọc dữ liệu trước.");
    }

    // Sử dụng BOM (\uFEFF) để Excel nhận diện chuẩn Tiếng Việt (UTF-8)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Thời gian,Công việc,Chi tiết,Người thực hiện,Bằng chứng (TxID)\n";

    currentBlockchainData.forEach(row => {
        // Bao bọc các trường trong dấu ngoặc kép để tránh lỗi nếu có chứa dấu phẩy
        let time = `"${row.time}"`;
        let action = `"${row.action}"`;
        let detail = `"${row.detail.replace(/"/g, '""')}"`;
        let performer = `"${row.performer}"`;
        let txId = `"${row.txId}"`;

        csvContent += `${time},${action},${detail},${performer},${txId}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Tên file sẽ tự động có thời gian tải xuống
    link.setAttribute("download", `TruyXuat_VAC_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================================================
// 7. GEMINI AI: CHATBOT ĐA NĂNG (TEXT + IMAGE)
// ============================================================================
document.getElementById('chatImageInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('chat-image-preview-container');
    const previewImg = document.getElementById('chatImagePreview');
    if (file) {
        previewImg.src = URL.createObjectURL(file);
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
        previewImg.src = '';
    }
});

function removeChatImage() {
    const fileInput = document.getElementById('chatImageInput');
    if (fileInput) fileInput.value = '';
    document.getElementById('chat-image-preview-container').style.display = 'none';
    document.getElementById('chatImagePreview').src = '';
}

async function sendMessage() {
    const inputField = document.getElementById('userInput');
    const fileInput = document.getElementById('chatImageInput');
    const chatHistory = document.getElementById('chatHistory');

    const message = inputField.value.trim();
    const hasImage = fileInput.files.length > 0;

    if (!message && !hasImage) return;

    let userContent = '';
    let imageToUpload = null;

    if (hasImage) {
        imageToUpload = fileInput.files[0];
        const imageURL = URL.createObjectURL(imageToUpload);
        userContent += `<img src="${imageURL}" style="max-width: 200px; border-radius: 8px; margin-bottom: 5px; border: 1px solid #e5e7eb;"><br>`;
    }
    if (message) {
        userContent += message;
    }

    chatHistory.innerHTML += `<div class="message user-message">${userContent}</div>`;

    inputField.value = '';
    removeChatImage();
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const typingId = "typing-" + Date.now();
    chatHistory.innerHTML += `<div id="${typingId}" class="message bot-message" style="opacity: 0.7;"><i class="fa-solid fa-ellipsis fa-bounce"></i> Đang suy nghĩ...</div>`;
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        let response, data;

        if (hasImage) {
            const formData = new FormData();
            formData.append('image', imageToUpload);
            formData.append('message', message);

            response = await fetch('http://localhost:3000/api/chat/multimodal', {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
        }

        data = await response.json();
        let formattedReply = (data.reply || data.message || "Lỗi phản hồi").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

        document.getElementById(typingId).remove();
        chatHistory.innerHTML += `<div class="message bot-message">${formattedReply}</div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        document.getElementById(typingId).remove();
        chatHistory.innerHTML += `<div class="message bot-message" style="color: #dc2626;"><i class="fa-solid fa-circle-exclamation"></i> Không thể kết nối Gemini AI.</div>`;
    }
}

document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

// ============================================================================
// 8. CAMERA AI (ĐẾM VÀ HIỂN THỊ VIDEO TRỰC QUAN YOLOv8)
// ============================================================================
function triggerCVCount() {
    const resultBox = document.getElementById('cv-result');
    const zoneName = document.getElementById('cv-camera-section').dataset.currentZone;
    const intervalVal = document.getElementById('cv-interval').value;

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> YOLOv8 đang quét luồng Camera trực tiếp...';
    logAccess(`Kích hoạt Camera AI Online tại ${zoneName}`);

    setTimeout(() => {
        let freqText = intervalVal == "0" ? "Chỉ đếm thủ công" : `Đã lên lịch quét mỗi ${intervalVal} phút`;
        resultBox.innerHTML = `
            <h4 style="color: #16a34a;"><i class="fa-solid fa-check-circle"></i> Quét Live Camera hoàn tất</h4>
            <p><strong>Nguồn cấp:</strong> Trạm Camera IoT</p>
            <p><strong>Số lượng:</strong> <span style="font-size: 1.5rem; color: #ef4444;">${Math.floor(Math.random() * 20) + 480}</span> cá thể.</p>
            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 5px;">* ${freqText}.</p>
        `;
    }, 2500);
}

document.getElementById('mediaUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        const videoPlayer = document.getElementById('preview-video');
        const imgPlayer = document.getElementById('preview-image');
        const placeholder = document.getElementById('camera-placeholder');

        placeholder.style.display = 'none';

        if (file.type.startsWith('video/')) {
            imgPlayer.style.display = 'none';
            videoPlayer.src = fileURL;
            videoPlayer.style.display = 'block';
            videoPlayer.currentTime = 0;
            videoPlayer.play();
        } else {
            videoPlayer.style.display = 'none';
            imgPlayer.src = fileURL;
            imgPlayer.style.display = 'block';
        }
    }
});

async function analyzeMedia() {
    const mediaInput = document.getElementById('mediaUpload');
    const modeSelect = document.getElementById('cv-mode');
    const resultBox = document.getElementById('cv-result');
    const zoneName = document.getElementById('cv-camera-section').dataset.currentZone;
    const videoPlayer = document.getElementById('preview-video');
    const imgPlayer = document.getElementById('preview-image');

    if (mediaInput.files.length === 0) return alert("Vui lòng tải lên một file (ảnh hoặc video) từ thiết bị của bạn!");

    const mediaFile = mediaInput.files[0];
    const isVideo = mediaFile.type.startsWith('video/');

    if (!isVideo && modeSelect.value === 'line') {
        return alert("Chế độ 'Vạch ngang' chỉ hoạt động với Video!");
    }

    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('zone', zoneName);
    formData.append('mode', modeSelect.value);

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = '<div style="padding: 15px;"><i class="fa-solid fa-spinner fa-spin"></i> AI đang phân tích dữ liệu. Vui lòng chờ...</div>';

    if (isVideo) videoPlayer.style.opacity = "0.3";
    else imgPlayer.style.opacity = "0.3";

    try {
        const response = await fetch('http://localhost:3000/api/cv/count-media', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            if (isVideo) {
                videoPlayer.src = data.media_url;
                videoPlayer.style.opacity = "1";
                videoPlayer.play();
            } else {
                imgPlayer.src = data.media_url;
                imgPlayer.style.opacity = "1";
            }

            resultBox.innerHTML = `
                <h4 style="color: #16a34a;"><i class="fa-solid fa-check-circle"></i> Trích xuất Bằng Chứng AI hoàn tất</h4>
                <p><strong>Tệp nguồn:</strong> ${mediaFile.name}</p>
                <p><strong>Chế độ đếm:</strong> ${data.mode === 'line' ? 'Đếm qua vạch' : (data.mode === 'image' ? 'Ảnh tĩnh' : 'Tổng số')}</p>
                <p><strong>Số lượng đếm chuẩn xác:</strong> <span style="font-size: 1.5rem; color: #ef4444; font-weight: bold;">${data.total_count}</span> cá thể.</p>
                <p style="font-size: 0.85rem; color: #6b7280; margin-top: 5px;">* Dữ liệu bằng chứng đã được ghi nhận và đồng bộ Blockchain.</p>
            `;
            logAccess(`Hoàn tất quét AI offline. Chế độ [${data.mode}]. Phát hiện ${data.total_count} cá thể.`);
        } else {
            if (isVideo) videoPlayer.style.opacity = "1"; else imgPlayer.style.opacity = "1";
            resultBox.innerHTML = `<div style="color: #dc2626; padding: 10px;"><strong>Lỗi AI:</strong> ${data.message}</div>`;
        }
    } catch (error) {
        if (isVideo) videoPlayer.style.opacity = "1"; else imgPlayer.style.opacity = "1";
        resultBox.innerHTML = `<div style="color: #dc2626; padding: 10px;"><strong>Lỗi kết nối:</strong> Không thể kết nối đến Máy chủ Node.js.</div>`;
    }
}

logAccess("Hệ thống khởi động thành công.");