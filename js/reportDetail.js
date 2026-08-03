// ========================================
// REPORT DETAIL STATE
// ========================================

let reportDetailInitialized = false;

let currentReportDetailRows = [];


// ========================================
// INIT
// ========================================

async function initReportDetail() {

    if (reportDetailInitialized) {

        return;

    }

    initReportDetailMonthYear();

    await loadReportEmployees();

    reportDetailInitialized = true;

}


// ========================================
// INIT THÁNG / NĂM
// ========================================

function initReportDetailMonthYear() {

    const monthSelect =
        document.getElementById("detailMonth");

    const yearSelect =
        document.getElementById("detailYear");

    if (monthSelect) {

        const currentMonth =
            new Date().getMonth() + 1;

        monthSelect.innerHTML = "";

        for (let i = 1; i <= 12; i++) {

            monthSelect.innerHTML += `

                <option value="${i}" ${i === currentMonth ? "selected" : ""}>

                    Tháng ${i}

                </option>

            `;

        }

    }

    if (yearSelect) {

        const currentYear =
            new Date().getFullYear();

        yearSelect.innerHTML = "";

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
// LOAD NHÂN VIÊN
// ========================================

async function loadReportEmployees() {

    const select =
        document.getElementById("reportEmployee");

    if (!select) {

        return;

    }

    const employees =
        await apiGet("employeeList");

    select.innerHTML = "";

    employees.forEach(function(nv) {

        select.innerHTML += `

            <option value="${escapeHtml(nv.manv)}">

                ${escapeHtml(nv.manv)} - ${escapeHtml(nv.hoten)}

            </option>

        `;

    });

}


// ========================================
// LOAD BẢNG CÔNG CHI TIẾT
// ========================================

async function loadReportDetail() {

    const manv =
        document.getElementById("reportEmployee")?.value || "";

    const month =
        document.getElementById("detailMonth")?.value || "";

    const year =
        document.getElementById("detailYear")?.value || "";

    if (!manv) {

        alert("Vui lòng chọn nhân viên.");

        return;

    }

    try {

        const attendanceRows =
            await apiGet(
                "reportDetail",
                {
                    manv: manv,
                    month: month,
                    year: year
                }
            );

        const leaveRows =
            await apiGet(
                "approvedEmployeeLeaves",
                {
                    manv: manv,
                    month: month,
                    year: year
                }
            );

        currentReportDetailRows =
            mergeReportDetailWithLeaves(
                attendanceRows,
                leaveRows
            );

        renderReportDetail(
            currentReportDetailRows
        );

    }
    catch (error) {

        console.error(
            "loadReportDetail:",
            error
        );

        alert(
            "Không tải được bảng công nhân viên."
        );

    }

}


// ========================================
// GỘP CHẤM CÔNG + NGHỈ PHÉP
// ========================================

function mergeReportDetailWithLeaves(
    attendanceRows,
    leaveRows
) {

    const rows =
        Array.isArray(attendanceRows)
            ? attendanceRows.slice()
            : [];

    const existingDateMap = {};

    rows.forEach(function(row) {

        const dateKey =
            getReportRowDateKey(row);

        if (dateKey) {

            existingDateMap[dateKey] = true;

        }

    });

    if (
        Array.isArray(leaveRows)
    ) {

        leaveRows.forEach(function(leave) {

            const dateKey =
                getReportRowDateKey(leave);

            if (!dateKey) {

                return;

            }

            /**
             * Nếu ngày đó đã có chấm công,
             * không thêm dòng nghỉ để tránh trùng.
             */
            if (existingDateMap[dateKey]) {

                return;

            }

            rows.push({

                ngay: dateKey,

                congtrinh:
                    "📝 " + leave.loaiNghi,

                checkin: "",

                checkout: "",

                tonggio: "",

                cong:
                    "Nghỉ phép",

                ot: "",

                tre: "",

                isLeave: true,

                maDon:
                    leave.maDon,

                loaiNghi:
                    leave.loaiNghi,

                lyDo:
                    leave.lyDo

            });

        });

    }

    rows.sort(function(a, b) {

        return String(getReportRowDateKey(a))
            .localeCompare(
                String(getReportRowDateKey(b))
            );

    });

    return rows;

}


// ========================================
// RENDER BẢNG CÔNG CHI TIẾT
// ========================================

function renderReportDetail(rows) {

    const tbody =
        document.getElementById("tableReportDetail");

    if (!tbody) {

        return;

    }

    if (
        !rows ||
        rows.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8">

                    Không có dữ liệu.

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =
        rows.map(function(row) {

            const isLeave =
                row.isLeave === true;

            return `

                <tr class="${isLeave ? "leave-report-row" : ""}">

                    <td>
                        ${formatReportDetailDate(
                            getReportRowDateKey(row)
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getReportSiteText(row)
                        )}
                    </td>

                    <td>
                        ${formatReportTime(
                            getReportCheckIn(row)
                        )}
                    </td>

                    <td>
                        ${formatReportTime(
                            getReportCheckOut(row)
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getReportTotalHours(row)
                        )}
                    </td>

                    <td>
                        ${
                            isLeave
                                ? `<span class="status-pending">Nghỉ phép</span>`
                                : escapeHtml(getReportWorkDay(row))
                        }
                    </td>

                    <td>
                        ${escapeHtml(
                            getReportOvertime(row)
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getReportLate(row)
                        )}
                    </td>

                </tr>

            `;

        }).join("");

}


// ========================================
// EXPORT BẢNG CÔNG CHI TIẾT
// ========================================

function exportEmployeeReport() {

    if (
        !currentReportDetailRows ||
        currentReportDetailRows.length === 0
    ) {

        alert("Chưa có dữ liệu để xuất.");

        return;

    }

    const employeeText =
        getExportSelectedTextByIds([
            "reportEmployeeSelect",
            "reportDetailEmployee",
            "reportEmployee",
            "employeeReportSelect",
            "detailEmployeeSelect"
        ]);

    const month =
        getExportValueByIds([
            "reportDetailMonth",
            "reportEmployeeMonth",
            "employeeReportMonth",
            "detailMonth",
            "reportMonth"
        ]);

    const year =
        getExportValueByIds([
            "reportDetailYear",
            "reportEmployeeYear",
            "employeeReportYear",
            "detailYear",
            "reportYear"
        ]);

    const headers = [
        "Ngày",
        "Công trình",
        "Check In",
        "Check Out",
        "Tổng giờ",
        "Công",
        "OT",
        "Trễ"
    ];

    let html =
        '<html>' +
            '<head>' +
                '<meta charset="UTF-8">' +
            '</head>' +
            '<body>' +
                '<table style="width:100%; border-collapse:collapse;">' +
                    '<tr>' +
                        '<td colspan="8" style="font-size:20px;font-weight:700;text-align:center;color:#14532d;">' +
                            'BẢNG CÔNG NHÂN VIÊN' +
                        '</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="8" style="font-size:13px;text-align:center;font-weight:700;">' +
                            escapeHtml(employeeText) +
                        '</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="8" style="font-size:13px;text-align:center;">' +
                            'Tháng ' +
                            escapeHtml(month) +
                            '/' +
                            escapeHtml(year) +
                        '</td>' +
                    '</tr>' +
                    '<tr><td colspan="8">&nbsp;</td></tr>' +
                    '<tr>';

    headers.forEach(function(header) {

        html +=
            '<th style="background:#15803d;color:white;font-weight:700;text-align:center;border:1px solid #d9ead3;padding:8px;">' +
                escapeHtml(header) +
            '</th>';

    });

    html +=
        '</tr>';

    currentReportDetailRows.forEach(function(row) {

        html +=
            '<tr>' +
                '<td style="border:1px solid #d9ead3;padding:7px;">' +
                    escapeHtml(
                        formatReportDetailDate(
                            getReportRowDateKey(row)
                        )
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;">' +
                    escapeHtml(
                        getReportSiteText(row)
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:center;">' +
                    escapeHtml(
                        formatReportTime(
                            getReportCheckIn(row)
                        )
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:center;">' +
                    escapeHtml(
                        formatReportTime(
                            getReportCheckOut(row)
                        )
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:right;">' +
                    escapeHtml(
                        getReportTotalHours(row)
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:right;">' +
                    escapeHtml(
                        row.isLeave
                            ? "Nghỉ phép"
                            : getReportWorkDay(row)
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:right;">' +
                    escapeHtml(
                        getReportOvertime(row)
                    ) +
                '</td>' +

                '<td style="border:1px solid #d9ead3;padding:7px;text-align:right;">' +
                    escapeHtml(
                        getReportLate(row)
                    ) +
                '</td>' +
            '</tr>';

    });

    html +=
                '</table>' +
            '</body>' +
        '</html>';

    const fileEmployee =
        employeeText
            .replace(/[^a-zA-Z0-9À-ỹ\s-]/g, "")
            .replace(/\s+/g, "-");

    downloadHtmlExcelFile(
        html,
        "bang-cong-" +
        fileEmployee +
        "-thang-" +
        month +
        "-" +
        year +
        ".xls"
    );

}


// ========================================
// DATA HELPER
// ========================================

function getReportRowDateKey(row) {

    const value =
        row.ngay ||
        row.date ||
        row.ngayChamCong ||
        row.ngayCong ||
        "";

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


function getReportSiteText(row) {

    return row.congtrinh ||
        row.congTrinh ||
        row.site ||
        row.tenct ||
        row.tenCT ||
        "";

}


function getReportCheckIn(row) {

    return row.checkin ||
        row.checkIn ||
        row.check_in ||
        "";

}


function getReportCheckOut(row) {

    return row.checkout ||
        row.checkOut ||
        row.check_out ||
        "";

}


function getReportTotalHours(row) {

    return row.tonggio ||
        row.tongGio ||
        row.totalHours ||
        row.hours ||
        "";

}


function getReportWorkDay(row) {

    if (!row) {

        return "";

    }

    const value =
        row.daywork ??
        row.dayWork ??
        row.cong ??
        row.ngayCong ??
        row.workDay ??
        row.workDays ??
        row.workday ??
        row.congTinhLuong ??
        row.soCong ??
        "";

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }

    const numberValue =
        Number(value);

    if (isNaN(numberValue)) {

        return String(value || "");

    }

    if (numberValue === 0) {

        return "";

    }

    return numberValue.toFixed(2);

}


function getReportOvertime(row) {

    return row.ot ||
        row.overtime ||
        row.overtimeHours ||
        "";

}


function getReportLate(row) {

    return row.tre ||
        row.late ||
        row.lateMinutes ||
        "";

}


// ========================================
// FORMAT HELPER
// ========================================

function formatReportDetailDate(value) {

    if (!value) {

        return "";

    }

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        const parts =
            value.substring(0, 10).split("-");

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


function formatReportTime(value) {

    if (!value) {

        return "";

    }

    if (
        typeof value === "string" &&
        /^\d{2}:\d{2}/.test(value)
    ) {

        return value;

    }

    const date =
        new Date(value);

    if (
        isNaN(date.getTime())
    ) {

        return String(value || "");

    }

    return date.toLocaleTimeString(
        "vi-VN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function csvEscape(value) {

    const text =
        String(value || "");

    return '"' +
        text.replace(/"/g, '""') +
        '"';

}