// ========================================
// ADMIN PAGE STATE
// ========================================

let adminAttendanceLoaded = false;
let adminReportLoaded = false;

// ========================================
// INIT
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);


// ========================================
// KHỞI TẠO ADMIN
// ========================================

async function initAdmin() {

    const user = getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    if (user.role !== "admin") {

        alert(
            "Bạn không có quyền truy cập."
        );

        window.location.href =
            "index.html";

        return;

    }


    setupAdminNavigation();


    showAdminSection(
        "siteSection"
    );


    try {

        await Promise.all([

            loadDashboard(),

            loadDanhSachCongTrinh(),

            loadNhanVien()

        ]);

    }
    catch (error) {

        console.error(
            "initAdmin:",
            error
        );


        alert(
            "Không tải được đầy đủ dữ liệu quản trị."
        );

    }

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
            buttonId: "btnAttendance",
            sectionId: "attendanceSection",
            onOpen: async function() {

                if (
                    !adminAttendanceLoaded &&
                    typeof loadAttendance === "function"
                ) {

                    await loadAttendance();

                    adminAttendanceLoaded = true;

                }

            }
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
// HIỂN THỊ SECTION
// ========================================

function showAdminSection(
    sectionId
) {

    const sectionIds = [

        "siteSection",

        "employeeSection",

        "attendanceSection",

        "reportSection"

    ];


    sectionIds.forEach(function(id) {

        const section =
            document.getElementById(id);


        if (!section) {

            return;

        }


        section.classList.toggle(

            "active",

            id === sectionId

        );

    });

}