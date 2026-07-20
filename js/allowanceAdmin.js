let allowanceAdminLoaded = false;

let employeeAllowanceList = [];
let siteAllowanceExcludeList = [];


// ========================================
// LOAD PHỤ CẤP ADMIN
// ========================================

async function loadAllowanceAdmin() {

    if (allowanceAdminLoaded) {

        return;

    }

    initAllowancePeriod();

    await loadEmployeeAllowances();
    await loadSiteAllowanceExcludes();

    allowanceAdminLoaded = true;

}


// ========================================
// INIT THÁNG/NĂM
// ========================================

function initAllowancePeriod() {

    const now =
        new Date();

    const currentMonth =
        now.getMonth() + 1;

    const currentYear =
        now.getFullYear();

    const allowanceMonth =
        document.getElementById("allowanceMonth");

    const allowanceYear =
        document.getElementById("allowanceYear");

    if (
        allowanceMonth &&
        !allowanceMonth.value
    ) {

        const payrollMonth =
            document.getElementById("payrollConfigMonth");

        allowanceMonth.value =
            payrollMonth && payrollMonth.value
                ? payrollMonth.value
                : currentMonth;

    }

    if (
        allowanceYear &&
        !allowanceYear.value
    ) {

        const payrollYear =
            document.getElementById("payrollConfigYear");

        allowanceYear.value =
            payrollYear && payrollYear.value
                ? payrollYear.value
                : currentYear;

    }

}


// ========================================
// LOAD PHỤ CẤP NHÂN VIÊN
// ========================================

async function loadEmployeeAllowances() {

    try {

        initAllowancePeriod();

        const month =
            document.getElementById("allowanceMonth")?.value || "";

        const year =
            document.getElementById("allowanceYear")?.value || "";

        const keyword =
            document.getElementById("allowanceKeyword")?.value || "";

        const pb =
            document.getElementById("allowancePb")?.value || "";

        if (!month || !year) {

            alert("Vui lòng chọn tháng/năm.");

            return;

        }

        employeeAllowanceList =
            await apiGet(
                "employeeAllowanceList",
                {
                    month:
                        month,

                    year:
                        year,

                    keyword:
                        keyword,

                    pb:
                        pb
                }
            );

        renderEmployeeAllowances();

    }
    catch (error) {

        console.error(
            "loadEmployeeAllowances:",
            error
        );

        alert(
            "Không tải được phụ cấp nhân viên."
        );

    }

}


// ========================================
// RENDER PHỤ CẤP NHÂN VIÊN
// ========================================

function renderEmployeeAllowances() {

    const container =
        document.getElementById(
            "employeeAllowanceList"
        );

    if (!container) {

        return;

    }

    if (
        !employeeAllowanceList ||
        employeeAllowanceList.length === 0
    ) {

        container.innerHTML =
            "<p>Không có nhân viên phù hợp.</p>";

        return;

    }

    container.innerHTML =
        '<div class="table-scroll">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Mã NV</th>' +
                        '<th>Họ tên</th>' +
                        '<th>Phòng ban</th>' +
                        '<th>Điện thoại</th>' +
                        '<th>Xăng xe</th>' +
                        '<th>Trách nhiệm</th>' +
                        '<th>Ghi chú</th>' +
                        '<th>Trạng thái</th>' +
                        '<th>Cập nhật</th>' +
                        '<th>Thao tác</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    employeeAllowanceList.map(function(item) {

                        const rowId =
                            buildAllowanceRowId(
                                item.manv
                            );

                        return (
                            '<tr>' +
                                '<td>' + escapeHtml(item.manv) + '</td>' +
                                '<td>' + escapeHtml(item.hoten) + '</td>' +
                                '<td>' + escapeHtml(item.pb) + '</td>' +

                                '<td>' +
                                    '<input class="table-input" id="' + rowId + '_phone" value="' +
                                       escapeHtml(formatAllowanceMoneyInput(item.phuCapDienThoai)) +
                                    '">' +
                                '</td>' +

                                '<td>' +
                                    '<input class="table-input" id="' + rowId + '_fuel" value="' +
                                        escapeHtml(formatAllowanceMoneyInput(item.phuCapXangXe)) +
                                    '">' +
                                '</td>' +

                                '<td>' +
                                    '<input class="table-input" id="' + rowId + '_responsibility" value="' +
                                        escapeHtml(formatAllowanceMoneyInput(item.phuCapTrachNhiem)) +
                                    '">' +
                                '</td>' +

                                '<td>' +
                                    '<input class="table-input table-note" id="' + rowId + '_note" value="' +
                                        escapeHtml(item.ghiChu || "") +
                                    '">' +
                                '</td>' +
                                '<td>' +
    renderAllowanceStatus(item) +
'</td>' +
                                '<td>' +
                                    escapeHtml(item.updatedBy || "") +
                                    '<br>' +
                                    formatAllowanceDateTime(item.updatedAt) +
                                '</td>' +

                                '<td>' +
                                    '<div class="action-buttons">' +
                                        '<button type="button" class="btn btn-sm btn-primary" onclick="saveAllowanceRow(\'' +
                                            escapeHtml(item.manv) +
                                        '\')">Lưu</button>' +

                                        '<button type="button" class="btn btn-sm btn-danger" onclick="resetAllowanceRow(\'' +
                                            escapeHtml(item.manv) +
                                        '\')">Reset</button>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>'
                        );

                    }).join("") +
                '</tbody>' +
            '</table>' +
        '</div>';

}


// ========================================
// LƯU 1 DÒNG PHỤ CẤP
// ========================================

async function saveAllowanceRow(manv) {

    const month =
        document.getElementById("allowanceMonth")?.value || "";

    const year =
        document.getElementById("allowanceYear")?.value || "";

    const rowId =
        buildAllowanceRowId(manv);

    const currentItem =
        employeeAllowanceList.find(function(item) {
            return item.manv === manv;
        });

    const oldPhone =
        Number(currentItem?.phuCapDienThoai || 0);

    const oldFuel =
        Number(currentItem?.phuCapXangXe || 0);

    const oldResponsibility =
        Number(currentItem?.phuCapTrachNhiem || 0);

    const hasOldAllowance =
        oldPhone > 0 ||
        oldFuel > 0 ||
        oldResponsibility > 0 ||
        String(currentItem?.ghiChu || "").trim() !== "" ||
        String(currentItem?.updatedAt || "").trim() !== "" ||
        String(currentItem?.updatedBy || "").trim() !== "";

    if (hasOldAllowance) {

        const ok =
            confirm(
                "Nhân viên " +
                manv +
                " đã có phụ cấp tháng " +
                month +
                "/" +
                year +
                ".\n\n" +
                "Điện thoại cũ: " +
                formatAllowanceMoneyInput(oldPhone) +
                "\n" +
                "Xăng xe cũ: " +
                formatAllowanceMoneyInput(oldFuel) +
                "\n" +
                "Trách nhiệm cũ: " +
                formatAllowanceMoneyInput(oldResponsibility) +
                "\n\n" +
                "Xác nhận lưu đè?"
            );

        if (!ok) {

            return;

        }

    }

    const user =
        getCurrentUser() || {};

    const updatedBy =
        user.manv
            ? user.manv + " - " + (user.hoten || "")
            : "Admin";

    const payload = {

        month:
            month,

        year:
            year,

        manv:
            manv,

        phuCapDienThoai:
            document.getElementById(rowId + "_phone")?.value || 0,

        phuCapXangXe:
            document.getElementById(rowId + "_fuel")?.value || 0,

        phuCapTrachNhiem:
            document.getElementById(rowId + "_responsibility")?.value || 0,

        ghiChu:
            document.getElementById(rowId + "_note")?.value || "",

        updatedBy:
            updatedBy,

        actorManv:
            user.manv || ""

    };

    try {

        const result =
            await apiPostText(
                "saveEmployeeAllowance",
                payload
            );

        if (result !== "OK") {

            alert(result);

            return;

        }

        alert("Đã lưu phụ cấp.");

        await loadEmployeeAllowances();

    }
    catch (error) {

        console.error(
            "saveAllowanceRow:",
            error
        );

        alert(
            "Không lưu được phụ cấp."
        );

    }

}


// ========================================
// RESET 1 DÒNG PHỤ CẤP
// ========================================

async function resetAllowanceRow(manv) {

    const ok =
        confirm(
            "Xác nhận reset phụ cấp tháng của nhân viên " +
            manv +
            "?"
        );

    if (!ok) {

        return;

    }

    const month =
        document.getElementById("allowanceMonth")?.value || "";

    const year =
        document.getElementById("allowanceYear")?.value || "";

    const user =
        getCurrentUser() || {};

    try {

        const result =
            await apiPostText(
                "resetEmployeeAllowance",
                {
                    month:
                        month,

                    year:
                        year,

                    manv:
                        manv,

                    actorManv:
                        user.manv || ""
                }
            );

        if (result !== "OK") {

            alert(result);

            return;

        }

        await loadEmployeeAllowances();

    }
    catch (error) {

        console.error(
            "resetAllowanceRow:",
            error
        );

        alert(
            "Không reset được phụ cấp."
        );

    }

}


// ========================================
// LOAD LOẠI TRỪ PHỤ CẤP CT
// ========================================

async function loadSiteAllowanceExcludes() {

    try {

        const keyword =
            document.getElementById("excludeAllowanceKeyword")?.value || "";

        const pb =
            document.getElementById("excludeAllowancePb")?.value || "";

        siteAllowanceExcludeList =
            await apiGet(
                "siteAllowanceExcludeList",
                {
                    keyword:
                        keyword,

                    pb:
                        pb
                }
            );

        renderSiteAllowanceExcludes();

    }
    catch (error) {

        console.error(
            "loadSiteAllowanceExcludes:",
            error
        );

        alert(
            "Không tải được loại trừ phụ cấp công trình."
        );

    }

}


// ========================================
// RENDER LOẠI TRỪ PHỤ CẤP CT
// ========================================

function renderSiteAllowanceExcludes() {

    const container =
        document.getElementById(
            "siteAllowanceExcludeList"
        );

    if (!container) {

        return;

    }

    if (
        !siteAllowanceExcludeList ||
        siteAllowanceExcludeList.length === 0
    ) {

        container.innerHTML =
            "<p>Không có nhân viên phù hợp.</p>";

        return;

    }

    container.innerHTML =
        '<div class="table-scroll">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Mã NV</th>' +
                        '<th>Họ tên</th>' +
                        '<th>Phòng ban</th>' +
                        '<th>Không tính PC CT</th>' +
                        '<th>Lý do</th>' +
                        '<th>Cập nhật</th>' +
                        '<th>Thao tác</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    siteAllowanceExcludeList.map(function(item) {

                        const rowId =
                            buildExcludeRowId(
                                item.manv
                            );

                        return (
                            '<tr>' +
                                '<td>' + escapeHtml(item.manv) + '</td>' +
                                '<td>' + escapeHtml(item.hoten) + '</td>' +
                                '<td>' + escapeHtml(item.pb) + '</td>' +

                                '<td>' +
                                    '<select class="table-input" id="' + rowId + '_excluded">' +
                                        '<option value="Không" ' + (item.khongTinhPhuCapCT === "Không" ? "selected" : "") + '>Không</option>' +
                                        '<option value="Có" ' + (item.khongTinhPhuCapCT === "Có" ? "selected" : "") + '>Có</option>' +
                                    '</select>' +
                                '</td>' +

                                '<td>' +
                                    '<input class="table-input table-note" id="' + rowId + '_reason" value="' +
                                        escapeHtml(item.lyDo || "") +
                                    '">' +
                                '</td>' +

                                '<td>' +
                                    escapeHtml(item.updatedBy || "") +
                                    '<br>' +
                                    formatAllowanceDateTime(item.updatedAt) +
                                '</td>' +

                                '<td>' +
                                    '<button type="button" class="btn btn-sm btn-primary" onclick="saveExcludeRow(\'' +
                                        escapeHtml(item.manv) +
                                    '\')">Lưu</button>' +
                                '</td>' +
                            '</tr>'
                        );

                    }).join("") +
                '</tbody>' +
            '</table>' +
        '</div>';

}


// ========================================
// LƯU LOẠI TRỪ PC CT
// ========================================

async function saveExcludeRow(manv) {

    const rowId =
        buildExcludeRowId(manv);

    const user =
        getCurrentUser() || {};

    const updatedBy =
        user.manv
            ? user.manv + " - " + (user.hoten || "")
            : "Admin";

    const payload = {

        manv:
            manv,

        khongTinhPhuCapCT:
            document.getElementById(rowId + "_excluded")?.value || "Không",

        lyDo:
            document.getElementById(rowId + "_reason")?.value || "",

        updatedBy:
            updatedBy,

        actorManv:
            user.manv || ""

    };

    try {

        const result =
            await apiPostText(
                "saveSiteAllowanceExclude",
                payload
            );

        if (result !== "OK") {

            alert(result);

            return;

        }

        await loadSiteAllowanceExcludes();

    }
    catch (error) {

        console.error(
            "saveExcludeRow:",
            error
        );

        alert(
            "Không lưu được loại trừ phụ cấp công trình."
        );

    }

}


// ========================================
// HELPER
// ========================================

function buildAllowanceRowId(manv) {

    return "allowance_" +
        String(manv || "")
            .replace(/[^a-zA-Z0-9]/g, "_");

}


function buildExcludeRowId(manv) {

    return "exclude_" +
        String(manv || "")
            .replace(/[^a-zA-Z0-9]/g, "_");

}


function formatAllowanceDateTime(value) {

    if (!value) {

        return "";

    }

    const date =
        new Date(value);

    if (
        isNaN(date.getTime())
    ) {

        return String(value || "");

    }

    return date.toLocaleString("vi-VN");

}
function renderAllowanceStatus(item) {

    const total =
        Number(item.phuCapDienThoai || 0) +
        Number(item.phuCapXangXe || 0) +
        Number(item.phuCapTrachNhiem || 0);

    if (total > 0 || item.ghiChu) {

        return '<span class="status-active">Đã nhập</span>';

    }

    return '<span class="status-pending">Chưa nhập</span>';

}
function formatAllowanceMoneyInput(value) {

    const numberValue =
        Number(value || 0);

    if (!numberValue) {

        return "0";

    }

    return numberValue.toLocaleString("vi-VN");

}