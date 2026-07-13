// ========================================
// LOGIN STATE
// ========================================

let isLoggingIn = false;


// ========================================
// LOGIN
// ========================================

async function login() {

    if (isLoggingIn) {

        return;

    }


    const sdtElement =
        document.getElementById("sdt");


    const matKhauElement =
        document.getElementById("matkhau");


    if (
        !sdtElement ||
        !matKhauElement
    ) {

        alert(
            "Không tìm thấy form đăng nhập."
        );

        return;

    }


    const sdt =
        sdtElement.value.trim();


    const matkhau =
        matKhauElement.value;


    if (!sdt) {

        alert(
            "Vui lòng nhập số điện thoại."
        );

        sdtElement.focus();

        return;

    }


    if (!matkhau) {

        alert(
            "Vui lòng nhập mật khẩu."
        );

        matKhauElement.focus();

        return;

    }


    isLoggingIn = true;


    setLoginButtonState(true);


    try {

        const user = await apiPostJson(

            "login",

            {

                sdt: sdt,

                matkhau: matkhau,

                deviceId: getDeviceId()

            }

        );


        if (!user.success) {

            alert(

                user.message ||

                "Đăng nhập không thành công."

            );

            return;

        }


        setCurrentUser(user);


        window.location.href =
            "index.html";

    }
    catch (error) {

        console.error(
            "login:",
            error
        );


        alert(
            "Không thể kết nối hệ thống. Vui lòng thử lại."
        );

    }
    finally {

        isLoggingIn = false;


        setLoginButtonState(false);

    }

}


// ========================================
// TRẠNG THÁI NÚT ĐĂNG NHẬP
// ========================================

function setLoginButtonState(
    loading
) {

    const button =
        document.querySelector(
            "[onclick='login()']"
        );


    if (!button) {

        return;

    }


    button.disabled = loading;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            "Đang đăng nhập...";


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
// ENTER ĐỂ ĐĂNG NHẬP
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    function() {


        const currentUser =
            getCurrentUser();


        if (currentUser) {

            window.location.href =
                "index.html";

            return;

        }


        const sdtElement =
            document.getElementById("sdt");


        const matKhauElement =
            document.getElementById("matkhau");


        [
            sdtElement,
            matKhauElement
        ].forEach(function(element) {

            if (!element) {

                return;

            }


            element.addEventListener(

                "keydown",

                function(event) {

                    if (
                        event.key === "Enter"
                    ) {

                        login();

                    }

                }

            );

        });

    }

);