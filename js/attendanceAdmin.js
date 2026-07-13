// ========================================
// ATTENDANCE ADMIN STATE
// ========================================

let attendanceLoaded = false;


// ========================================
// LOAD CHẤM CÔNG ADMIN
// ========================================

async function loadAttendance() {

    try {

        const ds = await apiGet(
            "attendance"
        );


        ds.reverse();


        renderAttendance(ds);


        attendanceLoaded = true;

    }
    catch (error) {

        console.error(
            "loadAttendance:",
            error
        );


        renderAttendance([]);


        alert(
            "Không tải được dữ liệu chấm công."
        );


        throw error;

    }

}


// ========================================
// RENDER BẢNG CHẤM CÔNG
// ========================================

function renderAttendance(ds) {

    const table =
        document.getElementById(
            "tableAttendance"
        );


    if (!table) {

        return;

    }


    if (
        !Array.isArray(ds) ||
        ds.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="5">

                    Chưa có dữ liệu chấm công

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML = ds
        .map(function(x) {

            return `

                <tr>

                    <td>
                        ${escapeHtml(formatAttendanceTime(x.time))}
                    </td>

                    <td>
                        ${escapeHtml(x.hoten)}
                    </td>

                    <td>
                        ${escapeHtml(x.congtrinh)}
                    </td>

                    <td>
                        ${renderAttendanceType(x.type)}
                    </td>

                    <td>
                        ${escapeHtml(x.distance)} m
                    </td>

                </tr>

            `;

        })
        .join("");

}


// ========================================
// FORMAT LOẠI CHẤM CÔNG
// ========================================

function renderAttendanceType(type) {

    if (type === "Check In") {

        return "🟢 Check In";

    }


    if (type === "Check Out") {

        return "🔴 Check Out";

    }


    return escapeHtml(type || "");

}


// ========================================
// FORMAT THỜI GIAN
// ========================================

function formatAttendanceTime(value) {

    const date = new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return value || "";

    }


    return date.toLocaleString(
        "vi-VN"
    );

}