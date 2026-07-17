// ========================================
// HR EMPLOYEE STATE
// ========================================

let hrPositionsLoaded = false;

let isSavingHRProfile = false;


// ========================================
// MỞ HỒ SƠ NHÂN VIÊN
// ========================================

async function openHREmployeeProfile(manv) {

    try {

        await loadHRPositions();


        const profile = await apiGet(

            "hrEmployeeDetail",

            {
                manv: manv
            }

        );


        if (
            typeof profile === "string"
        ) {

            alert(profile);

            return;

        }


        fillHRProfileForm(profile);

resetContractForm();

await loadEmployeeContracts(manv);

        const panel =
            document.getElementById(
                "hrProfilePanel"
            );


        if (panel) {

            panel.style.display = "block";

            panel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }
    catch (error) {

        console.error(
            "openHREmployeeProfile:",
            error
        );


        alert(
            "Không tải được hồ sơ nhân viên."
        );

    }

}


// ========================================
// ĐÓNG HỒ SƠ
// ========================================

function closeHREmployeeProfile() {

    const panel =
        document.getElementById(
            "hrProfilePanel"
        );


    if (panel) {

        panel.style.display = "none";

    }

}


// ========================================
// LOAD CHỨC VỤ
// ========================================

async function loadHRPositions() {

    if (hrPositionsLoaded) {

        return;

    }


    const positions = await apiGet(
        "positions"
    );


    const select =
        document.getElementById(
            "hrMaChucVu"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">

            -- Chọn chức vụ --

        </option>

    `;


    positions.forEach(function(cv) {

        select.innerHTML += `

            <option value="${escapeHtml(cv.ma)}">

                ${escapeHtml(cv.ten)}

            </option>

        `;

    });


    hrPositionsLoaded = true;

}


// ========================================
// ĐỔ DỮ LIỆU VÀO FORM
// ========================================

function fillHRProfileForm(profile) {

    setHRValue(
        "hrManv",
        profile.manv
    );


    setHRValue(

        "hrEmployeeName",

        profile.manv +

        " - " +

        profile.hoten

    );

    setHRValue(
    "contractEmployeeName",
    profile.manv + " - " + profile.hoten
    );

    setHRValue(
        "hrNgaySinh",
        formatDateForInput(profile.ngaySinh)
    );


    setHRValue(
        "hrGioiTinh",
        profile.gioiTinh
    );


    setHRValue(
        "hrCCCD",
        profile.cccd
    );


    setHRValue(
        "hrNgayCapCCCD",
        formatDateForInput(profile.ngayCapCCCD)
    );


    setHRValue(
        "hrNoiCapCCCD",
        profile.noiCapCCCD
    );


    setHRValue(
        "hrDiaChi",
        profile.diaChi
    );


    setHRValue(
        "hrEmail",
        profile.email
    );


    setHRValue(
        "hrMaChucVu",
        profile.maChucVu
    );


    setHRValue(
        "hrNgayVaoLam",
        formatDateForInput(profile.ngayVaoLam)
    );


    setHRValue(
        "hrTaiKhoanNganHang",
        profile.taiKhoanNganHang
    );


    setHRValue(
        "hrTenNganHang",
        profile.tenNganHang
    );


    setHRValue(

        "hrTrangThaiNhanSu",

        profile.trangThaiNhanSu ||
        "Đang làm"

    );


    setHRValue(
        "hrAvatarURL",
        profile.avatarURL
    );


    setHRValue(
        "hrGhiChu",
        profile.ghiChu
    );

}


// ========================================
// LẤY DỮ LIỆU FORM
// ========================================

function getHRProfileFormData() {

    return {

        manv:
            getHRValue("hrManv"),

        ngaySinh:
            getHRValue("hrNgaySinh"),

        gioiTinh:
            getHRValue("hrGioiTinh"),

        cccd:
            getHRValue("hrCCCD"),

        ngayCapCCCD:
            getHRValue("hrNgayCapCCCD"),

        noiCapCCCD:
            getHRValue("hrNoiCapCCCD"),

        diaChi:
            getHRValue("hrDiaChi"),

        email:
            getHRValue("hrEmail"),

        maChucVu:
            getHRValue("hrMaChucVu"),

        ngayVaoLam:
            getHRValue("hrNgayVaoLam"),

        taiKhoanNganHang:
            getHRValue("hrTaiKhoanNganHang"),

        tenNganHang:
            getHRValue("hrTenNganHang"),

        trangThaiNhanSu:
            getHRValue("hrTrangThaiNhanSu"),

        avatarURL:
            getHRValue("hrAvatarURL"),

        ghiChu:
            getHRValue("hrGhiChu")

    };

}


// ========================================
// LƯU HỒ SƠ
// ========================================

async function saveHREmployeeProfile() {

    if (isSavingHRProfile) {

        return;

    }


    const data =
        getHRProfileFormData();


    const validationMessage =
        validateHRProfileForm(data);


    if (validationMessage) {

        alert(validationMessage);

        return;

    }


    isSavingHRProfile = true;


    setHRSaveButtonState(true);


    try {

        const result = await apiPostText(

            "updateHREmployeeProfile",

            data

        );


        if (result !== "OK") {

            alert(

                result ||

                "Không lưu được hồ sơ nhân viên."

            );

            return;

        }


        alert(
            "Cập nhật hồ sơ nhân viên thành công"
        );

    }
    catch (error) {

        console.error(
            "saveHREmployeeProfile:",
            error
        );


        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        isSavingHRProfile = false;


        setHRSaveButtonState(false);

    }

}


// ========================================
// VALIDATE FRONTEND
// ========================================

function validateHRProfileForm(data) {

    if (
        data.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(data.email)
    ) {

        return "Email không hợp lệ.";

    }


    if (
        data.cccd &&
        !/^[0-9]{9,12}$/
            .test(data.cccd)
    ) {

        return "CCCD/CMND phải gồm 9 đến 12 chữ số.";

    }


    return "";

}


// ========================================
// BUTTON STATE
// ========================================

function setHRSaveButtonState(
    loading
) {

    const button =
        document.getElementById(
            "btnSaveHRProfile"
        );


    if (!button) {

        return;

    }


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang lưu...";

        return;

    }


    if (
        button.dataset.originalText
    ) {

        button.innerHTML =
            button.dataset.originalText;

    }

}


// ========================================
// HELPER
// ========================================

function setHRValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.value =
        value || "";

}


function getHRValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


function formatDateForInput(value) {

    if (!value) {

        return "";

    }


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        return value.substring(0, 10);

    }


    const date =
        new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return "";

    }


    return date
        .toISOString()
        .substring(0, 10);

}
// ========================================
// CONTRACT STATE
// ========================================

let currentContracts = [];

let isSavingContract = false;


// ========================================
// LOAD HỢP ĐỒNG THEO NHÂN VIÊN
// ========================================

async function loadEmployeeContracts(manv) {

    try {

        currentContracts = await apiGet(

            "employeeContracts",

            {
                manv: manv
            }

        );


        renderEmployeeContracts();

    }
    catch (error) {

        console.error(
            "loadEmployeeContracts:",
            error
        );


        alert(
            "Không tải được danh sách hợp đồng."
        );

    }

}


// ========================================
// RENDER DANH SÁCH HỢP ĐỒNG
// ========================================

function renderEmployeeContracts() {

    const container =
        document.getElementById(
            "contractList"
        );


    if (!container) {

        return;

    }


    if (
        !currentContracts ||
        currentContracts.length === 0
    ) {

        container.innerHTML = `

            <p style="color:#6b7280;">

                Chưa có hợp đồng nào.

            </p>

        `;

        return;

    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>Mã HĐ</th>

                    <th>Loại hợp đồng</th>

                    <th>Hiệu lực</th>

                    <th>Hết hạn</th>

                    <th>Lương</th>

                    <th>Trạng thái</th>

                    <th>File</th>

                    <th>Thao tác</th>

                </tr>

            </thead>

            <tbody>

                ${currentContracts.map(function(hd) {

                    return `

                        <tr>

                            <td>${escapeHtml(hd.mahd)}</td>

                            <td>${escapeHtml(hd.loaiHD)}</td>

                            <td>${formatDateDisplay(hd.ngayHieuLuc)}</td>

                            <td>${formatDateDisplay(hd.ngayHetHan)}</td>

                            <td>${formatMoney(hd.luongCoBan)}</td>

                            <td>${escapeHtml(hd.trangThai)}</td>

                            <td>

                                ${
                                    hd.fileURL
                                        ? `<a href="${escapeHtml(hd.fileURL)}" target="_blank">Mở file</a>`
                                        : ""
                                }

                            </td>

                            <td>

                                <div class="action-buttons">

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-warning"
                                        onclick="editEmployeeContract('${hd.mahd}')"
                                    >
                                        ✏️ Sửa
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-secondary"
                                        onclick="expireEmployeeContract('${hd.mahd}')"
                                    >
                                        Hết hạn
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-danger"
                                        onclick="liquidateEmployeeContract('${hd.mahd}')"
                                    >
                                        Thanh lý
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}


// ========================================
// LẤY FORM HỢP ĐỒNG
// ========================================

function getContractFormData() {

    return {

        mahd:
            getHRValue("contractMaHD"),

        manv:
            getHRValue("hrManv"),

        loaiHD:
            getHRValue("contractLoaiHD"),

        ngayKy:
            getHRValue("contractNgayKy"),

        ngayHieuLuc:
            getHRValue("contractNgayHieuLuc"),

        ngayHetHan:
            getHRValue("contractNgayHetHan"),

        luongCoBan:
            getHRValue("contractLuongCoBan"),

        phuCap:
            getHRValue("contractPhuCap"),
        hinhThucLuong:
    getHRValue("contractHinhThucLuong"),

luongDongBH:
    getHRValue("contractLuongDongBH"),

coDongBH:
    getHRValue("contractCoDongBH"),

thuongMacDinh:
    getHRValue("contractThuongMacDinh"),

khauTruMacDinh:
    getHRValue("contractKhauTruMacDinh"),
        trangThai:
            getHRValue("contractTrangThai"),

        fileURL:
            getHRValue("contractFileURL"),

        ghiChu:
            getHRValue("contractGhiChu")

    };

}


// ========================================
// LƯU HỢP ĐỒNG
// ========================================

async function saveEmployeeContract() {

    if (isSavingContract) {

        return;

    }


    const data =
        getContractFormData();


    const validationMessage =
        validateContractForm(data);


    if (validationMessage) {

        alert(validationMessage);

        return;

    }


    const action =
        data.mahd
            ? "updateEmployeeContract"
            : "addEmployeeContract";


    isSavingContract = true;


    setContractSaveButtonState(true);


    try {

        const result = await apiPostText(

            action,

            data

        );


        if (result !== "OK") {

            alert(

                result ||

                "Không lưu được hợp đồng."

            );

            return;

        }


        alert(
            "Lưu hợp đồng thành công"
        );


        resetContractForm();


        await loadEmployeeContracts(
            data.manv
        );

    }
    catch (error) {

        console.error(
            "saveEmployeeContract:",
            error
        );


        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        isSavingContract = false;


        setContractSaveButtonState(false);

    }

}


// ========================================
// VALIDATE HỢP ĐỒNG
// ========================================

function validateContractForm(data) {

    if (!data.manv) {

        return "Thiếu nhân viên.";

    }


    if (!data.loaiHD) {

        return "Vui lòng chọn loại hợp đồng.";

    }


    if (!data.ngayKy) {

        return "Vui lòng nhập ngày ký.";

    }


    if (!data.ngayHieuLuc) {

        return "Vui lòng nhập ngày hiệu lực.";

    }


    return "";

}


// ========================================
// SỬA HỢP ĐỒNG
// ========================================

function editEmployeeContract(mahd) {

    const contract =
        currentContracts.find(function(item) {

            return item.mahd === mahd;

        });


    if (!contract) {

        alert(
            "Không tìm thấy hợp đồng."
        );

        return;

    }


    setHRValue(
        "contractMaHD",
        contract.mahd
    );


    setHRValue(
        "contractLoaiHD",
        contract.loaiHD
    );


    setHRValue(
        "contractNgayKy",
        formatDateForInput(contract.ngayKy)
    );


    setHRValue(
        "contractNgayHieuLuc",
        formatDateForInput(contract.ngayHieuLuc)
    );


    setHRValue(
        "contractNgayHetHan",
        formatDateForInput(contract.ngayHetHan)
    );


    setHRValue(
        "contractLuongCoBan",
        contract.luongCoBan
    );


    setHRValue(
        "contractPhuCap",
        contract.phuCap
    );

    setHRValue(
    "contractHinhThucLuong",
    contract.hinhThucLuong || "LuongThang"
);

setHRValue(
    "contractLuongDongBH",
    contract.luongDongBH
);

setHRValue(
    "contractCoDongBH",
    contract.coDongBH || "Không"
);

setHRValue(
    "contractThuongMacDinh",
    contract.thuongMacDinh || 0
);

setHRValue(
    "contractKhauTruMacDinh",
    contract.khauTruMacDinh || 0
);

    setHRValue(
        "contractTrangThai",
        contract.trangThai
    );


    setHRValue(
        "contractFileURL",
        contract.fileURL
    );


    setHRValue(
        "contractGhiChu",
        contract.ghiChu
    );


    const button =
        document.getElementById(
            "btnSaveContract"
        );


    if (button) {

        button.innerHTML =
            "💾 Cập nhật hợp đồng";

    }

}


// ========================================
// RESET FORM HỢP ĐỒNG
// ========================================

function resetContractForm() {

    const ids = [

        "contractMaHD",

        "contractLoaiHD",

        "contractNgayKy",

        "contractNgayHieuLuc",

        "contractNgayHetHan",

        "contractLuongCoBan",

        "contractPhuCap",

        "contractFileURL",

        "contractGhiChu",

        "contractLuongDongBH",
"contractThuongMacDinh",
"contractKhauTruMacDinh"
        

    ];


    ids.forEach(function(id) {

        setHRValue(
            id,
            ""
        );

    });


    setHRValue(
        "contractTrangThai",
        "Hiệu lực"
    );
setHRValue(
    "contractHinhThucLuong",
    "LuongThang"
);

setHRValue(
    "contractCoDongBH",
    "Không"
);

setHRValue(
    "contractThuongMacDinh",
    "0"
);

setHRValue(
    "contractKhauTruMacDinh",
    "0"
);

    const button =
        document.getElementById(
            "btnSaveContract"
        );


    if (button) {

        button.innerHTML =
            "💾 Lưu hợp đồng";

    }

}


// ========================================
// CẬP NHẬT TRẠNG THÁI HỢP ĐỒNG
// ========================================

async function expireEmployeeContract(mahd) {

    await updateContractStatus(

        mahd,

        "Hết hạn"

    );

}


async function liquidateEmployeeContract(mahd) {

    const ok = confirm(

        "Xác nhận thanh lý hợp đồng này?"

    );


    if (!ok) {

        return;

    }


    await updateContractStatus(

        mahd,

        "Đã thanh lý"

    );

}


async function updateContractStatus(

    mahd,

    trangThai

) {

    const manv =
        getHRValue("hrManv");


    const result = await apiPostText(

        "updateEmployeeContractStatus",

        {
            mahd: mahd,
            trangThai: trangThai
        }

    );


    if (result !== "OK") {

        alert(result);

        return;

    }


    await loadEmployeeContracts(
        manv
    );

}


// ========================================
// BUTTON STATE HỢP ĐỒNG
// ========================================

function setContractSaveButtonState(
    loading
) {

    const button =
        document.getElementById(
            "btnSaveContract"
        );


    if (!button) {

        return;

    }


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang lưu...";

        return;

    }


    if (
        button.dataset.originalText
    ) {

        button.innerHTML =
            button.dataset.originalText;

    }

}


// ========================================
// FORMAT HELPER
// ========================================

function formatDateDisplay(value) {

    const input =
        formatDateForInput(value);


    if (!input) {

        return "";

    }


    const parts =
        input.split("-");


    return parts[2] +

        "/" +

        parts[1] +

        "/" +

        parts[0];

}


function formatMoney(value) {

    const numberValue =
        Number(value || 0);


    if (!numberValue) {

        return "";

    }


    return numberValue.toLocaleString(
        "vi-VN"
    );

}