let attendanceAdjustmentAdminLoaded = false;

let attendanceAdjustmentAdminList = [];


async function loadAttendanceAdjustmentAdmin() {

    if (attendanceAdjustmentAdminLoaded) {

        return;

    }

    await loadAttendanceAdjustments();

    attendanceAdjustmentAdminLoaded = true;

}


async function loadAttendanceAdjustments() {

    try {

        const status =
            document.getElementById("adjustmentFilterStatus")?.value || "";

        const keyword =
            document.getElementById("adjustmentSearchKeyword")?.value || "";

        attendanceAdjustmentAdminList =
            await apiGet(
                "attendanceAdjustmentRequests",
                {
                    status: status,
                    keyword: keyword
                }
            );

        renderAttendanceAdjustments();

    }
    catch (error) {

        console.error(
            "loadAttendanceAdjustments:",
            error
        );

        alert(
            "Không tải được đơn chấm công bù."
        );

    }

}


function renderAttendanceAdjustments() {

    const container =
        document.getElementById(
            "attendanceAdjustmentAdminList"
        );

    if (!container) {

        return;

    }

    if (
        !attendanceAdjustmentAdminList ||
        attendanceAdjustmentAdminList.length === 0
    ) {

        container.innerHTML =
            `<p>Không có đơn chấm công bù phù hợp.</p>`;

        return;

    }

    container.innerHTML = `

        <table>

            <thead>
                <tr>
                    <th>Mã đơn</th>
                    <th>Nhân viên</th>
                    <th>PB</th>
                    <th>Ngày</th>
                    <th>Địa điểm</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Duyệt</th>
                </tr>
            </thead>

            <tbody>

                ${attendanceAdjustmentAdminList.map(function(item) {

                    return `

                        <tr>
                            <td>${escapeHtml(item.maDon)}</td>

                            <td>
                                ${escapeHtml(item.manv)}
                                -
                                ${escapeHtml(item.hoten)}
                            </td>

                            <td>${escapeHtml(item.pb)}</td>

                            <td>${formatAdjustmentAdminDate(item.ngayChamCong)}</td>

                            <td>
                                ${escapeHtml(item.mact)}
                                -
                                ${escapeHtml(item.tenct)}
                            </td>

                            <td>${escapeHtml(item.gioVao)}</td>

                            <td>${escapeHtml(item.gioRa)}</td>

                            <td>${escapeHtml(item.lyDo)}</td>

                            <td>${renderAdjustmentAdminStatus(item.trangThai)}</td>

                            <td>${renderAdjustmentAdminActions(item)}</td>
                        </tr>

                    `;

                }).join("")}

            </tbody>

        </table>

    `;

}


function renderAdjustmentAdminStatus(status) {

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


function renderAdjustmentAdminActions(item) {

    if (item.trangThai !== "Chờ duyệt") {

        return `

            <small>
                ${escapeHtml(item.nguoiDuyet || "")}
                ${item.ngayDuyet ? "<br>" + formatAdjustmentAdminDateTime(item.ngayDuyet) : ""}
            </small>

        `;

    }

    return `

        <div class="action-buttons">

            <button
                type="button"
                class="btn btn-sm btn-primary"
                onclick="approveAttendanceAdjustment('${item.maDon}')"
            >
                ✅ Duyệt
            </button>

            <button
                type="button"
                class="btn btn-sm btn-danger"
                onclick="rejectAttendanceAdjustment('${item.maDon}')"
            >
                ❌ Từ chối
            </button>

        </div>

    `;

}


async function approveAttendanceAdjustment(maDon) {

    const ok = confirm(
        "Xác nhận duyệt đơn chấm công bù này?"
    );

    if (!ok) {

        return;

    }

    await updateAttendanceAdjustmentStatusFromAdmin(
        maDon,
        "Đã duyệt",
        "Đồng ý"
    );

}


async function rejectAttendanceAdjustment(maDon) {

    const reason = prompt(
        "Nhập lý do từ chối:"
    );

    if (reason === null) {

        return;

    }

    await updateAttendanceAdjustmentStatusFromAdmin(
        maDon,
        "Từ chối",
        reason || "Không duyệt"
    );

}


async function updateAttendanceAdjustmentStatusFromAdmin(
    maDon,
    trangThai,
    ghiChuDuyet
) {

    try {

        const user =
            getCurrentUser() || {};

        const result =
            await apiPostText(
                "updateAttendanceAdjustmentStatus",
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
            "Cập nhật đơn chấm công bù thành công."
        );

        await loadAttendanceAdjustments();

        if (typeof loadAttendance === "function") {

            await loadAttendance();

        }

    }
    catch (error) {

        console.error(
            "updateAttendanceAdjustmentStatusFromAdmin:",
            error
        );

        alert(
            "Không cập nhật được đơn chấm công bù."
        );

    }

}


function formatAdjustmentAdminDate(value) {

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

        return parts[2] + "/" + parts[1] + "/" + parts[0];

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return "";

    }

    return date.toLocaleDateString("vi-VN");

}


function formatAdjustmentAdminDateTime(value) {

    if (!value) {

        return "";

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return "";

    }

    return date.toLocaleString("vi-VN");

}