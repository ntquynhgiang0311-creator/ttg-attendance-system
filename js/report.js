// ========================================
// REPORT STATE
// ========================================

let reportInitialized = false;

let currentReportRows = [];


// ========================================
// INIT REPORT
// ========================================

async function initReport() {

    if (reportInitialized) {

        return;

    }

    initReportMonthYear();

    await loadReportDepartments();

    reportInitialized = true;

}


// ========================================
// INIT THÁNG / NĂM
// ========================================

function initReportMonthYear() {

    const monthSelect =
        document.getElementById("reportMonth");

    const yearSelect =
        document.getElementById("reportYear");

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
// LOAD PHÒNG BAN CHO BÁO CÁO
// ========================================

async function loadReportDepartments() {

    const select =
        document.getElementById("reportPB");

    if (!select) {

        return;

    }

    try {

        const departments =
            await apiGet("departments");

        select.innerHTML = `

            <option value="all">

                Tất cả PB

            </option>

        `;

        departments.forEach(function(pb) {

            select.innerHTML += `

                <option value="${escapeHtml(pb.ten)}">

                    ${escapeHtml(pb.ten)}

                </option>

            `;

        });

    }
    catch (error) {

        console.warn(
            "Không tải được phòng ban báo cáo:",
            error
        );

    }

}


// ========================================
// LẤY FILTER
// ========================================

function getReportFilters() {

    return {

        month:
            document.getElementById("reportMonth")?.value || "",

        year:
            document.getElementById("reportYear")?.value || "",

        pb:
            document.getElementById("reportPB")?.value || "all"

    };

}


// ========================================
// LOAD BÁO CÁO THÁNG
// ========================================

async function loadReport() {

    const filters =
        getReportFilters();

    if (
        !filters.month ||
        !filters.year
    ) {

        alert(
            "Vui lòng chọn tháng/năm."
        );

        return;

    }

    try {

        const attendanceReport =
            await apiGet(
                "report",
                {
                    month: filters.month,
                    year: filters.year,
                    pb: filters.pb
                }
            );

        const approvedLeaves =
            await apiGet(
                "leaveRequests",
                {
                    status: "Đã duyệt",
                    keyword: ""
                }
            );

        currentReportRows =
            mergeMonthlyReportWithLeaves(
                attendanceReport,
                approvedLeaves,
                filters
            );

        renderReport(
            currentReportRows
        );

    }
    catch (error) {

        console.error(
            "loadReport:",
            error
        );

        alert(
            "Không tải được báo cáo tháng."
        );

    }

}


// ========================================
// GỘP BÁO CÁO CÔNG + NGHỈ PHÉP
// ========================================

function mergeMonthlyReportWithLeaves(
    attendanceReport,
    approvedLeaves,
    filters
) {

    const month =
        Number(filters.month);

    const year =
        Number(filters.year);

    const selectedPB =
        String(filters.pb || "all");

    const map = {};


    if (
        Array.isArray(attendanceReport)
    ) {

        attendanceReport.forEach(function(row) {

            const normalized =
                normalizeReportRow(row);

            if (!normalized.manv) {

                return;

            }

            map[normalized.manv] =
                normalized;

        });

    }


    const leaveMap =
        countApprovedLeaveDaysByEmployee(
            approvedLeaves,
            month,
            year,
            selectedPB
        );


    Object.keys(leaveMap).forEach(function(manv) {

        const leaveInfo =
            leaveMap[manv];

        if (!map[manv]) {

            map[manv] = {

                manv: manv,

                hoten:
                    leaveInfo.hoten || "",

                pb:
                    leaveInfo.pb || "",

                ngayCong: 0,

                nghiPhep: 0,

                tongGio: 0,

                onlyLeave: true

            };

        }

        map[manv].nghiPhep =
            leaveInfo.soNgay;

        if (!map[manv].hoten) {

            map[manv].hoten =
                leaveInfo.hoten || "";

        }

        if (!map[manv].pb) {

            map[manv].pb =
                leaveInfo.pb || "";

        }

    });


    const result =
        Object.values(map);


    result.sort(function(a, b) {

        return String(a.manv)
            .localeCompare(
                String(b.manv)
            );

    });


    return result;

}


// ========================================
// CHUẨN HÓA ROW BÁO CÁO CŨ
// ========================================

function normalizeReportRow(row) {

    row = row || {};

    return {

        manv:
            row.manv ||
            row.maNV ||
            row.MaNV ||
            "",

        hoten:
            row.hoten ||
            row.hoTen ||
            row.HoTen ||
            row.ten ||
            "",

        pb:
            row.pb ||
            row.PB ||
            row.phongBan ||
            "",

        ngayCong:
            Number(
                row.ngayCong ??
                row.days ??
                row.cong ??
                row.totalDays ??
                0
            ),

        nghiPhep:
            Number(
                row.nghiPhep ||
                row.leaveDays ||
                0
            ),

        tongGio:
            Number(
                row.tongGio ??
                row.hours ??
                row.totalHours ??
                row.tonggio ??
                0
            ),

        onlyLeave: false

    };

}


// ========================================
// ĐẾM NGÀY NGHỈ ĐÃ DUYỆT THEO NHÂN VIÊN
// ========================================

function countApprovedLeaveDaysByEmployee(
    leaves,
    month,
    year,
    selectedPB
) {

    const map = {};

    if (!Array.isArray(leaves)) {

        return map;

    }

    leaves.forEach(function(item) {

        if (
            String(item.trangThai || "") !== "Đã duyệt"
        ) {

            return;

        }

        if (
            selectedPB !== "all" &&
            normalizeCompareText(item.pb) !== normalizeCompareText(selectedPB)
        ) {

            return;

        }

        const startDate =
            parseReportDate(item.tuNgay);

        const endDate =
            parseReportDate(item.denNgay);

        if (
            !startDate ||
            !endDate
        ) {

            return;

        }

        const days =
            countDaysInMonthRange(
                startDate,
                endDate,
                month,
                year
            );

        if (days <= 0) {

            return;

        }

        const manv =
            item.manv ||
            item.maNV ||
            item.MaNV ||
            "";

        if (!manv) {

            return;

        }

        if (!map[manv]) {

            map[manv] = {

                manv: manv,

                hoten:
                    item.hoten ||
                    item.hoTen ||
                    item.HoTen ||
                    "",

                pb:
                    item.pb ||
                    item.PB ||
                    "",

                soNgay: 0

            };

        }

        map[manv].soNgay += days;

    });

    return map;

}


// ========================================
// ĐẾM SỐ NGÀY TRONG THÁNG
// ========================================

function countDaysInMonthRange(
    startDate,
    endDate,
    month,
    year
) {

    let count = 0;

    const current = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
    );

    const end = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
    );

    while (
        current.getTime() <= end.getTime()
    ) {

        if (
            current.getMonth() + 1 === month &&
            current.getFullYear() === year
        ) {

            count++;

        }

        current.setDate(
            current.getDate() + 1
        );

    }

    return count;

}


// ========================================
// RENDER REPORT
// ========================================

function renderReport(rows) {

    const tbody =
        document.getElementById("tableReport");

    if (!tbody) {

        return;

    }

    if (
        !rows ||
        rows.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    Không có dữ liệu báo cáo

                </td>

            </tr>

        `;

        updateReportSummary([]);

        return;

    }

    tbody.innerHTML =
        rows.map(function(row) {

            return `

                <tr class="${row.onlyLeave ? "leave-only-row" : ""}">

                    <td>${escapeHtml(row.manv)}</td>

                    <td>${escapeHtml(row.hoten)}</td>

                    <td>${formatReportNumber(row.ngayCong)}</td>

                    <td>
                        ${
                            row.nghiPhep > 0
                                ? `<span class="status-pending">${formatReportNumber(row.nghiPhep)}</span>`
                                : ""
                        }
                    </td>

                    <td>${formatReportNumber(row.tongGio)}</td>

                </tr>

            `;

        }).join("");

    updateReportSummary(rows);

}


// ========================================
// UPDATE SUMMARY
// ========================================

function updateReportSummary(rows) {

    rows = Array.isArray(rows)
        ? rows
        : [];

    const tongNV =
        rows.length;

    const tongCong =
        rows.reduce(function(sum, row) {

            return sum + Number(row.ngayCong || 0);

        }, 0);

    const tongGio =
        rows.reduce(function(sum, row) {

            return sum + Number(row.tongGio || 0);

        }, 0);

    setText(
        "reportNV",
        tongNV
    );

    setText(
        "reportDays",
        formatReportNumber(tongCong)
    );

    setText(
        "reportHours",
        formatReportNumber(tongGio)
    );

}


// ========================================
// EXPORT REPORT
// ========================================

function exportMonthlyReport() {

    const table =
        getMonthlyReportTableForExport();

    if (!table) {

        alert("Không tìm thấy bảng báo cáo tháng để xuất.");

        return;

    }

    const month =
        getExportValueByIds([
            "reportMonth",
            "reportFilterMonth",
            "monthlyReportMonth",
            "monthReport"
        ]);

    const year =
        getExportValueByIds([
            "reportYear",
            "reportFilterYear",
            "monthlyReportYear",
            "yearReport"
        ]);

    const clonedTable =
        table.cloneNode(true);

    clonedTable
        .querySelectorAll("button, input, select")
        .forEach(function(element) {
            element.remove();
        });

    styleExportTable(clonedTable);

    const html =
        '<html>' +
            '<head>' +
                '<meta charset="UTF-8">' +
            '</head>' +
            '<body>' +
                '<table style="width:100%; border-collapse:collapse;">' +
                    '<tr>' +
                        '<td colspan="20" style="font-size:20px;font-weight:700;text-align:center;color:#14532d;">' +
                            'BÁO CÁO CÔNG THÁNG' +
                        '</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="20" style="font-size:13px;text-align:center;">' +
                            'Tháng ' +
                            escapeHtml(month) +
                            '/' +
                            escapeHtml(year) +
                        '</td>' +
                    '</tr>' +
                    '<tr><td colspan="20">&nbsp;</td></tr>' +
                '</table>' +

                clonedTable.outerHTML +
            '</body>' +
        '</html>';

    downloadHtmlExcelFile(
        html,
        "bao-cao-thang-" + month + "-" + year + ".xls"
    );

}


// ========================================
// HELPER
// ========================================

function parseReportDate(value) {

    if (!value) {

        return null;

    }

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        const date =
            new Date(
                value.substring(0, 10) + "T00:00:00"
            );

        if (
            isNaN(date.getTime())
        ) {

            return null;

        }

        return date;

    }

    const date =
        new Date(value);

    if (
        isNaN(date.getTime())
    ) {

        return null;

    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function normalizeCompareText(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


function formatReportNumber(value) {

    const numberValue =
        Number(value || 0);

    if (
        Number.isInteger(numberValue)
    ) {

        return String(numberValue);

    }

    return numberValue.toFixed(2);

}


function csvEscape(value) {

    const text =
        String(value || "");

    return '"' +
        text.replace(/"/g, '""') +
        '"';

}
async function exportReport() {

    const month =
        document.getElementById("reportMonth")?.value || "";

    const year =
        document.getElementById("reportYear")?.value || "";

    const pb =
        document.getElementById("reportPB")?.value || "all";

    try {

        const summaryList =
            await apiGet(
                "report",
                {
                    month: month,
                    year: year,
                    pb: pb
                }
            );

        if (
            !Array.isArray(summaryList) ||
            summaryList.length === 0
        ) {

            alert("Không có dữ liệu báo cáo để xuất.");

            return;

        }

        const detailMap = {};

        for (
            let i = 0;
            i < summaryList.length;
            i++
        ) {

            const employee =
                summaryList[i];

            if (
                !employee.manv ||
                Number(employee.days || 0) === 0
            ) {

                detailMap[employee.manv] =
                    [];

                continue;

            }

            detailMap[employee.manv] =
                await apiGet(
                    "reportDetail",
                    {
                        manv: employee.manv,
                        month: month,
                        year: year
                    }
                );

        }

        const html =
            buildFullMonthlyReportExcelHtml(
                summaryList,
                detailMap,
                month,
                year
            );

        downloadMonthlyReportExcel(
            html,
            "bang-cong-tong-va-chi-tiet-" +
            month +
            "-" +
            year +
            ".xls"
        );

    } catch (error) {

        console.error(
            "exportReport:",
            error
        );

        alert(
            "Không xuất được báo cáo tháng."
        );

    }

}
function getMonthlyReportTableForExport() {

    const selectors = [
        "#reportList table",
        "#reportResult table",
        "#monthlyReportList table",
        "#reportSection table"
    ];

    for (
        let i = 0;
        i < selectors.length;
        i++
    ) {

        const table =
            document.querySelector(
                selectors[i]
            );

        if (
            table &&
            table.querySelectorAll("tr").length > 1
        ) {

            return table;

        }

    }

    return null;

}
function buildFullMonthlyReportExcelHtml(
    summaryList,
    detailMap,
    month,
    year
) {

    let totalEmployees = 0;
    let totalDays = 0;
    let totalHours = 0;
    let totalOT = 0;
    let totalLate = 0;

    summaryList.forEach(function(item) {

        if (Number(item.days || 0) > 0) {
            totalEmployees++;
        }

        totalDays += Number(item.days || 0);
        totalHours += Number(item.hours || 0);

        totalOT += Number(item.ot || 0);
        totalLate += Number(item.late || 0);

    });

    let html =
        '<html>' +
        '<head>' +
            '<meta charset="UTF-8">' +
            '<style>' +
                'body{font-family:Arial,sans-serif;font-size:12px;}' +
                'table{border-collapse:collapse;width:100%;}' +
                'td,th{border:1px solid #d9ead3;padding:6px;vertical-align:middle;}' +
                'th{background:#15803d;color:#ffffff;font-weight:bold;text-align:center;}' +
                '.title{font-size:20px;font-weight:bold;color:#14532d;text-align:center;}' +
                '.subtitle{text-align:center;font-size:13px;}' +
                '.section{background:#dcfce7;color:#14532d;font-weight:bold;font-size:14px;}' +
                '.center{text-align:center;}' +
                '.right{text-align:right;}' +
                '.late{color:#b91c1c;font-weight:bold;}' +
            '</style>' +
        '</head>' +
        '<body>' +
        '<table>' +

            '<tr>' +
                '<td colspan="8" class="title">BẢNG CÔNG TỔNG VÀ CHI TIẾT NHÂN VIÊN</td>' +
            '</tr>' +

            '<tr>' +
                '<td colspan="8" class="subtitle">Tháng ' +
                    escapeHtml(month) +
                    '/' +
                    escapeHtml(year) +
                '</td>' +
            '</tr>' +

            '<tr><td colspan="8">&nbsp;</td></tr>' +

            '<tr>' +
                '<th>Nhân viên có công</th>' +
                '<th>Tổng ngày công</th>' +
                '<th>Tổng giờ</th>' +
                '<th>Tổng OT</th>' +
                '<th>Tổng trễ phút</th>' +
                '<th colspan="3"></th>' +
            '</tr>' +

            '<tr>' +
                '<td class="center">' + escapeHtml(totalEmployees) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalDays)) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalHours)) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalOT)) + '</td>' +
                '<td class="center">' + escapeHtml(totalLate) + '</td>' +
                '<td colspan="3"></td>' +
            '</tr>' +

            '<tr><td colspan="8">&nbsp;</td></tr>' +

            '<tr>' +
                '<td colspan="8" class="section">BẢNG TỔNG NHÂN VIÊN</td>' +
            '</tr>' +

            '<tr>' +
                '<th>Mã NV</th>' +
                '<th>Họ tên</th>' +
                '<th>PB</th>' +
                '<th>Ngày công</th>' +
                '<th>Tổng giờ</th>' +
                '<th>OT</th>' +
                '<th>Trễ phút</th>' +
                '<th>Ghi chú</th>' +
            '</tr>';

    summaryList.forEach(function(item) {

        if (Number(item.days || 0) === 0) {
            return;
        }

        html +=
            '<tr>' +
                '<td>' + escapeHtml(item.manv || "") + '</td>' +
                '<td>' + escapeHtml(item.hoten || "") + '</td>' +
                '<td>' + escapeHtml(item.pb || "") + '</td>' +
                '<td class="right">' + escapeHtml(formatReportExportNumber(item.days || 0)) + '</td>' +
                '<td class="right">' + escapeHtml(formatReportExportNumber(item.hours || 0)) + '</td>' +
                '<td class="right">' + escapeHtml(formatReportExportNumber(item.ot || 0)) + '</td>' +
                '<td class="right ' + (Number(item.late || 0) > 0 ? 'late' : '') + '">' +
                    escapeHtml(Number(item.late || 0) > 0 ? item.late : "") +
                '</td>' +
                '<td></td>' +
            '</tr>';

    });

    html +=
        '<tr><td colspan="8">&nbsp;</td></tr>' +
        '<tr>' +
            '<td colspan="8" class="section">CHI TIẾT CHẤM CÔNG TỪNG NHÂN VIÊN</td>' +
        '</tr>';

    summaryList.forEach(function(employee) {

        const detailList =
            detailMap[employee.manv] || [];

        if (!detailList || detailList.length === 0) {
            return;
        }

        html +=
            '<tr><td colspan="8">&nbsp;</td></tr>' +

            '<tr>' +
                '<td colspan="8" class="section">' +
                    escapeHtml(employee.manv || "") +
                    ' - ' +
                    escapeHtml(employee.hoten || "") +
                    ' - ' +
                    escapeHtml(employee.pb || "") +
                '</td>' +
            '</tr>' +

            '<tr>' +
                '<th>Ngày</th>' +
                '<th>Công trình</th>' +
                '<th>Check In</th>' +
                '<th>Check Out</th>' +
                '<th>Tổng giờ</th>' +
                '<th>Công</th>' +
                '<th>OT</th>' +
                '<th>Trễ</th>' +
            '</tr>';

        detailList.forEach(function(row) {

            const late =
                Number(row.late || 0);

            html +=
                '<tr>' +
                    '<td class="center">' + escapeHtml(formatReportExportDate(row.date)) + '</td>' +
                    '<td>' + escapeHtml(row.site || "") + '</td>' +
                    '<td class="center">' + escapeHtml(row.checkin || "") + '</td>' +
                    '<td class="center">' + escapeHtml(row.checkout || "") + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.hours || 0)) + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.daywork || 0)) + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.ot || 0)) + '</td>' +
                    '<td class="right ' + (late > 0 ? 'late' : '') + '">' +
                        escapeHtml(late > 0 ? late : "") +
                    '</td>' +
                '</tr>';

        });

    });

    html +=
        '</table>' +
        '</body>' +
        '</html>';

    return html;

}


function formatReportExportDate(value) {

    if (!value) {

        return "";

    }

    const text =
        String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {

        const parts =
            text.substring(0, 10).split("-");

        return parts[2] + "/" + parts[1] + "/" + parts[0];

    }

    return text;

}


function formatReportExportNumber(value) {

    const numberValue =
        Number(value || 0);

    if (isNaN(numberValue)) {

        return value || "";

    }

    return numberValue.toFixed(2).replace(".00", "");

}


function downloadMonthlyReportExcel(
    html,
    fileName
) {

    const blob =
        new Blob(
            [html],
            {
                type: "application/vnd.ms-excel;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}
let currentDailyAttendanceRows = [];


document.addEventListener("DOMContentLoaded", function() {

    initDailyAttendanceReport();

});


function initDailyAttendanceReport() {

    initDailyAttendanceDate();

    syncDailyAttendanceDepartmentOptions();

}


function initDailyAttendanceDate() {

    const input =
        document.getElementById("dailyAttendanceDate");

    if (!input) {

        return;

    }

    if (input.value) {

        return;

    }

    const today =
        new Date();

    input.value =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

}


function syncDailyAttendanceDepartmentOptions() {

    const dailySelect =
        document.getElementById("dailyAttendancePB");

    if (!dailySelect) {

        return;

    }

    const monthlySelect =
        document.getElementById("reportPB");

    if (
        monthlySelect &&
        monthlySelect.options.length > 0
    ) {

        dailySelect.innerHTML =
            monthlySelect.innerHTML;

        return;

    }

    dailySelect.innerHTML =
        '<option value="all">Tất cả PB</option>';

}


async function loadDailyAttendanceReport() {

    const date =
        document.getElementById("dailyAttendanceDate")?.value || "";

    const pb =
        document.getElementById("dailyAttendancePB")?.value || "all";

    if (!date) {

        alert("Vui lòng chọn ngày.");

        return;

    }

    try {

        const data =
            await apiGet(
                "dailyAttendanceReport",
                {
                    date: date,
                    pb: pb
                }
            );

        window.currentDailyAttendanceRows =
            Array.isArray(data)
                ? data
                : [];

        renderDailyAttendanceReport(
            window.currentDailyAttendanceRows
        );

        updateDailyAttendanceSummary(
            window.currentDailyAttendanceRows
        );

    } catch (error) {

        console.error(
            "loadDailyAttendanceReport:",
            error
        );

        alert(
            "Không tải được bảng công ngày."
        );

    }

}


function renderDailyAttendanceReport(list) {

    const tbody =
        document.getElementById("dailyAttendanceTable");

    if (!tbody) {

        return;

    }

    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        tbody.innerHTML =
    '<tr><td colspan="12" class="empty-cell">Không có dữ liệu chấm công ngày này.</td></tr>';
        return;

    }

    let html = "";

    list.forEach(function(row) {

        const late =
            Number(row.late || 0);

        html +=
            '<tr>' +
                '<td>' + escapeHtml(formatDailyAttendanceDate(row.date)) + '</td>' +
                '<td>' + escapeHtml(row.manv || "") + '</td>' +
                '<td>' + escapeHtml(row.hoten || "") + '</td>' +
                '<td>' + escapeHtml(row.pb || "") + '</td>' +
                '<td>' + escapeHtml(row.site || "") + '</td>' +
                '<td>' + escapeHtml(row.checkin || "") + '</td>' +
                '<td>' + escapeHtml(row.checkout || "") + '</td>' +
                '<td class="text-right">' + escapeHtml(formatDailyAttendanceNumber(row.hours || 0)) + '</td>' +
                '<td class="text-right">' + escapeHtml(formatDailyAttendanceNumber(row.daywork || 0)) + '</td>' +
                '<td class="text-right">' + escapeHtml(formatDailyAttendanceNumber(row.ot || 0)) + '</td>' +
                '<td class="text-right">' + escapeHtml(late > 0 ? late : "") + '</td>' +
                '<td>' + escapeHtml(row.note || "") + '</td>' +
            '</tr>';

    });

    tbody.innerHTML =
        html;

}


function updateDailyAttendanceSummary(list) {

    let totalEmployees = 0;
    let totalDays = 0;
    let totalHours = 0;
    let totalOT = 0;
    let totalLate = 0;

    list.forEach(function(row) {

        if (
            Number(row.daywork || 0) > 0 ||
            row.checkin ||
            row.checkout
        ) {

            totalEmployees++;

        }

        totalDays +=
            Number(row.daywork || 0);

        totalHours +=
            Number(row.hours || 0);

        totalOT +=
            Number(row.ot || 0);

        totalLate +=
            Number(row.late || 0);

    });

    setDailyAttendanceText(
        "dailyAttendanceNV",
        totalEmployees
    );

    setDailyAttendanceText(
        "dailyAttendanceDays",
        formatDailyAttendanceNumber(totalDays)
    );

    setDailyAttendanceText(
        "dailyAttendanceHours",
        formatDailyAttendanceNumber(totalHours)
    );

    setDailyAttendanceText(
        "dailyAttendanceOT",
        formatDailyAttendanceNumber(totalOT)
    );

    setDailyAttendanceText(
        "dailyAttendanceLate",
        totalLate
    );

}


async function exportDailyAttendanceReport() {

    const date =
        document.getElementById("dailyAttendanceDate")?.value || "";

    if (!date) {

        alert("Vui lòng chọn ngày.");

        return;

    }

    if (
        !window.currentDailyAttendanceRows ||
        window.currentDailyAttendanceRows.length === 0
    ) {

        await loadDailyAttendanceReport();

    }

    if (
        !currentDailyAttendanceRows ||
        currentDailyAttendanceRows.length === 0
    ) {

        alert("Không có dữ liệu để xuất.");

        return;

    }

    const html =
        buildDailyAttendanceExcelHtml(
            window.currentDailyAttendanceRows,
            date
        );

    downloadDailyAttendanceExcel(
        html,
        "bang-cong-ngay-" +
        date +
        ".xls"
    );

}


function buildDailyAttendanceExcelHtml(
    list,
    date
) {

    let totalEmployees = 0;
    let totalDays = 0;
    let totalHours = 0;
    let totalOT = 0;
    let totalLate = 0;

    list.forEach(function(row) {

        if (
            Number(row.daywork || 0) > 0 ||
            row.checkin ||
            row.checkout
        ) {

            totalEmployees++;

        }

        totalDays +=
            Number(row.daywork || 0);

        totalHours +=
            Number(row.hours || 0);

        totalOT +=
            Number(row.ot || 0);

        totalLate +=
            Number(row.late || 0);

    });

    let html =
        '<html>' +
            '<head>' +
                '<meta charset="UTF-8">' +
                '<style>' +
                    'body{font-family:Arial,sans-serif;font-size:12px;}' +
                    'table{border-collapse:collapse;width:100%;}' +
                    'td,th{border:1px solid #d9ead3;padding:6px;vertical-align:middle;}' +
                    'th{background:#15803d;color:#ffffff;font-weight:bold;text-align:center;}' +
                    '.title{font-size:20px;font-weight:bold;color:#14532d;text-align:center;}' +
                    '.subtitle{text-align:center;font-size:13px;}' +
                    '.center{text-align:center;}' +
                    '.right{text-align:right;}' +
                    '.late{color:#b91c1c;font-weight:bold;}' +
                '</style>' +
            '</head>' +
            '<body>' +
                '<table>' +
                    '<tr>' +
                        '<td colspan="12" class="title">BẢNG CÔNG NGÀY</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="12" class="subtitle">' +
                            formatDailyAttendanceDate(date) +
                        '</td>' +
                    '</tr>' +
                    '<tr><td colspan="12">&nbsp;</td></tr>' +

                    '<tr>' +
                        '<th>Nhân viên có công</th>' +
                        '<th>Tổng ngày công</th>' +
                        '<th>Tổng giờ</th>' +
                        '<th>Tổng OT</th>' +
                        '<th>Tổng trễ phút</th>' +
                        '<th colspan="7"></th>' +
                    '</tr>' +

                    '<tr>' +
                        '<td class="center">' + escapeHtml(totalEmployees) + '</td>' +
                        '<td class="center">' + escapeHtml(formatDailyAttendanceNumber(totalDays)) + '</td>' +
                        '<td class="center">' + escapeHtml(formatDailyAttendanceNumber(totalHours)) + '</td>' +
                        '<td class="center">' + escapeHtml(formatDailyAttendanceNumber(totalOT)) + '</td>' +
                        '<td class="center">' + escapeHtml(totalLate) + '</td>' +
                        '<td colspan="7"></td>' +
                    '</tr>' +

                    '<tr><td colspan="12">&nbsp;</td></tr>' +

                    '<tr>' +
                        '<th>Ngày</th>' +
                        '<th>Mã NV</th>' +
                        '<th>Họ tên</th>' +
                        '<th>PB</th>' +
                        '<th>Công trình</th>' +
                        '<th>Check In</th>' +
                        '<th>Check Out</th>' +
                        '<th>Tổng giờ</th>' +
                        '<th>Công</th>' +
                        '<th>OT</th>' +
                        '<th>Trễ</th>' +
                        '<th>Ghi chú</th>' +
                    '</tr>';

    list.forEach(function(row) {

        const late =
            Number(row.late || 0);

        html +=
            '<tr>' +
                '<td class="center">' + escapeHtml(formatDailyAttendanceDate(row.date)) + '</td>' +
                '<td>' + escapeHtml(row.manv || "") + '</td>' +
                '<td>' + escapeHtml(row.hoten || "") + '</td>' +
                '<td>' + escapeHtml(row.pb || "") + '</td>' +
                '<td>' + escapeHtml(row.site || "") + '</td>' +
                '<td class="center">' + escapeHtml(row.checkin || "") + '</td>' +
                '<td class="center">' + escapeHtml(row.checkout || "") + '</td>' +
                '<td class="right">' + escapeHtml(formatDailyAttendanceNumber(row.hours || 0)) + '</td>' +
                '<td class="right">' + escapeHtml(formatDailyAttendanceNumber(row.daywork || 0)) + '</td>' +
                '<td class="right">' + escapeHtml(formatDailyAttendanceNumber(row.ot || 0)) + '</td>' +
                '<td class="right ' + (late > 0 ? 'late' : '') + '">' +
                    escapeHtml(late > 0 ? late : "") +
                '</td>' +
                '<td>' + escapeHtml(row.note || "") + '</td>' +
            '</tr>';

    });

    html +=
                '</table>' +
            '</body>' +
        '</html>';

    return html;

}


function formatDailyAttendanceDate(value) {

    if (!value) {

        return "";

    }

    const text =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2}/.test(text)
    ) {

        const parts =
            text.substring(0, 10)
                .split("-");

        return parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0];

    }

    return text;

}


function formatDailyAttendanceNumber(value) {

    const numberValue =
        Number(value || 0);

    if (
        isNaN(numberValue)
    ) {

        return value || "";

    }

    return numberValue
        .toFixed(2)
        .replace(".00", "");

}


function setDailyAttendanceText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.innerHTML =
        value;

}


function downloadDailyAttendanceExcel(
    html,
    fileName
) {

    const blob =
        new Blob(
            [html],
            {
                type:
                    "application/vnd.ms-excel;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}
window.currentDailyAttendanceRows =
    window.currentDailyAttendanceRows || [];

window.loadDailyAttendanceReport =
    loadDailyAttendanceReport;

window.exportDailyAttendanceReport =
    exportDailyAttendanceReport;

document.addEventListener("DOMContentLoaded", function() {

    const input =
        document.getElementById("dailyAttendanceDate");

    if (input && !input.value) {

        const today =
            new Date();

        input.value =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");

    }

    const dailyPB =
        document.getElementById("dailyAttendancePB");

    const reportPB =
        document.getElementById("reportPB");

    if (
        dailyPB &&
        reportPB &&
        reportPB.options.length > 0
    ) {

        dailyPB.innerHTML =
            reportPB.innerHTML;

    }

});
