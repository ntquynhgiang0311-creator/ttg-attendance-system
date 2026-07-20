/**
 * Mở rộng Sheet HopDong cho bảng lương Cách C.
 *
 * Chạy 1 lần.
 */
function setupContractPayrollColumns() {

  const sheet = getSheet(
    CONFIG.SHEETS.CONTRACTS
  );

  const headers = [

    "HinhThucLuong",

    "LuongDongBH",

    "CoDongBH",

    "ThuongMacDinh",

    "KhauTruMacDinh"

  ];

  sheet
    .getRange(
      1,
      13,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  return textResponse(
    "SETUP_CONTRACT_PAYROLL_COLUMNS_OK"
  );

}