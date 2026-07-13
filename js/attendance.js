// ========================================
// ATTENDANCE STATE
// ========================================

let attendanceSites = [];

let isSubmittingAttendance = false;


// ========================================
// INIT
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    initAttendancePage

);


// ========================================
// KHỞI TẠO TRANG CHẤM CÔNG
// ========================================

async function initAttendancePage() {

    const user =
        getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    renderUserInfo(user);


    await loadSites();


    await loadHistory();

}


// ========================================
// HIỂN THỊ USER
// ========================================

function renderUserInfo(user) {

    const element =
        document.getElementById(
            "userInfo"
        );


    if (!element) {

        return;

    }


    element.innerHTML =

        "👤 " +

        escapeHtml(user.hoten) +

        " · " +

        escapeHtml(user.manv);

}


// ========================================
// LOAD CÔNG TRÌNH ACTIVE
// ========================================

async function loadSites() {

    try {

        attendanceSites = await apiGet(
            "sites"
        );


        console.log(
            "Danh sách công trình:",
            attendanceSites
        );

    }
    catch (error) {

        console.error(
            "loadSites:",
            error
        );


        attendanceSites = [];


        alert(
            "Không tải được danh sách công trình."
        );

    }

}


// ========================================
// CHẤM CÔNG
// ========================================

async function getLocation() {

    const user =
        getCurrentUser();


    if (!user) {

        alert(
            "Bạn chưa đăng nhập."
        );


        window.location.href =
            "login.html";


        return;

    }


    if (isSubmittingAttendance) {

        return;

    }


    if (
        !Array.isArray(attendanceSites) ||
        attendanceSites.length === 0
    ) {

        alert(
            "Chưa có công trình đang hoạt động."
        );

        return;

    }


    const typeElement =
        document.getElementById("type");


    if (!typeElement) {

        alert(
            "Không xác định được loại chấm công."
        );

        return;

    }


    const type =
        typeElement.value;


    if (
        type !== "Check In" &&
        type !== "Check Out"
    ) {

        alert(
            "Loại chấm công không hợp lệ."
        );

        return;

    }


    if (!navigator.geolocation) {

        alert(
            "Thiết bị không hỗ trợ GPS."
        );

        return;

    }


    isSubmittingAttendance = true;


    setAttendanceButtonState(true);


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            try {

                const lat =
                    position.coords.latitude;


                const lng =
                    position.coords.longitude;


                const nearest =
                    findNearestSite(
                        lat,
                        lng
                    );


                if (!nearest.site) {

                    alert(
                        "Không tìm thấy công trình có tọa độ hợp lệ."
                    );

                    return;

                }


                const site =
                    nearest.site;


                const distanceMeters =
                    nearest.distanceMeters;


                const radius =
                    Number(site.radius);


                if (
                    distanceMeters > radius
                ) {

                    updateLocationInfo(
                        site,
                        distanceMeters,
                        false
                    );


                    alert(

                        "Bạn không ở trong phạm vi công trình.\n" +

                        "Khoảng cách: " +

                        Math.round(distanceMeters) +

                        "m\n" +

                        "Phạm vi cho phép: " +

                        Math.round(radius) +

                        "m"

                    );


                    return;

                }


                updateLocationInfo(
                    site,
                    distanceMeters,
                    true
                );


                const result = await apiPostText(

                    "checkIn",

                    {

                        manv:
                            user.manv,

                        mact:
                            site.ma,

                        type:
                            type,

                        latitude:
                            lat,

                        longitude:
                            lng,

                        // Backend tự tính lại.
                        // Giá trị này chỉ giữ tương thích request cũ.
                        distance:
                            Math.round(
                                distanceMeters
                            ),

                        deviceId:
                            getDeviceId()

                    }

                );


                if (result !== "OK") {

                    alert(

                        result ||

                        "Chấm công không thành công."

                    );

                    return;

                }


                alert(

                    type === "Check In"

                        ? "Check In thành công"

                        : "Check Out thành công"

                );


                await loadHistory();

            }
            catch (error) {

                console.error(
                    "getLocation:",
                    error
                );


                alert(

                    "Không thể chấm công.\n" +

                    error.message

                );

            }
            finally {

                isSubmittingAttendance = false;


                setAttendanceButtonState(false);

            }

        },


        function(error) {

            console.error(
                "GPS error:",
                error
            );


            isSubmittingAttendance = false;


            setAttendanceButtonState(false);


            alert(
                getGpsErrorMessage(error)
            );

        },


        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


// ========================================
// TÌM CÔNG TRÌNH GẦN NHẤT
// ========================================

function findNearestSite(
    lat,
    lng
) {

    let nearestSite = null;

    let nearestDistance =
        Infinity;


    attendanceSites.forEach(function(site) {

        const siteLat =
            Number(site.lat);


        const siteLng =
            Number(site.lng);


        if (
            !Number.isFinite(siteLat) ||
            !Number.isFinite(siteLng)
        ) {

            return;

        }


        const distanceKm =
            calculateDistanceKm(

                lat,

                lng,

                siteLat,

                siteLng

            );


        const distanceMeters =
            distanceKm * 1000;


        if (
            distanceMeters <
            nearestDistance
        ) {

            nearestDistance =
                distanceMeters;


            nearestSite =
                site;

        }

    });


    return {

        site:
            nearestSite,

        distanceMeters:
            nearestDistance

    };

}


// ========================================
// TÍNH KHOẢNG CÁCH GPS
// ========================================

function calculateDistanceKm(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const p =
        0.017453292519943295;


    const a =

        0.5 -

        Math.cos(
            (lat2 - lat1) * p
        ) / 2 +

        Math.cos(lat1 * p) *

        Math.cos(lat2 * p) *

        (

            1 -

            Math.cos(
                (lng2 - lng1) * p
            )

        ) / 2;


    return 12742 *
        Math.asin(
            Math.sqrt(a)
        );

}


// ========================================
// HIỂN THỊ VỊ TRÍ
// ========================================

function updateLocationInfo(
    site,
    distanceMeters,
    isInside
) {

    const gpsElement =
        document.getElementById("gps");


    const siteNameElement =
        document.getElementById(
            "siteName"
        );


    const distanceElement =
        document.getElementById(
            "distance"
        );


    if (gpsElement) {

        gpsElement.innerHTML =

            isInside

                ? "🟢 Đã xác định"

                : "🔴 Ngoài phạm vi";

    }


    if (siteNameElement) {

        siteNameElement.innerHTML =

            escapeHtml(site.loai) +

            " · " +

            escapeHtml(site.ten);

    }


    if (distanceElement) {

        distanceElement.innerHTML =

            Math.round(distanceMeters) +

            " m";

    }

}


// ========================================
// NÚT CHẤM CÔNG
// ========================================

function setAttendanceButtonState(
    loading
) {

    const button =
        document.querySelector(
            "[onclick='getLocation()']"
        );


    if (!button) {

        return;

    }


    button.disabled =
        loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang xác định vị trí...";


        return;

    }


    if (
        button.dataset.originalText
    ) {

        button.innerHTML =
            button.dataset.originalText;

    }

}


// ========================================
// LỊCH SỬ CHẤM CÔNG
// ========================================

async function loadHistory() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    try {

        const data = await apiGet(

            "history",

            {
                manv:
                    user.manv
            }

        );


        renderHistory(data);

    }
    catch (error) {

        console.error(
            "loadHistory:",
            error
        );

    }

}


// ========================================
// RENDER LỊCH SỬ
// ========================================

function renderHistory(data) {

    const historyDiv =
        document.getElementById(
            "history"
        );


    if (!historyDiv) {

        return;

    }


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        historyDiv.innerHTML = `

            <div class="history-empty">

                Chưa có lịch sử chấm công

            </div>

        `;


        return;

    }


    historyDiv.innerHTML =
        data.map(function(x) {

            return `

                <div class="history-item">

                    <div class="history-type">

                        ${
                            x.type === "Check In"

                                ? "🟢 Check In"

                                : "🔴 Check Out"
                        }

                    </div>

                    <div class="history-time">

                        ${escapeHtml(formatHistoryTime(x.time))}

                    </div>

                </div>

            `;

        }).join("");

}


// ========================================
// FORMAT THỜI GIAN
// ========================================

function formatHistoryTime(value) {

    const date =
        new Date(value);


    if (
        isNaN(date.getTime())
    ) {

        return value || "";

    }


    return date.toLocaleString(
        "vi-VN"
    );

}


// ========================================
// GPS ERROR MESSAGE
// ========================================

function getGpsErrorMessage(error) {

    switch (error.code) {

        case error.PERMISSION_DENIED:

            return "Bạn chưa cấp quyền truy cập vị trí.";


        case error.POSITION_UNAVAILABLE:

            return "Không xác định được vị trí hiện tại.";


        case error.TIMEOUT:

            return "GPS phản hồi quá lâu. Vui lòng thử lại.";


        default:

            return "Không lấy được vị trí GPS.";

    }

}