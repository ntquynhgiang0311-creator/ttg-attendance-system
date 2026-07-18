// ========================================
// SYSTEM LOG ADMIN STATE
// ========================================

let systemLogAdminLoaded = false;
let systemLogList = [];


// ========================================
// INIT
// ========================================

async function loadSystemLogAdmin() {

    if (systemLogAdminLoaded) {
        return;
    }

    await loadSystemLogs();

    systemLogAdminLoaded = true;

}


// ========================================
// LOAD SYSTEM LOGS
// ========================================

async function loadSystemLogs() {

    try {

        const moduleElement =
            document.getElementById("systemLogModule");

        const keywordElement =
            document.getElementById("systemLogKeyword");

        const limitElement =
            document.getElementById("systemLogLimit");


        const moduleName =
            moduleElement
                ? moduleElement.value
                : "";

        const keyword =
            keywordElement
                ? keywordElement.value
                : "";

        const limit =
            limitElement
                ? limitElement.value
                : 100;


        systemLogList =
            await apiGet(
                "systemLogs",
                {
                    module: moduleName,
                    keyword: keyword,
                    limit: limit
                }
            );


        renderSystemLogs();

    }
    catch (error) {

        console.error(
            "loadSystemLogs:",
            error
        );

        alert(
            "Không tải được nhật ký hệ thống."
        );

    }

}


// ========================================
// RENDER
// ========================================

function renderSystemLogs() {

    const container =
        document.getElementById("systemLogList");

    if (!container) {
        return;
    }

    if (
        !systemLogList ||
        systemLogList.length === 0
    ) {

        container.innerHTML =
            "<p>Chưa có nhật ký phù hợp.</p>";

        return;

    }

    container.innerHTML =
        '<div class="system-log-table-scroll">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Thời gian</th>' +
                        '<th>Người thao tác</th>' +
                        '<th>Role</th>' +
                        '<th>Module</th>' +
                        '<th>Hành động</th>' +
                        '<th>Mã đối tượng</th>' +
                        '<th>Nội dung mới</th>' +
                        '<th>Ghi chú</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    systemLogList.map(function(item) {

                        return (
                            '<tr>' +

                                '<td>' +
                                    formatSystemLogDateTime(item.thoiGian) +
                                '</td>' +

                                '<td>' +
                                    escapeHtml(item.manv) +
                                    (
                                        item.hoten
                                            ? " - " + escapeHtml(item.hoten)
                                            : ""
                                    ) +
                                '</td>' +

                                '<td>' +
                                    escapeHtml(item.role) +
                                '</td>' +

                                '<td>' +
                                    renderSystemLogModule(item.module) +
                                '</td>' +

                                '<td>' +
                                    renderSystemLogAction(item.hanhDong) +
                                '</td>' +

                                '<td>' +
                                    escapeHtml(item.maDoiTuong) +
                                '</td>' +

                                '<td>' +
                                    '<pre class="system-log-json">' +
                                        escapeHtml(item.noiDungMoi) +
                                    '</pre>' +
                                '</td>' +

                                '<td>' +
                                    escapeHtml(item.ghiChu) +
                                '</td>' +

                            '</tr>'
                        );

                    }).join("") +
                '</tbody>' +
            '</table>' +
        '</div>';

}


// ========================================
// RENDER HELPER
// ========================================

function renderSystemLogModule(moduleName) {

    const text =
        String(moduleName || "");

    return (
        '<span class="system-log-module">' +
            escapeHtml(text) +
        '</span>'
    );

}


function renderSystemLogAction(action) {

    const text =
        String(action || "");

    if (text === "Đã duyệt") {

        return (
            '<span class="status-active">' +
                "Đã duyệt" +
            '</span>'
        );

    }

    if (text === "Từ chối") {

        return (
            '<span class="status-inactive">' +
                "Từ chối" +
            '</span>'
        );

    }

    return (
        '<span class="status-pending">' +
            escapeHtml(text) +
        '</span>'
    );

}


function formatSystemLogDateTime(value) {

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