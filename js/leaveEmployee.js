// ========================================
// EMPLOYEE LEAVE STATE
// ========================================

let isSubmittingLeave = false;
let employeeLeaveTypeConfigs = [];
async function loadEmployeeLeaveTypeConfigs() {

    try {

        employeeLeaveTypeConfigs =
            await apiGet(
                "leaveTypeConfigs",
                {
                    status: "Active"
                }
            );

        renderEmployeeLeaveTypeSelect();

    } catch (error) {

        console.error("loadEmployeeLeaveTypeConfigs:", error);

    }

}


function renderEmployeeLeaveTypeSelect() {

    const select =
        document.getElementById("leaveType");

    if (!select) {

        return;

    }

    select.innerHTML =
        '<option value="">-- Chọn loại nghỉ --</option>';

    employeeLeaveTypeConfigs.forEach(function(item) {

        const label =
            item.nhomNghi === item.chiTiet
                ? item.nhomNghi
                : item.nhomNghi + " - " + item.chiTiet;

        select.innerHTML +=
            '<option value="' + escapeHtml(item.maLoai) + '">' +
                escapeHtml(label) +
            '</option>';

    });

}


function getSelectedLeaveTypeConfig() {

    const select =
        document.getElementById("leaveType");

    if (!select) {

        return null;

    }

    const value =
        select.value || "";

    if (!value) {

        return null;

    }

    return employeeLeaveTypeConfigs.find(function(item) {

        const label =
            item.nhomNghi === item.chiTiet
                ? item.nhomNghi
                : item.nhomNghi + " - " + item.chiTiet;

        return (
            item.maLoai === value ||
            item.chiTiet === value ||
            item.nhomNghi === value ||
            label === value
        );

    }) || null;

}
// ========================================
// INIT
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initEmployeeLeave
);


async function initEmployeeLeave() {

    const leaveSection =
        document.getElementById("employeeLeaveList") ||
        document.getElementById("leaveType");

    if (!leaveSection) {

        return;

    }

    const user =
        getCurrentUser();

    if (!user || !user.manv) {

        return;

    }

    await loadEmployeeLeaveTypeConfigs();

    await loadMyLeaveRequests();

}


// ========================================
// GỬI ĐƠN NGHỈ
// ========================================

async function submitLeaveRequest() {

    if (isSubmittingLeave) {

        return;

    }

    const user =
        getCurrentUser() || {};

    if (!user || !user.manv) {

        alert(
            "Vui lòng đăng nhập lại."
        );

        window.location.href =
            "login.html";

        return;

    }

    const selectedLeaveType =
        getSelectedLeaveTypeConfig();

    if (!selectedLeaveType) {

        alert(
            "Vui lòng chọn loại nghỉ."
        );

        return;

    }

    const payload = {

        manv:
            user.manv || "",

        tuNgay:
    getLeaveInputValue("leaveFromDate") ||
    getLeaveInputValue("leaveTuNgay"),

denNgay:
    getLeaveInputValue("leaveToDate") ||
    getLeaveInputValue("leaveDenNgay"),

        maLoaiNghi:
            selectedLeaveType.maLoai || "",

        loaiNghi:
            selectedLeaveType.chiTiet || "",

        nhomNghi:
            selectedLeaveType.nhomNghi || "",

        chiTietNghi:
            selectedLeaveType.chiTiet || "",

        huongLuong:
            selectedLeaveType.huongLuong || "",

        truPhepNam:
            selectedLeaveType.truPhepNam || "",

        canFileDinhKem:
            selectedLeaveType.canFileDinhKem || "",

        lyDo:
    getLeaveInputValue("leaveReason") ||
    getLeaveInputValue("leaveLyDo")

    };

    const validationMessage =
        validateLeaveForm(payload);

    if (validationMessage) {

        alert(validationMessage);

        return;

    }

    const ok =
        confirm(
            "Xác nhận gửi đơn nghỉ phép?"
        );

    if (!ok) {

        return;

    }

    isSubmittingLeave =
        true;

    setLeaveSubmitButtonState(
        true
    );

    try {

        const result =
            await apiPostText(
                "addLeaveRequest",
                payload
            );

        if (result !== "OK") {

            alert(
                result ||
                "Không gửi được đơn nghỉ phép."
            );

            return;

        }

        alert(
            "Đã gửi đơn nghỉ phép. Vui lòng chờ duyệt."
        );

        resetLeaveForm();

        await loadMyLeaveRequests();

    } catch (error) {

        console.error(
            "submitLeaveRequest:",
            error
        );

        alert(
            "Không thể kết nối hệ thống."
        );

    } finally {

        isSubmittingLeave =
            false;

        setLeaveSubmitButtonState(
            false
        );

    }

}


// ========================================
// LOAD ĐƠN CỦA NHÂN VIÊN
// ========================================

async function loadMyLeaveRequests() {

    const user =
        getCurrentUser();


    if (!user || !user.manv) {

        return;

    }


    try {

        const list = await apiGet(
            "employeeLeaveRequests",
            {
                manv: user.manv
            }
        );


        renderMyLeaveRequests(list);

    }
    catch (error) {

        console.error(
            "loadMyLeaveRequests:",
            error
        );

    }

}


// ========================================
// RENDER LỊCH SỬ ĐƠN NGHỈ
// ========================================

function renderMyLeaveRequests(list) {

    const container =
        document.getElementById(
            "employeeLeaveList"
        );


    if (!container) {

        return;

    }


    if (!list || list.length === 0) {

        container.innerHTML = `
            <p style="color:#6b7280;">
                Chưa có đơn nghỉ nào.
            </p>
        `;

        return;

    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>
                    <th>Mã đơn</th>
                    <th>Loại nghỉ</th>
                    <th>Từ ngày</th>
                    <th>Đến ngày</th>
                    <th>Số ngày</th>
                    <th>Trạng thái</th>
                </tr>

            </thead>

            <tbody>

                ${list.map(function(item) {

                    return `

                        <tr>
                            <td>${escapeHtml(item.maDon)}</td>
                            <td>${escapeHtml(item.loaiNghi)}</td>
                            <td>${formatEmployeeLeaveDate(item.tuNgay)}</td>
                            <td>${formatEmployeeLeaveDate(item.denNgay)}</td>
                            <td>${escapeHtml(item.soNgay)}</td>
                            <td>${renderEmployeeLeaveStatus(item.trangThai)}</td>
                        </tr>

                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}


// ========================================
// VALIDATE FORM
// ========================================

function validateLeaveForm(data) {

    if (!data.manv) {

        return "Thiếu mã nhân viên. Vui lòng đăng nhập lại.";

    }


    if (!data.loaiNghi) {

        return "Vui lòng chọn loại nghỉ.";

    }


    if (!data.tuNgay) {

        return "Vui lòng chọn từ ngày.";

    }


    if (!data.denNgay) {

        return "Vui lòng chọn đến ngày.";

    }


    if (
        new Date(data.denNgay).getTime() <
        new Date(data.tuNgay).getTime()
    ) {

        return "Đến ngày không được nhỏ hơn từ ngày.";

    }

    const today =
    new Date();

today.setHours(
    0,
    0,
    0,
    0
);

const tuNgay =
    new Date(
        data.tuNgay + "T00:00:00"
    );

const noticeDays =
    Math.floor(
        (
            tuNgay.getTime() -
            today.getTime()
        ) /
        (
            1000 * 60 * 60 * 24
        )
    );

if (noticeDays < 0) {

    return "Không thể tạo đơn nghỉ cho ngày đã qua.";

}

const canSubmitUrgent =
    data.nhomNghi === "Nghỉ không lương" ||
    data.nhomNghi === "Nghỉ việc riêng";

if (
    !canSubmitUrgent &&
    noticeDays < 3
) {

    return "Nghỉ phép năm phải gửi trước ít nhất 3 ngày. Nghỉ không lương và nghỉ việc riêng được phép gửi gấp.";

}


    if (!data.lyDo) {

        return "Vui lòng nhập lý do nghỉ.";

    }


    return "";

}


// ========================================
// RESET FORM
// ========================================

function resetLeaveForm() {

    setLeaveInputValue(
        "leaveType",
        ""
    );

    setLeaveInputValue(
        "leaveFromDate",
        ""
    );

    setLeaveInputValue(
        "leaveToDate",
        ""
    );

    setLeaveInputValue(
        "leaveReason",
        ""
    );

}


// ========================================
// BUTTON STATE
// ========================================

function setLeaveSubmitButtonState(loading) {

    const button =
        document.getElementById(
            "btnSubmitLeave"
        );


    if (!button) {

        return;

    }


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang gửi...";

        return;

    }


    if (button.dataset.originalText) {

        button.innerHTML =
            button.dataset.originalText;

    }

}


// ========================================
// HELPER
// ========================================

function getLeaveInputValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


function setLeaveInputValue(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.value =
        value || "";

}


function formatEmployeeLeaveDate(value) {

    if (!value) {

        return "";

    }


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        const parts =
            value.substring(0, 10)
                .split("-");


        return parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0];

    }


    const date =
        new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "vi-VN"
    );

}


function renderEmployeeLeaveStatus(status) {

    const text =
        String(status || "");


    if (text === "Chờ duyệt") {

        return `<span class="status-pending">Chờ duyệt</span>`;

    }


    if (text === "Đã duyệt") {

        return `<span class="status-active">Đã duyệt</span>`;

    }


    if (text === "Từ chối") {

        return `<span class="status-inactive">Từ chối</span>`;

    }


    return escapeHtml(text);

}
function getEmployeeLeaveTypeText(item) {

    if (!item) {

        return "";

    }

    const nhomNghi =
        item.nhomNghi || "";

    const chiTietNghi =
        item.chiTietNghi || item.loaiNghi || "";

    if (
        nhomNghi &&
        chiTietNghi &&
        nhomNghi !== chiTietNghi
    ) {

        return nhomNghi + " - " + chiTietNghi;

    }

    return chiTietNghi || nhomNghi || "";

}