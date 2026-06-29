async function loadReport(){

    const month =
    document.getElementById(
        "reportMonth"
    ).value;

    const year =
    document.getElementById(
        "reportYear"
    ).value;
    const pb =
document.getElementById(
"reportPB"
).value;

const res = await fetch(

API_URL +

"?action=report" +

"&month=" + month +

"&year=" + year +

"&pb=" + pb

);


    const ds = await res.json();

    let html = "";
    let totalNV = 0;

let totalDays = 0;

let totalHours = 0;

    ds.forEach(x=>{

    if(x.days == 0){

        return;

    }

    totalNV++;

    totalDays += Number(x.days);

    totalHours += Number(x.hours);

    html += `

        <tr>

            <td>${x.manv}</td>

            <td>${x.hoten}</td>

            <td>${x.days}</td>

            <td>${x.hours} h</td>

        </tr>

        `;

    });

    document.getElementById(

        "tableReport"

    ).innerHTML = html;
    document.getElementById(

"reportNV"

).innerHTML = totalNV;

document.getElementById(

"reportDays"

).innerHTML = totalDays;

document.getElementById(

"reportHours"

).innerHTML =

totalHours.toFixed(1);

}

async function exportReport(){

const month =
document.getElementById(
"reportMonth"
).value;

const year =
document.getElementById(
"reportYear"
).value;

const res =
await fetch(

API_URL+

`?action=report&month=${month}&year=${year}`

);

const ds =
await res.json();

let csv = "";

for(const nv of ds){

if(Number(nv.days)==0){

continue;

}

csv +=

`${nv.manv};${nv.hoten}\n`;

csv +=

"Ngày;Công trình;Check In;Check Out;Tổng giờ;Công;OT;Trễ\n";

const detail =
await fetch(

API_URL+

`?action=reportDetail`

+

`&manv=${nv.manv}`

+

`&month=${month}`

+

`&year=${year}`

);

const rows =
await detail.json();

let tongCong = 0;
let tongOT = 0;
let tongTre = 0;

rows.forEach(r=>{

csv +=

`${r.date};`

+

`${r.site};`

+

`${r.checkin};`

+

`${r.checkout};`

+

`${r.hours};`

+

`${r.daywork};`

+

`${r.ot};`

+

`${r.late}\n`;

tongCong +=
Number(r.daywork);

tongOT +=
Number(r.ot);

tongTre +=
Number(r.late);

});

csv += "\n";

csv +=

`Tổng công;${tongCong}\n`;

csv +=

`Tổng OT;${tongOT.toFixed(2)}\n`;

csv +=

`Tổng trễ;${tongTre}\n`;

csv += "\n\n";

}

const blob =

new Blob(

["\uFEFF"+csv],

{

type:

"text/csv;charset=utf-8;"

}

);

const link =

document.createElement(

"a"

);

link.href =

URL.createObjectURL(

blob

);

link.download =

`BangCong_${month}_${year}.csv`;

link.click();

}
document.addEventListener(

"DOMContentLoaded",

()=>{

const y =
new Date().getFullYear();

let html = "";

for(let i=y-1;i<=y+2;i++){

html += `

<option value="${i}">

${i}

</option>

`;

}

document.getElementById(
"reportYear"
).innerHTML = html;

document.getElementById(
"reportMonth"
).value =

new Date().getMonth()+1;

document.getElementById(
"reportYear"
).value = y;

loadReport();

}

);