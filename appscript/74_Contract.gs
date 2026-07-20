/**
 * Lấy danh sách hợp đồng theo nhân viên.
 */
function getEmployeeContracts(manv) {

  manv = normalizeText(manv);

  if (isEmpty(manv)) {

    return jsonResponse([]);

  }

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    if (
      normalizeText(row[1]) !== manv
    ) {

      continue;

    }

    result.push({

      mahd: row[0],

      manv: row[1],

      loaiHD: row[2],

      ngayKy: row[3],

      ngayHieuLuc: row[4],

      ngayHetHan: row[5],

      luongCoBan: row[6],

      phuCap: row[7],

      trangThai: row[8],

      fileURL: row[9],

      ghiChu: row[10],

      createdAt: row[11],

hinhThucLuong: row[12],

luongDongBH: row[13],

coDongBH: row[14],

thuongMacDinh: row[15],

khauTruMacDinh: row[16]

    });

  }

  return jsonResponse(result);

}


/**
 * Thêm hợp đồng lao động.
 */
function addEmployeeContract(data) {

  const validation =
    validateContractInput_(data, false);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const contract =
    validation.contract;

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(10000);

    const sheet = getSheet(
      CONFIG.SHEETS.CONTRACTS
    );

    const maHD =
      generateNextCode(
        sheet,
        1,
        CONFIG.CODE_PREFIX.CONTRACT,
        CONFIG.CODE_LENGTH.CONTRACT
      );

    sheet.appendRow([

  maHD,

  contract.manv,

  contract.loaiHD,

  contract.ngayKy,

  contract.ngayHieuLuc,

  contract.ngayHetHan,

  contract.luongCoBan,

  contract.phuCap,

  contract.trangThai,

  contract.fileURL,

  contract.ghiChu,

  new Date(),

  contract.hinhThucLuong,

  contract.luongDongBH,

  contract.coDongBH,

  contract.thuongMacDinh,

  contract.khauTruMacDinh

]);
try {

  writeSystemLog({

    actorManv:
      normalizeText(data.actorManv),

    module:
      "HopDong",

    action:
      "Thêm hợp đồng",

    targetId:
      maHD,

    oldValue:
      "",

    newValue:
      contract,

    note:
      "Thêm hợp đồng lao động"

  });

}
catch (error) {

  Logger.log(
    "System log add contract error: " +
    error.message
  );

}

    return textResponse("OK");

  }
  catch (error) {

    logError(
      "addEmployeeContract",
      error
    );

    return textResponse(
      "Không thêm được hợp đồng"
    );

  }
  finally {

    lock.releaseLock();

  }

}


/**
 * Cập nhật hợp đồng lao động.
 */
function updateEmployeeContract(data) {

  const maHD = normalizeText(
    data.mahd
  );

  if (isEmpty(maHD)) {

    return textResponse(
      "Thiếu mã hợp đồng"
    );

  }

  const validation =
    validateContractInput_(data, true);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const contract =
    validation.contract;

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(values[i][0]) !== maHD
    ) {

      continue;

    }

    const oldValue = {

      maHD:
        values[i][0],

      manv:
        values[i][1],

      loaiHD:
        values[i][2],

      ngayKy:
        values[i][3],

      ngayHieuLuc:
        values[i][4],

      ngayHetHan:
        values[i][5],

      luongCoBan:
        values[i][6],

      phuCap:
        values[i][7],

      trangThai:
        values[i][8],

      fileURL:
        values[i][9],

      ghiChu:
        values[i][10],

      createdAt:
        values[i][11],

      hinhThucLuong:
        values[i][12],

      luongDongBH:
        values[i][13],

      coDongBH:
        values[i][14],

      thuongMacDinh:
        values[i][15],

      khauTruMacDinh:
        values[i][16]

    };

    const createdAt =
      values[i][11] || new Date();

    const newValue = {

      maHD:
        maHD,

      manv:
        contract.manv,

      loaiHD:
        contract.loaiHD,

      ngayKy:
        contract.ngayKy,

      ngayHieuLuc:
        contract.ngayHieuLuc,

      ngayHetHan:
        contract.ngayHetHan,

      luongCoBan:
        contract.luongCoBan,

      phuCap:
        contract.phuCap,

      trangThai:
        contract.trangThai,

      fileURL:
        contract.fileURL,

      ghiChu:
        contract.ghiChu,

      createdAt:
        createdAt,

      hinhThucLuong:
        contract.hinhThucLuong,

      luongDongBH:
        contract.luongDongBH,

      coDongBH:
        contract.coDongBH,

      thuongMacDinh:
        contract.thuongMacDinh,

      khauTruMacDinh:
        contract.khauTruMacDinh

    };

    sheet
      .getRange(
        i + 1,
        1,
        1,
        17
      )
      .setValues([

        [

          newValue.maHD,

          newValue.manv,

          newValue.loaiHD,

          newValue.ngayKy,

          newValue.ngayHieuLuc,

          newValue.ngayHetHan,

          newValue.luongCoBan,

          newValue.phuCap,

          newValue.trangThai,

          newValue.fileURL,

          newValue.ghiChu,

          newValue.createdAt,

          newValue.hinhThucLuong,

          newValue.luongDongBH,

          newValue.coDongBH,

          newValue.thuongMacDinh,

          newValue.khauTruMacDinh

        ]

      ]);

    SpreadsheetApp.flush();

    try {

      writeSystemLog({

        actorManv:
          normalizeText(data.actorManv),

        module:
          "HopDong",

        action:
          "Sửa hợp đồng",

        targetId:
          maHD,

        oldValue:
          oldValue,

        newValue:
          newValue,

        note:
          "Cập nhật hợp đồng lao động"

      });

    }
    catch (error) {

      Logger.log(
        "System log update contract error: " +
        error.message
      );

    }

    return textResponse("OK");

  }

  return textResponse(
    "Không tìm thấy hợp đồng"
  );

}


/**
 * Cập nhật trạng thái hợp đồng.
 */
function updateEmployeeContractStatus(data) {

  const maHD = normalizeText(
    data.mahd
  );

  const trangThai = normalizeText(
    data.trangThai
  );

  if (isEmpty(maHD)) {

    return textResponse(
      "Thiếu mã hợp đồng"
    );

  }

  if (isEmpty(trangThai)) {

    return textResponse(
      "Thiếu trạng thái hợp đồng"
    );

  }

  if (
    !isValidContractStatus_(trangThai)
  ) {

    return textResponse(
      "Trạng thái hợp đồng không hợp lệ"
    );

  }

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(values[i][0]) !== maHD
    ) {

      continue;

    }

    sheet
      .getRange(
        i + 1,
        9
      )
      .setValue(
        trangThai
      );
try {

  writeSystemLog({

    actorManv:
      normalizeText(data.actorManv),

    module:
      "HopDong",

    action:
      newStatus,

    targetId:
      maHD,

    oldValue:
      {
        trangThai: oldStatus
      },

    newValue:
      {
        trangThai: newStatus
      },

    note:
      "Cập nhật trạng thái hợp đồng"

  });

}
catch (error) {

  Logger.log(
    "System log contract status error: " +
    error.message
  );

}
    return textResponse("OK");

  }

  return textResponse(
    "Không tìm thấy hợp đồng"
  );

}


/**
 * Validate dữ liệu hợp đồng.
 */
function validateContractInput_(
  data,
  isUpdate
) {

  data = data || {};

  const contract = {

    manv:
      normalizeText(data.manv),

    loaiHD:
      normalizeText(data.loaiHD),

    ngayKy:
      normalizeText(data.ngayKy),

    ngayHieuLuc:
      normalizeText(data.ngayHieuLuc),

    ngayHetHan:
      normalizeText(data.ngayHetHan),

    luongCoBan:
      normalizeMoney_(data.luongCoBan),

    phuCap:
      normalizeMoney_(data.phuCap),

    trangThai:
      normalizeText(data.trangThai),

    fileURL:
      normalizeText(data.fileURL),

    ghiChu:
      normalizeText(data.ghiChu),
    
    hinhThucLuong:
  normalizeText(data.hinhThucLuong),

luongDongBH:
  normalizeMoney_(data.luongDongBH),

coDongBH:
  normalizeText(data.coDongBH),

thuongMacDinh:
  normalizeMoney_(data.thuongMacDinh),

khauTruMacDinh:
  normalizeMoney_(data.khauTruMacDinh)

  };

  if (
    isEmpty(contract.manv)
  ) {

    return {
      success: false,
      message: "Thiếu nhân viên"
    };

  }

  if (
    !employeeExists_(contract.manv)
  ) {

    return {
      success: false,
      message: "Không tìm thấy nhân viên"
    };

  }

  if (
    isEmpty(contract.loaiHD)
  ) {

    return {
      success: false,
      message: "Vui lòng chọn loại hợp đồng"
    };

  }

  if (
    isEmpty(contract.ngayKy)
  ) {

    return {
      success: false,
      message: "Vui lòng nhập ngày ký"
    };

  }

  if (
    isEmpty(contract.ngayHieuLuc)
  ) {

    return {
      success: false,
      message: "Vui lòng nhập ngày hiệu lực"
    };

  }

  if (
    !isEmpty(contract.ngayKy) &&
    !isValidDateText_(contract.ngayKy)
  ) {

    return {
      success: false,
      message: "Ngày ký không hợp lệ"
    };

  }

  if (
    !isEmpty(contract.ngayHieuLuc) &&
    !isValidDateText_(contract.ngayHieuLuc)
  ) {

    return {
      success: false,
      message: "Ngày hiệu lực không hợp lệ"
    };

  }

  if (
    !isEmpty(contract.ngayHetHan) &&
    !isValidDateText_(contract.ngayHetHan)
  ) {

    return {
      success: false,
      message: "Ngày hết hạn không hợp lệ"
    };

  }

  if (
    isEmpty(contract.trangThai)
  ) {

    contract.trangThai =
      "Hiệu lực";

  }

  if (
    !isValidContractStatus_(
      contract.trangThai
    )
  ) {

    return {
      success: false,
      message: "Trạng thái hợp đồng không hợp lệ"
    };

  }
if (
  isEmpty(contract.hinhThucLuong)
) {

  contract.hinhThucLuong =
    "LuongThang";

}

if (
  contract.hinhThucLuong !== "LuongThang" &&
  contract.hinhThucLuong !== "LuongCong"
) {

  return {
    success: false,
    message: "Hình thức lương không hợp lệ"
  };

}

if (
  isEmpty(contract.coDongBH)
) {

  contract.coDongBH =
    "Không";

}

if (
  contract.coDongBH !== "Có" &&
  contract.coDongBH !== "Không"
) {

  return {
    success: false,
    message: "Cấu hình đóng bảo hiểm không hợp lệ"
  };

}
  return {
    success: true,
    contract: contract
  };

}


/**
 * Kiểm tra nhân viên tồn tại.
 */
function employeeExists_(manv) {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(values[i][0]) === manv
    ) {

      return true;

    }

  }

  return false;

}


/**
 * Chuẩn hóa tiền.
 */
function normalizeMoney_(value) {

  const text = normalizeText(value);

  if (isEmpty(text)) {

    return 0;

  }

  const cleaned = text.replace(
    /[,\s]/g,
    ""
  );

  const numberValue =
    Number(cleaned);

  if (
    isNaN(numberValue) ||
    numberValue < 0
  ) {

    return 0;

  }

  return numberValue;

}


/**
 * Validate ngày dạng yyyy-mm-dd.
 */
function isValidDateText_(value) {

  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(value)
  ) {

    return false;

  }

  const date = new Date(
    value + "T00:00:00"
  );

  return !isNaN(
    date.getTime()
  );

}


/**
 * Trạng thái hợp đồng hợp lệ.
 */
function isValidContractStatus_(
  status
) {

  const validStatuses = [

    "Hiệu lực",

    "Hết hạn",

    "Đã thanh lý"

  ];

  return validStatuses.indexOf(
    status
  ) >= 0;

}
/**
 * Danh sách tất cả hợp đồng.
 */
function getContractList(status, keyword) {

  status = normalizeText(status);
  keyword = normalizeText(keyword).toLowerCase();

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeMap =
    getEmployeeBriefMap_();

  const result = [];

  for (let i = 1; i < values.length; i++) {

    const row = values[i];

    const maHD = normalizeText(row[0]);
    const maNV = normalizeText(row[1]);

    if (
      isEmpty(maHD) ||
      isEmpty(maNV)
    ) {
      continue;
    }

    const employee =
      employeeMap[maNV] || {};

    const contractStatus =
      normalizeText(row[8]);

    if (
      !isEmpty(status) &&
      contractStatus !== status
    ) {
      continue;
    }

    const searchText = [
      maHD,
      maNV,
      employee.hoten,
      employee.pb,
      row[2],
      contractStatus
    ].join(" ").toLowerCase();

    if (
      !isEmpty(keyword) &&
      searchText.indexOf(keyword) < 0
    ) {
      continue;
    }

    result.push({

      mahd: maHD,
      manv: maNV,
      hoten: employee.hoten || "",
      pb: employee.pb || "",
      loaiHD: row[2],
      ngayKy: row[3],
      ngayHieuLuc: row[4],
      ngayHetHan: row[5],
      luongCoBan: row[6],
      phuCap: row[7],
      trangThai: contractStatus,
      fileURL: row[9],
      ghiChu: row[10],
      createdAt: row[11],

hinhThucLuong: row[12],

luongDongBH: row[13],

coDongBH: row[14],

thuongMacDinh: row[15],

khauTruMacDinh: row[16]

    });

  }

  return jsonResponse(result);

}


/**
 * Hợp đồng sắp hết hạn.
 */
function getContractAlerts(days) {

  days = Number(days || 30);

  if (
    isNaN(days) ||
    days <= 0
  ) {
    days = 30;
  }

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeMap =
    getEmployeeBriefMap_();

  const today =
    getDateOnly_(new Date());

  const result = [];

  for (let i = 1; i < values.length; i++) {

    const row = values[i];

    const maHD = normalizeText(row[0]);
    const maNV = normalizeText(row[1]);
    const trangThai = normalizeText(row[8]);

    if (
      isEmpty(maHD) ||
      isEmpty(maNV)
    ) {
      continue;
    }

    if (trangThai !== "Hiệu lực") {
      continue;
    }

    const ngayHetHan =
      parseContractDate_(row[5]);

    if (!ngayHetHan) {
      continue;
    }

    const daysLeft =
      Math.ceil(
        (ngayHetHan.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
      );

    if (
      daysLeft < 0 ||
      daysLeft > days
    ) {
      continue;
    }

    const employee =
      employeeMap[maNV] || {};

    result.push({

      mahd: maHD,
      manv: maNV,
      hoten: employee.hoten || "",
      pb: employee.pb || "",
      loaiHD: row[2],
      ngayHieuLuc: row[4],
      ngayHetHan: row[5],
      trangThai: trangThai,
      daysLeft: daysLeft,
      fileURL: row[9]

    });

  }

  result.sort(function(a, b) {
    return a.daysLeft - b.daysLeft;
  });

  return jsonResponse(result);

}


/**
 * Map nhân viên ngắn gọn.
 */
function getEmployeeBriefMap_() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const map = {};

  for (let i = 1; i < values.length; i++) {

    const manv =
      normalizeText(values[i][0]);

    if (isEmpty(manv)) {
      continue;
    }

    map[manv] = {
      manv: manv,
      hoten: values[i][1],
      sdt: values[i][2],
      status: values[i][5],
      pb: values[i][7]
    };

  }

  return map;

}


/**
 * Parse ngày hợp đồng.
 */
function parseContractDate_(value) {

  if (!value) {
    return null;
  }

  if (
    Object.prototype.toString.call(value) === "[object Date]"
  ) {

    if (isNaN(value.getTime())) {
      return null;
    }

    return getDateOnly_(value);

  }

  const text =
    normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date =
    new Date(text + "T00:00:00");

  if (isNaN(date.getTime())) {
    return null;
  }

  return getDateOnly_(date);

}


/**
 * Lấy ngày không tính giờ.
 */
function getDateOnly_(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}