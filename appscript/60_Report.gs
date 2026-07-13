/**
 * Báo cáo tổng chấm công theo tháng
 */
function getReport(
  month,
  year,
  pb
) {

  month = Number(month);

  year = Number(year);

  pb = normalizeText(pb);


  validateReportPeriod(
    month,
    year
  );


  const employeeValues = getSheet(
    CONFIG.SHEETS.EMPLOYEES
  )
    .getDataRange()
    .getValues();


  const attendanceValues = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  )
    .getDataRange()
    .getValues();


  // =========================
  // KHỞI TẠO NHÂN VIÊN
  // =========================

  const report = {};


  for (
    let i = 1;
    i < employeeValues.length;
    i++
  ) {

    const manv = normalizeText(
      employeeValues[i][0]
    );


    if (isEmpty(manv)) {

      continue;

    }


    report[manv] = {

      manv: manv,

      hoten:
        employeeValues[i][1],

      pb:
        employeeValues[i][7],

      days: 0,

      hours: 0

    };

  }


  // =========================
  // GOM DỮ LIỆU THEO NV + NGÀY
  // =========================

  const daily = {};


  for (
    let i = 1;
    i < attendanceValues.length;
    i++
  ) {

    const date = new Date(
      attendanceValues[i][0]
    );


    if (
      isNaN(date.getTime())
    ) {

      continue;

    }


    if (
      date.getMonth() + 1 !== month ||
      date.getFullYear() !== year
    ) {

      continue;

    }


    const manv = normalizeText(
      attendanceValues[i][1]
    );


    if (
      !report[manv]
    ) {

      continue;

    }


    const type = normalizeText(
      attendanceValues[i][3]
    );


    const day = formatDateKey(
      date
    );


    if (
      !daily[manv]
    ) {

      daily[manv] = {};

    }


    if (
      !daily[manv][day]
    ) {

      daily[manv][day] = {

        in: null,

        out: null

      };

    }


    const item =
      daily[manv][day];


    // Lấy Check In sớm nhất
    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_IN
    ) {

      if (
        !item.in ||
        date < item.in
      ) {

        item.in = date;

      }

    }


    // Lấy Check Out muộn nhất
    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    ) {

      if (
        !item.out ||
        date > item.out
      ) {

        item.out = date;

      }

    }

  }


  // =========================
  // TÍNH CÔNG VÀ GIỜ
  // =========================

  Object.keys(daily)
    .forEach(function(manv) {


      Object.keys(
        daily[manv]
      )
        .forEach(function(day) {


          const item =
            daily[manv][day];


          // Chưa đủ In / Out
          // Không tính công
          if (
            !item.in ||
            !item.out
          ) {

            return;

          }


          if (
            item.out <= item.in
          ) {

            return;

          }


          const hours =

            (
              item.out -
              item.in
            )

            /

            3600000;


          const dayWork =
            calculateDayWork(
              hours
            );


          report[manv].hours +=
            hours;


          report[manv].days +=
            dayWork;


        });

    });


  // =========================
  // RESPONSE
  // =========================

  const result = [];


  Object.values(report)
    .forEach(function(item) {


      const employeeDepartment =
        normalizeText(
          item.pb
        );


      if (
        !isEmpty(pb) &&
        pb !== "all" &&
        employeeDepartment !== pb
      ) {

        return;

      }


      result.push({

        manv:
          item.manv,

        hoten:
          item.hoten,

        pb:
          employeeDepartment,

        days:
          item.days,

        hours:
          item.hours.toFixed(1)

      });


    });


  return jsonResponse(result);

}


/**
 * Báo cáo chi tiết nhân viên
 */
function getReportDetail(
  manv,
  month,
  year
) {

  manv = normalizeText(manv);

  month = Number(month);

  year = Number(year);


  validateReportPeriod(
    month,
    year
  );


  if (isEmpty(manv)) {

    throw new Error(
      "Thiếu mã nhân viên"
    );

  }


  const attendanceValues = getSheet(
    CONFIG.SHEETS.ATTENDANCE
  )
    .getDataRange()
    .getValues();


  const siteValues = getSheet(
    CONFIG.SHEETS.SITES
  )
    .getDataRange()
    .getValues();


  // =========================
  // MAP CÔNG TRÌNH
  // =========================

  const siteMap = {};


  for (
    let i = 1;
    i < siteValues.length;
    i++
  ) {

    siteMap[
      siteValues[i][0]
    ] = siteValues[i][1];

  }


  // =========================
  // GOM CHẤM CÔNG THEO NGÀY
  // =========================

  const daily = {};


  for (
    let i = 1;
    i < attendanceValues.length;
    i++
  ) {

    const date = new Date(
      attendanceValues[i][0]
    );


    if (
      isNaN(date.getTime())
    ) {

      continue;

    }


    if (
      date.getMonth() + 1 !== month ||
      date.getFullYear() !== year
    ) {

      continue;

    }


    const attendanceManv =
      normalizeText(
        attendanceValues[i][1]
      );


    if (
      attendanceManv !== manv
    ) {

      continue;

    }


    const type = normalizeText(
      attendanceValues[i][3]
    );


    const maCT = normalizeText(
      attendanceValues[i][2]
    );


    const day = formatDateKey(
      date
    );


    if (
      !daily[day]
    ) {

      daily[day] = {

        in: null,

        out: null,

        mact: ""

      };

    }


    const item =
      daily[day];


    // =========================
    // CHECK IN SỚM NHẤT
    // =========================

    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_IN
    ) {

      if (
        !item.in ||
        date < item.in
      ) {

        item.in = date;

        item.mact = maCT;

      }

    }


    // =========================
    // CHECK OUT MUỘN NHẤT
    // =========================

    if (
      type ===
      CONFIG.ATTENDANCE_TYPE.CHECK_OUT
    ) {

      if (
        !item.out ||
        date > item.out
      ) {

        item.out = date;

      }


      // Dữ liệu lịch sử không có Check In
      if (
        isEmpty(item.mact)
      ) {

        item.mact = maCT;

      }

    }

  }


  // =========================
  // TẠO CHI TIẾT BÁO CÁO
  // =========================

  const result = [];


  Object.keys(daily)
    .sort()
    .forEach(function(day) {


      const item =
        daily[day];


      let hours = 0;

      let overtime = 0;

      let lateMinutes = 0;

      let dayWork = 0;


      if (
        item.in &&
        item.out &&
        item.out > item.in
      ) {

        hours =

          (
            item.out -
            item.in
          )

          /

          3600000;


        dayWork =
          calculateDayWork(
            hours
          );


        overtime =
          calculateOvertimeHours(
            item.out
          );


        lateMinutes =
          calculateLateMinutes(
            item.in
          );

      }


      result.push({

        date:
          day,

        site:

          siteMap[
            item.mact
          ]

          ||

          item.mact,

        checkin:

          item.in

            ?

            Utilities.formatDate(

              item.in,

              Session.getScriptTimeZone(),

              "HH:mm"

            )

            :

            "",

        checkout:

          item.out

            ?

            Utilities.formatDate(

              item.out,

              Session.getScriptTimeZone(),

              "HH:mm"

            )

            :

            "",

        hours:
          hours.toFixed(2),

        daywork:
          dayWork,

        ot:
          overtime.toFixed(2),

        late:
          Math.round(
            lateMinutes
          )

      });

    });


  return jsonResponse(result);

}


/**
 * Tính ngày công
 */
function calculateDayWork(
  hours
) {

  if (
    hours >=
    CONFIG.WORK_RULES.FULL_DAY_HOURS
  ) {

    return 1;

  }


  if (
    hours >=
    CONFIG.WORK_RULES.HALF_DAY_HOURS
  ) {

    return 0.5;

  }


  return 0;

}


/**
 * Tính giờ tăng ca sau giờ kết thúc
 */
function calculateOvertimeHours(
  checkoutTime
) {

  const endTime = new Date(
    checkoutTime
  );


  endTime.setHours(

    CONFIG.WORK_RULES.END_HOUR,

    CONFIG.WORK_RULES.END_MINUTE,

    0,

    0

  );


  if (
    checkoutTime <= endTime
  ) {

    return 0;

  }


  return (

    checkoutTime -
    endTime

  ) / 3600000;

}


/**
 * Tính số phút đi trễ
 */
function calculateLateMinutes(
  checkinTime
) {

  const startTime = new Date(
    checkinTime
  );


  startTime.setHours(

    CONFIG.WORK_RULES.START_HOUR,

    CONFIG.WORK_RULES.START_MINUTE,

    0,

    0

  );


  if (
    checkinTime <= startTime
  ) {

    return 0;

  }


  return (

    checkinTime -
    startTime

  ) / 60000;

}


/**
 * Kiểm tra tháng / năm báo cáo
 */
function validateReportPeriod(
  month,
  year
) {

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {

    throw new Error(
      "Tháng báo cáo không hợp lệ"
    );

  }


  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {

    throw new Error(
      "Năm báo cáo không hợp lệ"
    );

  }

}