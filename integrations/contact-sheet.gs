// Install on a dedicated tab so historical column layouts stay intact.
function doPost(event) {
  const settings = PropertiesService.getScriptProperties();
  const inbound = JSON.parse(event.postData.contents);
  const secret = settings.getProperty('CONTACT_SHEET_SECRET');
  const contact = inbound.contact;
  if (!secret || inbound.secret !== secret || !contact ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(contact.id)) throw Error('Invalid request');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.openById(settings.getProperty('SPREADSHEET_ID'));
    const sheet = book.getSheetByName('ClinicFlow inquiries') || book.insertSheet('ClinicFlow inquiries');
    const fields = ['id','created_at','name','email','phone','message','source','utm_source','utm_medium','utm_campaign','utm_content'];
    if (sheet.getLastRow() === 0) sheet.appendRow(fields);
    if (sheet.getRange(1,1).getValue() !== 'id') throw Error('Unexpected destination layout');
    const count = sheet.getLastRow() - 1;
    const exists = count && sheet.getRange(2,1,count,1).createTextFinder(contact.id).matchEntireCell(true).findNext();
    if (!exists) {
      const row = fields.map(key => {
        const value = String(contact[key] || '');
        return /^\s*[=+@-]/.test(value) ? "'" + value : value;
      });
      const next = sheet.getLastRow() + 1;
      sheet.getRange(next, fields.indexOf('phone') + 1).setNumberFormat('@');
      sheet.getRange(next, 1, 1, fields.length).setValues([row]);
      SpreadsheetApp.flush();
    }
    return ContentService.createTextOutput(JSON.stringify({storedId:contact.id})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
