const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "login.html";
} else if (user.role !== "admin") {
    alert("Bạn không có quyền truy cập.");
    window.location.href = "index.html";
}
let lat = 0;
let lng = 0;

function layGPS(){

    navigator.geolocation.getCurrentPosition(function(position){

        lat = position.coords.latitude;
        lng = position.coords.longitude;

        document.getElementById("gps").innerHTML =
        "Latitude: " + lat +
        "<br>Longitude: " + lng;

    });

}
async function luuCongTrinh(){

    const ten = document.getElementById("tenct").value;
    const diachi = document.getElementById("diachi").value;
    const radius = document.getElementById("radius").value;
    const loai = document.getElementById("loaict").value;

    const res = await fetch(
      API_URL,
      {
        method:"POST",
        body: JSON.stringify({
    action:"addSite",
    ten:ten,
    loai:loai,
    diachi:diachi,
    lat:lat,
    lng:lng,
    radius:radius
})
      }
    );

    const kq = await res.text();

alert(kq);

loadDanhSachCongTrinh();

}
async function loadDanhSachCongTrinh(){

    const res = await fetch(API_URL + "?action=sites");

    const ds = await res.json();

    let html = "";

    ds.forEach(ct=>{

        html += `
<tr>

    <td>${ct.ma}</td>

    <td>${ct.ten}</td>

    <td>${ct.loai}</td>

    <td>${ct.diachi}</td>

    <td>${ct.radius} m</td>

    <td>${ct.status}</td>

    <td>
        <button>Sửa</button>
        <button>Xóa</button>
    </td>

</tr>
`;

    });

    document.getElementById("tableSite").innerHTML = html;
document.getElementById("tenct").value = "";
document.getElementById("diachi").value = "";
document.getElementById("radius").value = "150";
document.getElementById("gps").innerHTML = "";

lat = 0;
lng = 0;
}
window.onload = async function(){

    await loadDashboard();

    await loadDanhSachCongTrinh();

    await loadNhanVien();

}
async function luuNhanVien(){

    const hoten = document.getElementById("hoten").value;

    const sdt = document.getElementById("sdt").value;

    const matkhau = document.getElementById("matkhau").value;

    const role = document.getElementById("role").value;

    const res = await fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:"addEmployee",

            hoten:hoten,

            sdt:sdt,

            matkhau:matkhau,

            role:role

        })

    });

    const kq = await res.text();

    alert(kq);
loadNhanVien();

document.getElementById("hoten").value="";
document.getElementById("sdt").value="";
document.getElementById("matkhau").value="";
document.getElementById("role").value="User";
}
async function loadNhanVien(){

    const res = await fetch(
        API_URL + "?action=employeeList"
    );

    const ds = await res.json();

    let html = "";

    ds.forEach(nv=>{

        html += `
        <tr>

            <td>${nv.manv}</td>

            <td>${nv.hoten}</td>

            <td>${nv.sdt}</td>

            <td>${nv.role}</td>

            <td>${nv.status}</td>

            <td>

                <button>Sửa</button>

                <button>Khóa</button>

            </td>

        </tr>
        `;

    });

    document.getElementById("tableEmployee").innerHTML = html;

}
async function loadDashboard(){

    const res = await fetch(
        API_URL + "?action=dashboard"
    );

    const data = await res.json();

    document.getElementById("tongNV").innerHTML = data.tongNV;

    document.getElementById("tongCT").innerHTML = data.tongCT;

    document.getElementById("checkin").innerHTML = data.checkin;

    document.getElementById("chuacheckin").innerHTML = data.chuacheckin;

}