const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Gateway, Wallets } = require('fabric-network'); // Thư viện Fabric SDK

// ============================================================================
// KHỞI TẠO GEMINI AI
// ============================================================================
const genAI = new GoogleGenerativeAI("AIzaSyDpAuXfUHvAfy5oYeVIlV8ydGXuF08A8t8");

const app = express();
app.use(cors());
app.use(express.json());

// Cho phép Frontend truy cập trực tiếp vào thư mục chứa video đã xử lý
app.use('/video_outputs', express.static(path.join(__dirname, 'temp_uploads')));

const upload = multer({ dest: path.join(__dirname, 'temp_uploads/') });

// ============================================================================
// HÀM LẤY THỜI GIAN THỰC
// ============================================================================
function getRealTimeStr(offsetMinutes = 0) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - offsetMinutes);
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ============================================================================
// 1. MOCK DATA: CƠ SỞ DỮ LIỆU TRANG TRẠI V.A.C
// ============================================================================
const zoneDetails = {
    "vuon_raumuong": { title: "Vườn Rau Muống", icon: "fa-seedling", color: "green", stats: [{ label: "Nhiệt độ", value: "28°C", status: "good" }, { label: "Độ ẩm", value: "80%", status: "good" }, { label: "pH Đất", value: "6.5", status: "good" }], devices: [{ name: "Máy bơm tưới", state: "Đang tắt" }], crops: "Rau muống nước", farmLogs: [] },
    "vuon_bapcai": { title: "Vườn Bắp Cải", icon: "fa-leaf", color: "green", stats: [{ label: "Nhiệt độ", value: "24°C", status: "good" }, { label: "Độ ẩm", value: "65%", status: "good" }, { label: "pH Đất", value: "6.8", status: "good" }], devices: [{ name: "Tưới nhỏ giọt", state: "Đang hoạt động" }], crops: "Bắp cải cuộn", farmLogs: [] },
    "vuon_carot": { title: "Vườn Cà Rốt", icon: "fa-carrot", color: "orange", stats: [{ label: "Nhiệt độ", value: "22°C", status: "good" }, { label: "Độ ẩm", value: "50%", status: "warning" }, { label: "pH Đất", value: "6.0", status: "good" }], devices: [{ name: "Máy bơm phun sương", state: "Đang tắt" }], crops: "Cà rốt giống Nhật", farmLogs: [] },
    "vuon_suhao": { title: "Vườn Su Hào", icon: "fa-spa", color: "green", stats: [{ label: "Nhiệt độ", value: "25°C", status: "good" }, { label: "Độ ẩm", value: "60%", status: "good" }, { label: "pH Đất", value: "6.5", status: "good" }], devices: [{ name: "Tưới tự động", state: "Đang tắt" }], crops: "Su hào tím", farmLogs: [] },
    "ao_tom": { title: "Ao Nuôi Tôm", icon: "fa-shrimp", color: "blue", foodInventory: { "Cám tôm công nghiệp": 300, "Cám sinh học": 200 }, stats: [{ label: "Nhiệt độ nước", value: "28°C", status: "good" }, { label: "Oxy (DO)", value: "5.5 mg/L", status: "good" }, { label: "Độ pH nước", value: "7.8", status: "good" }], devices: [{ name: "Quạt nước (Sục khí)", state: "Đang hoạt động" }, { name: "Hệ thống cho ăn tự động", state: "Đang tắt" }], crops: "Tôm thẻ chân trắng", farmLogs: [] },
    "ao_ca": { title: "Ao Nuôi Cá", icon: "fa-fish", color: "blue", foodInventory: { "Cám cá có vảy": 800 }, stats: [{ label: "Nhiệt độ nước", value: "26°C", status: "good" }, { label: "Oxy (DO)", value: "4.0 mg/L", status: "warning" }, { label: "Độ pH nước", value: "7.2", status: "good" }], devices: [{ name: "Máy sục khí Oxy", state: "Đang tắt" }, { name: "Hệ thống cho ăn tự động", state: "Đang tắt" }], crops: "Cá chép, Cá trắm", farmLogs: [] },
    "chuong_ga": { title: "Chuồng Gà", icon: "fa-kiwi-bird", color: "orange", foodInventory: { "Cám ngô xay": 150, "Cám cò Cargill": 150 }, stats: [{ label: "Nhiệt độ", value: "30°C", status: "good" }, { label: "Độ ẩm", value: "65%", status: "good" }], devices: [{ name: "Quạt thông gió", state: "Đang hoạt động" }, { name: "Hệ thống cho ăn", state: "Đang tắt" }, { name: "Băng tải dọn phân", state: "Đang tắt" }], crops: "Gà thịt (Giống lai chọi)", has_cv_camera: true, farmLogs: [] },
    "chuong_bo": { title: "Chuồng Bò", icon: "fa-cow", color: "orange", foodInventory: { "Cỏ voi ủ chua": 1000, "Cám tổng hợp": 500 }, stats: [{ label: "Nhiệt độ", value: "28°C", status: "good" }, { label: "Độ ẩm", value: "70%", status: "good" }], devices: [{ name: "Phun sương làm mát", state: "Đang tắt" }, { name: "Máy rải thức ăn", state: "Đang tắt" }, { name: "Máy cạp phân tự động", state: "Đang tắt" }], crops: "Bò thịt (3B)", has_cv_camera: true, farmLogs: [] },
    "chuong_lon": { title: "Chuồng Lợn", icon: "fa-piggy-bank", color: "orange", foodInventory: { "Cám heo siêu nạc": 600 }, stats: [{ label: "Nhiệt độ", value: "27°C", status: "good" }, { label: "Độ ẩm", value: "75%", status: "good" }], devices: [{ name: "Hệ thống tắm mát", state: "Đang tắt" }, { name: "Hệ thống bơm cám", state: "Đang tắt" }, { name: "Hệ thống xịt rửa chuồng", state: "Đang tắt" }], crops: "Lợn siêu nạc", has_cv_camera: true, farmLogs: [] }
};

// ============================================================================
// HỆ THỐNG BLOCKCHAIN HYPERLEDGER FABRIC (REAL-TIME + FALLBACK)
// ============================================================================

// Hàm kết nối tới mạng lưới Fabric (Gateway)
async function getFabricContract() {
    try {
        const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-org1.json');

        // Nếu chưa cấu hình mạng thật, hệ thống sẽ tự động dùng Dữ liệu giả lập (Fallback)
        if (!fs.existsSync(ccpPath)) {
            throw new Error("Chưa tìm thấy cấu hình Fabric Network. Đang dùng chế độ giả lập.");
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser', // Tài khoản đại diện cho Backend
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('vacledger');
        return { contract, gateway };
    } catch (error) {
        return null; // Chuyển sang chế độ giả lập nếu chưa có mạng thật
    }
}

// BIẾN LƯU TRỮ GIẢ LẬP BLOCKCHAIN ĐÃ ĐƯỢC CHUẨN HÓA CẤU TRÚC
const fallbackLedger = {
    "gà thịt (giống lai chọi)": [
        { time: getRealTimeStr(15), action: "Farm Log", detail: "Xác nhận kiểm tra chất lượng", performer: "Nguyễn Văn A", txId: "0x8f4a2b3491b..." },
        { time: getRealTimeStr(120), action: "IoT Sensor", detail: "Mức khí NH3 ổn định 15ppm", performer: "Hệ thống tự động", txId: "0x7c8a9b125e2..." }
    ],
    "lợn siêu nạc": [
        { time: getRealTimeStr(10), action: "Farm Log", detail: "Xuất bán 100 con cho đối tác thương mại", performer: "Ban Quản lý", txId: "0x1f2a3c778f9..." }
    ],
    "bò thịt (3b)": [
        { time: getRealTimeStr(30), action: "Farm Log", detail: "Rải thức ăn tự động: Cỏ voi ủ chua trộn cám", performer: "Máy thực hiện", txId: "0x3d9e8b221a5..." }
    ],
    "tôm thẻ chân trắng": [
        { time: getRealTimeStr(5), action: "Farm Log", detail: "Cho tôm ăn cám công nghiệp 10kg", performer: "Trần Thị B", txId: "0x9c8b7a441c0..." },
        { time: getRealTimeStr(60), action: "AI Vision", detail: "Đàn tôm sinh trưởng đều, không có dấu hiệu đục cơ", performer: "Camera ngầm", txId: "0x2a3b4c990d1..." }
    ]
};

// Hàm ghi dữ liệu lên Fabric hoặc Fallback Ledger
async function recordToBlockchain(cropName, type, detail) {
    if (!cropName) return;

    // Thuật toán tách "Người thực hiện" ra khỏi chuỗi "detail" gốc
    let extractedPerformer = "Hệ thống tự động";
    let extractedDetail = detail;
    const splitKeywords = ["Người thực hiện:", "Người kiểm tra:", "Người cho ăn:"];

    for (let kw of splitKeywords) {
        if (detail.includes(kw)) {
            const parts = detail.split(kw);
            extractedDetail = parts[0].trim().replace(/\.$/, ''); // Xóa dấu chấm thừa
            extractedPerformer = parts[1].trim();
            break;
        }
    }

    const fabric = await getFabricContract();

    if (fabric) {
        try {
            console.log(`Đang gửi giao dịch lên Fabric cho [${cropName}]...`);
            await fabric.contract.submitTransaction('addLog', cropName, type, extractedDetail, extractedPerformer);
            fabric.gateway.disconnect();
        } catch (error) {
            console.error("Lỗi khi ghi lên Fabric:", error);
        }
    } else {
        const key = cropName.toLowerCase().trim();
        if (!fallbackLedger[key]) fallbackLedger[key] = [];
        const txHash = "0x" + Math.random().toString(16).substr(2, 10) + Date.now().toString(16).substr(-4);

        fallbackLedger[key].unshift({
            time: getRealTimeStr(0),
            action: type,
            detail: extractedDetail,
            performer: extractedPerformer,
            txId: txHash
        });
        console.log(`[Giả lập Fabric] Đã lưu log cho: ${cropName}`);
    }
}

// ============================================================================
// 2. API QUẢN LÝ DỮ LIỆU & ĐIỀU KHIỂN
// ============================================================================
app.get('/api/zone/:id', (req, res) => {
    const zoneId = req.params.id;
    if (zoneDetails[zoneId]) {
        let responseData = JSON.parse(JSON.stringify(zoneDetails[zoneId]));
        if (responseData.foodInventory) {
            for (let [type, qty] of Object.entries(responseData.foodInventory)) {
                responseData.stats.push({ label: `Tồn kho: ${type}`, value: `${qty} kg`, status: qty > 100 ? "good" : "warning" });
            }
        }
        res.json(responseData);
    } else {
        res.status(404).json({ error: "Không tìm thấy" });
    }
});

app.post('/api/zone/:id/log', (req, res) => {
    const zone = zoneDetails[req.params.id];
    if (zone) {
        zone.farmLogs.unshift(req.body);
        recordToBlockchain(zone.crops, "Farm Log", req.body.detail);
        res.json({ success: true });
    } else res.status(404).json({ error: "Lỗi" });
});

app.post('/api/zone/:id/replenish', (req, res) => {
    const zoneId = req.params.id;
    const { addedQuantity, foodType, performedBy } = req.body;
    const zone = zoneDetails[zoneId];

    if (zone && zone.foodInventory !== undefined) {
        const qty = parseFloat(addedQuantity);
        let type = foodType.trim();

        const existingKey = Object.keys(zone.foodInventory).find(key => key.toLowerCase() === type.toLowerCase());
        if (existingKey) type = existingKey;
        else {
            type = type.charAt(0).toUpperCase() + type.slice(1);
            zone.foodInventory[type] = 0;
        }

        zone.foodInventory[type] += qty;

        const dateStr = getRealTimeStr(0).split(' ')[0];
        const logDetail = `Đã bổ sung ${qty} kg [${type}] vào kho. Người thực hiện: ${performedBy || "N/A"}`;

        zone.farmLogs.unshift({ date: dateStr, action: "Nhập kho", detail: logDetail });
        recordToBlockchain(zone.crops, "Farm Log", logDetail);

        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: "Khu vực này không có kho thức ăn." });
    }
});

app.post('/api/zone/:zoneId/device/:deviceIndex', (req, res) => {
    const { zoneId, deviceIndex } = req.params;
    const { newState, duration, quantity, foodType, performedBy } = req.body;
    const zone = zoneDetails[zoneId];

    if (zone && zone.devices[deviceIndex]) {
        if (quantity && zone.foodInventory !== undefined) {
            const qtyNum = parseFloat(quantity);
            const type = foodType;
            if (!type || !zone.foodInventory[type] || qtyNum > zone.foodInventory[type]) {
                return res.status(400).json({ success: false, error: `Không đủ thức ăn loại [${type || 'Không xác định'}]! Kho chỉ còn ${zone.foodInventory[type] || 0} kg.` });
            }
            zone.foodInventory[type] -= qtyNum;
        }

        zone.devices[deviceIndex].state = newState;

        const dateStr = getRealTimeStr(0).split(' ')[0];
        let actionDetail = `Đã ${newState.toLowerCase()} [${zone.devices[deviceIndex].name}]`;
        if (quantity && foodType) actionDetail += ` định lượng: ${quantity} kg [${foodType}]`;
        actionDetail += `. Người thực hiện: ${performedBy || "N/A"}`;
        if (duration) actionDetail += ` (Hẹn giờ: ${duration} phút)`;

        zone.farmLogs.unshift({ date: dateStr, action: "Điều khiển IoT", detail: actionDetail });
        recordToBlockchain(zone.crops, "IoT Sensor", actionDetail);

        res.json({ success: true, message: "Cập nhật thành công" });
    } else {
        res.status(404).json({ success: false, error: "Không tìm thấy thiết bị" });
    }
});

// CẬP NHẬT API TRUY XUẤT CHO BLOCKCHAIN TAB
app.post('/api/blockchain', async (req, res) => {
    const query = req.body.query.toLowerCase().trim();
    const fabric = await getFabricContract();

    if (fabric) {
        try {
            const resultBytes = await fabric.contract.evaluateTransaction('getLogsByCrop', query);
            const resultJson = JSON.parse(resultBytes.toString());

            if (resultJson.length > 0) {
                const formattedData = resultJson.map(item => ({
                    time: new Date(item.timestamp).toLocaleString('vi-VN'),
                    action: item.actionType,
                    detail: item.detail,
                    performer: item.author || "Hệ thống",
                    txId: item.txId
                }));
                res.json({ success: true, product: query, data: formattedData });
            } else {
                res.json({ success: false, message: "Không tìm thấy dữ liệu trên Hyperledger Fabric." });
            }
            fabric.gateway.disconnect();
        } catch (error) {
            res.status(500).json({ success: false, message: `Lỗi kết nối Fabric: ${error.message}` });
        }
    } else {
        // Truy vấn từ bộ nhớ giả lập (Fallback)
        let foundKey = Object.keys(fallbackLedger).find(key => key.includes(query) || query.includes(key));
        if (foundKey) res.json({ success: true, product: foundKey, data: fallbackLedger[foundKey] });
        else res.json({ success: false, message: "Không tìm thấy dữ liệu Sổ cái Blockchain (Simulator) cho nông sản này." });
    }
});

// ============================================================================
// 4. API CHATBOT & XỬ LÝ ẢNH (POWERED BY GEMINI)
// ============================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Bạn là Trợ lý AI chuyên gia nông nghiệp của hệ thống V.A.C Smart Farm. 
        Nhiệm vụ của bạn là tư vấn ngắn gọn, dễ hiểu, thực tế cho nông dân. 
        Câu hỏi của nông dân: "${userMsg}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Lỗi Gemini Chat:", error.message);
        res.json({ reply: `❌ Google AI phản hồi lỗi: ${error.message}` });
    }
});

app.post('/api/chat/multimodal', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, reply: "Không nhận được hình ảnh đính kèm." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let userText = req.body.message ? req.body.message.trim() : "";
        let promptText = userText !== "" ? userText : "Hãy phân tích hình ảnh này giúp tôi.";

        const prompt = `Bạn là Trợ lý AI chuyên gia nông nghiệp của hệ thống V.A.C Smart Farm.
        Dưới đây là hình ảnh do người dùng cung cấp kèm lời nhắn: "${promptText}".
        Hãy phân tích hình ảnh cẩn thận và trả lời chính xác, ngắn gọn, dễ hiểu.`;

        const imageParts = [
            {
                inlineData: {
                    data: fs.readFileSync(req.file.path).toString("base64"),
                    mimeType: req.file.mimetype
                }
            }
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;

        fs.unlinkSync(req.file.path);
        res.json({ success: true, reply: response.text() });
    } catch (error) {
        console.error("Lỗi Gemini Multimodal:", error.message);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, reply: `❌ Google AI phản hồi lỗi: ${error.message}` });
    }
});

// ============================================================================
// 5. API AI VISION: ĐẾM VÀ TRẢ VỀ VIDEO MINH BẠCH (YOLOv8)
// ============================================================================
app.post('/api/cv/count-media', upload.single('media'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Không nhận được file dữ liệu." });
    }

    const fileExt = path.extname(req.file.originalname) || (req.file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const mediaPathWithExt = path.resolve(req.file.path + fileExt);
    fs.renameSync(req.file.path, mediaPathWithExt);

    const pythonScriptPath = path.join(__dirname, '..', 'cv_module', 'count_animals.py');
    const pythonExecutable = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');

    let targetCrop = "Không xác định";
    for (let key in zoneDetails) {
        if (zoneDetails[key].title === req.body.zone) {
            targetCrop = zoneDetails[key].crops;
            break;
        }
    }

    const mode = req.body.mode || 'total';

    exec(`"${pythonExecutable}" "${pythonScriptPath}" "${mediaPathWithExt}" --mode ${mode}`, (error, stdout, stderr) => {
        fs.unlink(mediaPathWithExt, () => { });

        if (error) {
            console.error(`Lỗi thực thi Python:`, stderr);
            return res.json({ success: false, message: `Lỗi AI: ${stderr}` });
        }

        try {
            const outputLines = stdout.trim().split('\n');
            let jsonString = outputLines[outputLines.length - 1].trim();

            if (!jsonString.startsWith('{')) {
                jsonString = outputLines.find(line => line.includes('{"success"')) || jsonString;
            }

            const aiData = JSON.parse(jsonString);

            if (aiData.success) {
                recordToBlockchain(targetCrop, "AI Vision", `Quét Camera (Chế độ: ${aiData.mode}): Phát hiện chính xác ${aiData.total_count} cá thể. Kèm bằng chứng.`);

                res.json({
                    success: true,
                    total_count: aiData.total_count,
                    mode: aiData.mode,
                    media_url: `http://localhost:3000/video_outputs/${aiData.processed_file || aiData.processed_video}`
                });
            } else {
                res.json({ success: false, message: aiData.error || "Lỗi xử lý Python" });
            }
        } catch (parseError) {
            console.log("Lỗi Parse JSON:", stdout);
            res.json({ success: false, message: "Không thể đọc dữ liệu từ AI." });
        }
    });
});

app.listen(3000, () => console.log(`🤖 Backend Node.js đang chạy tại cổng 3000 (Đã tích hợp Fabric Simulator)`));