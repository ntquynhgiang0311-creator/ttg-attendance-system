/**
 * Phòng ban đang hoạt động.
 *
 * Dùng cho form nhân viên / HR.
 */
function getDepartments() {

  return jsonResponse(
    readDepartments_(true)
  );

}


/**
 * Tất cả phòng ban.
 *
 * Dùng cho Admin sau này.
 */
function getDepartmentList() {

  return jsonResponse(
    readDepartments_(false)
  );

}


/**
 * Đọc dữ liệu phòng ban.
 */
function readDepartments_(
  activeOnly
) {

  const sheet = getSheet(
    CONFIG.SHEETS.DEPARTMENTS
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

    const ma = normalizeText(
      values[i][0]
    );


    const ten = normalizeText(
      values[i][1]
    );


    const status = normalizeText(
      values[i][3]
    );


    if (
      isEmpty(ma) ||
      isEmpty(ten)
    ) {

      continue;

    }


    if (
      activeOnly &&
      status !== CONFIG.STATUS.ACTIVE
    ) {

      continue;

    }


    result.push({

      ma: ma,

      ten: ten,

      mota: values[i][2],

      status: status

    });

  }


  return result;

}