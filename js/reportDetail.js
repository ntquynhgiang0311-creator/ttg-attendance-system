// ========================================
// REPORT DETAIL STATE
// ========================================

let reportDetailInitialized = false;


// ========================================
// INIT REPORT DETAIL
// ========================================

async function initReportDetail() {

    if (reportDetailInitialized) {

        return;

    }


    initDetailMonthYear();


    await loadReportEmployees();


    reportDetailInitialized = true;


    const employeeSelect =
        document.getElementById(
            "reportEmployee"
        );


    if (
        employeeSelect &&
        employeeSelect.value
    ) {

        await loadReportDetail();

    }

}


// ========================================
// LOAD NHÂN VIÊN CHO SELECT
// ========================================

async function loadReportEmployees() {

    try {

        const data = await apiGet(
            "employeeList"
        );


        const select =
            document.getElementById(
                "reportEmployee"
            );


        if (!select) {

            return;

        }


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            select.innerHTML = `

                <option value="">

                    Không có nhân viên

                </option>

            `;


            return;

        }


        select.innerHTML =
            data.map(function(x) {

                return `

                    <option value="${escapeHtml(x.manv)}">

                        ${escapeHtml(x.manv)}
                        -
                        ${escapeHtml(x.hoten)}

                    </option>

                `;

            }).join("");

    }
    catch (error) {

        console.error(
            "loadReportEmployees:",
            error
        );


        alert(
            "Không tải được danh sách nhân viên báo cáo."
        );

    }

}


// ========================================
// INIT THÁNG / NĂM CHI TIẾT
// ========================================

function initDetailMonthYear() {

    const monthElement =
        document.getElementById(
            "detailMonth"
        );


    const yearElement =
        document.getElementById(
            "detailYear"
        );


    if (monthElement) {

        let monthHtml = "";

        for (let i = 1; i <= 12; i++) {

            monthHtml += `

                <option value="${i}">
                    ${i}
                </option>

            `;

        }


        monthElement.innerHTML =
            monthHtml;


        monthElement.value =
            new Date().getMonth() + 1;

    }


    if (yearElement) {

        const currentYear =
            new Date().getFullYear();


        let yearHtml = "";

        for (
            let i = currentYear - 1;
            i <= currentYear + 1;
            i++
        ) {

            yearHtml += `

                <option value="${i}">
                    ${i}
                </option>

            `;

        }


        yearElement.innerHTML =
            yearHtml;


        yearElement.value =
            currentYear;

    }

}


// ========================================
// LOAD CHI TIẾT BÁO CÁO
// ========================================

async function loadReportDetail() {

    const manv =
        document
            .getElementById("reportEmployee")
            .value;


    const month =
        document
            .getElementById("detailMonth")
            .value;


    const year =
        document
            .getElementById("detailYear")
            .value;


    if (!manv) {

        renderReportDetail([]);

        return;

    }


    try {

        const data = await apiGet(

            "reportDetail",

            {

                manv:
                    manv,

                month:
                    month,

                year:
                    year

            }

        );


        renderReportDetail(data);

    }
    catch (error) {

        console.error(
            "loadReportDetail:",
            error
        );


        renderReportDetail([]);


        alert(
            "Không tải được chi tiết báo cáo."
        );

    }

}


// ========================================
// RENDER CHI TIẾT
// ========================================

function renderReportDetail(data) {

    const table =
        document.getElementById(
            "tableReportDetail"
        );


    if (!table) {

        return;

    }


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="8">

                    Không có dữ liệu chi tiết

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        data.map(function(x) {

            return `

                <tr>

                    <td>
                        ${escapeHtml(x.date)}
                    </td>

                    <td>
                        ${escapeHtml(x.site)}
                    </td>

                    <td>
                        ${escapeHtml(x.checkin)}
                    </td>

                    <td>
                        ${escapeHtml(x.checkout)}
                    </td>

                    <td>
                        ${escapeHtml(x.hours)}
                    </td>

                    <td>
                        ${escapeHtml(x.daywork)}
                    </td>

                    <td>
                        ${escapeHtml(x.ot)}
                    </td>

                    <td>
                        ${escapeHtml(x.late)}
                    </td>

                </tr>

            `;

        }).join("");

}