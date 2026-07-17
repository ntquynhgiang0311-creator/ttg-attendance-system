// ========================================
// ADVANCE ADMIN STATE
// ========================================

let advanceAdminLoaded = false;

let advanceAdminList = [];


// ========================================
// INIT ADVANCE ADMIN
// ========================================

async function loadAdvanceAdmin() {

    if (advanceAdminLoaded) {

        return;

    }

    initAdvanceMonthYear();

    await loadAdvanceRequests();

    advanceAdminLoaded = true;

}


// ========================================
// INIT THÁNG / NĂM
// ========================================

function initAdvanceMonthYear() {

    const monthSelect =
        document.getElementById("advanceFilterMonth");

    const yearSelect =
        document.getElementById("advanceFilterYear");

    const currentMonth =
        new Date().getMonth() + 1;

    const currentYear =
        new Date().getFullYear();

    if (monthSelect) {

        monthSelect.innerHTML = `
            <option value="">Tất cả tháng</option>
        `;

        for (let i = 1; i <= 12; i++) {

            monthSelect.innerHTML += `

                <option value="${i}" ${i === currentMonth ? "selected" : ""}>

                    Tháng ${i}

                </option>

            `;

        }

    }

    if (yearSelect) {

        yearSelect.innerHTML = `
            <option value="">Tất cả năm</option>
        `;

        for (
            let year = currentYear - 1;
            year <= currentYear + 1;
            year++
        ) {

            yearSelect.innerHTML += `

                <option value="${year}" ${year === currentYear ? "selected" : ""}>

                    ${year}

                </option>

            `;

        }

    }

}


// ========================================
// LOAD DANH SÁCH TẠM ỨNG
// ========================================

async function loadAdvanceRequests() {

    try {

        const status =
            document.getElementById("advanceFilterStatus")?.value || "";

        const keyword =
            document.getElementById("advanceSearchKeyword")?.value || "";

        const month =
            document.getElementById("advanceFilterMonth")?.value || "";

        const year =
            document.getElementById("advanceFilterYear")?.value || "";


        advanceAdminList = await apiGet(
            "advanceRequests",
            {
                status: status,
                keyword: keyword,
                month: month,
                year: year
            }
        );


        renderAdvanceRequests();

    }
    catch (error) {

        console.error(
            "loadAdvanceRequests:",
            error
        );

        alert(
            "Không tải được danh sách tạm ứng."
        );

    }

}


// ========================================
// RENDER DANH SÁCH
// ========================================

function renderAdvanceRequests() {

    const container =
        document.getElementById("advanceAdminList");


    if (!container) {

        return;

    }


    if (
        !advanceAdminList ||
        advanceAdminList.length === 0
    ) {

        container.innerHTML =
            `<p>Không có đề nghị tạm ứng phù hợp.</p>`;

        return;

    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>Mã TU</th>

                    <th>Nhân viên</th>

                    <th>Phòng ban</th>

                    <th>Ngày</th>

                    <th>Số tiền</th>

                    <th>Lý do</th>

                    <th>Trạng thái</th>

                    <th>Duyệt</th>

                </tr>

            </thead>

            <tbody>

                ${advanceAdminList.map(function(item) {

                    return `

                        <tr>

                            <td>${escapeHtml(item.maTU)}</td>

                            <td>
                                ${escapeHtml(item.manv)}
                                -
                                ${escapeHtml(item.hoten)}
                            </td>

                            <td>${escapeHtml(item.pb)}</td>

                            <td>${formatAdvanceAdminDate(item.ngayTamUng)}</td>

                            <td>${formatAdvanceAdminMoney(item.soTien)}</td>

                            <td>${escapeHtml(item.lyDo)}</td>

                            <td>
                                ${renderAdvanceAdminStatus(item.trangThai)}
                            </td>

                            <td>
                                ${renderAdvanceActions(item)}
                            </td>

                        </tr>

                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}


// ========================================
// RENDER TRẠNG THÁI
// ========================================

function renderAdvanceAdminStatus(status) {

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


// ========================================
// RENDER NÚT DUYỆT
// ========================================

function renderAdvanceActions(item) {

    if (item.trangThai !== "Chờ duyệt") {

        return `

            <small>

                ${escapeHtml(item.nguoiDuyet || "")}

                ${item.ngayDuyet ? "<br>" + formatAdvanceAdminDateTime(item.ngayDuyet) : ""}

            </small>

        `;

    }


    return `

        <div class="action-buttons">

            <button
                type="button"
                class="btn btn-sm btn-primary"
                onclick="approveAdvanceRequest('${item.maTU}')"
            >
                ✅ Duyệt
            </button>

            <button
                type="button"
                class="btn btn-sm btn-danger"
                onclick="rejectAdvanceRequest('${item.maTU}')"
            >
                ❌ Từ chối
            </button>

        </div>

    `;

}


// ========================================
// DUYỆT TẠM ỨNG
// ========================================

async function approveAdvanceRequest(maTU) {

    const ok = confirm(
        "Xác nhận duyệt đề nghị tạm ứng này?"
    );


    if (!ok) {

        return;

    }


    await updateAdvanceStatus(
        maTU,
        "Đã duyệt",
        "Đồng ý"
    );

}


// ========================================
// TỪ CHỐI TẠM ỨNG
// ========================================

async function rejectAdvanceRequest(maTU) {

    const reason = prompt(
        "Nhập lý do từ chối:"
    );


    if (reason === null) {

        return;

    }


    await updateAdvanceStatus(
        maTU,
        "Từ chối",
        reason || "Không duyệt"
    );

}


// ========================================
// UPDATE TRẠNG THÁI
// ========================================

async function updateAdvanceStatus(
    maTU,
    trangThai,
    ghiChuDuyet
) {

    try {

        const user =
            getCurrentUser() || {};


        const result = await apiPostText(
            "updateAdvanceRequestStatus",
            {
                maTU: maTU,
                trangThai: trangThai,
                approverManv: user.manv,
                ghiChuDuyet: ghiChuDuyet
            }
        );


        if (result !== "OK") {

            alert(result);

            return;

        }


        alert(
            "Cập nhật đề nghị tạm ứng thành công"
        );


        await loadAdvanceRequests();

    }
    catch (error) {

        console.error(
            "updateAdvanceStatus:",
            error
        );

        alert(
            "Không cập nhật được đề nghị tạm ứng."
        );

    }

}


// ========================================
// FORMAT HELPER
// ========================================

function formatAdvanceAdminDate(value) {

    if (!value) {

        return "";

    }


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        const parts =
            value.substring(0, 10).split("-");

        return parts[2] + "/" + parts[1] + "/" + parts[0];

    }


    const date =
        new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return "";

    }


    return date.toLocaleDateString("vi-VN");

}


function formatAdvanceAdminDateTime(value) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return "";

    }


    return date.toLocaleString("vi-VN");

}


function formatAdvanceAdminMoney(value) {

    const numberValue =
        Number(value || 0);


    if (!numberValue) {

        return "";

    }


    return numberValue.toLocaleString("vi-VN") + " đ";

}