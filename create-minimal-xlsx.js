// Run with: node create-minimal-xlsx.js
// Creates templates/empty.xlsx for default files init
var fs = require('fs');
var path = require('path');
try {
  var XLSX = require('xlsx');
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), 'Sheet1');
  var buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  var dir = path.join(__dirname, 'templates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'empty.xlsx'), buf);
  console.log('Created templates/empty.xlsx');
} catch (e) {
  console.error('Need xlsx: npm install xlsx');
  process.exit(1);
}
