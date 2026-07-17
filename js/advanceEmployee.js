// ========================================
// EMPLOYEE ADVANCE STATE
// ========================================

let isSubmittingAdvance = false;


// ========================================
// INIT
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initEmployeeAdvance
);


async function initEmployeeAdvance() {

    const advanceForm =
        document.getElementById(
            "advanceSoTien"
        );


    if (!advanceForm) {

        return;

    }


    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    setDefaultAdvanceDate();


    await loadMyAdvanceRequests();

}


// ========================================
// SET NGÀY MẶC ĐỊNH
// ========================================

function setDefaultAdvanceDate() {

    const input =
        document.getElementById(
            "advanceNgayTamUng"
        );


    if (!input) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    input.value =
        year + "-" + month + "-" + day;

}


// ========================================
// GỬI ĐỀ NGHỊ TẠM ỨNG
// ========================================

async function submitAdvanceRequest() {

    if (isSubmittingAdvance) {

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

        ngayTamUng:
            getAdvanceInputValue(
                "advanceNgayTamUng"
            ),

        soTien:
            getAdvanceInputValue(
                "advanceSoTien"
            ),

        lyDo:
            getAdvanceInputValue(
                "advanceLyDo"
            )

    };


    const validationMessage =
        validateAdvanceForm(data);


    if (validationMessage) {

        alert(validationMessage);

        return;

    }


    const ok = confirm(
        "Xác nhận gửi đề nghị tạm ứng?"
    );


    if (!ok) {

        return;

    }


    isSubmittingAdvance = true;


    setAdvanceSubmitButtonState(true);


    try {

        const result =
            await apiPostText(
                "addAdvanceRequest",
                data
            );


        if (result !== "OK") {

            alert(
                result ||
                "Không gửi được đề nghị tạm ứng."
            );

            return;

        }


        alert(
            "Đã gửi đề nghị tạm ứng. Vui lòng chờ duyệt."
        );


        resetAdvanceForm();


        await loadMyAdvanceRequests();

    }
    catch (error) {

        console.error(
            "submitAdvanceRequest:",
            error
        );


        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        isSubmittingAdvance = false;


        setAdvanceSubmitButtonState(false);

    }

}


// ========================================
// LOAD LỊCH SỬ TẠM ỨNG CỦA NHÂN VIÊN
// ========================================

async function loadMyAdvanceRequests() {

    const user =
        getCurrentUser();


    if (!user || !user.manv) {

        return;

    }


    try {

        const list =
            await apiGet(
                "employeeAdvanceRequests",
                {
                    manv: user.manv
                }
            );


        renderMyAdvanceRequests(list);

    }
    catch (error) {

        console.error(
            "loadMyAdvanceRequests:",
            error
        );

    }

}


// ========================================
// RENDER LỊCH SỬ
// ========================================

function renderMyAdvanceRequests(list) {

    const container =
        document.getElementById(
            "employeeAdvanceList"
        );


    if (!container) {

        return;

    }


    if (!list || list.length === 0) {

        container.innerHTML = `
            <p style="color:#6b7280;">
                Chưa có đề nghị tạm ứng nào.
            </p>
        `;

        return;

    }


    container.innerHTML = `

        <div class="advance-table-scroll">

            <table>

                <thead>

                    <tr>
                        <th>Mã</th>
                        <th>Ngày</th>
                        <th>Số tiền</th>
                        <th>Lý do</th>
                        <th>Trạng thái</th>
                    </tr>

                </thead>

                <tbody>

                    ${list.map(function(item) {

                        return `

                            <tr>
                                <td>${escapeHtml(item.maTU)}</td>
                                <td>${formatAdvanceDate(item.ngayTamUng)}</td>
                                <td>${formatAdvanceMoney(item.soTien)}</td>
                                <td>${escapeHtml(item.lyDo)}</td>
                                <td>${renderAdvanceStatus(item.trangThai)}</td>
                            </tr>

                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ========================================
// VALIDATE FORM
// ========================================

function validateAdvanceForm(data) {

    if (!data.manv) {

        return "Thiếu mã nhân viên. Vui lòng đăng nhập lại.";

    }


    if (!data.ngayTamUng) {

        return "Vui lòng chọn ngày tạm ứng.";

    }


    const amount =
        Number(data.soTien || 0);


    if (
        isNaN(amount) ||
        amount <= 0
    ) {

        return "Số tiền tạm ứng phải lớn hơn 0.";

    }


    if (amount > 100000000) {

        return "Số tiền tạm ứng quá lớn, vui lòng kiểm tra lại.";

    }


    if (!data.lyDo) {

        return "Vui lòng nhập lý do tạm ứng.";

    }


    return "";

}


// ========================================
// RESET FORM
// ========================================

function resetAdvanceForm() {

    setAdvanceInputValue(
        "advanceSoTien",
        ""
    );


    setAdvanceInputValue(
        "advanceLyDo",
        ""
    );


    setDefaultAdvanceDate();

}


// ========================================
// BUTTON STATE
// ========================================

function setAdvanceSubmitButtonState(loading) {

    const button =
        document.getElementById(
            "btnSubmitAdvance"
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

function getAdvanceInputValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


function setAdvanceInputValue(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.value =
        value || "";

}


function formatAdvanceDate(value) {

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


function formatAdvanceMoney(value) {

    const numberValue =
        Number(value || 0);


    if (!numberValue) {

        return "";

    }


    return numberValue.toLocaleString(
        "vi-VN"
    ) + " đ";

}


function renderAdvanceStatus(status) {

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