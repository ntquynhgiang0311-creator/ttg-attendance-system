// ========================================
// REPORT STATE
// ========================================

let reportInitialized = false;
let isExportingReport = false;


// ========================================
// INIT REPORT
// ========================================

async function initReport() {

    if (reportInitialized) {

        return;

    }


    initReportMonthYear();


    reportInitialized = true;


    await loadReport();

}


// ========================================
// INIT THÁNG / NĂM
// ========================================

function initReportMonthYear() {

    const monthElement =
        document.getElementById("reportMonth");


    const yearElement =
        document.getElementById("reportYear");


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
            i <= currentYear + 2;
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
// LẤY BỘ LỌC BÁO CÁO
// ========================================

function getReportFilters() {

    return {

        month:
            document
                .getElementById("reportMonth")
                .value,

        year:
            document
                .getElementById("reportYear")
                .value,

        pb:
            document
                .getElementById("reportPB")
                .value

    };

}


// ========================================
// LOAD BÁO CÁO TỔNG
// ========================================

async function loadReport() {

    try {

        const filters =
            getReportFilters();


        const ds = await apiGet(

            "report",

            {

                month:
                    filters.month,

                year:
                    filters.year,

                pb:
                    filters.pb

            }

        );


        renderReport(ds);

    }
    catch (error) {

        console.error(
            "loadReport:",
            error
        );


        renderReport([]);


        alert(
            "Không tải được báo cáo chấm công."
        );

    }

}


// ========================================
// RENDER BÁO CÁO TỔNG
// ========================================

function renderReport(ds) {

    const table =
        document.getElementById(
            "tableReport"
        );


    let totalNV = 0;

    let totalDays = 0;

    let totalHours = 0;


    const rows = Array.isArray(ds)
        ? ds.filter(function(x) {

            return Number(x.days) > 0;

        })
        : [];


    if (table) {

        if (rows.length === 0) {

            table.innerHTML = `

                <tr>

                    <td colspan="4">

                        Không có dữ liệu báo cáo

                    </td>

                </tr>

            `;

        }
        else {

            table.innerHTML =
                rows.map(function(x) {

                    totalNV++;

                    totalDays +=
                        Number(x.days);

                    totalHours +=
                        Number(x.hours);


                    return `

                        <tr>

                            <td>
                                ${escapeHtml(x.manv)}
                            </td>

                            <td>
                                ${escapeHtml(x.hoten)}
                            </td>

                            <td>
                                ${escapeHtml(x.days)}
                            </td>

                            <td>
                                ${escapeHtml(x.hours)} h
                            </td>

                        </tr>

                    `;

                }).join("");

        }

    }


    setReportText(
        "reportNV",
        totalNV
    );


    setReportText(
        "reportDays",
        totalDays
    );


    setReportText(
        "reportHours",
        totalHours.toFixed(1)
    );

}


// ========================================
// SET TEXT
// ========================================

function setReportText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    element.innerHTML =
        escapeHtml(value);

}


// ========================================
// EXPORT CSV
// ========================================

async function exportReport() {

    if (isExportingReport) {

        return;

    }


    const filters =
        getReportFilters();


    isExportingReport = true;


    setExportReportButtonState(true);


    try {

        const ds = await apiGet(

            "report",

            {

                month:
                    filters.month,

                year:
                    filters.year,

                pb:
                    filters.pb

            }

        );


        const lines = [];


        for (const nv of ds) {

            if (
                Number(nv.days) === 0
            ) {

                continue;

            }


            lines.push(
                csvLine([
                    nv.manv,
                    nv.hoten
                ])
            );


            lines.push(
                csvLine([
                    "Ngày",
                    "Công trình",
                    "Check In",
                    "Check Out",
                    "Tổng giờ",
                    "Công",
                    "OT",
                    "Trễ"
                ])
            );


            const rows = await apiGet(

                "reportDetail",

                {

                    manv:
                        nv.manv,

                    month:
                        filters.month,

                    year:
                        filters.year

                }

            );


            let tongCong = 0;

            let tongOT = 0;

            let tongTre = 0;


            rows.forEach(function(r) {

                lines.push(
                    csvLine([
                        r.date,
                        r.site,
                        r.checkin,
                        r.checkout,
                        r.hours,
                        r.daywork,
                        r.ot,
                        r.late
                    ])
                );


                tongCong +=
                    Number(r.daywork);

                tongOT +=
                    Number(r.ot);

                tongTre +=
                    Number(r.late);

            });


            lines.push("");

            lines.push(
                csvLine([
                    "Tổng công",
                    tongCong
                ])
            );


            lines.push(
                csvLine([
                    "Tổng OT",
                    tongOT.toFixed(2)
                ])
            );


            lines.push(
                csvLine([
                    "Tổng trễ",
                    tongTre
                ])
            );


            lines.push("");

            lines.push("");

        }


        if (lines.length === 0) {

            alert(
                "Không có dữ liệu để xuất báo cáo."
            );

            return;

        }


        downloadCsv(

            lines.join("\n"),

            `BangCong_${filters.month}_${filters.year}.csv`

        );

    }
    catch (error) {

        console.error(
            "exportReport:",
            error
        );


        alert(
            "Không xuất được báo cáo."
        );

    }
    finally {

        isExportingReport = false;


        setExportReportButtonState(false);

    }

}


// ========================================
// CSV HELPER
// ========================================

function csvLine(values) {

    return values
        .map(escapeCsv)
        .join(";");

}


function escapeCsv(value) {

    const text =
        String(value ?? "");


    return (

        '"' +

        text.replace(
            /"/g,
            '""'
        )

        +

        '"'

    );

}


function downloadCsv(
    content,
    filename
) {

    const blob =
        new Blob(

            [
                "\uFEFF" + content
            ],

            {
                type:
                    "text/csv;charset=utf-8;"
            }

        );


    const link =
        document.createElement("a");


    link.href =
        URL.createObjectURL(blob);


    link.download =
        filename;


    link.click();


    URL.revokeObjectURL(
        link.href
    );

}


// ========================================
// NÚT EXPORT
// ========================================

function setExportReportButtonState(
    loading
) {

    const button =
        document.querySelector(
            "[onclick='exportReport()']"
        );


    if (!button) {

        return;

    }


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang xuất...";


        return;

    }


    if (
        button.dataset.originalText
    ) {

        button.innerHTML =
            button.dataset.originalText;

    }

}