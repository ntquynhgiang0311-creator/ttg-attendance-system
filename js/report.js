// ========================================
// REPORT STATE
// ========================================

let reportInitialized = false;

let currentReportRows = [];


// ========================================
// CẤU HÌNH XUẤT DATA ĐỔ LƯƠNG
// ========================================
// Khu vực lấy trực tiếp từ cột CongTrinh.KhuVucLuong:
// - HCM  = công trình trong TP.HCM  -> xt / CNt
// - TINH = công trình ngoài TP.HCM -> xtt / CNtt
// - VĂN PHÒNG / XƯỞNG luôn là công thường -> x / CN
const PAYROLL_EXPORT_RULES = {

    normalSiteKeywords: [
        "VĂN PHÒNG",
        "VAN PHONG",
        "XƯỞNG",
        "XUONG"
    ],

    workCodes: {
        normal: { full: "x", half: "x/2" },
        site: { full: "xt", half: "xt/2" },
        stay: { full: "xtt", half: "xtt/2" },
        sundayNormal: { full: "CN", half: "CN/2" },
        sundaySite: { full: "CNt", half: "CNt/2" },
        sundayStay: { full: "CNtt", half: "CNtt/2" },
        leave: "0",
        holiday: "L"
    }

};


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

    if (!month || !year) {
        alert("Vui lòng chọn tháng/năm.");
        return;
    }

    try {

        const results =
            await Promise.all([

                apiGet(
                    "report",
                    {
                        month: month,
                        year: year,
                        pb: pb
                    }
                ),

                apiGet(
                    "reportAllDetails",
                    {
                        month: month,
                        year: year,
                        pb: pb
                    }
                ),

                apiGet(
                    "leaveRequests",
                    {
                        status: "Đã duyệt",
                        keyword: ""
                    }
                )

            ]);

        const summaryList =
            Array.isArray(results[0])
                ? results[0]
                : [];

        const detailMap =
            results[1] &&
            typeof results[1] === "object"
                ? results[1]
                : {};

        const approvedLeaves =
            Array.isArray(results[2])
                ? results[2]
                : [];

        if (summaryList.length === 0) {
            alert("Không có dữ liệu báo cáo để xuất.");
            return;
        }

        const html =
            buildFullMonthlyReportExcelHtml(
                summaryList,
                detailMap,
                month,
                year,
                approvedLeaves
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

        alert("Không xuất được báo cáo tháng.");

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
    year,
    approvedLeaves
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
                '.confirm{color:#b91c1c;font-weight:bold;}' +
                '.payroll-title{font-size:18px;font-weight:bold;color:#14532d;text-align:center;background:#dcfce7;}' +
                '.payroll-note{font-size:11px;color:#374151;background:#f8fafc;}' +
                '.payroll-code{text-align:center;font-weight:bold;}' +
                '.payroll-ot{text-align:right;}' +
            '</style>' +
        '</head>' +
        '<body>' +

        buildPayrollImportTableHtml(
            summaryList,
            detailMap,
            month,
            year,
            approvedLeaves
        ) +

        '<br><br>' +
        '<table>' +

            '<tr>' +
                '<td colspan="10" class="title">BẢNG CÔNG TỔNG VÀ CHI TIẾT NHÂN VIÊN</td>' +
            '</tr>' +

            '<tr>' +
                '<td colspan="10" class="subtitle">Tháng ' +
                    escapeHtml(month) +
                    '/' +
                    escapeHtml(year) +
                '</td>' +
            '</tr>' +

            '<tr><td colspan="10">&nbsp;</td></tr>' +

            '<tr>' +
                '<th>Nhân viên có công</th>' +
                '<th>Tổng ngày công</th>' +
                '<th>Tổng giờ</th>' +
                '<th>Tổng OT</th>' +
                '<th>Tổng trễ phút</th>' +
                '<th colspan="5"></th>' +
            '</tr>' +

            '<tr>' +
                '<td class="center">' + escapeHtml(totalEmployees) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalDays)) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalHours)) + '</td>' +
                '<td class="center">' + escapeHtml(formatReportExportNumber(totalOT)) + '</td>' +
                '<td class="center">' + escapeHtml(totalLate) + '</td>' +
                '<td colspan="5"></td>' +
            '</tr>' +

            '<tr><td colspan="10">&nbsp;</td></tr>' +

            '<tr>' +
                '<td colspan="10" class="section">BẢNG TỔNG NHÂN VIÊN</td>' +
            '</tr>' +

            '<tr>' +
                '<th>Mã NV</th>' +
                '<th>Họ tên</th>' +
                '<th>PB</th>' +
                '<th>Ngày công</th>' +
                '<th>Tổng giờ</th>' +
                '<th>OT</th>' +
                '<th>Trễ phút</th>' +
                '<th colspan="3">Ghi chú</th>' +
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
                '<td colspan="3"></td>' +
            '</tr>';

    });

    html +=
        '<tr><td colspan="10">&nbsp;</td></tr>' +
        '<tr>' +
            '<td colspan="10" class="section">CHI TIẾT CHẤM CÔNG TỪNG NHÂN VIÊN</td>' +
        '</tr>';

    summaryList.forEach(function(employee) {

        const employeeManv =
            getReportExportEmployeeCode(employee);

        let detailList =
            detailMap[employeeManv] || [];

        if (!Array.isArray(detailList)) {

            console.error(
                "Chi tiết bảng công không phải mảng:",
                detailList
            );

            detailList = [];

        }

        if (detailList.length === 0) {
            return;
        }

        html +=
            '<tr><td colspan="10">&nbsp;</td></tr>' +

            '<tr>' +
                '<td colspan="10" class="section">' +
                    escapeHtml(employee.manv || "") +
                    ' - ' +
                    escapeHtml(employee.hoten || "") +
                    ' - ' +
                    escapeHtml(employee.pb || "") +
                '</td>' +
            '</tr>' +

            '<tr>' +
                '<th>Ngày</th>' +
                '<th>Công trình chấm công</th>' +
                '<th>Phân công</th>' +
                '<th>Check In</th>' +
                '<th>Check Out</th>' +
                '<th>Tổng giờ</th>' +
                '<th>Công</th>' +
                '<th>OT</th>' +
                '<th>Trễ</th>' +
                '<th>Ghi chú phân công / xác nhận</th>' +
            '</tr>';

        detailList.forEach(function(row) {

            const late =
                Number(row.late || 0);

            const note =
                row.ghiChuPhanCong ||
                row.note ||
                "";

            const noteClass =
                String(note || "").indexOf("CẦN XÁC NHẬN") >= 0
                    ? "confirm"
                    : "";

            html +=
                '<tr>' +
                    '<td class="center">' + escapeHtml(formatReportExportDate(row.date)) + '</td>' +
                    '<td>' + escapeHtml(row.site || "") + '</td>' +
                    '<td>' + escapeHtml(row.phanCong || "") + '</td>' +
                    '<td class="center">' + escapeHtml(row.checkin || "") + '</td>' +
                    '<td class="center">' + escapeHtml(row.checkout || "") + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.hours || 0)) + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.daywork || 0)) + '</td>' +
                    '<td class="right">' + escapeHtml(formatReportExportNumber(row.ot || 0)) + '</td>' +
                    '<td class="right ' + (late > 0 ? 'late' : '') + '">' +
                        escapeHtml(late > 0 ? late : "") +
                    '</td>' +
                    '<td class="' + noteClass + '">' +
                        escapeHtml(note) +
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



// ========================================
// DATA ĐỔ LƯƠNG - 31 NGÀY x (CÔNG + TC)
// ========================================

function buildPayrollImportTableHtml(
    summaryList,
    detailMap,
    month,
    year,
    approvedLeaves
) {

    const monthNumber =
        Number(month);

    const yearNumber =
        Number(year);

    const leaveDayMap =
        buildPayrollLeaveDayMap(
            approvedLeaves,
            monthNumber,
            yearNumber
        );

    const employees =
        (Array.isArray(summaryList)
            ? summaryList.slice()
            : []);

    employees.sort(function(a, b) {
        return getReportExportEmployeeCode(a)
            .localeCompare(
                getReportExportEmployeeCode(b)
            );
    });

    const totalColumns =
        2 + (31 * 2);

    let html =
        '<table>' +
            '<tr>' +
                '<td colspan="' + totalColumns + '" class="payroll-title">DATA ĐỔ LƯƠNG</td>' +
            '</tr>' +
            '<tr>' +
                '<td colspan="' + totalColumns + '" class="payroll-note">' +
                    'Dùng Mã NV làm khóa dò sang sheet CHẤM CÔNG. ' +
                    'Quy ước: x/x/2 = công thường; xt/xt/2 = công trình phụ cấp 30k; ' +
                    'xtt/xtt/2 = công trình ở lại phụ cấp 80k; ' +
                    'CN/CNt/CNtt = Chủ nhật; 0 = nghỉ; L = lễ.' +
                '</td>' +
            '</tr>' +
            '<tr>' +
                '<th>Mã NV</th>' +
                '<th>Họ tên</th>';

    for (let day = 1; day <= 31; day++) {

        html +=
            '<th>' + day + ' Công</th>' +
            '<th>' + day + ' TC</th>';

    }

    html +=
            '</tr>';

    employees.forEach(function(employee) {

        const manv =
            getReportExportEmployeeCode(employee);

        if (!manv) {
            return;
        }

        const detailList =
            Array.isArray(detailMap[manv])
                ? detailMap[manv]
                : [];

        const detailDayMap =
            buildPayrollDetailDayMap(
                detailList
            );

        html +=
            '<tr>' +
                '<td>' + escapeHtml(manv) + '</td>' +
                '<td>' + escapeHtml(employee.hoten || employee.hoTen || "") + '</td>';

        for (let day = 1; day <= 31; day++) {

            const validDate =
                isValidPayrollMonthDay(
                    yearNumber,
                    monthNumber,
                    day
                );

            if (!validDate) {

                html +=
                    '<td></td><td></td>';

                continue;

            }

            const dateKey =
                buildPayrollDateKey(
                    yearNumber,
                    monthNumber,
                    day
                );

            const detail =
                detailDayMap[dateKey] || null;

            const leave =
                leaveDayMap[
                    manv + "|" + dateKey
                ] || null;

            const workCode =
                buildPayrollWorkCode(
                    detail,
                    dateKey,
                    leave
                );

            const overtime =
                detail
                    ? Number(detail.ot || 0)
                    : 0;

            html +=
                '<td class="payroll-code">' +
                    escapeHtml(workCode) +
                '</td>' +
                '<td class="payroll-ot">' +
                    escapeHtml(
                        overtime > 0
                            ? formatReportExportNumber(overtime)
                            : ""
                    ) +
                '</td>';

        }

        html +=
            '</tr>';

    });

    html +=
        '</table>';

    return html;

}


function buildPayrollDetailDayMap(detailList) {

    const map = {};

    if (!Array.isArray(detailList)) {
        return map;
    }

    detailList.forEach(function(row) {

        const dateKey =
            normalizePayrollDateKey(
                row && row.date
            );

        if (!dateKey) {
            return;
        }

        map[dateKey] =
            row;

    });

    return map;

}


function buildPayrollLeaveDayMap(
    leaves,
    month,
    year
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

        const manv =
            String(
                item.manv ||
                item.maNV ||
                item.MaNV ||
                ""
            ).trim();

        if (!manv) {
            return;
        }

        const startDate =
            parseReportDate(
                item.tuNgay ||
                item.ngayBatDau ||
                item.fromDate
            );

        const endDate =
            parseReportDate(
                item.denNgay ||
                item.ngayKetThuc ||
                item.toDate
            );

        if (!startDate || !endDate) {
            return;
        }

        const current =
            new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
            );

        const end =
            new Date(
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

                const dateKey =
                    buildPayrollDateKey(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        current.getDate()
                    );

                map[
                    manv + "|" + dateKey
                ] = item;

            }

            current.setDate(
                current.getDate() + 1
            );

        }

    });

    return map;

}


function buildPayrollWorkCode(
    detail,
    dateKey,
    leave
) {

    const codes =
        PAYROLL_EXPORT_RULES.workCodes;

    const dayWork =
        detail
            ? Number(detail.daywork || 0)
            : 0;

    // Có công thực tế thì ưu tiên dữ liệu chấm công.
    if (dayWork > 0) {

        const isHalfDay =
            dayWork < 1;

        const locationType =
            classifyPayrollLocation(
                detail
            );

        const date =
            parsePayrollDateKey(
                dateKey
            );

        const isSunday =
            date &&
            date.getDay() === 0;

        let codeGroup =
            codes.normal;

        if (isSunday) {

            if (locationType === "stay") {
                codeGroup = codes.sundayStay;
            }
            else if (locationType === "site") {
                codeGroup = codes.sundaySite;
            }
            else {
                codeGroup = codes.sundayNormal;
            }

        }
        else {

            if (locationType === "stay") {
                codeGroup = codes.stay;
            }
            else if (locationType === "site") {
                codeGroup = codes.site;
            }
            else {
                codeGroup = codes.normal;
            }

        }

        return isHalfDay
            ? codeGroup.half
            : codeGroup.full;

    }

    // Nếu có dấu vết chấm công nhưng chưa đủ điều kiện ra công
    // thì để trống để HR kiểm tra ở phần chi tiết, không tự ghi đè bằng nghỉ.
    if (
        detail &&
        (detail.checkin || detail.checkout)
    ) {
        return "";
    }

    // Chỉ đưa nghỉ đã duyệt vào bảng đổ lương.
    if (leave) {

        const leaveText =
            normalizePayrollText(
                leave.loaiNghi ||
                leave.tenLoaiNghi ||
                leave.nhomNghi ||
                leave.lyDo ||
                ""
            );

        if (
            leaveText.indexOf("LE") >= 0 &&
            leaveText.indexOf("NGHI") >= 0
        ) {
            return codes.holiday;
        }

        return codes.leave;

    }

    return "";

}


function classifyPayrollLocation(row) {

    row = row || {};

    const locations = [
        {
            code: row.maCTIn || row.maCT || "",
            name: row.siteIn || row.site || "",
            region: row.khuVucLuongIn || row.khuVucLuong || ""
        },
        {
            code: row.maCTOut || row.maCT || "",
            name: row.siteOut || row.site || "",
            region: row.khuVucLuongOut || row.khuVucLuong || ""
        }
    ];

    let result =
        "normal";

    locations.forEach(function(location) {

        const type =
            classifyPayrollLocationPart(
                location.code,
                location.name,
                location.region
            );

        // Chỉ cần một lượt IN/OUT thuộc công trình tỉnh
        // thì cả ngày được xếp nhóm xtt/CNtt.
        if (type === "stay") {
            result = "stay";
            return;
        }

        if (
            type === "site" &&
            result !== "stay"
        ) {
            result = "site";
        }

    });

    return result;

}


function classifyPayrollLocationPart(
    maCT,
    siteName,
    khuVucLuong
) {

    const code =
        String(maCT || "")
            .trim()
            .toUpperCase();

    const text =
        normalizePayrollText(
            siteName
        );

    // Văn phòng / Xưởng luôn là công thường,
    // không phụ thuộc KhuVucLuong.
    if (
        PAYROLL_EXPORT_RULES.normalSiteKeywords
            .some(function(keyword) {
                return text.indexOf(
                    normalizePayrollText(keyword)
                ) >= 0;
            })
    ) {
        return "normal";
    }

    const region =
        normalizePayrollRegion(
            khuVucLuong
        );

    if (region === "TINH") {
        return "stay";
    }

    if (region === "HCM") {
        return "site";
    }

    if (!code && !text) {
        return "normal";
    }

    // Công trình chưa khai KhuVucLuong:
    // mặc định HCM để không tự phát sinh phụ cấp tỉnh.
    return "site";

}


function normalizePayrollRegion(value) {

    const text =
        normalizePayrollText(value)
            .replace(/\./g, "")
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return "";
    }

    if (
        text === "HCM" ||
        text === "TPHCM" ||
        text === "TP HCM" ||
        text === "HO CHI MINH" ||
        text === "TP HO CHI MINH"
    ) {
        return "HCM";
    }

    if (
        text === "TINH" ||
        text === "NGOAI HCM" ||
        text === "NGOAI TPHCM" ||
        text === "NGOAI TP HCM"
    ) {
        return "TINH";
    }

    return text;

}


function normalizePayrollText(value) {

    return String(value || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Đ/g, "D");

}


function normalizePayrollDateKey(value) {

    if (!value) {
        return "";
    }

    const text =
        String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text.substring(0, 10);
    }

    const date =
        parseReportDate(value);

    if (!date) {
        return "";
    }

    return buildPayrollDateKey(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );

}


function buildPayrollDateKey(
    year,
    month,
    day
) {

    return String(year) +
        "-" +
        String(month).padStart(2, "0") +
        "-" +
        String(day).padStart(2, "0");

}


function parsePayrollDateKey(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
        return null;
    }

    const parts =
        String(value).split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

}


function isValidPayrollMonthDay(
    year,
    month,
    day
) {

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );

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

        const rows =
            Array.isArray(data)
                ? data
                : [];

        window.currentDailyAttendanceRows =
            rows;

        renderDailyAttendanceReport(rows);
        updateDailyAttendanceSummary(rows);

        if (rows.length === 0) {

            alert(
                "Không có dữ liệu để xuất cho ngày " +
                formatDailyAttendanceDate(date) +
                "."
            );

            return;

        }

        const html =
            buildDailyAttendanceExcelHtml(
                rows,
                date
            );

        downloadDailyAttendanceExcel(
            html,
            "bang-cong-ngay-" +
            date +
            ".xls"
        );

    } catch (error) {

        console.error(
            "exportDailyAttendanceReport:",
            error
        );

        alert(
            "Không xuất được bảng công ngày."
        );

    }

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
function getReportExportEmployeeCode(item) {

    return String(
        item.manv ||
        item.maNV ||
        item.MaNV ||
        item.MaNv ||
        ""
    ).trim();

}



function downloadMonthlyReportExcel(
    html,
    filename
) {

    const blob =
        new Blob(
            ["\ufeff" + html],
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
        filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}