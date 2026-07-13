let congTrinh = [];
let lat = 0;
let lng = 0;
let editingSite = null;
/* ===========================
   Lấy GPS công trình
=========================== */

function layGPS() {

    if (!navigator.geolocation) {

        alert(
            "Thiết bị không hỗ trợ GPS."
        );

        return;

    }


    const gpsElement =
        document.getElementById("gps");


    if (gpsElement) {

        gpsElement.innerHTML =
            "⏳ Đang lấy vị trí...";

    }


    navigator.geolocation
        .getCurrentPosition(

            function(position) {

                lat =
                    position.coords.latitude;

                lng =
                    position.coords.longitude;


                if (gpsElement) {

                    gpsElement.innerHTML =

                        "📍 Latitude: " +

                        lat.toFixed(6) +

                        "<br>Longitude: " +

                        lng.toFixed(6);

                }

            },


            function(error) {

                console.error(
                    "layGPS:",
                    error
                );


                lat = 0;

                lng = 0;


                if (gpsElement) {

                    gpsElement.innerHTML =
                        "";

                }


                let message =
                    "Không lấy được GPS.";


                switch (error.code) {

                    case error.PERMISSION_DENIED:

                        message =
                            "Bạn chưa cấp quyền truy cập vị trí.";

                        break;


                    case error.POSITION_UNAVAILABLE:

                        message =
                            "Không xác định được vị trí hiện tại.";

                        break;


                    case error.TIMEOUT:

                        message =
                            "GPS phản hồi quá lâu. Vui lòng thử lại.";

                        break;

                }


                alert(message);

            },


            {

                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0

            }

        );

}
/* ===========================
   Danh sách công trình
=========================== */
async function loadDanhSachCongTrinh() {

    try {

        congTrinh = await apiGet(
            "siteList"
        );

        let html = "";

        congTrinh.forEach(ct => {

            html += `

            <tr>

                <td>
                    ${escapeHtml(ct.ma)}
                </td>

                <td>
                    ${escapeHtml(ct.ten)}
                </td>

                <td>
                    ${escapeHtml(ct.loai)}
                </td>

                <td>
                    ${escapeHtml(ct.diachi)}
                </td>

                <td>
                    ${Number(ct.radius)} m
                </td>

                <td>

                    <span class="${
                        ct.status === "Active"
                            ? "active"
                            : "inactive"
                    }">

                        ${escapeHtml(ct.status)}

                    </span>

                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editSite('${ct.ma}')"
                    >
                        ✏️ Sửa
                    </button>

                    <button
                        class="lock-btn"
                        onclick="toggleSite('${ct.ma}')"
                    >

                        ${
                            ct.status === "Active"
                                ? "🔒 Khóa"
                                : "🔓 Mở"
                        }

                    </button>

                </td>

            </tr>

            `;

        });


        document
            .getElementById("tableSite")
            .innerHTML = html;

    }
    catch (error) {

        console.error(
            "loadDanhSachCongTrinh:",
            error
        );

        alert(
            "Không tải được danh sách công trình."
        );

    }

}
/* ===========================
   Lưu công trình
=========================== */
async function luuCongTrinh() {

    const ten = document
        .getElementById("tenct")
        .value
        .trim();

    const loai = document
        .getElementById("loaict")
        .value
        .trim();

    const diachi = document
        .getElementById("diachi")
        .value
        .trim();

    const radius = Number(
        document
            .getElementById("radius")
            .value
    );


    // =========================
    // VALIDATE NHANH FRONTEND
    // =========================

    if (!ten) {

        alert(
            "Vui lòng nhập tên công trình."
        );

        return;

    }


    if (!loai) {

        alert(
            "Vui lòng chọn loại công trình."
        );

        return;

    }


    if (!diachi) {

        alert(
            "Vui lòng nhập địa chỉ công trình."
        );

        return;

    }


    if (
        lat === 0 &&
        lng === 0
    ) {

        alert(
            "Vui lòng lấy vị trí GPS công trình."
        );

        return;

    }


    if (
        !Number.isFinite(radius) ||
        radius <= 0
    ) {

        alert(
            "Bán kính công trình không hợp lệ."
        );

        return;

    }


    const action = editingSite
        ? "updateSite"
        : "addSite";


    const button = document
        .getElementById(
            "btnLuuCongTrinh"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML =
            "Đang lưu...";

    }


    try {

        const result = await apiPostText(

            action,

            {

                ma: editingSite,

                ten: ten,

                loai: loai,

                diachi: diachi,

                lat: lat,

                lng: lng,

                radius: radius

            }

        );


        if (result !== "OK") {

            alert(
                result ||
                "Không lưu được công trình."
            );

            return;

        }


        alert(

            editingSite

                ? "Cập nhật công trình thành công"

                : "Thêm công trình thành công"

        );


        resetForm();


        await loadDanhSachCongTrinh();


        await loadDashboard();

    }
    catch (error) {

        console.error(
            "luuCongTrinh:",
            error
        );


        alert(
            "Không thể kết nối hệ thống."
        );

    }
    finally {

        if (button) {

            button.disabled = false;


            button.innerHTML =

                editingSite

                    ? "💾 Cập nhật công trình"

                    : "💾 Lưu công trình";

        }

    }

}
/* ===========================
   Sửa công trình
=========================== */

function editSite(ma) {

    const ct = congTrinh.find(
        item => item.ma === ma
    );


    if (!ct) {

        alert(
            "Không tìm thấy công trình."
        );

        return;

    }


    editingSite = ct.ma;


    document
        .getElementById("tenct")
        .value = ct.ten || "";


    document
        .getElementById("loaict")
        .value = ct.loai || "";


    document
        .getElementById("diachi")
        .value = ct.diachi || "";


    document
        .getElementById("radius")
        .value = Number(ct.radius) || 150;


    lat = Number(ct.lat);

    lng = Number(ct.lng);


    const gpsElement =
        document.getElementById("gps");


    if (
        gpsElement &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
    ) {

        gpsElement.innerHTML =

            "📍 Latitude: " +

            lat.toFixed(6) +

            "<br>Longitude: " +

            lng.toFixed(6);

    }


    const button =
        document.getElementById(
            "btnLuuCongTrinh"
        );


    if (button) {

        button.innerHTML =
            "💾 Cập nhật công trình";

    }

}
/* ===========================
   Khóa / Mở công trình
=========================== */

async function toggleSite(ma) {

    const ct = congTrinh.find(
        item => item.ma === ma
    );


    if (!ct) {

        alert(
            "Không tìm thấy công trình."
        );

        return;

    }


    const isActive =
        ct.status === "Active";


    const actionText =
        isActive
            ? "khóa"
            : "mở";


    const confirmed = confirm(

        "Bạn có chắc muốn " +

        actionText +

        " công trình \"" +

        ct.ten +

        "\"?"

    );


    if (!confirmed) {

        return;

    }


    try {

        const result = await apiPostText(

            "toggleSite",

            {
                ma: ma
            }

        );


        if (result !== "OK") {

            alert(

                result ||

                "Không cập nhật được trạng thái công trình."

            );

            return;

        }


        await loadDanhSachCongTrinh();


        await loadDashboard();

    }
    catch (error) {

        console.error(
            "toggleSite:",
            error
        );


        alert(
            "Không thể kết nối hệ thống."
        );

    }

}
/* ===========================
   Reset form công trình
=========================== */

function resetForm() {

    editingSite = null;

    lat = 0;

    lng = 0;


    const tenElement =
        document.getElementById("tenct");

    const loaiElement =
        document.getElementById("loaict");

    const diaChiElement =
        document.getElementById("diachi");

    const radiusElement =
        document.getElementById("radius");

    const gpsElement =
        document.getElementById("gps");

    const button =
        document.getElementById(
            "btnLuuCongTrinh"
        );


    if (tenElement) {

        tenElement.value = "";

    }


    if (loaiElement) {

        loaiElement.value =
            "Văn Phòng";

    }


    if (diaChiElement) {

        diaChiElement.value = "";

    }


    if (radiusElement) {

        radiusElement.value = "150";

    }


    if (gpsElement) {

        gpsElement.innerHTML = "";

    }


    if (button) {

        button.disabled = false;

        button.innerHTML =
            "💾 Lưu công trình";

    }

}