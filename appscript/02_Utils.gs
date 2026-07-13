/**
 * Trả JSON response
 */
function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}


/**
 * Trả text response
 */
function textResponse(text) {

  return ContentService
    .createTextOutput(
      String(text)
    );

}


/**
 * Lấy Sheet theo tên
 */
function getSheet(sheetName) {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) {

    throw new Error(
      "Không tìm thấy Sheet: " + sheetName
    );

  }

  return sheet;

}


/**
 * Parse dữ liệu POST
 */
function parsePostData(e) {

  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {

    throw new Error(
      "Không có dữ liệu POST"
    );

  }

  let data;

  try {

    data = JSON.parse(
      e.postData.contents
    );

  }
  catch (error) {

    throw new Error(
      "Dữ liệu JSON không hợp lệ"
    );

  }

  if (!data.action) {

    throw new Error(
      "Thiếu action"
    );

  }

  return data;

}


/**
 * Sinh mã tiếp theo.
 *
 * Ví dụ:
 * NV001
 * NV002
 * NV005
 *
 * => NV006
 */
function generateNextCode(
  sheet,
  columnIndex,
  prefix,
  codeLength
) {

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {

    return prefix +
      String(1).padStart(
        codeLength,
        "0"
      );

  }

  const values = sheet
    .getRange(
      2,
      columnIndex,
      lastRow - 1,
      1
    )
    .getValues();

  let maxNumber = 0;

  values.forEach(function(row) {

    const code = String(
      row[0] || ""
    ).trim();

    if (
      !code.startsWith(prefix)
    ) {

      return;

    }

    const numberPart = Number(
      code.substring(
        prefix.length
      )
    );

    if (
      !isNaN(numberPart) &&
      numberPart > maxNumber
    ) {

      maxNumber = numberPart;

    }

  });

  const nextNumber =
    maxNumber + 1;

  return prefix +
    String(nextNumber)
      .padStart(
        codeLength,
        "0"
      );

}


/**
 * Format ngày thành yyyy-MM-dd
 */
function formatDateKey(date) {

  return Utilities.formatDate(
    new Date(date),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

}


/**
 * Format ngày dd/MM/yyyy
 */
function formatDisplayDate(date) {

  return Utilities.formatDate(
    new Date(date),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy"
  );

}


/**
 * Chuẩn hóa chuỗi
 */
function normalizeText(value) {

  return String(
    value || ""
  ).trim();

}


/**
 * Kiểm tra giá trị rỗng
 */
function isEmpty(value) {

  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );

}


/**
 * Log lỗi hệ thống
 */
function logError(
  moduleName,
  error
) {

  console.error(
    "[" + moduleName + "]",
    error
  );

}


/**
 * Response lỗi API
 */
function errorResponse(
  message,
  detail
) {

  const result = {
    success: false,
    message: message
  };

  if (detail) {

    result.detail = String(detail);

  }

  return jsonResponse(result);

}