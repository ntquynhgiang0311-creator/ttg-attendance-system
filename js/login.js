let deviceId = localStorage.getItem("deviceId");
if(!deviceId){

    deviceId = crypto.randomUUID();

    localStorage.setItem("deviceId", deviceId);

}
async function login(){

    const sdt = document.getElementById("sdt").value;

    const matkhau = document.getElementById("matkhau").value;

    const res = await fetch(API_URL,{

    method:"POST",

    body:JSON.stringify({

        action:"login",

        sdt:sdt,

        matkhau:matkhau,

        deviceId: deviceId

    })

});
    const user = await res.json();

    if(user.success){

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        window.location.href="index.html";

    }else{

        alert(user.message || "Sai tài khoản hoặc mật khẩu");

    }

}