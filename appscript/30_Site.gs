/**
 * Danh sách công trình ACTIVE.
 *
 * Dùng cho app chấm công.
 */
function getSites() {

  const sites = readSites_(true);

  return jsonResponse(sites);

}


/**
 * Toàn bộ công trình.
 *
 * Dùng cho Admin.
 */
function getSiteList() {

  const sites = readSites_(false);

  return jsonResponse(sites);

}


/**
 * Đọc dữ liệu công trình.
 */
function readSites_(activeOnly) {

  const sheet = getSheet(
    CONFIG.SHEETS.SITES
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

    const status = normalizeText(
      values[i][7]
    );


    if (isEmpty(ma)) {

      continue;

    }


    if (
      activeOnly === true &&
      status !== CONFIG.STATUS.ACTIVE
    ) {

      continue;

    }


    result.push({

      ma: ma,

      ten: values[i][1],

      loai: values[i][2],

      diachi: values[i][3],

      lat: Number(values[i][4]),

      lng: Number(values[i][5]),

      radius: Number(values[i][6]),

      status: status

    });

  }


  return result;

}


/**
 * Thêm công trình.
 */
function addSite(data) {

  const validation =
    validateSiteInput_(data);


  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }


  const sheet = getSheet(
    CONFIG.SHEETS.SITES
  );


  const maCT = generateNextCode(

    sheet,

    1,

    CONFIG.CODE_PREFIX.SITE,

    CONFIG.CODE_LENGTH.SITE

  );


  const site = validation.site;


  sheet.appendRow([

    maCT,

    site.ten,

    site.loai,

    site.diachi,

    site.lat,

    site.lng,

    site.radius,

    CONFIG.STATUS.ACTIVE

  ]);


  return textResponse("OK");

}


/**
 * Cập nhật công trình.
 */
function updateSite(data) {

  const maCT = normalizeText(
    data.ma
  );


  if (isEmpty(maCT)) {

    return textResponse(
      "Thiếu mã công trình"
    );

  }


  const validation =
    validateSiteInput_(data);


  if (!validation.success) {

    return textResponse(
      validation.message
    );

  }


  const sheet = getSheet(
    CONFIG.SHEETS.SITES
  );


  const values = sheet
    .getDataRange()
    .getValues();


  const site = validation.site;


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      normalizeText(
        values[i][0]
      ) !== maCT
    ) {

      continue;

    }


    sheet
      .getRange(
        i + 1,
        2,
        1,
        6
      )
      .setValues([

        [

          site.ten,

          site.loai,

          site.diachi,

          site.lat,

          site.lng,

          site.radius

        ]

      ]);


    return textResponse("OK");

  }


  return textResponse(
    "Không tìm thấy công trình"
  );

}


/**
 * Bật / tắt công trình.
 */
function toggleSite(data) {

  const maCT = normalizeText(
    data.ma
  );


  if (isEmpty(maCT)) {

    return textResponse(
      "Thiếu mã công trình"
    );

  }


  const sheet = getSheet(
    CONFIG.SHEETS.SITES
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
      normalizeText(
        values[i][0]
      ) !== maCT
    ) {

      continue;

    }


    const currentStatus =
      normalizeText(
        values[i][7]
      );


    const newStatus =

      currentStatus ===
      CONFIG.STATUS.ACTIVE

        ?

        CONFIG.STATUS.INACTIVE

        :

        CONFIG.STATUS.ACTIVE;


    sheet
      .getRange(
        i + 1,
        8
      )
      .setValue(newStatus);


    return textResponse("OK");

  }


  return textResponse(
    "Không tìm thấy công trình"
  );

}


/**
 * Tương thích action cũ.
 *
 * Chỉ chuyển sang Inactive.
 */
function disableSite(data) {

  const maCT = normalizeText(
    data.ma
  );


  if (isEmpty(maCT)) {

    return textResponse(
      "Thiếu mã công trình"
    );

  }


  const sheet = getSheet(
    CONFIG.SHEETS.SITES
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
      normalizeText(
        values[i][0]
      ) !== maCT
    ) {

      continue;

    }


    sheet
      .getRange(
        i + 1,
        8
      )
      .setValue(
        CONFIG.STATUS.INACTIVE
      );


    return textResponse("OK");

  }


  return textResponse(
    "Không tìm thấy công trình"
  );

}


/**
 * Kiểm tra dữ liệu công trình.
 *
 * Không throw Error.
 * Luôn trả object success/message.
 */
function validateSiteInput_(data) {

  data = data || {};


  const ten = normalizeText(
    data.ten
  );


  const loai = normalizeText(
    data.loai
  );


  const diachi = normalizeText(
    data.diachi
  );


  if (isEmpty(ten)) {

    return {

      success: false,

      message:
        "Vui lòng nhập tên công trình"

    };

  }


  if (isEmpty(loai)) {

    return {

      success: false,

      message:
        "Vui lòng chọn loại công trình"

    };

  }


  if (isEmpty(diachi)) {

    return {

      success: false,

      message:
        "Vui lòng nhập địa chỉ công trình"

    };

  }


  if (
    isEmpty(data.lat) ||
    isEmpty(data.lng)
  ) {

    return {

      success: false,

      message:
        "Vui lòng lấy vị trí GPS công trình"

    };

  }


  const lat = Number(
    data.lat
  );


  const lng = Number(
    data.lng
  );


  const radius = Number(
    data.radius
  );


  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {

    return {

      success: false,

      message:
        "Latitude không hợp lệ"

    };

  }


  if (
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {

    return {

      success: false,

      message:
        "Longitude không hợp lệ"

    };

  }


  /**
   * Frontend cũ dùng 0 / 0
   * làm trạng thái chưa lấy GPS.
   */
  if (
    lat === 0 &&
    lng === 0
  ) {

    return {

      success: false,

      message:
        "Vui lòng lấy vị trí GPS công trình"

    };

  }


  if (
    !Number.isFinite(radius) ||
    radius <= 0
  ) {

    return {

      success: false,

      message:
        "Bán kính công trình không hợp lệ"

    };

  }


  return {

    success: true,

    site: {

      ten: ten,

      loai: loai,

      diachi: diachi,

      lat: lat,

      lng: lng,

      radius: radius

    }

  };

}