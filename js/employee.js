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

        nhanVien = await apiGet(
            "employeeList"
        );

        renderNhanVien();

    }
    catch (error) {

        console.error(
            "loadNhanVien:",
            error
        );

        nhanVien = [];

        renderNhanVien();

        throw error;

    }

}


// ========================================
// RENDER DANH SÁCH NHÂN VIÊN
// ========================================

function renderNhanVien() {

    const table =
        document.getElementById(
            "tableEmployee"
        );

    if (!table) {

        return;

    }

    if (
        !Array.isArray(nhanVien) ||
        nhanVien.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Chưa có nhân viên
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML =
        nhanVien.map(function(nv) {

            const isActive =
                String(nv.status || "")
                    .toLowerCase() === "active";

            const toggleButton =
                isActive
                    ? `
                        <button
                            class="btn btn-sm btn-danger"
                            onclick="toggleEmployee('${escapeHtml(nv.manv)}')"
                        >
                            🔒 Khóa
                        </button>
                      `
                    : `
                        <button
                            class="btn btn-sm btn-primary"
                            onclick="toggleEmployee('${escapeHtml(nv.manv)}')"
                        >
                            ✅ Mở
                        </button>
                      `;

            return `
                <tr>

                    <td>
                        ${escapeHtml(nv.manv)}
                    </td>

                    <td>
                        ${escapeHtml(nv.hoten)}
                    </td>

                    <td>
                        ${escapeHtml(nv.sdt)}
                    </td>

                    <td>
                        ${escapeHtml(nv.role)}
                    </td>

                    <td>
                        ${escapeHtml(nv.pb || "")}
                    </td>

                    <td>
                        <span class="${isActive ? "active" : "inactive"}">
                            ${escapeHtml(nv.status)}
                        </span>
                    </td>

                    <td>
                        <div class="action-buttons">

                            <button
                                class="btn btn-sm btn-warning"
                                onclick="editEmployee('${escapeHtml(nv.manv)}')"
                            >
                                ✏️ Sửa
                            </button>

                            <button
                                class="btn btn-sm btn-info"
                                onclick="openHREmployeeProfile('${escapeHtml(nv.manv)}')"
                            >
                                👤 Hồ sơ
                            </button>

                            ${toggleButton}

                        </div>
                    </td>

                </tr>
            `;

        }).join("");

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