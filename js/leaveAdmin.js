// ========================================
// LEAVE ADMIN STATE
// ========================================

let leaveAdminLoaded = false;

let leaveAdminList = [];


// ========================================
// INIT LEAVE ADMIN
// ========================================

async function loadLeaveAdmin() {

    if (leaveAdminLoaded) {

        return;

    }

    await loadLeaveRequests();

    leaveAdminLoaded = true;

}


// ========================================
// LOAD DANH SÁCH ĐƠN NGHỈ
// ========================================

async function loadLeaveRequests() {

    try {

        const status =
            document.getElementById("leaveFilterStatus")?.value || "";

        const keyword =
            document.getElementById("leaveSearchKeyword")?.value || "";


        leaveAdminList = await apiGet(
            "leaveRequests",
            {
                status: status,
                keyword: keyword
            }
        );


        renderLeaveRequests();

    }
    catch (error) {

        console.error(
            "loadLeaveRequests:",
            error
        );

        alert(
            "Không tải được danh sách đơn nghỉ."
        );

    }

}


// ========================================
// RENDER DANH SÁCH
// ========================================

function renderLeaveRequests() {

    const container =
        document.getElementById("leaveAdminList");


    if (!container) {

        return;

    }


    if (
        !leaveAdminList ||
        leaveAdminList.length === 0
    ) {

        container.innerHTML =
            `<p>Không có đơn nghỉ phù hợp.</p>`;

        return;

    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>Mã đơn</th>

                    <th>Nhân viên</th>

                    <th>Phòng ban</th>

                    <th>Loại nghỉ</th>

                    <th>Từ ngày</th>

                    <th>Đến ngày</th>

                    <th>Số ngày</th>

                    <th>Lý do</th>

                    <th>Trạng thái</th>

                    <th>Duyệt</th>

                </tr>

            </thead>

            <tbody>

                ${leaveAdminList.map(function(item) {

                    return `

                        <tr>

                            <td>${escapeHtml(item.maDon)}</td>

                            <td>
                                ${escapeHtml(item.manv)}
                                -
                                ${escapeHtml(item.hoten)}
                            </td>

                            <td>${escapeHtml(item.pb)}</td>

                            <td>${escapeHtml(item.loaiNghi)}</td>

                            <td>${formatLeaveDate(item.tuNgay)}</td>

                            <td>${formatLeaveDate(item.denNgay)}</td>

                            <td>${escapeHtml(item.soNgay)}</td>

                            <td>${escapeHtml(item.lyDo)}</td>

                            <td>
                                ${renderLeaveStatus(item.trangThai)}
                            </td>

                            <td>
                                ${renderLeaveActions(item)}
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

function renderLeaveStatus(status) {

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

function renderLeaveActions(item) {

    if (item.trangThai !== "Chờ duyệt") {

        return `

            <small>

                ${escapeHtml(item.nguoiDuyet || "")}

                ${item.ngayDuyet ? "<br>" + formatLeaveDateTime(item.ngayDuyet) : ""}

            </small>

        `;

    }


    return `

        <div class="action-buttons">

            <button
                type="button"
                class="btn btn-sm btn-primary"
                onclick="approveLeaveRequest('${item.maDon}')"
            >
                ✅ Duyệt
            </button>

            <button
                type="button"
                class="btn btn-sm btn-danger"
                onclick="rejectLeaveRequest('${item.maDon}')"
            >
                ❌ Từ chối
            </button>

        </div>

    `;

}


// ========================================
// DUYỆT ĐƠN
// ========================================

async function approveLeaveRequest(maDon) {

    const ok = confirm(
        "Xác nhận duyệt đơn nghỉ này?"
    );


    if (!ok) {

        return;

    }


    await updateLeaveStatus(
        maDon,
        "Đã duyệt",
        "Đồng ý"
    );

}


// ========================================
// TỪ CHỐI ĐƠN
// ========================================

async function rejectLeaveRequest(maDon) {

    const reason = prompt(
        "Nhập lý do từ chối:"
    );


    if (reason === null) {

        return;

    }


    await updateLeaveStatus(
        maDon,
        "Từ chối",
        reason || "Không duyệt"
    );

}


// ========================================
// UPDATE TRẠNG THÁI
// ========================================

async function updateLeaveStatus(
    maDon,
    trangThai,
    ghiChuDuyet
) {

    try {

        const user =
            getCurrentUser() || {};


        const result = await apiPostText(
    "updateLeaveRequestStatus",
    {
        maDon: maDon,
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
            "Cập nhật đơn nghỉ thành công"
        );


        await loadLeaveRequests();

    }
    catch (error) {

        console.error(
            "updateLeaveStatus:",
            error
        );

        alert(
            "Không cập nhật được đơn nghỉ."
        );

    }

}


// ========================================
// FORMAT HELPER
// ========================================

function formatLeaveDate(value) {

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


function formatLeaveDateTime(value) {

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