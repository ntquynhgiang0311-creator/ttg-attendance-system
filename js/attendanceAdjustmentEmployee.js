// ========================================
// EMPLOYEE ATTENDANCE ADJUSTMENT STATE
// ========================================

let isSubmittingAdjustment = false;


// ========================================
// INIT
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initAttendanceAdjustmentEmployee
);


async function initAttendanceAdjustmentEmployee() {

    const form =
        document.getElementById(
            "adjustmentMaCT"
        );

    if (!form) {

        return;

    }

    const user =
        getCurrentUser();

    if (!user) {

        return;

    }

    setTodayAdjustmentDate();

    await loadAdjustmentSites();

    await loadMyAttendanceAdjustments();

}


// ========================================
// SET TODAY
// ========================================

function setTodayAdjustmentDate() {

    const input =
        document.getElementById(
            "adjustmentNgayChamCong"
        );

    if (!input) {

        return;

    }

    const today =
        new Date();

    const yyyy =
        today.getFullYear();

    const mm =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const dd =
        String(today.getDate())
            .padStart(2, "0");

    input.value =
        yyyy + "-" + mm + "-" + dd;

}

// ========================================
// LOAD ĐỊA ĐIỂM
// ========================================

async function loadAdjustmentSites() {

    const select =
        document.getElementById(
            "adjustmentMaCT"
        );

    if (!select) {

        return;

    }

    try {

        const sites =
            await apiGet("sites");

        select.innerHTML =
            `<option value="">-- Chọn địa điểm --</option>`;

        sites.forEach(function(site) {

            select.innerHTML += `

                <option value="${escapeHtml(site.ma)}">

                    ${escapeHtml(site.ma)} - ${escapeHtml(site.ten)}

                </option>

            `;

        });

    }
    catch (error) {

        console.error(
            "loadAdjustmentSites:",
            error
        );

    }

}


// ========================================
// SUBMIT
// ========================================

async function submitAttendanceAdjustment() {

    if (isSubmittingAdjustment) {

        return;

    }

    const user =
        getCurrentUser();

    if (!user) {

        alert(
            "Vui lòng đăng nhập lại."
        );

        window.location.href =
            "login.html";

        return;

    }

    const data = {

        manv:
            user.manv,

        ngayChamCong:
            getAdjustmentValue(
                "adjustmentNgayChamCong"
            ),

        mact:
            getAdjustmentValue(
                "adjustmentMaCT"
            ),

        gioVao:
            getAdjustmentValue(
                "adjustmentGioVao"
            ),

        gioRa:
            getAdjustmentValue(
                "adjustmentGioRa"
            ),

        lyDo:
            getAdjustmentValue(
                "adjustmentLyDo"
            )

    };

    const validation =
        validateAttendanceAdjustmentForm(
            data
        );

    if (validation) {

        alert(validation);

        return;

    }

    const ok = confirm(
        "Xác nhận gửi đơn chấm công bù?"
    );

    if (!ok) {

        return;

    }

    isSubmittingAdjustment = true;

    setAdjustmentButtonState(true);

    try {

        const result =
            await apiPostText(
                "addAttendanceAdjustmentRequest",
                data
            );

        if (result !== "OK") {

            alert(
                result ||
                "Không gửi được đơn chấm công bù."
            );

            return;

        }

        alert(
            "Đã gửi đơn chấm công bù. Vui lòng chờ Admin duyệt trong ngày."
        );

        resetAttendanceAdjustmentForm();

        await loadMyAttendanceAdjustments();

    }
    catch (error) {

        console.error(
            "submitAttendanceAdjustment:",
            error
        );

        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        isSubmittingAdjustment = false;

        setAdjustmentButtonState(false);

    }

}


// ========================================
// LOAD MY REQUESTS
// ========================================

async function loadMyAttendanceAdjustments() {

    const user =
        getCurrentUser();

    if (!user || !user.manv) {

        return;

    }

    try {

        const list =
            await apiGet(
                "employeeAttendanceAdjustmentRequests",
                {
                    manv: user.manv
                }
            );

        renderMyAttendanceAdjustments(list);

    }
    catch (error) {

        console.error(
            "loadMyAttendanceAdjustments:",
            error
        );

    }

}


// ========================================
// RENDER MY REQUESTS
// ========================================

function renderMyAttendanceAdjustments(list) {

    const container =
        document.getElementById(
            "employeeAdjustmentList"
        );

    if (!container) {

        return;

    }

    if (!list || list.length === 0) {

        container.innerHTML = `
            <p style="color:#6b7280;">
                Chưa có đơn chấm công bù nào.
            </p>
        `;

        return;

    }

    container.innerHTML = `

        <div class="adjustment-table-scroll">

            <table>

                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Ngày</th>
                        <th>Địa điểm</th>
                        <th>Giờ vào</th>
                        <th>Giờ ra</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>

                <tbody>

                    ${list.map(function(item) {

                        return `

                            <tr>
                                <td>${escapeHtml(item.maDon)}</td>
                                <td>${formatAdjustmentDate(item.ngayChamCong)}</td>
                                <td>${escapeHtml(item.tenct || item.mact)}</td>
                                <td>${escapeHtml(item.gioVao)}</td>
                                <td>${escapeHtml(item.gioRa)}</td>
                                <td>${renderAdjustmentStatus(item.trangThai)}</td>
                            </tr>

                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ========================================
// VALIDATE
// ========================================

function validateAttendanceAdjustmentForm(data) {

    if (!data.manv) {

        return "Thiếu mã nhân viên. Vui lòng đăng nhập lại.";

    }

    if (!data.ngayChamCong) {

        return "Thiếu ngày chấm công.";

    }

    if (!data.mact) {

        return "Vui lòng chọn địa điểm.";

    }

    if (
        !data.gioVao &&
        !data.gioRa
    ) {

        return "Vui lòng nhập giờ vào hoặc giờ ra cần bù.";

    }

    if (
        data.gioVao &&
        data.gioRa &&
        data.gioRa <= data.gioVao
    ) {

        return "Giờ ra phải lớn hơn giờ vào.";

    }

    if (!data.lyDo) {

        return "Vui lòng nhập lý do.";

    }

    return "";

}


// ========================================
// RESET
// ========================================

function resetAttendanceAdjustmentForm() {

    setAdjustmentValue(
        "adjustmentMaCT",
        ""
    );

    setAdjustmentValue(
        "adjustmentGioVao",
        ""
    );

    setAdjustmentValue(
        "adjustmentGioRa",
        ""
    );

    setAdjustmentValue(
        "adjustmentLyDo",
        ""
    );

    setTodayAdjustmentDate();

}


// ========================================
// BUTTON STATE
// ========================================

function setAdjustmentButtonState(loading) {

    const button =
        document.getElementById(
            "btnSubmitAdjustment"
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

function getAdjustmentValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";

    }

    return String(
        element.value || ""
    ).trim();

}


function setAdjustmentValue(
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


function formatAdjustmentDate(value) {

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


function renderAdjustmentStatus(status) {

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