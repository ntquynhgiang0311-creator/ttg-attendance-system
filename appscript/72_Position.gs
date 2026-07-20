/**
 * Chức vụ đang hoạt động.
 *
 * Dùng cho form nhân viên / HR.
 */
function getPositions() {

  return jsonResponse(
    readPositions_(true)
  );

}


/**
 * Tất cả chức vụ.
 *
 * Dùng cho Admin sau này.
 */
function getPositionList() {

  return jsonResponse(
    readPositions_(false)
  );

}


/**
 * Đọc dữ liệu chức vụ.
 */
function readPositions_(
  activeOnly
) {

  const sheet = getSheet(
    CONFIG.SHEETS.POSITIONS
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