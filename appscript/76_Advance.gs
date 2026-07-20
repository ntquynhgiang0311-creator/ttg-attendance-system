/**
 * Setup Sheet Tạm ứng.
 *
 * Chạy 1 lần.
 */
function setupAdvanceSheet() {

  const sheet =
    getOrCreateAdvanceSheet_();

  const headers = [

    "MaTU",

    "MaNV",

    "NgayTamUng",

    "SoTien",

    "LyDo",

    "TrangThai",

    "NguoiDuyet",

    "NgayDuyet",

    "GhiChuDuyet",

    "CreatedAt"

  ];

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  sheet.setFrozenRows(1);

  return textResponse(
    "SETUP_ADVANCE_OK"
  );

}


/**
 * Lấy danh sách đề nghị tạm ứng.
 *
 * Dùng cho Admin/Kế toán.
 */
function getAdvanceRequests(
  status,
  keyword,
  month,
  year
) {

  status =
    normalizeText(status);

  keyword =
    normalizeText(keyword)
      .toLowerCase();

  month =
    Number(month || 0);

  year =
    Number(year || 0);

  const sheet = getSheet(
    CONFIG.SHEETS.ADVANCES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const employeeMap =
    getEmployeeBriefMapForAdvance_();

  const result = [];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];

    const maTU =
      normalizeText(row[0]);

    const maNV =
      normalizeText(row[1]);

    if (
      isEmpty(maTU) ||
      isEmpty(maNV)
    ) {

      continue;

    }

    const ngayTamUng =
      parseAdvanceDate_(row[2]);

    if (
      month > 0 &&
      year > 0
    ) {

      if (!ngayTamUng) {

        continue;

      }

      if (
        ngayTamUng.getMonth() + 1 !== month ||
        ngayTamUng.getFullYear() !== year
      ) {

        continue;

      }

    }

    const trangThai =
      normalizeText(row[5]);

    if (
      !isEmpty(status) &&
      trangThai !== status
    ) {

      continue;

    }

    const employee =
      employeeMap[maNV] || {};

    const searchText = [

      maTU,

      maNV,

      employee.hoten,

      employee.pb,

      row[4],

      trangThai

    ]
      .join(" ")
      .toLowerCase();

    if (
      !isEmpty(keyword) &&
      searchText.indexOf(keyword) < 0
    ) {

      continue;

    }

    result.push({

      maTU: maTU,

      manv: maNV,

      hoten:
        employee.hoten || "",

      pb:
        employee.pb || "",

      ngayTamUng:
        row[2],

      soTien:
        row[3],

      lyDo:
        row[4],

      trangThai:
        trangThai,

      nguoiDuyet:
        row[6],

      ngayDuyet:
        row[7],

      ghiChuDuyet:
        row[8],

      createdAt:
        row[9]

    });

  }

  result.sort(function(a, b) {

    return String(b.createdAt || "")
      .localeCompare(
        String(a.createdAt || "")
      );

  });

  return jsonResponse(result);

}


/**
 * Lấy đề nghị tạm ứng theo nhân viên.
 */
function getEmployeeAdvanceRequests(manv) {

  manv =
    normalizeText(manv);

  if (isEmpty(manv)) {

    return jsonResponse([]);

  }

  const sheet = getSheet(
    CONFIG.SHEETS.ADVANCES
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

      maTU:
        row[0],

      manv:
        row[1],

      ngayTamUng:
        row[2],

      soTien:
        row[3],

      lyDo:
        row[4],

      trangThai:
        row[5],

      nguoiDuyet:
        row[6],

      ngayDuyet:
        row[7],

      ghiChuDuyet:
        row[8],

      createdAt:
        row[9]

    });

  }

  result.sort(function(a, b) {

    return String(b.createdAt || "")
      .localeCompare(
        String(a.createdAt || "")
      );

  });

  return jsonResponse(result);

}


/**
 * Nhân viên gửi đề nghị tạm ứng.
 *
 * Bản an toàn:
 * - Chỉ validate và append
 * - Không ghi log ở bước tạo đơn
 * - Log chỉ nên ghi ở bước Admin duyệt/từ chối
 */
function addAdvanceRequest(data) {

  const validation =
    validateAdvanceInput_(data);

  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }

  const advance =
    validation.advance;

  const lock =
    LockService.getScriptLock();

  let locked = false;

  try {

    lock.waitLock(10000);

    locked = true;

    const sheet = getSheet(
      CONFIG.SHEETS.ADVANCES
    );

    const maTU =
      generateNextCode(
        sheet,
        1,
        CONFIG.CODE_PREFIX.ADVANCE,
        CONFIG.CODE_LENGTH.ADVANCE
      );

    sheet.appendRow([

      maTU,

      advance.manv,

      advance.ngayTamUng,

      advance.soTien,

      advance.lyDo,

      "Chờ duyệt",

      "",

      "",

      "",

      new Date()

    ]);

    return textResponse("OK");

  }
  catch (error) {

    logError(
      "addAdvanceRequest",
      error
    );

    return textResponse(
      "Không tạo được đề nghị tạm ứng"
    );

  }
  finally {

    if (locked) {

      try {

        lock.releaseLock();

      }
      catch (error) {

        Logger.log(
          "releaseLock addAdvanceRequest error: " +
          error.message
        );

      }

    }

  }

}

/**
 * Duyệt / Từ chối đề nghị tạm ứng.
 *
 * Backend kiểm tra người duyệt có phải Admin thật không.
 */
function updateAdvanceRequestStatus(data) {

  data = data || {};

  const maTU =
    normalizeText(data.maTU);

  const trangThai =
    normalizeText(data.trangThai);

  const approverManv =
    normalizeText(data.approverManv);

  const ghiChuDuyet =
    normalizeText(data.ghiChuDuyet);

  if (isEmpty(maTU)) {

    return textResponse(
      "Thiếu mã tạm ứng"
    );

  }

  if (
    trangThai !== "Đã duyệt" &&
    trangThai !== "Từ chối"
  ) {

    return textResponse(
      "Trạng thái duyệt không hợp lệ"
    );

  }

  const approver =
    getAdminApproverForAdvance_(
      approverManv
    );

  if (!approver) {

    return textResponse(
      "Người duyệt không hợp lệ hoặc không có quyền Admin"
    );

  }

  const nguoiDuyet =
    approver.manv +
    " - " +
    approver.hoten;

  const sheet = getSheet(
    CONFIG.SHEETS.ADVANCES
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
      normalizeText(values[i][0]) !== maTU
    ) {

      continue;

    }

    const currentStatus =
      normalizeText(values[i][5]);

    if (
      currentStatus !== "Chờ duyệt"
    ) {

      return textResponse(
        "Đề nghị này đã được xử lý"
      );

    }

    sheet
      .getRange(
        i + 1,
        6,
        1,
        4
      )
      .setValues([

        [

          trangThai,

          nguoiDuyet,

          new Date(),

          ghiChuDuyet

        ]

      ]);


    /**
     * Ghi nhật ký cho cả Đã duyệt và Từ chối.
     * Lưu ý: module phải là TamUng.
     */
    try {

      writeSystemLog({

        actorManv:
          approverManv,

        module:
          "TamUng",

        action:
          trangThai,

        targetId:
          maTU,

        oldValue:
          {
            trangThai: currentStatus
          },

        newValue:
          {
            trangThai: trangThai,
            nguoiDuyet: nguoiDuyet,
            ghiChuDuyet: ghiChuDuyet
          },

        note:
          "Duyệt/từ chối đề nghị tạm ứng"

      });

    }
    catch (error) {

      Logger.log(
        "System log TamUng error: " +
        error.message
      );

    }

    return textResponse("OK");

  }

  return textResponse(
    "Không tìm thấy đề nghị tạm ứng"
  );

}


/**
 * Tổng tạm ứng đã duyệt theo nhân viên trong tháng.
 *
 * Dùng cho bảng lương sau này.
 */
function getApprovedAdvanceTotal(manv, month, year) {

  manv =
    normalizeText(manv);

  month =
    Number(month);

  year =
    Number(year);

  if (
    isEmpty(manv) ||
    isNaN(month) ||
    isNaN(year)
  ) {

    return jsonResponse({
      manv: manv,
      total: 0
    });

  }

  const sheet = getSheet(
    CONFIG.SHEETS.ADVANCES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  let total = 0;

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

    if (
      normalizeText(row[5]) !== "Đã duyệt"
    ) {

      continue;

    }

    const ngayTamUng =
      parseAdvanceDate_(row[2]);

    if (!ngayTamUng) {

      continue;

    }

    if (
      ngayTamUng.getMonth() + 1 !== month ||
      ngayTamUng.getFullYear() !== year
    ) {

      continue;

    }

    total += Number(row[3] || 0);

  }

  return jsonResponse({

    manv: manv,

    month: month,

    year: year,

    total: total

  });

}


/**
 * Validate đề nghị tạm ứng.
 */
function validateAdvanceInput_(data) {

  data = data || {};

  const advance = {

    manv:
      normalizeText(data.manv),

    ngayTamUng:
      normalizeText(data.ngayTamUng),

    soTien:
      normalizeAdvanceMoney_(data.soTien),

    lyDo:
      normalizeText(data.lyDo)

  };

  if (isEmpty(advance.manv)) {

    return {
      success: false,
      message: "Thiếu nhân viên"
    };

  }

  if (
    !employeeExistsForAdvance_(
      advance.manv
    )
  ) {

    return {
      success: false,
      message: "Không tìm thấy nhân viên"
    };

  }

  if (isEmpty(advance.ngayTamUng)) {

    advance.ngayTamUng =
      formatAdvanceDateKey_(new Date());

  }

  if (
    !isValidAdvanceDateText_(
      advance.ngayTamUng
    )
  ) {

    return {
      success: false,
      message: "Ngày tạm ứng không hợp lệ"
    };

  }

  if (
    advance.soTien <= 0
  ) {

    return {
      success: false,
      message: "Số tiền tạm ứng phải lớn hơn 0"
    };

  }

  if (
    advance.soTien > 100000000
  ) {

    return {
      success: false,
      message: "Số tiền tạm ứng quá lớn, vui lòng kiểm tra lại"
    };

  }

  if (isEmpty(advance.lyDo)) {

    return {
      success: false,
      message: "Vui lòng nhập lý do tạm ứng"
    };

  }

  return {
    success: true,
    advance: advance
  };

}


/**
 * Kiểm tra nhân viên tồn tại.
 */
function employeeExistsForAdvance_(manv) {

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
 * Kiểm tra người duyệt có phải Admin thật không.
 */
function getAdminApproverForAdvance_(manv) {

  manv =
    normalizeText(manv);

  if (isEmpty(manv)) {

    return null;

  }

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

    const currentManv =
      normalizeText(values[i][0]);

    if (currentManv !== manv) {

      continue;

    }

    const role =
      normalizeText(values[i][4])
        .toLowerCase();

    const status =
      normalizeText(values[i][5]);

    if (
      role !== "admin" ||
      status !== CONFIG.STATUS.ACTIVE
    ) {

      return null;

    }

    return {

      manv: currentManv,

      hoten:
        values[i][1],

      role:
        values[i][4]

    };

  }

  return null;

}


/**
 * Map nhân viên cho tạm ứng.
 */
function getEmployeeBriefMapForAdvance_() {

  const sheet = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const map = {};

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const manv =
      normalizeText(values[i][0]);

    if (isEmpty(manv)) {

      continue;

    }

    map[manv] = {

      manv: manv,

      hoten:
        values[i][1],

      sdt:
        values[i][2],

      status:
        values[i][5],

      pb:
        values[i][7]

    };

  }

  return map;

}


/**
 * Chuẩn hóa tiền tạm ứng.
 */
function normalizeAdvanceMoney_(value) {

  const text =
    normalizeText(value);

  if (isEmpty(text)) {

    return 0;

  }

  const cleaned =
    text.replace(
      /[,\s.]/g,
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
 * Validate ngày yyyy-mm-dd.
 */
function isValidAdvanceDateText_(value) {

  return /^\d{4}-\d{2}-\d{2}$/
    .test(value);

}


/**
 * Parse ngày tạm ứng.
 */
function parseAdvanceDate_(value) {

  if (!value) {

    return null;

  }

  if (
    Object.prototype.toString.call(value) === "[object Date]"
  ) {

    if (
      isNaN(value.getTime())
    ) {

      return null;

    }

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

  }

  const text =
    normalizeText(value);

  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(text)
  ) {

    return null;

  }

  const date =
    new Date(
      text + "T00:00:00"
    );

  if (
    isNaN(date.getTime())
  ) {

    return null;

  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}


/**
 * Format yyyy-mm-dd.
 */
function formatAdvanceDateKey_(date) {

  const year =
    date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return year + "-" + month + "-" + day;

}


/**
 * Lấy hoặc tạo Sheet TamUng.
 */
function getOrCreateAdvanceSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.ADVANCES
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.ADVANCES
      );

  }

  return sheet;

}