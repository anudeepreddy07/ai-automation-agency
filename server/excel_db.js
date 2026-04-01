const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.xlsx');
let workbook = null;

// Initialize Database
async function initDB() {
  workbook = new ExcelJS.Workbook();
  if (fs.existsSync(dbPath)) {
    await workbook.xlsx.readFile(dbPath);
  } else {
    // Create new sheets if it doesn't exist
    const auditsSheet = workbook.addWorksheet('Audits');
    auditsSheet.columns = [
      { header: 'Date', key: 'date', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    const checkoutsSheet = workbook.addWorksheet('Checkouts');
    checkoutsSheet.columns = [
      { header: 'Date', key: 'date', width: 25 },
      { header: 'Plan', key: 'plan', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
    ];

    const clicksSheet = workbook.addWorksheet('Clicks');
    clicksSheet.columns = [
      { header: 'Date', key: 'date', width: 25 },
      { header: 'Element', key: 'element', width: 20 },
      { header: 'Text', key: 'text', width: 30 },
      { header: 'Original Timestamp', key: 'timestamp', width: 30 },
    ];

    await workbook.xlsx.writeFile(dbPath);
    console.log('[DATABASE] Created new database.xlsx file');
  }
}

// Ensure sheet exists or return it
function getSheet(sheetName) {
  let sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    sheet = workbook.addWorksheet(sheetName);
  }
  return sheet;
}

// Appends row and saves
async function appendRow(sheetName, rowData) {
  if (!workbook) await initDB();
  const sheet = getSheet(sheetName);
  sheet.addRow(rowData);
  await workbook.xlsx.writeFile(dbPath);
}

module.exports = {
  initDB,
  appendRow,
};
