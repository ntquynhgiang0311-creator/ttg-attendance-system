const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "login.html";
} else if (user.role !== "admin") {
    alert("Bạn không có quyền truy cập.");
    window.location.href = "index.html";
}
window.onload = async function(){

    console.log("1");

    await loadDashboard();

    console.log("2");

    await loadDanhSachCongTrinh();

    console.log("3");

    await loadNhanVien();

    console.log("4");

}
