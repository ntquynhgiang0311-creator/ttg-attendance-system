async function login(){

    const sdt = document.getElementById("sdt").value;

    const matkhau = document.getElementById("matkhau").value;

    const res = await fetch(API_URL,
        {
            method:"POST",
            body:JSON.stringify({

                action:"login",

                sdt:sdt,

                matkhau:matkhau

            })
        }
    );

    const user = await res.json();

    if(user.success){

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        window.location.href="index.html";

    }else{

        alert("Sai tài khoản hoặc mật khẩu");

    }

}