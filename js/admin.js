// ========================================
// ADMIN STATE
// ========================================

let adminReportLoaded = false;

let adminContractLoaded = false;

let adminLeaveLoaded = false;

let adminAdvanceLoaded = false;

let adminPayrollLoaded = false;

let adminAttendanceAdjustmentLoaded = false;

let adminSystemLogLoaded = false;
// ========================================
// INIT ADMIN
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);


async function initAdmin() {

    const user =
        getCurrentUser();

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }

    if (!isAdminOrManager(user)) {

        alert("Bạn không có quyền vào trang quản trị.");

        window.location.href =
            "index.html";

        return;

    }

    setupAdminNavigation();
    applyAdminMenuByRole(user);
setAdminHeaderUser(user);
    const role =
    String(user.role || "")
        .trim()
        .toLowerCase();

if (
    role === "quanly" ||
    role === "quản lý"
) {

    showAdminSection(
        "workAssignmentSection"
    );

    if (typeof loadWorkAssignmentAdmin === "function") {
        loadWorkAssignmentAdmin();
    }

} else {

    showAdminSection(
        "siteSection"
    );

}

    await loadEmployeeDepartments();

    await Promise.all([
        loadDashboard(),
        loadDanhSachCongTrinh(),
        loadNhanVien()
    ]);

}

// ========================================
// MENU ADMIN
// ========================================

function setupAdminNavigation() {

    const navigation = [

        {
            buttonId: "btnSite",
            sectionId: "siteSection"
        },

        {
            buttonId: "btnEmployee",
            sectionId: "employeeSection"
        },

        {
            buttonId: "btnReport",
            sectionId: "reportSection",
            onOpen: async function() {

                if (!adminReportLoaded) {

                    if (
                        typeof initReport === "function"
                    ) {

                        await initReport();

                    }


                    if (
                        typeof initReportDetail === "function"
                    ) {

                        await initReportDetail();

                    }


                    adminReportLoaded = true;

                }

            }
        },

        {
            buttonId: "btnContract",
            sectionId: "contractSection",
            onOpen: async function() {

                if (
                    !adminContractLoaded &&
                    typeof loadContractAdmin === "function"
                ) {

                    await loadContractAdmin();

                    adminContractLoaded = true;

                }

            }
        },
        {
    buttonId: "btnLeave",
    sectionId: "leaveSection",
    onOpen: async function() {

        if (
            !adminLeaveLoaded &&
            typeof loadLeaveAdmin === "function"
        ) {

            await loadLeaveAdmin();

            adminLeaveLoaded = true;

        }

    }
},
{
    buttonId: "btnAdvance",
    sectionId: "advanceSection",
    onOpen: async function() {

        if (
            !adminAdvanceLoaded &&
            typeof loadAdvanceAdmin === "function"
        ) {

            await loadAdvanceAdmin();

            adminAdvanceLoaded = true;

        }

    }
},
{
  buttonId: "btnPayroll",
  sectionId: "payrollSection",
  onOpen: async function() {
    if (
      typeof loadPayrollAdmin === "function"
    ) {
      await loadPayrollAdmin();
    }

    if (
      typeof loadAllowanceAdmin === "function"
    ) {
      await loadAllowanceAdmin();
    }
  }
},
{
    buttonId: "btnAttendanceAdjustment",
    sectionId: "attendanceAdjustmentSection",
    onOpen: async function() {

        if (
            !adminAttendanceAdjustmentLoaded &&
            typeof loadAttendanceAdjustmentAdmin === "function"
        ) {

            await loadAttendanceAdjustmentAdmin();

            adminAttendanceAdjustmentLoaded = true;

        }

    }
},
{
    buttonId: "btnSystemLog",
    sectionId: "systemLogSection",
    onOpen: async function() {

        if (
            !adminSystemLogLoaded &&
            typeof loadSystemLogAdmin === "function"
        ) {

            await loadSystemLogAdmin();

            adminSystemLogLoaded = true;

        }

    }
}


    ];


    navigation.forEach(function(item) {

        const button =
            document.getElementById(
                item.buttonId
            );


        if (!button) {

            console.warn(
                "Không tìm thấy nút:",
                item.buttonId
            );

            return;

        }


        button.addEventListener(
            "click",
            async function() {

                showAdminSection(
                    item.sectionId
                );


                if (
                    typeof item.onOpen === "function"
                ) {

                    try {

                        await item.onOpen();

                    }
                    catch (error) {

                        console.error(
                            "Open section error:",
                            error
                        );

                    }

                }

            }
        );

    });

}


// ========================================
// SHOW SECTION
// ========================================

function showAdminSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(function(section) {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "";

        });

    const target =
        document.getElementById(
            sectionId
        );

    if (target) {

        target.classList.add(
            "active"
        );

        target.style.display =
            "";

    }

}
function setAdminHeaderUser(user) {

    const element =
        document.getElementById("adminUserInfo");

    if (!element) {
        return;
    }

    element.innerHTML =
        escapeHtml(user.manv || "") +
        " - " +
        escapeHtml(user.hoten || "") +
        " - " +
        escapeHtml(user.role || "");

}
function applyAdminMenuByRole(user) {

    const role =
        String(user.role || "")
            .trim()
            .toLowerCase();

    if (
        role !== "quanly" &&
        role !== "quản lý"
    ) {
        return;
    }

    const hideButtonIds = [
        "btnSite",
        "btnEmployee",
        "btnAttendance",
        "btnAttendanceAdjustment",
        "btnReport",
        "btnContract",
        "btnLeave",
        "btnAdvance",
        "btnPayroll",
        "btnSystemLog"
    ];

    hideButtonIds.forEach(function(id) {

        const button =
            document.getElementById(id);

        if (button) {
            button.style.display = "none";
        }

    });

}