async function loadReport(){

    const month =
    document.getElementById(
        "reportMonth"
    ).value;

    const year =
    document.getElementById(
        "reportYear"
    ).value;

    const res = await fetch(

        API_URL +

        "?action=report" +

        "&month=" + month +

        "&year=" + year

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
window.addEventListener("load",()=>{

const now = new Date();

document.getElementById(
"reportMonth"
).value =

now.getMonth()+1;

document.getElementById(
"reportYear"
).value =

now.getFullYear();

loadReport();

});
window.addEventListener("load",()=>{

const now = new Date();

document.getElementById(

"reportMonth"

).value =

now.getMonth()+1;

document.getElementById(

"reportYear"

).value =

now.getFullYear();

loadReport();

});
function exportReport(){

    let csv = "Mã NV;Họ tên;Ngày công;Tổng giờ\n";


    const rows = document.querySelectorAll(

        "#tableReport tr"

    );

    rows.forEach(row=>{

        const cols = row.querySelectorAll(

            "td"

        );

        if(cols.length){

            csv +=

cols[0].innerText + ";" +

cols[1].innerText + ";" +

cols[2].innerText + ";" +

cols[3].innerText +

"\n";

        }

    });

    const blob = new Blob(
["\uFEFF" + csv],
{
type:"text/csv;charset=utf-8;"
}
);

    const link = document.createElement(

        "a"

    );

    link.href = URL.createObjectURL(

        blob

    );

    const month = document.getElementById(

        "reportMonth"

    ).value;

    const year = document.getElementById(

        "reportYear"

    ).value;

    link.download =

        `BaoCao_${month}_${year}.csv`;

    link.click();

}