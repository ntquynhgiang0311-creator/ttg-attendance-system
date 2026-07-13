// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {

    try {

        const data = await apiGet(
            "dashboard"
        );


        setText(
            "tongNV",
            data.tongNV
        );


        setText(
            "tongCT",
            data.tongCT
        );


        setText(
            "checkin",
            data.checkin
        );


        setText(
            "chuacheckin",
            data.chuacheckin
        );

    }
    catch (error) {

        console.error(
            "loadDashboard:",
            error
        );


        setText("tongNV", "-");

        setText("tongCT", "-");

        setText("checkin", "-");

        setText("chuacheckin", "-");


        throw error;

    }

}


// ========================================
// SET TEXT AN TOÀN
// ========================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.innerHTML =
        escapeHtml(
            value ?? 0
        );

}