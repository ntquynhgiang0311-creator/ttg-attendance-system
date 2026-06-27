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
const siteSection =
document.getElementById(
"siteSection"
);

const employeeSection =
document.getElementById(
"employeeSection"
);

const attendanceSection =
document.getElementById(
"attendanceSection"
);
const reportSection =
document.getElementById(
"reportSection"
);
function hideAll(){

siteSection.classList.remove(
"active"
);

employeeSection.classList.remove(
"active"
);

attendanceSection.classList.remove(
"active"
);

reportSection.classList.remove(
"active"
);

}

btnSite.onclick=()=>{

hideAll();

siteSection.classList.add(
"active"
);

};

btnEmployee.onclick=()=>{

hideAll();

employeeSection.classList.add(
"active"
);

};

btnAttendance.onclick=()=>{

hideAll();

attendanceSection.classList.add(
"active"
);

};
btnReport.onclick = ()=>{

hideAll();

reportSection.classList.add(
"active"
);

};

siteSection.classList.add(
"active"
);
