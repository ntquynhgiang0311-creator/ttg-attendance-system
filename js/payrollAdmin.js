// ========================================
// PAYROLL ADMIN STATE
// ========================================

let payrollAdminLoaded = false;


// ========================================
// INIT PAYROLL ADMIN
// ========================================

async function loadPayrollAdmin() {

    if (payrollAdminLoaded) {

        return;

    }

    initPayrollConfigMonthYear();

    initPayrollDraftMonthYear();

    await loadPayrollDraftDepartments();

    await loadPayrollConfig();

    payrollAdminLoaded = true;

}


// ========================================
// INIT THÁNG / NĂM
// ========================================

function initPayrollConfigMonthYear() {

    const monthSelect =
        document.getElementById("payrollConfigMonth");

    const yearSelect =
        document.getElementById("payrollConfigYear");

    const currentMonth =
        new Date().getMonth() + 1;

    const currentYear =
        new Date().getFullYear();

    if (monthSelect) {

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
// LOAD CẤU HÌNH CÔNG CHUẨN
// ========================================

async function loadPayrollConfig() {

    try {

        const month =
            document.getElementById("payrollConfigMonth")?.value || "";

        const year =
            document.getElementById("payrollConfigYear")?.value || "";

        if (!month || !year) {

            alert("Vui lòng chọn tháng/năm.");

            return;

        }

        const data =
            await apiGet(
                "payrollConfig",
                {
                    month: month,
                    year: year
                }
            );

        if (!data || data.success === false) {

            alert(
                data.message ||
                "Không tải được cấu hình lương."
            );

            return;

        }

        setPayrollValue(
            "payrollStandardDays",
            data.congChuan
        );

        setPayrollValue(
            "payrollConfigNote",
            data.ghiChu
        );

        setPayrollValue(
            "payrollConfigSource",
            data.source === "manual"
                ? "Thủ công"
                : "Tự động"
        );

        const info =
            document.getElementById("payrollConfigInfo");

        if (info) {

            info.innerHTML =
                data.source === "manual"
                    ? `Đang dùng công chuẩn thủ công. Cập nhật bởi: ${escapeHtml(data.updatedBy || "")}`
                    : "Đang tự tính: số ngày trong tháng trừ Chủ nhật.";

        }

    }
    catch (error) {

        console.error(
            "loadPayrollConfig:",
            error
        );

        alert(
            "Không tải được cấu hình công chuẩn."
        );

    }

}


// ========================================
// LƯU CÔNG CHUẨN
// ========================================

async function savePayrollConfigFromAdmin() {

    const month =
        document.getElementById("payrollConfigMonth")?.value || "";

    const year =
        document.getElementById("payrollConfigYear")?.value || "";

    const congChuan =
        document.getElementById("payrollStandardDays")?.value || "";

    const ghiChu =
        document.getElementById("payrollConfigNote")?.value || "";

    const user =
        getCurrentUser() || {};

    if (!month || !year) {

        alert("Vui lòng chọn tháng/năm.");

        return;

    }

    if (
        !congChuan ||
        Number(congChuan) <= 0 ||
        Number(congChuan) > 31
    ) {

        alert("Công chuẩn phải từ 1 đến 31.");

        return;

    }

    const ok =
        confirm(
            "Xác nhận lưu công chuẩn tháng này?"
        );

    if (!ok) {

        return;

    }

    try {

        const result =
            await apiPostText(
                "savePayrollConfig",
                {
    month:
        month,

    year:
        year,

    congChuan:
        congChuan,

    standardDays:
        congChuan,

    ghiChu:
        ghiChu,

    note:
        ghiChu,

    updatedBy:
        user.manv
            ? user.manv + " - " + (user.hoten || "")
            : "Admin",

    actorManv:
        user.manv || ""
}
            );

        if (result !== "OK") {

            alert(result);

            return;

        }

        alert("Đã lưu công chuẩn.");

        await loadPayrollConfig();

    }
    catch (error) {

        console.error(
            "savePayrollConfigFromAdmin:",
            error
        );

        alert(
            "Không lưu được công chuẩn."
        );

    }

}


// ========================================
// RESET VỀ TỰ ĐỘNG
// ========================================

async function resetPayrollConfigFromAdmin() {

    const month =
        document.getElementById("payrollConfigMonth")?.value || "";

    const year =
        document.getElementById("payrollConfigYear")?.value || "";

    const user =
        getCurrentUser() || {};

    if (!month || !year) {

        alert("Vui lòng chọn tháng/năm.");

        return;

    }

    const ok =
        confirm(
            "Xác nhận reset công chuẩn về tự động tính?"
        );

    if (!ok) {

        return;

    }

    try {

        const result =
            await apiPostText(
                "resetPayrollConfig",
                {
                    month:
                        month,

                    year:
                        year,

                    actorManv:
                        user.manv || ""
                }
            );

        if (result !== "OK") {

            alert(result);

            return;

        }

        alert("Đã reset công chuẩn về tự động.");

        await loadPayrollConfig();

    }
    catch (error) {

        console.error(
            "resetPayrollConfigFromAdmin:",
            error
        );

        alert(
            "Không reset được công chuẩn."
        );

    }

}


// ========================================
// HELPER
// ========================================

function setPayrollValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.value =
        value || "";

}
// ========================================
// PAYROLL DRAFT STATE
// ========================================

let currentPayrollDraft = null;


// ========================================
// INIT BẢNG LƯƠNG THÁNG / NĂM
// ========================================

function initPayrollDraftMonthYear() {

    const monthSelect =
        document.getElementById("payrollDraftMonth");

    const yearSelect =
        document.getElementById("payrollDraftYear");

    const currentMonth =
        new Date().getMonth() + 1;

    const currentYear =
        new Date().getFullYear();

    if (monthSelect) {

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
// LOAD PHÒNG BAN CHO BẢNG LƯƠNG
// ========================================

async function loadPayrollDraftDepartments() {

    const select =
        document.getElementById("payrollDraftPB");

    if (!select) {

        return;

    }

    try {

        const departments =
            await apiGet("departments");

        select.innerHTML = `

            <option value="all">

                Tất cả phòng ban

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
            "loadPayrollDraftDepartments:",
            error
        );

    }

}


// ========================================
// LOAD BẢNG LƯƠNG NHÁP
// ========================================

async function loadPayrollDraft() {

    const month =
        document.getElementById("payrollDraftMonth")?.value || "";

    const year =
        document.getElementById("payrollDraftYear")?.value || "";

    const pb =
        document.getElementById("payrollDraftPB")?.value || "all";

    if (!month || !year) {

        alert("Vui lòng chọn tháng/năm.");

        return;

    }

    try {

        const data =
            await apiGet(
                "payrollDraft",
                {
                    month: month,
                    year: year,
                    pb: pb
                }
            );

        if (!data || data.success === false) {

            alert(
                data.message ||
                "Không tính được bảng lương."
            );

            return;

        }

        currentPayrollDraft =
            data;

        renderPayrollDraft(data);

    }
    catch (error) {

        console.error(
            "loadPayrollDraft:",
            error
        );

        alert(
            "Không tải được bảng lương nháp."
        );

    }

}


// ========================================
// RENDER BẢNG LƯƠNG NHÁP
// ========================================

function renderPayrollDraft(data) {

    updatePayrollDraftSummary(
        data.summary || {}
    );

    const container =
        document.getElementById("payrollDraftTable");

    if (!container) {

        return;

    }

    const rows =
        data.rows || [];

    if (rows.length === 0) {

        container.innerHTML =
            `<p>Không có dữ liệu bảng lương.</p>`;

        return;

    }

    container.innerHTML = `

        <div class="payroll-table-scroll">

            <table>

                <thead>

                    <tr>
                        <th>Mã NV</th>
                        <th>Họ tên</th>
                        <th>PB</th>
                        <th>HĐ</th>
                        <th>Công chuẩn</th>
                        <th>Lương cơ bản</th>
                        <th>Phụ cấp</th>
                        <th>Lương ngày</th>
                        <th>Ngày công</th>
                        <th>Nghỉ phép</th>
                        <th>Không lương</th>
                        <th>Tiền công</th>
                        <th>Tiền nghỉ phép</th>
                        <th>Tổng thu nhập</th>
                        <th>Tạm ứng</th>
                        <th>Thực lãnh</th>
                        <th>Ghi chú</th>
                    </tr>

                </thead>

                <tbody>

                    ${rows.map(function(row) {

                        return `

                            <tr class="${row.ghiChu ? "payroll-warning-row" : ""}">

                                <td>${escapeHtml(row.manv)}</td>

                                <td>${escapeHtml(row.hoten)}</td>

                                <td>${escapeHtml(row.pb)}</td>

                                <td>${escapeHtml(row.mahd)}</td>

                                <td>${escapeHtml(row.congChuan)}</td>

                                <td>${formatPayrollMoney(row.luongCoBan)}</td>

                                <td>${formatPayrollMoney(row.phuCap)}</td>

                                <td>${formatPayrollMoney(row.luongNgay)}</td>

                                <td>${formatPayrollNumber(row.ngayCong)}</td>

                                <td>${formatPayrollNumber(row.nghiPhepCoLuong)}</td>

                                <td>${formatPayrollNumber(row.nghiKhongLuong)}</td>

                                <td>${formatPayrollMoney(row.tienCong)}</td>

                                <td>${formatPayrollMoney(row.tienNghiPhep)}</td>

                                <td>${formatPayrollMoney(row.tongThuNhap)}</td>

                                <td>${formatPayrollMoney(row.tamUng)}</td>

                                <td>
                                    <b>${formatPayrollMoney(row.thucLanh)}</b>
                                </td>

                                <td>${escapeHtml(row.ghiChu)}</td>

                            </tr>

                        `;

                    }).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ========================================
// SUMMARY
// ========================================

function updatePayrollDraftSummary(summary) {

    setPayrollText(
        "payrollTotalEmployees",
        summary.tongNhanVien || 0
    );

    setPayrollText(
        "payrollTotalIncome",
        formatPayrollMoney(
            summary.tongThuNhap || 0
        )
    );

    setPayrollText(
        "payrollTotalAdvance",
        formatPayrollMoney(
            summary.tongTamUng || 0
        )
    );

    setPayrollText(
        "payrollTotalNet",
        formatPayrollMoney(
            summary.tongThucLanh || 0
        )
    );

}

function getPayrollDraftRowsForExport() {

    if (
        typeof payrollDraftList !== "undefined" &&
        Array.isArray(payrollDraftList)
    ) {

        return payrollDraftList;

    }

    if (
        typeof payrollDraftData !== "undefined" &&
        Array.isArray(payrollDraftData)
    ) {

        return payrollDraftData;

    }

    if (
        typeof currentPayrollDraft !== "undefined" &&
        Array.isArray(currentPayrollDraft)
    ) {

        return currentPayrollDraft;

    }

    if (
        typeof payrollDraftRows !== "undefined" &&
        Array.isArray(payrollDraftRows)
    ) {

        return payrollDraftRows;

    }

    return [];

}
// ========================================
// EXPORT BẢNG LƯƠNG NHÁP
// ========================================

function exportPayrollDraft() {

    const table =
        getPayrollDraftTableForExport();

    if (!table) {

        alert("Không tìm thấy bảng lương nháp để xuất.");

        return;

    }

    const month =
        document.getElementById("payrollDraftMonth")?.value || "";

    const year =
        document.getElementById("payrollDraftYear")?.value || "";

    const clonedTable =
        table.cloneNode(true);

    clonedTable
        .querySelectorAll("button, input, select")
        .forEach(function(element) {
            element.remove();
        });

    clonedTable
        .querySelectorAll("th")
        .forEach(function(th) {
            th.style.backgroundColor = "#15803d";
            th.style.color = "#ffffff";
            th.style.fontWeight = "700";
            th.style.textAlign = "center";
            th.style.border = "1px solid #d9ead3";
            th.style.padding = "8px";
        });

    clonedTable
        .querySelectorAll("td")
        .forEach(function(td) {
            td.style.border = "1px solid #d9ead3";
            td.style.padding = "7px";
            td.style.verticalAlign = "middle";
        });

    clonedTable.style.borderCollapse =
        "collapse";

    clonedTable.style.fontFamily =
        "Arial, sans-serif";

    clonedTable.style.fontSize =
        "12px";

    clonedTable.style.width =
        "100%";

    const html =
        '<html>' +
            '<head>' +
                '<meta charset="UTF-8">' +
                '<style>' +
                    'body { font-family: Arial, sans-serif; }' +
                    '.title { font-size: 20px; font-weight: 700; color: #14532d; text-align: center; }' +
                    '.subtitle { font-size: 13px; color: #374151; text-align: center; }' +
                    '.summary-table td { border: 1px solid #bbf7d0; padding: 8px; font-weight: 700; }' +
                    '.summary-label { background: #dcfce7; color: #14532d; }' +
                    '.summary-value { color: #111827; }' +
                    'table { border-collapse: collapse; }' +
                    'td, th { mso-number-format:"\\@"; }' +
                    '.number { mso-number-format:"#,##0"; text-align: right; }' +
                    '.center { text-align: center; }' +
                '</style>' +
            '</head>' +
            '<body>' +

                '<table style="width:100%; border-collapse:collapse;">' +
                    '<tr>' +
                        '<td colspan="20" class="title">' +
                            'BẢNG LƯƠNG NHÁP' +
                        '</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="20" class="subtitle">' +
                            'Tháng ' +
                            escapeHtml(month) +
                            '/' +
                            escapeHtml(year) +
                        '</td>' +
                    '</tr>' +
                    '<tr><td colspan="20">&nbsp;</td></tr>' +
                '</table>' +

                buildPayrollExportSummaryHtml() +

                '<br>' +

                clonedTable.outerHTML +

            '</body>' +
        '</html>';

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
        "bang-luong-nhap-" +
        month +
        "-" +
        year +
        ".xls";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}


// ========================================
// FORMAT HELPER
// ========================================

function formatPayrollMoney(value) {

    const numberValue =
        Number(value || 0);

    if (!numberValue) {

        return "0";

    }

    return numberValue.toLocaleString(
        "vi-VN"
    );

}


function formatPayrollNumber(value) {

    const numberValue =
        Number(value || 0);

    if (
        Number.isInteger(numberValue)
    ) {

        return String(numberValue);

    }

    return numberValue.toFixed(2);

}


function setPayrollText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }

    element.textContent =
        value;

}


function payrollCsvEscape(value) {

    const text =
        String(value || "");

    return '"' +
        text.replace(/"/g, '""') +
        '"';

}
function formatPayrollExportNumber(value) {

    const numberValue =
        Number(value || 0);

    if (!numberValue) {

        return "0";

    }

    return numberValue.toLocaleString("vi-VN");

}
function getPayrollDraftTableForExport() {

    const selectors = [

        "#payrollDraftList table",

        "#payrollDraftResult table",

        "#payrollDraftContainer table",

        "#payrollDraftTable",

        "#payrollSection .payroll-draft-table",

        "#payrollSection table:last-of-type"

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
            table.querySelectorAll("tbody tr").length > 0
        ) {

            return table;

        }

    }

    return null;

}
function buildPayrollExportSummaryHtml() {

    const summaryItems = [

        {
            label: "Nhân viên",
            value: getPayrollSummaryText("payrollSummaryEmployees")
        },

        {
            label: "Tổng thu nhập",
            value: getPayrollSummaryText("payrollSummaryIncome")
        },

        {
            label: "Tạm ứng",
            value: getPayrollSummaryText("payrollSummaryAdvance")
        },

        {
            label: "Thực lãnh",
            value: getPayrollSummaryText("payrollSummaryNetPay")
        }

    ];

    let html =
        '<table class="summary-table" style="width:100%; border-collapse:collapse;">' +
            '<tr>';

    summaryItems.forEach(function(item) {

        html +=
            '<td class="summary-label">' +
                escapeHtml(item.label) +
            '</td>' +
            '<td class="summary-value">' +
                escapeHtml(item.value) +
            '</td>';

    });

    html +=
            '</tr>' +
        '</table>';

    return html;

}


function getPayrollSummaryText(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";

    }

    return String(
        element.innerText ||
        element.textContent ||
        ""
    ).trim();

}