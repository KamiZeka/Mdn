const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const $ = (id) => document.getElementById(id);
const val = (id) => $(id).value;
const num = (id, fallback = 0) => {
  const n = Number($(id).value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const rateDebarras = {
  garage: [25, 35, 45],
  cave: [30, 40, 55],
  appartement: [35, 50, 65],
  maison: [30, 45, 60],
  local: [35, 50, 70]
};

const fillCoeff = {
  faible: 0.20,
  moyen: 0.35,
  fort: 0.55,
  sature: 0.80
};

const rateNettoyage = {
  apres_debarras: [5, 8, 12],
  cave_garage: [6, 10, 15],
  travaux: [6, 10, 15],
  logement_sale: [10, 18, 25],
  tres_sale: [20, 30, 40]
};

function round10(x) { return Math.round(x / 10) * 10; }
function addTriplet(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function multiplyTriplet(a, coeff) { return [a[0] * coeff, a[1] * coeff, a[2] * coeff]; }
function minTriplet(a, min) { return [Math.max(a[0], min[0]), Math.max(a[1], min[1]), Math.max(a[2], min[2])]; }
function roundTriplet(a) { return a.map(round10); }

function calcDebarras() {
  const surface = num('debSurface', 50);
  const remplissage = val('debRemplissage');
  const volume = surface * fillCoeff[remplissage];
  const type = val('debType');
  let prices = rateDebarras[type].map(rate => volume * rate);

  let coeff = 1;
  if (val('debAcces') === 'moyen') coeff += 0.10;
  if (val('debAcces') === 'difficile') coeff += 0.25;
  if (val('debTri') === 'moyen') coeff += 0.10;
  if (val('debTri') === 'important') coeff += 0.25;
  if (val('debUrgence') === '7j') coeff += 0.10;
  if (val('debUrgence') === '48h') coeff += 0.20;

  const etage = val('debEtage');
  const ascenseur = val('debAscenseur') === 'oui';
  if (etage !== 'rdc') {
    if (ascenseur) coeff += 0.05;
    else if (etage === '1') coeff += 0.15;
    else if (etage === '2') coeff += 0.22;
    else coeff += 0.35;
  }

  prices = multiplyTriplet(prices, coeff);

  if (val('debLourds') === 'quelques') prices = addTriplet(prices, [60, 80, 120]);
  if (val('debLourds') === 'beaucoup') prices = addTriplet(prices, [160, 220, 300]);

  prices = minTriplet(prices, [180, 220, 280]);
  return {
    prices: roundTriplet(prices),
    volume: Math.round(volume),
    details: [
      `Débarras : ${surface} m², volume estimé ${Math.round(volume)} m³`,
      `Type : ${labelSelect('debType')}, remplissage : ${labelSelect('debRemplissage')}`,
      `Accès : ${labelSelect('debAcces')}, étage : ${labelSelect('debEtage')}, ascenseur : ${labelSelect('debAscenseur')}`,
      `Tri : ${labelSelect('debTri')}, objets lourds : ${labelSelect('debLourds')}, délai : ${labelSelect('debUrgence')}`,
      `Objets récupérables : ${labelSelect('debRecuperable')}`
    ]
  };
}

function calcNettoyage() {
  const surface = num('netSurface', 50);
  const type = val('netType');
  let prices = rateNettoyage[type].map(rate => surface * rate);

  let coeff = 1;
  if (val('netEtat') === 'poussiereux') coeff += 0.10;
  if (val('netEtat') === 'sale') coeff += 0.25;
  if (val('netEtat') === 'tres_sale') coeff += 0.50;
  prices = multiplyTriplet(prices, coeff);

  if (val('netCuisine') === 'oui') prices = addTriplet(prices, [60, 80, 120]);
  if (val('netOdeurs') === 'oui') prices = addTriplet(prices, [80, 100, 160]);
  if (val('netDesinfection') === 'oui') prices = addTriplet(prices, [90, 120, 180]);
  if (val('netVitres') === 'quelques') prices = addTriplet(prices, [40, 50, 80]);
  if (val('netVitres') === 'beaucoup') prices = addTriplet(prices, [90, 120, 180]);

  prices = minTriplet(prices, [120, 160, 220]);
  return {
    prices: roundTriplet(prices),
    details: [
      `Nettoyage spécialisé : ${surface} m²`,
      `Type : ${labelSelect('netType')}, état : ${labelSelect('netEtat')}`,
      `Cuisine/sanitaires : ${labelSelect('netCuisine')}, odeurs : ${labelSelect('netOdeurs')}, désinfection : ${labelSelect('netDesinfection')}, vitres : ${labelSelect('netVitres')}`
    ]
  };
}

function labelSelect(id) {
  const el = $(id);
  return el.options[el.selectedIndex]?.textContent || el.value;
}

function calculate() {
  const hasDebarras = $('serviceDebarras').checked;
  const hasNettoyage = $('serviceNettoyage').checked;

  $('debarrasPanel').hidden = !hasDebarras;
  $('nettoyagePanel').hidden = !hasNettoyage;
  $('discountNote').hidden = !(hasDebarras && hasNettoyage);

  if (!hasDebarras && !hasNettoyage) {
    $('priceLow').textContent = '—';
    $('priceMid').textContent = '—';
    $('priceHigh').textContent = '—';
    $('resultDetails').innerHTML = '<p>Choisissez au moins une prestation pour obtenir une estimation.</p>';
    $('estimationResume').value = '';
    $('detailsCalcul').value = '';
    return;
  }

  let total = [0, 0, 0];
  let details = [];

  if (hasDebarras) {
    const deb = calcDebarras();
    total = addTriplet(total, deb.prices);
    details.push(...deb.details);
    details.push(`Sous-total débarras : ${deb.prices.map(p => EUR.format(p)).join(' / ')}`);
  }

  if (hasNettoyage) {
    const net = calcNettoyage();
    total = addTriplet(total, net.prices);
    details.push(...net.details);
    details.push(`Sous-total nettoyage : ${net.prices.map(p => EUR.format(p)).join(' / ')}`);
  }

  let discount = [0, 0, 0];
  if (hasDebarras && hasNettoyage) {
    discount = total.map(p => round10(p * 0.10));
    total = total.map((p, i) => p - discount[i]);
    total = minTriplet(total, [300, 380, 480]);
    details.push(`Remise groupée débarras + nettoyage : -10 % (${discount.map(p => EUR.format(p)).join(' / ')})`);
  }

  total = roundTriplet(total);
  $('priceLow').textContent = EUR.format(total[0]);
  $('priceMid').textContent = EUR.format(total[1]);
  $('priceHigh').textContent = EUR.format(total[2]);

  const summary = `Estimation indicative MDN : basse ${EUR.format(total[0])}, normale ${EUR.format(total[1])}, haute ${EUR.format(total[2])}`;
  const rendered = details.map(line => `<p>${escapeHtml(line)}</p>`).join('');
  $('resultDetails').innerHTML = rendered;
  $('estimationResume').value = summary;
  $('detailsCalcul').value = [summary, ...details].join('\n');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

['change', 'input'].forEach(eventName => {
  document.addEventListener(eventName, (event) => {
    if (event.target.closest('#estimatorForm')) calculate();
  });
});

$('contactForm').addEventListener('submit', (event) => {
  calculate();
  if ($('contactForm').action.includes('TON_ID_FORMSPREE')) {
    event.preventDefault();
    $('formWarning').hidden = false;
    $('formWarning').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

calculate();
