let contractAdminLoaded = false;
let contractAdminList = [];

async function loadContractAdmin() {

    if (contractAdminLoaded) {
        return;
    }

    await loadContractAlerts();
    await loadContractList();

    contractAdminLoaded = true;

}


async function loadContractAlerts() {

    const days =
        document.getElementById("contractAlertDays")?.value || 30;

    const list = await apiGet(
        "contractAlerts",
        {
            days: days
        }
    );

    renderContractAlerts(list);

}


function renderContractAlerts(list) {

    const container =
        document.getElementById("contractAlertList");

    if (!container) {
        return;
    }

    if (!list || list.length === 0) {

        container.innerHTML =
            `<p style="color:#16a34a;">Không có hợp đồng sắp hết hạn.</p>`;

        return;

    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mã HĐ</th>
                    <th>Nhân viên</th>
                    <th>Phòng ban</th>
                    <th>Loại HĐ</th>
                    <th>Ngày hết hạn</th>
                    <th>Còn lại</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(function(item) {
                    return `
                        <tr>
                            <td>${escapeHtml(item.mahd)}</td>
                            <td>${escapeHtml(item.manv)} - ${escapeHtml(item.hoten)}</td>
                            <td>${escapeHtml(item.pb)}</td>
                            <td>${escapeHtml(item.loaiHD)}</td>
                            <td>${formatContractDate(item.ngayHetHan)}</td>
                            <td><b>${item.daysLeft} ngày</b></td>
                            <td>
                                <button
                                    class="btn btn-sm btn-info"
                                    onclick="openEmployeeContractFromList('${item.manv}')"
                                >
                                    Mở hồ sơ
                                </button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

}


async function loadContractList() {

    const status =
        document.getElementById("contractFilterStatus")?.value || "";

    const keyword =
        document.getElementById("contractSearchKeyword")?.value || "";

    contractAdminList = await apiGet(
        "contractList",
        {
            status: status,
            keyword: keyword
        }
    );

    renderContractAdminList();

}


function renderContractAdminList() {

    const container =
        document.getElementById("contractAdminList");

    if (!container) {
        return;
    }

    if (
        !contractAdminList ||
        contractAdminList.length === 0
    ) {

        container.innerHTML =
            `<p>Không có hợp đồng phù hợp.</p>`;

        return;

    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mã HĐ</th>
                    <th>Nhân viên</th>
                    <th>Phòng ban</th>
                    <th>Loại HĐ</th>
                    <th>Hiệu lực</th>
                    <th>Hết hạn</th>
                    <th>Lương</th>
                    <th>Trạng thái</th>
                    <th>File</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${contractAdminList.map(function(item) {
                    return `
                        <tr>
                            <td>${escapeHtml(item.mahd)}</td>
                            <td>${escapeHtml(item.manv)} - ${escapeHtml(item.hoten)}</td>
                            <td>${escapeHtml(item.pb)}</td>
                            <td>${escapeHtml(item.loaiHD)}</td>
                            <td>${formatContractDate(item.ngayHieuLuc)}</td>
                            <td>${formatContractDate(item.ngayHetHan)}</td>
                            <td>${formatContractMoney(item.luongCoBan)}</td>
                            <td>${escapeHtml(item.trangThai)}</td>
                            <td>
                                ${
                                    item.fileURL
                                        ? `<a href="${escapeHtml(item.fileURL)}" target="_blank">Mở</a>`
                                        : ""
                                }
                            </td>
                            <td>
                                <button
                                    class="btn btn-sm btn-info"
                                    onclick="openEmployeeContractFromList('${item.manv}')"
                                >
                                    Mở hồ sơ
                                </button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

}


async function openEmployeeContractFromList(manv) {

    showAdminSection("employeeSection");

    await openHREmployeeProfile(manv);

}


function formatContractDate(value) {

    if (!value) {
        return "";
    }

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

        const parts =
            value.substring(0, 10).split("-");

        return parts[2] + "/" + parts[1] + "/" + parts[0];

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("vi-VN");

}


function formatContractMoney(value) {

    const numberValue =
        Number(value || 0);

    if (!numberValue) {
        return "";
    }

    return numberValue.toLocaleString("vi-VN");

}