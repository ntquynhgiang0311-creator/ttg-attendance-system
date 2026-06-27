let congTrinh = [];

let lat = 0;
let lng = 0;

let editingSite = null;
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

    const action = editingSite ? "updateSite" : "addSite";

const res = await fetch(API_URL,{

    method:"POST",

    body:JSON.stringify({

        action:action,

        ma:editingSite,

        ten:ten,

        loai:loai,

        diachi:diachi,

        lat:lat,

        lng:lng,

        radius:radius

    })

});

    const kq = await res.text();

alert(kq);

editingSite = null;

document.getElementById("btnLuuCongTrinh").innerHTML =
"💾 Lưu công trình";

loadDanhSachCongTrinh();

}
async function loadDanhSachCongTrinh(){

    const res = await fetch(API_URL + "?action=sites");

    const ds = await res.json();

    congTrinh = ds;

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

<button
class="edit-btn"
onclick="editSite('${ct.ma}')">

✏️ Sửa

</button>

<button
class="lock-btn"
onclick="toggleSite(

'${ct.ma}',

'${ct.status}'

)">

${ct.status=="Active" ? "🔒 Khóa" : "🔓 Mở"}

</button>

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
async function khoaCongTrinh(ma){

    if(!confirm("Khóa công trình này?")){

        return;

    }

    const res = await fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:"disableSite",

            ma:ma

        })

    });

    const kq = await res.text();

    alert(kq);

    loadDanhSachCongTrinh();

}
function suaCongTrinh(ma){

    const ct = congTrinh.find(x => x.ma == ma);

    if(!ct){

        alert("Không tìm thấy công trình");

        return;

    }

    editingSite = ma;

    document.getElementById("tenct").value = ct.ten;

    document.getElementById("loaict").value = ct.loai;

    document.getElementById("diachi").value = ct.diachi;

    document.getElementById("radius").value = ct.radius;

    lat = ct.lat;

    lng = ct.lng;

    document.getElementById("gps").innerHTML =
        "Latitude: " + lat +
        "<br>Longitude: " + lng;

    document.getElementById("btnLuuCongTrinh").innerHTML =
        "💾 Cập nhật công trình";

}
async function toggleSite(

ma

){

await fetch(API_URL,{

method:"POST",

body:JSON.stringify({

action:"toggleSite",

ma:ma

})

});

loadSites();

}