const { chromium } = require('playwright');
const [,, caso, tema = 'ejemplo', out, paginas = ''] = process.argv;
(async () => {
  const br = await chromium.launch(); const pg = await br.newPage();
  pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => console.log('LOG', m.text()));
  await pg.goto(`file://' + require('path').join(__dirname, 'plantilla.html') + '?caso=${caso}&tema=${tema}${paginas ? '&paginas=' + paginas : ''}`, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await br.close();
})();
