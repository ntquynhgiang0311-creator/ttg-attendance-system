/**
 * Setup Sheet Nhật ký hệ thống.
 *
 * Chạy 1 lần.
 */
function setupSystemLogSheet() {

  const sheet =
    getOrCreateSystemLogSheet_();

  const headers = [

    "ThoiGian",

    "MaNV",

    "HoTen",

    "Role",

    "Module",

    "HanhDong",

    "MaDoiTuong",

    "NoiDungCu",

    "NoiDungMoi",

    "GhiChu"

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
    "SETUP_SYSTEM_LOG_OK"
  );

}


/**
 * Ghi nhật ký hệ thống.
 *
 * Không throw lỗi ra ngoài để tránh ảnh hưởng nghiệp vụ chính.
 */
function writeSystemLog(log) {

  try {

    log =
      log || {};

    const sheet =
      getOrCreateSystemLogSheet_();

    const actor =
      getSystemLogActor_(
        log.actorManv
      );

    sheet.appendRow([

      new Date(),

      actor.manv || "",

      actor.hoten || "",

      actor.role || "",

      normalizeText(log.module),

      normalizeText(log.action),

      normalizeText(log.targetId),

      stringifySystemLogValue_(
        log.oldValue
      ),

      stringifySystemLogValue_(
        log.newValue
      ),

      normalizeText(log.note)

    ]);

  }
  catch (error) {

    Logger.log(
      "writeSystemLog error: " +
      error.message
    );

  }

}


/**
 * API đọc nhật ký hệ thống.
 *
 * Dùng cho Admin sau này.
 */
function getSystemLogs(moduleName, keyword, limit) {

  moduleName =
    normalizeText(moduleName);

  keyword =
    normalizeText(keyword)
      .toLowerCase();

  limit =
    Number(limit || 200);

  if (
    isNaN(limit) ||
    limit <= 0
  ) {

    limit = 200;

  }

  const sheet = getSheet(
    CONFIG.SHEETS.SYSTEM_LOGS
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const result = [];

  for (
    let i = values.length - 1;
    i >= 1;
    i--
  ) {

    const row = values[i];

    const rowModule =
      normalizeText(row[4]);

    if (
      !isEmpty(moduleName) &&
      rowModule !== moduleName
    ) {

      continue;

    }

    const searchText = [
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8],
      row[9]
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

      thoiGian:
        row[0],

      manv:
        row[1],

      hoten:
        row[2],

      role:
        row[3],

      module:
        row[4],

      hanhDong:
        row[5],

      maDoiTuong:
        row[6],

      noiDungCu:
        row[7],

      noiDungMoi:
        row[8],

      ghiChu:
        row[9]

    });

    if (
      result.length >= limit
    ) {

      break;

    }

  }

  return jsonResponse(result);

}


/**
 * Lấy thông tin người thao tác từ mã nhân viên.
 */
function getSystemLogActor_(actorManv) {

  actorManv =
    normalizeText(actorManv);

  if (isEmpty(actorManv)) {

    return {
      manv: "",
      hoten: "",
      role: ""
    };

  }

  try {

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

      const manv =
        normalizeText(values[i][0]);

      if (
        manv !== actorManv
      ) {

        continue;

      }

      return {

        manv: manv,

        hoten:
          values[i][1],

        role:
          values[i][4]

      };

    }

  }
  catch (error) {

    Logger.log(
      "getSystemLogActor_ error: " +
      error.message
    );

  }

  return {
    manv: actorManv,
    hoten: "",
    role: ""
  };

}


/**
 * Chuyển object/value thành text lưu log.
 */
function stringifySystemLogValue_(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  if (
    typeof value === "string"
  ) {

    return value;

  }

  try {

    return JSON.stringify(value);

  }
  catch (error) {

    return String(value);

  }

}


/**
 * Lấy hoặc tạo Sheet NhatKyHeThong.
 */
function getOrCreateSystemLogSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.SYSTEM_LOGS
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.SYSTEM_LOGS
      );

  }

  return sheet;

}
