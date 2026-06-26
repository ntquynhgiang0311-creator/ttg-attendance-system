let editingEmployee = null;
let nhanVien = [];

async function luuNhanVien(){

    const hoten = document.getElementById("hoten").value;

    const sdt = document.getElementById("sdt").value;

    const matkhau = document.getElementById("matkhau").value;

    const role = document.getElementById("role").value;

    const action = editingEmployee ? "updateEmployee" : "addEmployee";

    const res = await fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action: action,

            manv: editingEmployee,

            hoten: hoten,

            sdt: sdt,

            matkhau: matkhau,

            role: role

        })

    });

    const kq = await res.text();

    alert(kq);
    editingEmployee = null;

document.getElementById("btnLuuNhanVien").innerHTML =
"💾 Lưu nhân viên";
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

    nhanVien = ds;

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

                <button onclick="suaNhanVien('${nv.manv}')">
                    Sửa
                </button>

                <button>Khóa</button>

            </td>

        </tr>
        `;

    });

    document.getElementById("tableEmployee").innerHTML = html;

}
function suaNhanVien(manv){

    const nv = nhanVien.find(x => x.manv == manv);

    if(!nv){
        alert("Không tìm thấy nhân viên");
        return;
    }

    editingEmployee = manv;

    document.getElementById("hoten").value = nv.hoten;

    document.getElementById("sdt").value = nv.sdt;

    document.getElementById("role").value = nv.role;

    document.getElementById("btnLuuNhanVien").innerHTML =
        "💾 Cập nhật nhân viên";

}