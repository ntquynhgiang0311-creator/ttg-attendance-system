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

function exportReport() {

    if (
        !currentReportRows ||
        currentReportRows.length === 0
    ) {

        alert(
            "Không có dữ liệu để xuất."
        );

        return;

    }

    const headers = [

        "Mã NV",

        "Họ tên",

        "Ngày công",

        "Nghỉ phép",

        "Tổng giờ"

    ];

    const lines = [
        headers.join(",")
    ];

    currentReportRows.forEach(function(row) {

        const values = [

            row.manv,

            row.hoten,

            formatReportNumber(row.ngayCong),

            formatReportNumber(row.nghiPhep),

            formatReportNumber(row.tongGio)

        ];

        lines.push(
            values.map(csvEscape)
                .join(",")
        );

    });

    const blob = new Blob(
        [
            "\uFEFF" + lines.join("\n")
        ],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "bao-cao-thang.csv";

    link.click();

    URL.revokeObjectURL(url);

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