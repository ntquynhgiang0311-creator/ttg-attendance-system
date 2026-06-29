async function loadReportDetail(){

const manv =
document.getElementById(
"reportEmployee"
).value;

const month =
document.getElementById(
"detailMonth"
).value;

const year =
document.getElementById(
"detailYear"
).value;

const res = await fetch(

API_URL +

`?action=reportDetail&manv=${manv}&month=${month}&year=${year}`

);

const data =
await res.json();

let html = "";

data.forEach(x=>{

html += `

<tr>

<td>${x.date}</td>

<td>${x.site}</td>

<td>${x.checkin}</td>

<td>${x.checkout}</td>

<td>${x.hours}</td>

<td>${x.daywork}</td>

<td>${x.ot}</td>

<td>${x.late}</td>

</tr>

`;

});

document.getElementById(

"tableReportDetail"

).innerHTML = html;

}
async function loadReportEmployees(){

const res =
await fetch(

API_URL+

"?action=employeeList"

);

const data =
await res.json();

let html = "";

data.forEach(x=>{

html += `

<option value="${x.manv}">

${x.manv} - ${x.hoten}

</option>

`;

});

document.getElementById(

"reportEmployee"

).innerHTML = html;

}
function loadMonthYear(){

let month = "";

for(let i=1;i<=12;i++){

month += `

<option value="${i}">

${i}

</option>

`;

}

document.getElementById(

"detailMonth"

).innerHTML = month;

const y =
new Date()

.getFullYear();

let year = "";

for(let i=y-1;i<=y+1;i++){

year += `

<option value="${i}">

${i}

</option>

`;

}

document.getElementById(

"detailYear"

).innerHTML = year;

document.getElementById(

"detailMonth"

).value =

new Date()

.getMonth()+1;

document.getElementById(

"detailYear"

).value =

new Date()

.getFullYear();

}
document.addEventListener(

"DOMContentLoaded",

()=>{

loadMonthYear();

loadReportEmployees();

}

);
document.addEventListener(

"DOMContentLoaded",

()=>{

document.getElementById(
"reportMonth"
).value =

new Date()
.getMonth()+1;

document.getElementById(
"reportYear"
).value =

new Date()
.getFullYear();

}

);