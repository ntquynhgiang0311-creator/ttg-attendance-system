/**
 * Setup Sheet Cấu hình lương.
 *
 * Chạy 1 lần.
 */
function setupPayrollConfigSheet() {

  const sheet =
    getOrCreatePayrollConfigSheet_();

  const headers = [

    "Thang",

    "Nam",

    "CongChuan",

    "TuDongTinh",

    "GhiChu",

    "UpdatedAt",

    "UpdatedBy"

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
  sheet
  .getRange("A:A")
  .setNumberFormat("0");

sheet
  .getRange("B:B")
  .setNumberFormat("0");

sheet
  .getRange("C:C")
  .setNumberFormat("0");

sheet
  .getRange("D:D")
  .setNumberFormat("@");

sheet
  .getRange("E:E")
  .setNumberFormat("@");

sheet
  .getRange("F:F")
  .setNumberFormat("dd/MM/yyyy HH:mm:ss");

sheet
  .getRange("G:G")
  .setNumberFormat("@");

  return textResponse(
    "SETUP_PAYROLL_CONFIG_OK"
  );

}


/**
 * Lấy cấu hình công chuẩn tháng.
 *
 * Nếu chưa có cấu hình thì tự tính:
 * Công chuẩn = số ngày trong tháng - số Chủ nhật.
 */
function getPayrollConfig(month, year) {

  month = Number(month);
  year = Number(year);

  if (
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12
  ) {

    return jsonResponse({
      success: false,
      message: "Tháng/năm không hợp lệ"
    });

  }

  const sheet = getSheet(
    CONFIG.SHEETS.PAYROLL_CONFIG
  );

  const values = sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const rowMonth =
      Number(values[i][0]);

    const rowYear =
      Number(values[i][1]);

    if (
      rowMonth === month &&
      rowYear === year
    ) {

      const congChuan =
        Number(values[i][2] || 0);

      return jsonResponse({

        success: true,

        month:
          month,

        year:
          year,

        congChuan:
          congChuan,

        standardDays:
          congChuan,

        tuDongTinh:
          false,

        ghiChu:
          values[i][4] || "",

        note:
          values[i][4] || "",

        updatedAt:
          values[i][5] || "",

        updatedBy:
          values[i][6] || "",

        source:
          "manual"

      });

    }

  }

  const autoStandardDays =
    calculateStandardWorkingDays_(
      month,
      year
    );

  return jsonResponse({

    success: true,

    month:
      month,

    year:
      year,

    congChuan:
      autoStandardDays,

    standardDays:
      autoStandardDays,

    tuDongTinh:
      true,

    ghiChu:
      "Tự tính: tổng ngày trong tháng trừ Chủ nhật",

    note:
      "Tự tính: tổng ngày trong tháng trừ Chủ nhật",

    updatedAt:
      "",

    updatedBy:
      "",

    source:
      "auto"

  });

}


/**
 * Lưu cấu hình công chuẩn tháng.
 */
function savePayrollConfig(data) {

  data = data || {};

  const month =
    Number(data.month);

  const year =
    Number(data.year);

  const congChuan =
    Number(
      data.congChuan ||
      data.standardDays
    );

  const ghiChu =
    normalizeText(
      data.ghiChu ||
      data.note
    );

  const updatedBy =
    normalizeText(data.updatedBy);

  if (
    isNaN(month) ||
    month < 1 ||
    month > 12
  ) {

    return textResponse(
      "Tháng không hợp lệ"
    );

  }

  if (
    isNaN(year) ||
    year < 2000
  ) {

    return textResponse(
      "Năm không hợp lệ"
    );

  }

  if (
    isNaN(congChuan) ||
    congChuan <= 0 ||
    congChuan > 31
  ) {

    return textResponse(
      "Công chuẩn không hợp lệ"
    );

  }

  const sheet = getSheet(
    CONFIG.SHEETS.PAYROLL_CONFIG
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const targetId =
    year + "-" + String(month).padStart(2, "0");

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const rowMonth =
      Number(values[i][0]);

    const rowYear =
      Number(values[i][1]);

    if (
      rowMonth !== month ||
      rowYear !== year
    ) {

      continue;

    }

    const oldValue = {

      month:
        values[i][0],

      year:
        values[i][1],

      congChuan:
        values[i][2],

      tuDongTinh:
        values[i][3],

      ghiChu:
        values[i][4],

      updatedAt:
        values[i][5],

      updatedBy:
        values[i][6]

    };

    const newValue = {

      month:
        month,

      year:
        year,

      congChuan:
        congChuan,

      tuDongTinh:
        false,

      ghiChu:
        ghiChu,

      updatedAt:
        new Date(),

      updatedBy:
        updatedBy

    };

    sheet
      .getRange(
        i + 1,
        1,
        1,
        7
      )
      .setValues([

        [

          newValue.month,

          newValue.year,

          newValue.congChuan,

          newValue.tuDongTinh,

          newValue.ghiChu,

          newValue.updatedAt,

          newValue.updatedBy

        ]

      ]);

    try {

      writeSystemLog({

        actorManv:
          normalizeText(data.actorManv),

        module:
          "Luong",

        action:
          "Sửa công chuẩn",

        targetId:
          targetId,

        oldValue:
          oldValue,

        newValue:
          newValue,

        note:
          "Cập nhật cấu hình công chuẩn"

      });

    }
    catch (error) {

      Logger.log(
        "System log savePayrollConfig update error: " +
        error.message
      );

    }

    return textResponse("OK");

  }

  const newValue = {

    month:
      month,

    year:
      year,

    congChuan:
      congChuan,

    tuDongTinh:
      false,

    ghiChu:
      ghiChu,

    updatedAt:
      new Date(),

    updatedBy:
      updatedBy

  };

  sheet.appendRow([

    newValue.month,

    newValue.year,

    newValue.congChuan,

    newValue.tuDongTinh,

    newValue.ghiChu,

    newValue.updatedAt,

    newValue.updatedBy

  ]);

  try {

    writeSystemLog({

      actorManv:
        normalizeText(data.actorManv),

      module:
        "Luong",

      action:
        "Thêm công chuẩn",

      targetId:
        targetId,

      oldValue:
        "",

      newValue:
        newValue,

      note:
        "Thêm cấu hình công chuẩn"

    });

  }
  catch (error) {

    Logger.log(
      "System log savePayrollConfig add error: " +
      error.message
    );

  }

  return textResponse("OK");

}


/**
 * Reset cấu hình công chuẩn tháng về tự động.
 *
 * Xóa dòng cấu hình thủ công của tháng/năm.
 */
function resetPayrollConfig(data) {

  data = data || {};

  const month =
    Number(data.month);

  const year =
    Number(data.year);

  if (
    isNaN(month) ||
    month < 1 ||
    month > 12
  ) {

    return textResponse(
      "Tháng không hợp lệ"
    );

  }

  if (
    isNaN(year) ||
    year < 2000
  ) {

    return textResponse(
      "Năm không hợp lệ"
    );

  }

  const sheet = getSheet(
    CONFIG.SHEETS.PAYROLL_CONFIG
  );

  const values = sheet
    .getDataRange()
    .getValues();

  const targetId =
    year + "-" + String(month).padStart(2, "0");

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const rowMonth =
      Number(values[i][0]);

    const rowYear =
      Number(values[i][1]);

    if (
      rowMonth !== month ||
      rowYear !== year
    ) {

      continue;

    }

    const oldValue = {

      month:
        values[i][0],

      year:
        values[i][1],

      congChuan:
        values[i][2],

      tuDongTinh:
        values[i][3],

      ghiChu:
        values[i][4],

      updatedAt:
        values[i][5],

      updatedBy:
        values[i][6]

    };

    sheet.deleteRow(
      i + 1
    );

    try {

      writeSystemLog({

        actorManv:
          normalizeText(data.actorManv),

        module:
          "Luong",

        action:
          "Reset công chuẩn",

        targetId:
          targetId,

        oldValue:
          oldValue,

        newValue:
          {
            month:
              month,

            year:
              year,

            mode:
              "Auto"
          },

        note:
          "Reset công chuẩn về tự động"

      });

    }
    catch (error) {

      Logger.log(
        "System log resetPayrollConfig error: " +
        error.message
      );

    }

    return textResponse("OK");

  }

  /**
   * Không có dòng thủ công để xóa,
   * nhưng vẫn ghi log thao tác reset.
   */
  try {

    writeSystemLog({

      actorManv:
        normalizeText(data.actorManv),

      module:
        "Luong",

      action:
        "Reset công chuẩn",

      targetId:
        targetId,

      oldValue:
        {
          month:
            month,

          year:
            year,

          mode:
            "Auto"
        },

      newValue:
        {
          month:
            month,

          year:
            year,

          mode:
            "Auto"
        },

      note:
        "Reset công chuẩn nhưng không có cấu hình thủ công"

    });

  }
  catch (error) {

    Logger.log(
      "System log resetPayrollConfig no-row error: " +
      error.message
    );

  }

  return textResponse("OK");

}


/**
 * Tự tính công chuẩn.
 *
 * Rule V1:
 * Công chuẩn = số ngày trong tháng - số Chủ nhật.
 */
function calculateStandardWorkingDays_(
  month,
  year
) {

  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();

  let standardDays = 0;

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    const dayOfWeek =
      date.getDay();

    /**
     * getDay():
     * 0 = Chủ nhật
     */
    if (dayOfWeek !== 0) {

      standardDays++;

    }

  }

  return standardDays;

}


/**
 * Lấy hoặc tạo Sheet CauHinhLuong.
 */
function getOrCreatePayrollConfigSheet_() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.PAYROLL_CONFIG
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.PAYROLL_CONFIG
      );

  }

  return sheet;

}
function fixPayrollConfigSheetFormat() {

  const sheet = getSheet(
    CONFIG.SHEETS.PAYROLL_CONFIG
  );

  sheet
    .getRange("A:A")
    .setNumberFormat("0");

  sheet
    .getRange("B:B")
    .setNumberFormat("0");

  sheet
    .getRange("C:C")
    .setNumberFormat("0");

  sheet
    .getRange("D:D")
    .setNumberFormat("@");

  sheet
    .getRange("E:E")
    .setNumberFormat("@");

  sheet
    .getRange("F:F")
    .setNumberFormat("dd/MM/yyyy HH:mm:ss");

  sheet
    .getRange("G:G")
    .setNumberFormat("@");

  return textResponse(
    "FIX_PAYROLL_CONFIG_FORMAT_OK"
  );

}