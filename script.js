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
  remise_etat: [6, 9, 13],
  apres_debarras: [6, 10, 15],
  fin_bail: [6, 10, 15],
  cave_garage: [6, 10, 15],
  travaux: [8, 12, 18],
  logement_encombre: [10, 16, 24],
  succession: [8, 13, 20],
  autre: [8, 12, 18]
};

const wasteSupplements = {
  matelas: [30, 50, 80],
  electromenager: [30, 60, 100],
  gravats: [100, 200, 300],
  verts: [50, 100, 150],
  sacs: [80, 150, 250]
};

function round10(x) { return Math.round(x / 10) * 10; }
function addTriplet(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function multiplyTriplet(a, coeff) { return [a[0] * coeff, a[1] * coeff, a[2] * coeff]; }
function minTriplet(a, min) { return [Math.max(a[0], min[0]), Math.max(a[1], min[1]), Math.max(a[2], min[2])]; }
function roundTriplet(a) { return a.map(round10); }

function checkedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

function checkedLabels(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.dataset.label || el.value);
}

function hasAny(values, targets) {
  return targets.some(target => values.includes(target));
}

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

  if (val('debDistance') === 'moins20') coeff += 0.05;
  if (val('debDistance') === '20_50') coeff += 0.15;
  if (val('debDistance') === 'plus50') coeff += 0.25;
  if (val('debDistance') === 'complique') coeff += 0.30;

  const etage = val('debEtage');
  const ascenseur = val('debAscenseur') === 'oui';
  if (etage !== 'rdc') {
    if (ascenseur) coeff += 0.05;
    else if (etage === '1') coeff += 0.15;
    else if (etage === '2') coeff += 0.22;
    else coeff += 0.35;
  }

  const specials = checkedValues('debSpecial');
  if (specials.includes('moisissures')) coeff += 0.10;
  if (specials.includes('nuisibles')) coeff += 0.20;
  if (specials.includes('insalubre')) coeff += 0.25;
  if (specials.includes('diogene')) coeff += 0.35;
  if (specials.includes('deces')) coeff += 0.10;

  prices = multiplyTriplet(prices, coeff);

  if (val('debLourds') === 'quelques') prices = addTriplet(prices, [60, 80, 120]);
  if (val('debLourds') === 'beaucoup') prices = addTriplet(prices, [160, 220, 300]);

  const wastes = checkedValues('debDechets');
  wastes.forEach(waste => {
    if (wasteSupplements[waste]) prices = addTriplet(prices, wasteSupplements[waste]);
  });

  prices = minTriplet(prices, [250, 300, 380]);

  const wasteLabels = checkedLabels('debDechets');
  const specialLabels = checkedLabels('debSpecial');
  const details = [
    `Débarras : ${surface} m², volume estimé ${Math.round(volume)} m³`,
    `Type : ${labelSelect('debType')}, remplissage : ${labelSelect('debRemplissage')}`,
    `Accès camion : ${labelSelect('debAcces')}, distance camion/logement : ${labelSelect('debDistance')}`,
    `Étage : ${labelSelect('debEtage')}, ascenseur : ${labelSelect('debAscenseur')}`,
    `Tri : ${labelSelect('debTri')}, objets lourds : ${labelSelect('debLourds')}, délai : ${labelSelect('debUrgence')}`,
    `Objets récupérables : ${labelSelect('debRecuperable')}`
  ];

  if (wasteLabels.length) details.push(`Déchets spécifiques : ${wasteLabels.join(', ')}`);
  if (wastes.includes('chimiques')) {
    details.push('⚠️ Peinture / produits chimiques : évacuation et tarif à confirmer selon la filière adaptée.');
  }
  if (wasteLabels.includes('Je ne sais pas')) {
    details.push('⚠️ Déchets spécifiques incertains : photos conseillées pour affiner le devis.');
  }
  if (specialLabels.length) {
    details.push(`Situation particulière : ${specialLabels.join(', ')}`);
  }
  if (hasAny(specials, ['nuisibles', 'insalubre', 'diogene'])) {
    details.push('⚠️ Cas sensible : estimation indicative uniquement, devis à confirmer après photos, appel ou visite.');
  }

  return {
    prices: roundTriplet(prices),
    volume: Math.round(volume),
    details
  };
}

function calcNettoyage() {
  const surface = num('netSurface', 50);
  const type = val('netType');
  const autre = $('netAutre')?.value.trim() || '';
  let prices = (rateNettoyage[type] || rateNettoyage.autre).map(rate => surface * rate);

  let coeff = 1;
  if (val('netEtat') === 'poussiereux') coeff += 0.12;
  if (val('netEtat') === 'sale') coeff += 0.30;
  if (val('netEtat') === 'tres_sale') coeff += 0.60;

  const specials = checkedValues('netSpecial');
  if (specials.includes('moisissures')) coeff += 0.15;
  if (specials.includes('nuisibles')) coeff += 0.25;
  if (specials.includes('insalubre')) coeff += 0.35;
  if (specials.includes('diogene')) coeff += 0.50;
  if (specials.includes('deces')) coeff += 0.20;

  prices = multiplyTriplet(prices, coeff);

  if (val('netCuisine') === 'oui') prices = addTriplet(prices, [60, 80, 120]);
  if (val('netOdeurs') === 'oui') prices = addTriplet(prices, [80, 100, 160]);
  if (val('netDesinfection') === 'oui') prices = addTriplet(prices, [90, 120, 180]);
  if (val('netVitres') === 'quelques') prices = addTriplet(prices, [40, 50, 80]);
  if (val('netVitres') === 'beaucoup') prices = addTriplet(prices, [90, 120, 180]);
  if (val('netEau') === 'non') prices = addTriplet(prices, [60, 100, 180]);
  if (val('netElectricite') === 'non') prices = addTriplet(prices, [40, 80, 150]);

  prices = minTriplet(prices, [150, 220, 300]);

  const specialLabels = checkedLabels('netSpecial');
  const details = [
    `Nettoyage spécialisé : ${surface} m²`,
    `Type : ${labelSelect('netType')}${type === 'autre' && autre ? ` — précision : ${autre}` : ''}, état : ${labelSelect('netEtat')}`,
    `Cuisine/sanitaires : ${labelSelect('netCuisine')}, odeurs : ${labelSelect('netOdeurs')}, désinfection : ${labelSelect('netDesinfection')}, vitres : ${labelSelect('netVitres')}`,
    `Eau disponible : ${labelSelect('netEau')}, électricité disponible : ${labelSelect('netElectricite')}`
  ];

  if (type === 'autre') details.push('⚠️ Nettoyage “autre” : le tarif sera confirmé après échange, photos ou visite.');
  if (val('netEau') !== 'oui') details.push('⚠️ Eau non confirmée : l’organisation et le tarif final peuvent changer.');
  if (val('netElectricite') !== 'oui') details.push('⚠️ Électricité non confirmée : l’organisation et le tarif final peuvent changer.');
  if (specialLabels.length) {
    details.push(`Situation particulière nettoyage : ${specialLabels.join(', ')}`);
  }
  if (hasAny(specials, ['nuisibles', 'insalubre', 'diogene', 'deces'])) {
    details.push('⚠️ Nettoyage sensible : photos ou visite nécessaires avant validation du devis.');
  }

  return {
    prices: roundTriplet(prices),
    details
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
  if ($('netAutreWrap')) $('netAutreWrap').hidden = val('netType') !== 'autre';

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
    total = minTriplet(total, [320, 400, 500]);
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


function bindEstimatorEvents() {
  const estimatorForm = $('estimatorForm');
  if (!estimatorForm) return;
  estimatorForm.querySelectorAll('input, select, textarea').forEach((field) => {
    ['input', 'change', 'click'].forEach((eventName) => {
      field.addEventListener(eventName, calculate);
    });
  });
}


bindEstimatorEvents();

$('contactForm').addEventListener('submit', (event) => {
  calculate();
  if ($('contactForm').action.includes('TON_ID_FORMSPREE')) {
    event.preventDefault();
    $('formWarning').hidden = false;
    $('formWarning').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

calculate();
