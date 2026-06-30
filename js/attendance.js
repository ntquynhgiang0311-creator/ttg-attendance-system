const user =
JSON.parse(localStorage.getItem("user"));

if(!user){

window.location.href="login.html";

}
let congTrinh = [];

function getDeviceId() {

    let deviceId = localStorage.getItem("deviceId");

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
    }

    return deviceId;
}
async function loadSites(){

    const res = await fetch(
       API_URL + "?action=sites"
    );

    congTrinh = await res.json();

    console.log(congTrinh);
}

function distance(lat1,lng1,lat2,lng2){

  const p = 0.017453292519943295;

  const a =
  0.5 -
  Math.cos((lat2-lat1)*p)/2 +
  Math.cos(lat1*p) *
  Math.cos(lat2*p) *
  (1-Math.cos((lng2-lng1)*p))/2;

  return 12742 * Math.asin(Math.sqrt(a));
}

function getLocation() {

const user = JSON.parse(localStorage.getItem("user"));

if(!user){

    window.location.href = "login.html";

}

document.getElementById("userInfo").innerHTML =
"👋 Xin chào, " + user.hoten;
if(!user){

    alert("Bạn chưa đăng nhập");

    window.location.href = "login.html";

    return;
document.getElementById("gps").innerHTML =
"🟢 Đã xác định";

document.getElementById("siteName").innerHTML =
ganNhat.ten;

document.getElementById("distance").innerHTML =
Math.round(khoangCachNhoNhat * 1000) + " m";
}

const name = user.hoten;
const manv = user.manv;

const type = document.getElementById("type").value;

 const deviceId = getDeviceId();

 navigator.geolocation.getCurrentPosition(

   function(position){

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
let ganNhat = null;
let khoangCachNhoNhat = 999999;

for(let ct of congTrinh){

  let d = distance(
    lat,
    lng,
    ct.lat,
    ct.lng
  );

  if(d < khoangCachNhoNhat){
      khoangCachNhoNhat = d;
      ganNhat = ct;
  }
}
if(!ganNhat){

alert("Chưa có công trình nào trong hệ thống.");

return;

}

if((khoangCachNhoNhat * 1000) > ganNhat.radius){

alert(

"Bạn không ở trong phạm vi công trình.\n"

+

"Khoảng cách: "

+

(khoangCachNhoNhat*1000).toFixed(0)

+

"m"

);

return;

}

document.getElementById("gps").innerHTML =
"🟢 Đã xác định";

document.getElementById("siteName").innerHTML =

ganNhat.loai

+

" · "

+

ganNhat.ten;

document.getElementById("distance").innerHTML =

Math.round(

khoangCachNhoNhat*1000

)

+

" m";

fetch(API_URL,{

method:"POST",

body:JSON.stringify({

action: "checkIn",

manv:manv,

mact:ganNhat.ma,

type:type,

latitude:lat,

longitude:lng,

distance:Math.round(

khoangCachNhoNhat*1000

),

deviceId:deviceId

})

})
.then(()=>{

alert("Chấm công thành công");

});


},

   function(error){

      alert("Không lấy được GPS");

   }

 );

}
document.addEventListener(
    "DOMContentLoaded",
    async ()=>{


    await loadSites();

    const user = JSON.parse(

        localStorage.getItem(

            "user"

        )

    );

    if(!user){

        window.location.href=

        "login.html";

        return;

    }

    document.getElementById(

        "userInfo"

    ).innerHTML =

    "👤 " +

    user.hoten +

    " . " + user.manv;
}
);
function logout(){

    localStorage.removeItem("user");

    window.location.href = "login.html";

}

async function loadHistory(){

    const user = JSON.parse(

        localStorage.getItem(

            "user"

        )

    );

    const res = await fetch(

        API_URL +

        "?action=history&manv=" +

        user.manv

    );

    const ds = await res.json();

    let html = "";

    ds.forEach(x=>{

        html += `

        <div class="history-item">

            <div class="history-type">

                ${x.type=="Check In"

                ?

                "🟢 Check In"

                :

                "🔴 Check Out"}

            </div>

            <div class="history-time">

                ${x.time}

            </div>

        </div>

        `;

    });

    const historyDiv =
document.getElementById("history");

if(historyDiv){

    historyDiv.innerHTML = html;

}

}