let workAssignmentList = [];
let workAssignmentEmployees = [];
let workAssignmentSites = [];
let editingWorkAssignment = "";

function openWorkAssignmentSection() {

    document
        .querySelectorAll(".section")
        .forEach(function(section) {
            section.style.display = "none";
        });

    const section =
        document.getElementById("workAssignmentSection");

    if (section) {
        section.style.display = "block";
    }

    loadWorkAssignmentAdmin();

}


async function loadWorkAssignmentAdmin() {

    initWorkAssignmentDate();

    await loadWorkAssignmentMasters();

    await loadWorkAssignments();

}


function initWorkAssignmentDate() {

    const dateElement =
        document.getElementById("workAssignmentDate");

    if (
        dateElement &&
        !dateElement.value
    ) {

        const today =
            new Date();

        dateElement.value =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");

    }

}


async function loadWorkAssignmentMasters() {

    const user =
        getCurrentUser() || {};

    const pb =
        document.getElementById("workAssignmentPB")?.value || "all";

    workAssignmentEmployees =
        await apiGet(
            "workAssignmentEmployees",
            {
                actorManv: user.manv || "",
                pb: pb
            }
        );

    workAssignmentSites =
        await apiGet("sites");

    renderWorkAssignmentEmployeeOptions();

    renderWorkAssignmentSiteOptions();

}


function renderWorkAssignmentEmployeeOptions() {

    const select =
        document.getElementById("workAssignmentEmployee");

    if (!select) {
        return;
    }

    let html =
        '<option value="">-- Chọn nhân viên --</option>';

    workAssignmentEmployees.forEach(function(item) {

        html +=
            '<option value="' + escapeHtml(item.manv) + '">' +
                escapeHtml(item.manv) +
                " - " +
                escapeHtml(item.hoten) +
                " - " +
                escapeHtml(item.pb) +
            '</option>';

    });

    select.innerHTML =
        html;

}


function renderWorkAssignmentSiteOptions() {

    const select =
        document.getElementById("workAssignmentSite");

    if (!select) {
        return;
    }

    let html =
        '<option value="">-- Chọn vị trí/công trình --</option>';

    workAssignmentSites.forEach(function(item) {

        html +=
            '<option value="' + escapeHtml(item.ma) + '">' +
                escapeHtml(item.ma) +
                " - " +
                escapeHtml(item.ten) +
                " - " +
                escapeHtml(item.loai || "") +
            '</option>';

    });

    select.innerHTML =
        html;

}


async function loadWorkAssignments() {

    const user =
        getCurrentUser() || {};

    const date =
        document.getElementById("workAssignmentDate")?.value || "";

    const pb =
        document.getElementById("workAssignmentPB")?.value || "all";

    try {

        workAssignmentList =
            await apiGet(
                "workAssignments",
                {
                    date: date,
                    pb: pb,
                    actorManv: user.manv || ""
                }
            );

        renderWorkAssignments();

    } catch (error) {

        console.error(
            "loadWorkAssignments:",
            error
        );

        alert(
            "Không tải được danh sách phân công."
        );

    }

}


function renderWorkAssignments() {

    const container =
        document.getElementById("workAssignmentList");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(workAssignmentList) ||
        workAssignmentList.length === 0
    ) {

        container.innerHTML =
            "<p>Chưa có phân công trong ngày này.</p>";

        return;

    }

    let html =
        '<div class="table-wrapper">' +
        '<table>' +
        '<thead>' +
        '<tr>' +
        '<th>Ngày</th>' +
        '<th>Mã NV</th>' +
        '<th>Họ tên</th>' +
        '<th>PB</th>' +
        '<th>Vị trí phân công</th>' +
        '<th>Nội dung</th>' +
        '<th>Ghi chú</th>' +
        '<th>Thao tác</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';

    workAssignmentList.forEach(function(item) {

        html +=
            '<tr>' +
                '<td>' + escapeHtml(item.ngay) + '</td>' +
                '<td>' + escapeHtml(item.manv) + '</td>' +
                '<td>' + escapeHtml(item.hoten) + '</td>' +
                '<td>' + escapeHtml(item.pb) + '</td>' +
                '<td>' +
                    escapeHtml(item.maCTPhanCong) +
                    " - " +
                    escapeHtml(item.tenCTPhanCong) +
                '</td>' +
                '<td>' + escapeHtml(item.noiDungCongViec) + '</td>' +
                '<td>' + escapeHtml(item.ghiChu) + '</td>' +
                '<td>' +
                    '<button type="button" class="edit-btn" onclick="editWorkAssignment(\'' +
                        escapeHtml(item.maPhanCong) +
                    '\')">Sửa</button> ' +
                    '<button type="button" class="lock-btn" onclick="deleteWorkAssignmentFromAdmin(\'' +
                        escapeHtml(item.maPhanCong) +
                    '\')">Xóa</button>' +
                '</td>' +
            '</tr>';

    });

    html +=
        '</tbody>' +
        '</table>' +
        '</div>';

    container.innerHTML =
        html;

}


async function saveWorkAssignmentFromAdmin() {

    const user =
        getCurrentUser() || {};

    const date =
        document.getElementById("workAssignmentDate")?.value || "";

    const manv =
        document.getElementById("workAssignmentEmployee")?.value || "";

    const maCT =
        document.getElementById("workAssignmentSite")?.value || "";

    const noiDung =
        document.getElementById("workAssignmentContent")?.value || "";

    const ghiChu =
        document.getElementById("workAssignmentNote")?.value || "";

    if (!date) {
        alert("Vui lòng chọn ngày phân công.");
        return;
    }

    if (!manv) {
        alert("Vui lòng chọn nhân viên.");
        return;
    }

    if (!maCT) {
        alert("Vui lòng chọn vị trí/công trình.");
        return;
    }

    try {

        const result =
            await apiPostText(
                "saveWorkAssignment",
                {
                    maPhanCong: editingWorkAssignment,
                    ngay: date,
                    manv: manv,
                    maCTPhanCong: maCT,
                    noiDungCongViec: noiDung,
                    ghiChu: ghiChu,
                    actorManv: user.manv || ""
                }
            );

        if (result !== "OK") {
            alert(result);
            return;
        }

        resetWorkAssignmentForm();

        await loadWorkAssignments();

        alert("Đã lưu phân công.");

    } catch (error) {

        console.error(
            "saveWorkAssignmentFromAdmin:",
            error
        );

        alert("Không lưu được phân công.");

    }

}


function editWorkAssignment(maPhanCong) {

    const item =
        workAssignmentList.find(function(row) {
            return row.maPhanCong === maPhanCong;
        });

    if (!item) {
        alert("Không tìm thấy phân công.");
        return;
    }

    editingWorkAssignment =
        item.maPhanCong;

    document.getElementById("workAssignmentDate").value =
        item.ngay || "";

    document.getElementById("workAssignmentEmployee").value =
        item.manv || "";

    document.getElementById("workAssignmentSite").value =
        item.maCTPhanCong || "";

    document.getElementById("workAssignmentContent").value =
        item.noiDungCongViec || "";

    document.getElementById("workAssignmentNote").value =
        item.ghiChu || "";

    const button =
        document.getElementById("btnSaveWorkAssignment");

    if (button) {
        button.innerHTML =
            "💾 Cập nhật phân công";
    }

}


async function deleteWorkAssignmentFromAdmin(maPhanCong) {

    const user =
        getCurrentUser() || {};

    const ok =
        confirm("Xóa phân công này?");

    if (!ok) {
        return;
    }

    try {

        const result =
            await apiPostText(
                "deleteWorkAssignment",
                {
                    maPhanCong: maPhanCong,
                    actorManv: user.manv || ""
                }
            );

        if (result !== "OK") {
            alert(result);
            return;
        }

        await loadWorkAssignments();

    } catch (error) {

        console.error(
            "deleteWorkAssignmentFromAdmin:",
            error
        );

        alert("Không xóa được phân công.");

    }

}


function resetWorkAssignmentForm() {

    editingWorkAssignment =
        "";

    document.getElementById("workAssignmentEmployee").value =
        "";

    document.getElementById("workAssignmentSite").value =
        "";

    document.getElementById("workAssignmentContent").value =
        "";

    document.getElementById("workAssignmentNote").value =
        "";

    const button =
        document.getElementById("btnSaveWorkAssignment");

    if (button) {
        button.innerHTML =
            "💾 Lưu phân công";
    }

}


window.openWorkAssignmentSection =
    openWorkAssignmentSection;

window.loadWorkAssignmentAdmin =
    loadWorkAssignmentAdmin;

window.loadWorkAssignments =
    loadWorkAssignments;

window.saveWorkAssignmentFromAdmin =
    saveWorkAssignmentFromAdmin;

window.editWorkAssignment =
    editWorkAssignment;

window.deleteWorkAssignmentFromAdmin =
    deleteWorkAssignmentFromAdmin;

window.resetWorkAssignmentForm =
    resetWorkAssignmentForm;