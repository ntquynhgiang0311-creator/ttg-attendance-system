let workAssignmentSaving = false;
let workAssignmentList = [];
let workAssignmentEmployees = [];
let workAssignmentSites = [];
let editingWorkAssignment = "";

function openWorkAssignmentSection() {

    if (typeof showAdminSection === "function") {

        showAdminSection(
            "workAssignmentSection"
        );

    } else {

        document
            .querySelectorAll(".section")
            .forEach(function(section) {

                section.style.display =
                    "";

                section.classList.remove(
                    "active"
                );

            });

        const section =
            document.getElementById(
                "workAssignmentSection"
            );

        if (section) {

            section.style.display =
                "";

            section.classList.add(
                "active"
            );

        }

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

    const container =
        document.getElementById("workAssignmentEmployeeList");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(workAssignmentEmployees) ||
        workAssignmentEmployees.length === 0
    ) {

        container.innerHTML =
            '<p class="work-assignment-help">Không có nhân viên để phân công.</p>';

        updateSelectedWorkAssignmentEmployeeCount();

        return;

    }

    let html = "";

    workAssignmentEmployees.forEach(function(item) {

        const searchText =
            (
                item.manv +
                " " +
                item.hoten +
                " " +
                item.pb
            ).toLowerCase();

        html +=
            '<label class="work-assignment-employee-item" data-search="' +
                escapeHtml(searchText) +
            '">' +
                '<input ' +
                    'type="checkbox" ' +
                    'class="work-assignment-employee-checkbox" ' +
                    'value="' + escapeHtml(item.manv) + '" ' +
                    'onchange="updateSelectedWorkAssignmentEmployeeCount()"' +
                '> ' +
                '<span>' +
                    '<b>' + escapeHtml(item.manv) + '</b>' +
                    ' - ' +
                    escapeHtml(item.hoten) +
                    '<small>' + escapeHtml(item.pb) + '</small>' +
                '</span>' +
            '</label>';

    });

    container.innerHTML =
        html;

    updateSelectedWorkAssignmentEmployeeCount();

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

    if (workAssignmentSaving) {
        return;
    }

    workAssignmentSaving = true;

    const button =
        document.getElementById("btnSaveWorkAssignment");

    const oldButtonText =
        button ? button.innerHTML : "";

    if (button) {
        button.disabled = true;
        button.innerHTML = "⏳ Đang lưu...";
    }

    try {

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

        await loadWorkAssignmentMasters();

        await loadWorkAssignments();

        alert("Đã lưu phân công.");

    } catch (error) {

        console.error(
            "saveWorkAssignmentFromAdmin:",
            error
        );

        alert("Không lưu được phân công.");

    } finally {

        workAssignmentSaving = false;

        if (button) {
            button.disabled = false;
            button.innerHTML =
                oldButtonText || "💾 Lưu phân công";
        }

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

clearSelectedWorkAssignmentEmployees();

document
    .querySelectorAll(".work-assignment-employee-checkbox")
    .forEach(function(checkbox) {

        checkbox.checked =
            checkbox.value === item.manv;

    });

updateSelectedWorkAssignmentEmployeeCount();

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

clearSelectedWorkAssignmentEmployees();

const search =
    document.getElementById("workAssignmentEmployeeSearch");

if (search) {
    search.value = "";
}

filterWorkAssignmentEmployees();

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


window.getSelectedWorkAssignmentEmployees =
    getSelectedWorkAssignmentEmployees;

window.filterWorkAssignmentEmployees =
    filterWorkAssignmentEmployees;

window.selectAllVisibleWorkAssignmentEmployees =
    selectAllVisibleWorkAssignmentEmployees;

window.clearSelectedWorkAssignmentEmployees =
    clearSelectedWorkAssignmentEmployees;

window.updateSelectedWorkAssignmentEmployeeCount =
    updateSelectedWorkAssignmentEmployeeCount;
    function getSelectedWorkAssignmentEmployees() {

    return Array.from(
        document.querySelectorAll(
            ".work-assignment-employee-checkbox:checked"
        )
    )
        .map(function(checkbox) {
            return checkbox.value;
        })
        .filter(function(value) {
            return String(value || "").trim() !== "";
        });

}


function filterWorkAssignmentEmployees() {

    const keyword =
        String(
            document.getElementById("workAssignmentEmployeeSearch")?.value || ""
        )
            .trim()
            .toLowerCase();

    document
        .querySelectorAll(".work-assignment-employee-item")
        .forEach(function(item) {

            const searchText =
                String(item.dataset.search || "")
                    .toLowerCase();

            item.style.display =
                !keyword || searchText.indexOf(keyword) >= 0
                    ? "flex"
                    : "none";

        });

}


function selectAllVisibleWorkAssignmentEmployees() {

    document
        .querySelectorAll(".work-assignment-employee-item")
        .forEach(function(item) {

            if (item.style.display === "none") {
                return;
            }

            const checkbox =
                item.querySelector(
                    ".work-assignment-employee-checkbox"
                );

            if (checkbox) {
                checkbox.checked = true;
            }

        });

    updateSelectedWorkAssignmentEmployeeCount();

}


function clearSelectedWorkAssignmentEmployees() {

    document
        .querySelectorAll(".work-assignment-employee-checkbox")
        .forEach(function(checkbox) {
            checkbox.checked = false;
        });

    updateSelectedWorkAssignmentEmployeeCount();

}


function updateSelectedWorkAssignmentEmployeeCount() {

    const count =
        getSelectedWorkAssignmentEmployees().length;

    const element =
        document.getElementById("workAssignmentEmployeeCount");

    if (element) {
        element.innerHTML =
            "Đã chọn " + count + " nhân viên";
    }

}