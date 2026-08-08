// ========================================
// EMPLOYEE STATE
// ========================================

let editingEmployee = null;
let nhanVien = [];
let isSavingEmployee = false;


// ========================================
// LOAD NHÂN VIÊN
// ========================================

async function loadNhanVien() {

    try {

        const data =
            await apiGet("employees");

        const list =
            Array.isArray(data)
                ? data
                : data.employees || data.data || [];

        renderNhanVien(list);

    } catch (error) {

        console.error("loadNhanVien:", error);

        const tbody =
            document.getElementById("employeeList") ||
            document.getElementById("nhanVienList");

        if (tbody) {

            tbody.innerHTML =
                '<tr><td colspan="7">Không tải được danh sách nhân viên.</td></tr>';

        }

    }

}

// ========================================
// RENDER DANH SÁCH NHÂN VIÊN
// ========================================

function renderNhanVien(list) {

    const tbody =
        document.getElementById("employeeList");

    if (!tbody) {
        console.error("Không tìm thấy tbody #employeeList");
        return;
    }

    if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7">Chưa có nhân viên</td></tr>';
        return;
    }

    let html = "";

    list.forEach(function(item) {

        const manv =
            item.manv ||
            item.maNV ||
            item.MaNV ||
            "";

        const hoten =
            item.hoten ||
            item.hoTen ||
            item.HoTen ||
            "";

        const sdt =
            item.sdt ||
            item.SDT ||
            "";

        const role =
            item.role ||
            item.Role ||
            "";

        const pb =
            item.pb ||
            item.PB ||
            "";

        const status =
            item.status ||
            item.Status ||
            "";

        html +=
            '<tr>' +
                '<td>' + escapeHtml(manv) + '</td>' +
                '<td>' + escapeHtml(hoten) + '</td>' +
                '<td>' + escapeHtml(sdt) + '</td>' +
                '<td>' + escapeHtml(role) + '</td>' +
                '<td>' + escapeHtml(pb) + '</td>' +
                '<td>' + escapeHtml(status) + '</td>' +
                '<td>' +
                    '<div class="action-buttons">' +
                        '<button type="button" class="edit-btn" onclick="openEmployeeProfile(\'' + manv + '\')">Hồ sơ</button>' +
                        '<button type="button" class="lock-btn" onclick="toggleEmployee(\'' + manv + '\')">Khóa/Mở</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';

    });

    tbody.innerHTML = html;

}

// ========================================
// LẤY DỮ LIỆU FORM
// ========================================

function getEmployeeFormData() {

    return {

        hoten:
            getEmployeeInputValue("hoten"),

        sdt:
            getEmployeeInputValue("sdt"),

        matkhau:
            getEmployeeRawValue("matkhau"),

        role:
            getEmployeeInputValue("role"),

        pb:
            getEmployeeInputValue("pb")

    };

}


// ========================================
// VALIDATE FORM
// ========================================

function validateEmployeeForm(data) {

    if (!data.hoten) {

        return "Vui lòng nhập họ tên.";

    }

    if (!data.sdt) {

        return "Vui lòng nhập số điện thoại.";

    }

    if (
        !/^[0-9]+$/.test(data.sdt)
    ) {

        return "Số điện thoại chỉ được chứa chữ số.";

    }

    if (
        data.sdt.length < 9 ||
        data.sdt.length > 11
    ) {

        return "Số điện thoại không hợp lệ.";

    }

    if (
        !editingEmployee &&
        !data.matkhau
    ) {

        return "Vui lòng nhập mật khẩu.";

    }

    if (!data.role) {

        return "Vui lòng chọn vai trò.";

    }

    if (!data.pb) {

        return "Vui lòng chọn phòng ban.";

    }

    const duplicatePhone =
        nhanVien.find(function(nv) {

            return (
                String(nv.sdt || "").trim() === data.sdt &&
                nv.manv !== editingEmployee
            );

        });

    if (duplicatePhone) {

        return (
            "Số điện thoại đã được sử dụng bởi " +
            duplicatePhone.manv +
            " - " +
            duplicatePhone.hoten
        );

    }

    return "";

}


// ========================================
// LƯU NHÂN VIÊN
// ========================================

async function luuNhanVien() {

    if (isSavingEmployee) {

        return;

    }

    const data =
        getEmployeeFormData();

    const validationMessage =
        validateEmployeeForm(data);

    if (validationMessage) {

        alert(validationMessage);

        return;

    }

    const currentUser =
        getCurrentUser() || {};

    const action =
        editingEmployee
            ? "updateEmployee"
            : "addEmployee";

    const payload = {

        manv:
            editingEmployee || "",

        hoten:
            data.hoten,

        sdt:
            data.sdt,

        matkhau:
            data.matkhau,

        role:
            data.role,

        pb:
            data.pb,

        actorManv:
            currentUser.manv || ""

    };

    isSavingEmployee = true;

    setEmployeeSaveButtonState(true);

    try {

        const result =
            await apiPostText(
                action,
                payload
            );

        if (result !== "OK") {

            alert(
                result ||
                "Không lưu được nhân viên."
            );

            return;

        }

        alert(
            editingEmployee
                ? "Cập nhật nhân viên thành công"
                : "Thêm nhân viên thành công"
        );

        resetEmployeeForm();

        await loadNhanVien();

        if (typeof loadDashboard === "function") {

            await loadDashboard();

        }

    }
    catch (error) {

        console.error(
            "luuNhanVien:",
            error
        );

        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        isSavingEmployee = false;

        setEmployeeSaveButtonState(false);

    }

}


// ========================================
// SỬA NHÂN VIÊN
// ========================================

function editEmployee(manv) {

    const nv =
        nhanVien.find(function(item) {

            return item.manv === manv;

        });

    if (!nv) {

        alert(
            "Không tìm thấy nhân viên."
        );

        return;

    }

    editingEmployee =
        nv.manv;

    setEmployeeValue(
        "hoten",
        nv.hoten || ""
    );

    setEmployeeValue(
        "sdt",
        nv.sdt || ""
    );

    setEmployeeValue(
        "matkhau",
        ""
    );

    setEmployeeValue(
        "role",
        nv.role || "User"
    );

    setEmployeeValue(
        "pb",
        nv.pb || ""
    );

    const passwordInput =
        document.getElementById(
            "matkhau"
        );

    if (passwordInput) {

        passwordInput.placeholder =
            "Để trống nếu không đổi mật khẩu";

    }

    const button =
        document.getElementById(
            "btnLuuNhanVien"
        );

    if (button) {

        button.innerHTML =
            "💾 Cập nhật nhân viên";

    }

}


// ========================================
// KHÓA / MỞ NHÂN VIÊN
// ========================================

async function toggleEmployee(manv) {

    const nv =
        nhanVien.find(function(item) {

            return item.manv === manv;

        });

    if (!nv) {

        alert(
            "Không tìm thấy nhân viên."
        );

        return;

    }

    const isActive =
        String(nv.status || "")
            .toLowerCase() === "active";

    const actionText =
        isActive
            ? "khóa"
            : "mở khóa";

    const confirmed =
        confirm(
            "Bạn có chắc muốn " +
            actionText +
            " nhân viên \"" +
            nv.hoten +
            "\"?"
        );

    if (!confirmed) {

        return;

    }

    try {

        const currentUser =
            getCurrentUser() || {};

        const result =
            await apiPostText(
                "toggleEmployee",
                {
                    manv:
                        manv,

                    actorManv:
                        currentUser.manv || ""
                }
            );

        if (result !== "OK") {

            alert(
                result ||
                "Không cập nhật được trạng thái nhân viên."
            );

            return;

        }

        await loadNhanVien();

        if (typeof loadDashboard === "function") {

            await loadDashboard();

        }

    }
    catch (error) {

        console.error(
            "toggleEmployee:",
            error
        );

        alert(
            "Không thể kết nối hệ thống."
        );

    }

}


// ========================================
// RESET FORM
// ========================================

function resetEmployeeForm() {

    editingEmployee = null;

    setEmployeeValue(
        "hoten",
        ""
    );

    setEmployeeValue(
        "sdt",
        ""
    );

    setEmployeeValue(
        "matkhau",
        ""
    );

    setEmployeeValue(
        "role",
        "User"
    );

    const pbElement =
        document.getElementById(
            "pb"
        );

    if (pbElement) {

        pbElement.selectedIndex = 0;

    }

    const matKhauElement =
        document.getElementById(
            "matkhau"
        );

    if (matKhauElement) {

        matKhauElement.placeholder =
            "Mật khẩu";

    }

    const button =
        document.getElementById(
            "btnLuuNhanVien"
        );

    if (button) {

        button.disabled = false;

        button.innerHTML =
            "💾 Lưu nhân viên";

    }

}


// ========================================
// TRẠNG THÁI NÚT LƯU
// ========================================

function setEmployeeSaveButtonState(loading) {

    const button =
        document.getElementById(
            "btnLuuNhanVien"
        );

    if (!button) {

        return;

    }

    button.disabled = loading;

    if (loading) {

        button.innerHTML =
            "Đang lưu...";

        return;

    }

    button.innerHTML =
        editingEmployee
            ? "💾 Cập nhật nhân viên"
            : "💾 Lưu nhân viên";

}


// ========================================
// LOAD PHÒNG BAN CHO FORM NHÂN VIÊN
// ========================================

async function loadEmployeeDepartments() {

    try {

        const departments =
            await apiGet(
                "departments"
            );

        const select =
            document.getElementById(
                "pb"
            );

        if (!select) {

            return;

        }

        select.innerHTML =
            departments.map(function(pb) {

                return `
                    <option value="${escapeHtml(pb.ten)}">
                        ${escapeHtml(pb.ten)}
                    </option>
                `;

            }).join("");

    }
    catch (error) {

        console.error(
            "loadEmployeeDepartments:",
            error
        );

        alert(
            "Không tải được danh sách phòng ban."
        );

    }

}


// ========================================
// HELPER
// ========================================

function getEmployeeInputValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";

    }

    return String(
        element.value || ""
    ).trim();

}


function getEmployeeRawValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";

    }

    return String(
        element.value || ""
    );

}


function setEmployeeValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.value =
        value || "";

}