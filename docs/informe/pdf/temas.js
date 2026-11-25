/* Identidad de cada farmacia: lo único que cambia entre farmacias. Todas son de demostración. */
const marcaCruz = (c, w) => `<svg viewBox="0 0 40 40" style="height:${w};width:auto"><rect x="1" y="1" width="38" height="38" rx="9" fill="${c}"/><path d="M16 9h8v7h7v8h-7v7h-8v-7H9v-8h7z" fill="#fff"/></svg>`;
window.TEMAS = {
  ejemplo: {
    demo: true, nombre: 'Farmacia Ejemplo', ciudad: 'Valladolid', acento: '#1E5B4F',
    servicio: 'Estudio facial personalizado',
    logo: `<div style="display:flex;align-items:center;gap:3mm">${marcaCruz('#1E5B4F', '11mm')}<div style="line-height:1.05"><div style="font-family:Fraunces,serif;font-size:13pt;font-weight:400;color:#15191C">Farmacia Ejemplo</div><div style="font-size:6.5pt;letter-spacing:.18em;text-transform:uppercase;color:#848D95">Valladolid</div></div></div>`,
    logoMini: `${marcaCruz('#1E5B4F', '6mm')}<span style="font-family:Fraunces,serif;font-size:9.5pt">Farmacia Ejemplo</span>`,
    direccion: 'Calle Ejemplo, 1 · 47001 Valladolid', telefono: '983 000 000', horario: 'Lunes a sábado, de 9:00 a 21:00',
    legal: '[PENDIENTE: razón social, NIF y domicilio]', contactoPriv: '[PENDIENTE: email de privacidad]',
  },
  alameda: {
    demo: true, nombre: 'Farmacia Alameda', ciudad: 'Sevilla', acento: '#23385E',
    servicio: 'Estudio facial personalizado',
    logo: `<div style="display:flex;align-items:center;gap:3mm"><svg viewBox="0 0 40 40" style="height:11mm"><circle cx="20" cy="20" r="19" fill="none" stroke="#23385E" stroke-width="1.6"/><text x="20" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#23385E">A</text></svg><div style="font-family:Georgia,serif;font-size:14pt;letter-spacing:.12em;text-transform:uppercase;color:#23385E">Alameda<div style="font-family:Inter,sans-serif;font-size:6pt;letter-spacing:.3em;color:#7c8799">Farmacia · Sevilla</div></div></div>`,
    logoMini: `<svg viewBox="0 0 40 40" style="height:6mm"><circle cx="20" cy="20" r="19" fill="none" stroke="#23385E" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#23385E">A</text></svg><span style="font-family:Georgia,serif;font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:#23385E">Alameda</span>`,
    direccion: 'Avenida de Demostración, 10 · 41001 Sevilla', telefono: '954 000 000', horario: 'Lunes a viernes, de 9:30 a 20:30',
    legal: '[PENDIENTE]', contactoPriv: '[PENDIENTE]',
  },
  llorente: {
    demo: true, nombre: 'Farmacia Llorente', ciudad: 'Bilbao', acento: '#B04A2E',
    servicio: 'Análisis de piel',
    logo: `<div style="display:flex;align-items:center;gap:2.5mm"><svg viewBox="0 0 40 40" style="height:10mm"><path d="M20 3c9 8 14 15 14 22a14 14 0 0 1-28 0C6 18 11 11 20 3z" fill="#B04A2E"/><path d="M15 25h10M20 20v10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg><div style="font-family:Inter,sans-serif;font-weight:700;font-size:13pt;letter-spacing:-.02em;color:#2A1A15">llorente<span style="color:#B04A2E">.</span><div style="font-weight:400;font-size:6.5pt;letter-spacing:.08em;color:#8a7a74">farmacia · bilbao</div></div></div>`,
    logoMini: `<svg viewBox="0 0 40 40" style="height:6mm"><path d="M20 3c9 8 14 15 14 22a14 14 0 0 1-28 0C6 18 11 11 20 3z" fill="#B04A2E"/></svg><span style="font-weight:700;font-size:9pt;letter-spacing:-.02em">llorente<span style="color:#B04A2E">.</span></span>`,
    direccion: 'Calle de Muestra, 5 · 48001 Bilbao', telefono: '944 000 000', horario: 'Todos los días, de 9:00 a 22:00',
    legal: '[PENDIENTE]', contactoPriv: '[PENDIENTE]',
  },
};
