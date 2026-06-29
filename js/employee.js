let editingEmployee = null;
let nhanVien = [];
async function loadNhanVien(){
    const res = await fetch(
        API_URL + "?action=employeeList"
    );
    nhanVien = await res.json();
    let html = "";
    nhanVien.forEach(nv => {
        html += `
        <tr>
            <td>${nv.manv}</td>
            <td>${nv.hoten}</td>
            <td>${nv.sdt}</td>
          <td>${nv.role}</td>

<td>${nv.pb || ""}</td>

<td>

<span class="${
nv.status=="Active"
?
"active"
:
"inactive"
}">

${nv.status}

</span>

</td>
            <td>
                <button
                class="edit-btn"
                onclick="editEmployee('${nv.manv}')">
                    ✏️ Sửa
                </button>
                <button
                class="lock-btn"
                onclick="toggleEmployee('${nv.manv}')">
                    ${nv.status=="Active"
                    ?"🔒 Khóa"
                    :"🔓 Mở"}
                </button>
            </td>
        </tr>
        `;
    });
    document.getElementById(
        "tableEmployee"
    ).innerHTML = html;
}
async function luuNhanVien(){
    const hoten =
    document.getElementById(
        "hoten"
    ).value;
    const sdt =
    document.getElementById(
        "sdt"
    ).value;
    const matkhau =
    document.getElementById(
        "matkhau"
    ).value;
    const role =
    document.getElementById(
        "role"
    ).value;
    const action =
    editingEmployee
    ?
    "updateEmployee"
    :
    "addEmployee";
    console.log({

action,

hoten,

sdt,

matkhau,

role,

pb: document.getElementById("pb").value

});
    const res = await fetch(
        API_URL,
        {
            method:"POST",
            body: JSON.stringify({

action: action,

manv: editingEmployee,

hoten: hoten,

sdt: sdt,

matkhau: matkhau,

role: role,

pb:
document.getElementById(
"pb"
).value

})


        }
    );
    const kq = await res.text();
    alert(kq);
    editingEmployee = null;
    document.getElementById(
        "btnLuuNhanVien"
    ).innerHTML =
    "💾 Lưu nhân viên";
    document.getElementById(
        "hoten"
    ).value = "";
    document.getElementById(
        "sdt"
    ).value = "";
    document.getElementById(
        "matkhau"
    ).value = "";
    document.getElementById(
        "role"
    ).value = "User";
    loadNhanVien();
}
function editEmployee(manv){

    const nv = nhanVien.find(
        x => x.manv == manv
    );

    if(!nv) return;

    editingEmployee = manv;

    document.getElementById(
        "hoten"
    ).value = nv.hoten;

    document.getElementById(
        "sdt"
    ).value = nv.sdt;

    document.getElementById(
        "role"
    ).value = nv.role;

    document.getElementById(
        "pb"
    ).value = nv.pb;

    document.getElementById(
        "btnLuuNhanVien"
    ).innerHTML =
    "💾 Cập nhật nhân viên";

}
async function toggleEmployee(
    manv
){
    await fetch(
        API_URL,
        {
            method:"POST",
            body:JSON.stringify({
                action:
                "toggleEmployee",
                manv:manv
            })
        }
    );
    loadNhanVien();
}
window.onload = function(){
    loadNhanVien();
}