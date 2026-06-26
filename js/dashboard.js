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