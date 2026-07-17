// ========================================
// EMPLOYEE INDEX TABS
// ========================================

function showEmployeeTab(tabName) {

    const tabs = [

        {
            name: "attendance",
            contentId: "employeeTabAttendance",
            buttonId: "tabBtnAttendance"
        },

        {
            name: "leave",
            contentId: "employeeTabLeave",
            buttonId: "tabBtnLeave"
        },

        {
            name: "advance",
            contentId: "employeeTabAdvance",
            buttonId: "tabBtnAdvance"
        },

        {
            name: "adjustment",
            contentId: "employeeTabAdjustment",
            buttonId: "tabBtnAdjustment"
        }

    ];


    tabs.forEach(function(tab) {

        const content =
            document.getElementById(
                tab.contentId
            );

        const button =
            document.getElementById(
                tab.buttonId
            );


        if (content) {

            content.classList.toggle(
                "active",
                tab.name === tabName
            );

        }


        if (button) {

            button.classList.toggle(
                "active",
                tab.name === tabName
            );

        }

    });

}