#!/usr/bin/env node
/**
 * xlang-sk1124 — CH / EU oldalak: a szlovák forrásból kimaradt (fordítatlan) szövegek javítása (2026-11-24)
 *
 * A ch-site / eu-site szótáras fordítása a táblázatból újragenerált, változó szövegeket (készlet, verziók,
 * használt autók címe/leírása) nem ismeri fel, ezért ~150 oldalon/nyelv szlovák szöveg maradt.
 * Ez a lépés a build végén, nyelvenként (a <html lang> alapján) sablonokkal lefordítja ezeket,
 * a fordíthatatlan szabad szöveges leírás-bekezdéseket (pl. „… Farby na prenájom: …”) pedig kiveszi.
 * Csak szlovák jelet tartalmazó szövegegységhez nyúl. Hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const MK = (process.env.CA_MARKET || '').trim().toLowerCase();
const MARKETS = ['ch', 'eu'].filter((m) => !MK || MK === 'all' || MK === m);
const L5 = ['de', 'fr', 'it', 'en', 'es'];

const SK = /[ľťňĺŕďčšžýĽŤŇČŠŽÝ]|(?<!\p{L})(?:Predané|[Nn]a predaj|bez DPH|[Tt]rieda|Cena|Áno|áut|autá|Hlavná|Prenájom|prenájm\p{L}*|dlhodob\p{L}*|kaucia|lízingu|kérésre|Odovzdávame|mesiacov|verzií|najazdené|ročník|benzín|kisautó|kabrió|csomaggal)(?!\p{L})|\/mes\.|(?<!\p{L})od (?=CHF|\d)/u;

const MON = { január: ['Januar', 'janvier', 'gennaio', 'January', 'enero'], február: ['Februar', 'février', 'febbraio', 'February', 'febrero'], marec: ['März', 'mars', 'marzo', 'March', 'marzo'], apríl: ['April', 'avril', 'aprile', 'April', 'abril'], máj: ['Mai', 'mai', 'maggio', 'May', 'mayo'], jún: ['Juni', 'juin', 'giugno', 'June', 'junio'], júl: ['Juli', 'juillet', 'luglio', 'July', 'julio'], august: ['August', 'août', 'agosto', 'August', 'agosto'], september: ['September', 'septembre', 'settembre', 'September', 'septiembre'], október: ['Oktober', 'octobre', 'ottobre', 'October', 'octubre'], november: ['November', 'novembre', 'novembre', 'November', 'noviembre'], december: ['Dezember', 'décembre', 'dicembre', 'December', 'diciembre'] };

/* [regex, [de, fr, it, en, es]] — sorrendben; $1… csoportok */
const R = (re, ...t) => [re, t];
const T = [
  R(/\bod, od\b/g, 'od', 'od', 'od', 'od', 'od'),
  R(/(\/mes\.) od([,.])/g, '$1$2', '$1$2', '$1$2', '$1$2', '$1$2'),
  // ---- bérlés: lead, verziók, FAQ ----
  R(/^Prenájom (.+?) — vyžiadajte si ponuku$/, '$1 mieten — Angebot anfordern', 'Location $1 — demandez une offre', 'Noleggio $1 — richiedi un’offerta', 'Rent the $1 — request an offer', 'Renting $1 — solicite una oferta'),
  R(/^Prenájom (.+?) a dlhodobý prenájom od /, '$1 mieten: Langzeitmiete ab ', 'Location $1 : location longue durée dès ', 'Noleggio $1: noleggio a lungo termine da ', 'Rent the $1: long-term rental from ', 'Renting $1: alquiler a largo plazo desde '),
  R(/^Prenájom (.+)$/, '$1 mieten', 'La location de la $1', 'Il noleggio di $1', 'Renting the $1', 'El renting del $1'),
  R(/^Dlhodobý prenájom (.+?) — úplne nové \S+ za mesačný poplatok$/, 'Langzeitmiete $1 — fabrikneu zur Monatsmiete', 'Location longue durée $1 — neuve, pour un loyer mensuel', 'Noleggio a lungo termine $1 — nuova, a canone mensile', '$1 long-term rental — brand new for a monthly fee', 'Renting $1 — nuevo por una cuota mensual'),
  R(/^(.+?) – dlhodobý prenájom$/, '$1 – Langzeitmiete', '$1 – location longue durée', '$1 – noleggio a lungo termine', '$1 – long-term rental', '$1 – renting'),
  R(/^Štúdiová fotografia (.+)$/, 'Studiofoto $1', 'Photo studio $1', 'Foto in studio $1', 'Studio photo of the $1', 'Foto de estudio $1'),
  R(/^(.+?) priestor vodiča$/, '$1 Cockpit', 'Poste de conduite $1', 'Abitacolo $1', '$1 cockpit', 'Puesto de conducción $1'),
  R(/ je najjednoduchšia cesta k úplne novému autu: v /, ' ist der einfachste Weg zu einem fabrikneuen Auto: Mit der ', ' est le moyen le plus simple de rouler en voiture neuve : en ', ' è il modo più semplice per avere un’auto nuova: con il ', ' is the easiest way to a brand-new car: with ', ' es la forma más sencilla de conducir un coche nuevo: con el '),
  R(/^dlhodobom prenájme$/, 'Langzeitmiete', 'location longue durée', 'noleggio a lungo termine', 'long-term rental', 'renting'),
  R(/^dlhodobého prenájmu auta$/, 'Langzeitmiete', 'location longue durée', 'noleggio a lungo termine', 'long-term car rental', 'renting de coches'),
  R(/^mesačný poplatok$/, 'Monatsmiete', 'loyer mensuel', 'canone mensile', 'monthly fee', 'cuota mensual'),
  R(/^kaucia$/, 'Kaution', 'dépôt de garantie', 'deposito cauzionale', 'deposit', 'fianza'),
  R(/^lízingu (.+)$/, 'Leasing $1', 'leasing $1', 'leasing $1', '$1 leasing', 'leasing del $1'),
  R(/ ho môžete jazdiť bez toho, aby ste doň viazali veľkú sumu: platíte jeden /, ' fahren Sie ihn, ohne viel Kapital zu binden: Sie zahlen eine ', ', vous la conduisez sans immobiliser une grosse somme : vous payez un ', ' la guidi senza immobilizzare una grossa somma: paghi un ', ' you drive it without tying up a large sum: you pay one ', ' lo conduces sin inmovilizar una gran suma: pagas una '),
  R(/ ho môžete jazdiť od /, ' fahren Sie ihn ab ', ', vous la conduisez dès ', ' la guidi da ', ' you can drive it from ', ' lo conduces desde '),
  R(/, servis, daň a pneumatiky vybavíme my\. To je podstata /, ', Service, Steuern und Reifen erledigen wir. Das ist das Prinzip der ', ', l’entretien, les taxes et les pneus, on s’en charge. C’est le principe de la ', ', manutenzione, tasse e pneumatici li gestiamo noi. È questa l’essenza del ', ', and we handle servicing, tax and tyres. That is the essence of ', ', y nosotros nos ocupamos del mantenimiento, los impuestos y los neumáticos. Esa es la esencia del '),
  R(/^: predvídateľné náklady, nové auto a žiadne starosti s ďalším predajom\.$/, ': planbare Kosten, ein neues Auto und keine Sorgen mit dem Wiederverkauf.', ' : des coûts prévisibles, une voiture neuve et aucun souci de revente.', ': costi prevedibili, auto nuova e nessun pensiero per la rivendita.', ': predictable costs, a new car and no resale worries.', ': costes previsibles, coche nuevo y sin preocupaciones por la reventa.'),
  R(/ je obľúbenou voľbou v kategórii (.+?)\. V $/, ' ist eine beliebte Wahl in der Kategorie $1. Mit der ', ' est un choix apprécié dans la catégorie $1. En ', ' è una scelta molto apprezzata nella categoria $1. Con il ', ' is a popular choice in the $1 category. With ', ' es una opción muy popular en la categoría $1. Con el '),
  R(/Momentálne si môžete vybrať z (\d+) áut (.+?)(?: \((\d+) k dispozícii ihneď\))?, vo verziách /, (m, a, b, c) => `Derzeit stehen ${a} Autos ${b} zur Wahl${c ? ` (${c} sofort verfügbar)` : ''}, in den Versionen `, (m, a, b, c) => `Vous avez actuellement le choix entre ${a} voitures ${b}${c ? ` (${c} disponibles immédiatement)` : ''}, en versions `, (m, a, b, c) => `Al momento può scegliere tra ${a} auto ${b}${c ? ` (${c} disponibili subito)` : ''}, nelle versioni `, (m, a, b, c) => `You can currently choose from ${a} ${b} cars${c ? ` (${c} available now)` : ''}, in the versions `, (m, a, b, c) => `Ahora mismo puede elegir entre ${a} coches ${b}${c ? ` (${c} disponibles ya)` : ''}, en las versiones `),
  R(/(?:Momentálne|Aktuálne) si môžete vybrať z (\d+) verzií:/, 'Derzeit stehen $1 Versionen zur Wahl:', 'Vous avez actuellement le choix entre $1 versions :', 'Al momento può scegliere tra $1 versioni:', 'You can currently choose from $1 versions:', 'Actualmente puede elegir entre $1 versiones:'),
  R(/Momentálne si môžete prenajať verziu /, 'Derzeit mietbar ist die Version ', 'Vous pouvez actuellement louer la version ', 'Al momento può noleggiare la versione ', 'You can currently rent the version ', 'Actualmente puede alquilar la versión '),
  R(/ Jednorazová vratná $/, ' Einmalige, rückzahlbare ', ' Unique et remboursable : ', ' Unico e rimborsabile: ', ' One-off refundable ', ' Única y reembolsable: '),
  R(/servis, daň a letné aj zimné pneumatiky hradíme my\./, 'Service, Steuern sowie Sommer- und Winterreifen übernehmen wir.', 'l’entretien, les taxes et les pneus été et hiver sont à notre charge.', 'manutenzione, tasse e pneumatici estivi e invernali sono a carico nostro.', 'servicing, tax and summer and winter tyres are on us.', 'el mantenimiento, los impuestos y los neumáticos de verano e invierno corren de nuestra cuenta.'),
  R(/Auto nemusíte vlastniť: na konci prenájmu ho jednoducho vrátite alebo prejdete na nový model\./, 'Sie müssen das Auto nicht besitzen: Am Ende der Miete geben Sie es einfach zurück oder wechseln auf ein neues Modell.', 'Vous n’avez pas à posséder la voiture : en fin de location, vous la rendez simplement ou passez à un nouveau modèle.', 'Non deve possedere l’auto: a fine noleggio la restituisce o passa a un nuovo modello.', 'You don’t have to own the car: at the end of the rental you simply return it or switch to a new model.', 'No tiene que ser propietario del coche: al final del renting lo devuelve o cambia a un modelo nuevo.'),
  R(/Mesačný poplatok za prenájom (.+?) začína na /, 'Die Monatsmiete für $1 beginnt bei ', 'Le loyer mensuel de la $1 commence à ', 'Il canone mensile per $1 parte da ', 'The monthly fee for the $1 starts at ', 'La cuota mensual del $1 empieza en '),
  R(/\. Podľa verzie: /, '. Je nach Version: ', '. Selon la version : ', '. In base alla versione: ', '. By version: ', '. Según la versión: '),
  R(/ Pre presnú individuálnu ponuku nás kontaktujte\./, ' Für ein genaues, individuelles Angebot kontaktieren Sie uns.', ' Contactez-nous pour une offre personnalisée précise.', ' Per un’offerta individuale precisa ci contatti.', ' Contact us for an exact, individual offer.', ' Contáctenos para una oferta individual exacta.'),
  R(/Mesačný poplatok zahŕňa používanie celkom novej (.+?) s dohodnutým limitom kilometrov; servis, daň a sadu letných a zimných pneumatík hradíme my\. Presné podmienky vopred písomne stanovíme v ponuke\./, 'Die Monatsmiete umfasst die Nutzung eines fabrikneuen $1 mit vereinbartem Kilometerkontingent; Service, Steuern sowie Sommer- und Winterreifen übernehmen wir. Die genauen Bedingungen halten wir vorab schriftlich im Angebot fest.', 'Le loyer mensuel comprend l’utilisation d’une $1 neuve avec un forfait kilométrique convenu ; l’entretien, les taxes et les pneus été et hiver sont à notre charge. Les conditions exactes sont fixées par écrit dans l’offre.', 'Il canone mensile comprende l’uso di una $1 nuova con un limite chilometrico concordato; manutenzione, tasse e pneumatici estivi e invernali sono a carico nostro. Le condizioni esatte vengono fissate per iscritto nell’offerta.', 'The monthly fee covers the use of a brand-new $1 with an agreed mileage allowance; servicing, tax and a set of summer and winter tyres are on us. The exact terms are set out in writing in the offer.', 'La cuota mensual incluye el uso de un $1 nuevo con un límite de kilómetros acordado; el mantenimiento, los impuestos y los neumáticos de verano e invierno corren de nuestra cuenta. Las condiciones exactas se fijan por escrito en la oferta.'),
  R(/Ktorú (.+?) si môžem prenajať\?/, 'Welche Version des $1 kann ich mieten?', 'Quelle version de $1 puis-je louer ?', 'Quale versione di $1 posso noleggiare?', 'Which $1 can I rent?', '¿Qué versión del $1 puedo alquilar?'),
  R(/Napíšte nám, ktorá verzia (.+?), farba a termín začiatku vás zaujíma — pripravíme vám bezplatnú ponuku na mieru\./, 'Schreiben Sie uns, welche Version des $1, welche Farbe und welchen Starttermin Sie wünschen — wir erstellen Ihnen ein kostenloses, individuelles Angebot.', 'Indiquez-nous la version de $1, la couleur et la date de début souhaitées — nous vous préparons une offre gratuite sur mesure.', 'Ci scriva quale versione di $1, colore e data di inizio Le interessano — prepareremo un’offerta gratuita su misura.', 'Tell us which version of the $1, colour and start date you are interested in — we will prepare a free, tailored offer.', 'Díganos qué versión del $1, color y fecha de inicio le interesan: le prepararemos una oferta gratuita a medida.'),
  R(/Dá sa (.+?) prenajať súkromným osobám aj firmám\?/, 'Können Privatpersonen und Firmen den $1 mieten?', 'Peut-on louer $1 en tant que particulier ou entreprise ?', '$1 si può noleggiare sia da privati sia da aziende?', 'Can private individuals and companies rent the $1?', '¿Pueden alquilar el $1 tanto particulares como empresas?'),
  R(/Áno, dlhodobý prenájom (.+?) je dostupný pre súkromné osoby aj firmy\. Pre firmy je nájomné v účtovníctve uznateľný náklad\./, 'Ja, die Langzeitmiete des $1 steht Privatpersonen und Firmen offen. Für Firmen ist die Miete eine abzugsfähige Betriebsausgabe.', 'Oui, la location longue durée de $1 est ouverte aux particuliers comme aux entreprises. Pour les entreprises, le loyer est une charge déductible.', 'Sì, il noleggio a lungo termine di $1 è disponibile sia per privati sia per aziende. Per le aziende il canone è un costo deducibile.', 'Yes, long-term rental of the $1 is available to private individuals and companies. For companies, the rent is a deductible business expense.', 'Sí, el renting del $1 está disponible para particulares y empresas. Para las empresas, la cuota es un gasto deducible.'),
  R(/^Radšej by ste ju lízingovali\? Pozrite si možnosti $/, 'Lieber leasen? Sehen Sie sich die Möglichkeiten für ', 'Vous préférez le leasing ? Découvrez les options de ', 'Preferisce il leasing? Scopra le opzioni di ', 'Prefer to lease it? See the options for ', '¿Prefiere el leasing? Consulte las opciones de '),
  R(/^ a financovania v kalkulačke\.$/, ' und Finanzierung im Rechner an.', ' et de financement dans le calculateur.', ' e finanziamento nel calcolatore.', ' and financing in the calculator.', ' y financiación en la calculadora.'),
  R(/(\d+) ks dostupné ihneď/g, '$1 Stk. sofort verfügbar', '$1 disponibles immédiatement', '$1 disponibili subito', '$1 available now', '$1 disponibles ya'),
  R(/(\d+) ks (.+?) ihneď k dispozícii/g, '$1 × $2 sofort verfügbar', '$1 × $2 disponibles immédiatement', '$1 × $2 disponibili subito', '$1 × $2 available now', '$1 × $2 disponibles ya'),
  R(/ďalšie autá(?: —|:) /g, 'weitere Autos: ', 'autres voitures : ', 'altre auto: ', 'more cars: ', 'más coches: '),
  R(/(\d+) ks\b/g, '$1 Stk.', '$1', '$1', '$1', '$1'),
  R(/Úplne nové autá s (\d+) km\./g, 'Fabrikneue Autos mit $1 km.', 'Voitures neuves avec $1 km.', 'Auto nuove con $1 km.', 'Brand-new cars with $1 km.', 'Coches nuevos con $1 km.'),
  R(/Odovzdávame úplne nové auto s (\d+) km\./g, 'Wir übergeben ein fabrikneues Auto mit $1 km.', 'Nous livrons une voiture neuve avec $1 km.', 'Consegniamo un’auto nuova con $1 km.', 'We hand over a brand-new car with $1 km.', 'Entregamos un coche nuevo con $1 km.'),
  R(/Na prenájom: /g, 'Zur Miete: ', 'À louer : ', 'A noleggio: ', 'For rent: ', 'En renting: '),
  R(/, s limitom /g, ', mit ', ', avec un forfait de ', ', con un limite di ', ', with an allowance of ', ', con un límite de '),
  R(/ a dobou prenájmu (\d+) mesiacov/g, ' und $1 Monaten Mietdauer', ' et une durée de $1 mois', ' e una durata di $1 mesi', ' and a $1-month rental term', ' y un plazo de $1 meses'),
  R(/, na (\d+) mesiacov/g, ', $1 Monate', ', $1 mois', ', $1 mesi', ', $1 months', ', $1 meses'),
  R(/kaucia od /g, 'Kaution ab ', 'dépôt dès ', 'deposito da ', 'deposit from ', 'fianza desde '),
  R(/Úplne nové, /g, 'Fabrikneu, ', 'Neuve, ', 'Nuova, ', 'Brand new, ', 'Nuevo, '),
  R(/prémiové auto/g, 'Premium-Auto', 'voiture premium', 'auto premium', 'premium car', 'coche premium'),
  R(/ · výbava: /g, ' · Ausstattung: ', ' · finitions : ', ' · allestimenti: ', ' · trims: ', ' · acabados: '),
  // verzió-jellemzők
  R(/vrcholný model M Performance s pohonom všetkých kolies/g, 'Top-Modell M Performance mit Allradantrieb', 'modèle phare M Performance à transmission intégrale', 'modello di punta M Performance a trazione integrale', 'flagship M Performance model with all-wheel drive', 'modelo tope M Performance con tracción total'),
  R(/úsporný diesel pre tých, ktorí veľa jazdia/g, 'sparsamer Diesel für Vielfahrer', 'diesel sobre pour les gros rouleurs', 'diesel parco per chi guida molto', 'economical diesel for high-mileage drivers', 'diésel eficiente para quien conduce mucho'),
  R(/úsporný diesel, na dlhé cesty/g, 'sparsamer Diesel für lange Strecken', 'diesel sobre pour les longs trajets', 'diesel parco per i lunghi viaggi', 'economical diesel for long trips', 'diésel eficiente para viajes largos'),
  R(/štvorvalcový benzínový, (\d+) V mild-hybrid/g, 'Vierzylinder-Benziner, $1-V-Mildhybrid', 'essence 4 cylindres, hybride léger $1 V', 'benzina 4 cilindri, mild hybrid $1 V', 'four-cylinder petrol, $1 V mild hybrid', 'gasolina de cuatro cilindros, mild hybrid de $1 V'),
  R(/výkonný štvorvalcový diesel/g, 'starker Vierzylinder-Diesel', 'diesel 4 cylindres puissant', 'potente diesel 4 cilindri', 'powerful four-cylinder diesel', 'potente diésel de cuatro cilindros'),
  R(/šesťvalcový diesel, xDrive összkerékhajtással/g, 'Sechszylinder-Diesel, xDrive-Allradantrieb', 'diesel 6 cylindres, transmission intégrale xDrive', 'diesel 6 cilindri, trazione integrale xDrive', 'six-cylinder diesel, xDrive all-wheel drive', 'diésel de seis cilindros, tracción total xDrive'),
  R(/šesťvalcový diesel/g, 'Sechszylinder-Diesel', 'diesel 6 cylindres', 'diesel 6 cilindri', 'six-cylinder diesel', 'diésel de seis cilindros'),
  R(/ M Sport csomaggal/g, ' mit M Sportpaket', ' avec pack M Sport', ' con pacchetto M Sport', ' with M Sport package', ' con paquete M Sport'),
  R(/trojvalcový/g, 'Dreizylinder', '3 cylindres', '3 cilindri', 'three-cylinder', 'tres cilindros'),
  R(/, ideálny do mesta/g, ', ideal für die Stadt', ', idéal en ville', ', ideale in città', ', ideal for the city', ', ideal para la ciudad'),
  R(/, vyvážená voľba/g, ', ausgewogene Wahl', ', choix équilibré', ', scelta equilibrata', ', a balanced choice', ', opción equilibrada'),
  R(/mild-hybridný benzínový motor, úsporný/g, 'Mildhybrid-Benziner, sparsam', 'essence hybride léger, sobre', 'benzina mild hybrid, parco', 'mild-hybrid petrol, economical', 'gasolina mild hybrid, eficiente'),
  R(/mild-hybridný benzín/g, 'Mildhybrid-Benziner', 'essence hybride léger', 'benzina mild hybrid', 'mild-hybrid petrol', 'gasolina mild hybrid'),
  R(/turbo benzínový motor/g, 'Turbo-Benziner', 'moteur essence turbo', 'motore turbo benzina', 'turbo petrol engine', 'motor de gasolina turbo'),
  R(/trojvalcový turbo, úsporný/g, 'Dreizylinder-Turbo, sparsam', 'turbo 3 cylindres, sobre', 'turbo 3 cilindri, parco', 'three-cylinder turbo, economical', 'turbo de tres cilindros, eficiente'),
  R(/dvojlitrový turbo, športový/g, 'Zweiliter-Turbo, sportlich', 'turbo 2 litres, sportif', 'turbo 2 litri, sportivo', 'two-litre turbo, sporty', 'turbo de dos litros, deportivo'),
  R(/výkonný benzínový/g, 'starker Benziner', 'essence puissant', 'benzina potente', 'powerful petrol', 'gasolina potente'),
  R(/výkonný diesel/g, 'starker Diesel', 'diesel puissant', 'diesel potente', 'powerful diesel', 'diésel potente'),
  R(/úsporný diesel/g, 'sparsamer Diesel', 'diesel sobre', 'diesel parco', 'economical diesel', 'diésel eficiente'),
  R(/, úsporný\b/g, ', sparsam', ', sobre', ', parco', ', economical', ', eficiente'),
  // ---- használt autók ----
  R(/^Predané: /u, 'Verkauft: ', 'Vendu : ', 'Venduto: ', 'Sold: ', 'Vendido: '),
  R(/^Predané$/, 'Verkauft', 'Vendus', 'Venduti', 'Sold', 'Vendidos'),
  R(/ Hľadáte niečo podobné\? Pozrite si našu aktuálnu ponuku\./, ' Sie suchen etwas Ähnliches? Sehen Sie sich unser aktuelles Angebot an.', ' Vous cherchez un modèle similaire ? Découvrez notre offre actuelle.', ' Cerca qualcosa di simile? Scopra la nostra offerta attuale.', ' Looking for something similar? See our current offer.', ' ¿Busca algo parecido? Vea nuestra oferta actual.'),
  R(/^Na predaj /, 'Zu verkaufen: ', 'À vendre : ', 'In vendita: ', 'For sale: ', 'En venta: '),
  R(/ na predaj(,|$)/, ' zu verkaufen$1', ' à vendre$1', ' in vendita$1', ' for sale$1', ' en venta$1'),
  R(/ Dovoz z Nemecka s overenou históriou od CarAdvance\./, ' Import aus Deutschland mit geprüfter Historie von CarAdvance.', ' Importée d’Allemagne avec historique vérifié par CarAdvance.', ' Importata dalla Germania con storico verificato da CarAdvance.', ' Imported from Germany with verified history by CarAdvance.', ' Importado de Alemania con historial verificado por CarAdvance.'),
  R(/Cena podľa zvoleného variantu nižšie, so zodpovednosťou za vady, dovoz CarAdvance\./, 'Preis je nach gewählter Variante unten, mit Sachmängelhaftung, Import durch CarAdvance.', 'Prix selon la variante choisie ci-dessous, avec garantie des vices, importation CarAdvance.', 'Prezzo in base alla variante scelta qui sotto, con garanzia per vizi, importazione CarAdvance.', 'Price depends on the variant chosen below, with liability for defects, imported by CarAdvance.', 'Precio según la variante elegida abajo, con garantía por defectos, importación CarAdvance.'),
  R(/Cena bez DPH/g, 'Preis ohne MWST', 'Prix HT', 'Prezzo IVA esclusa', 'Price excl. VAT', 'Precio sin IVA'),
  R(/\bCena (?=CHF|\d)/g, 'Preis ', 'Prix ', 'Prezzo ', 'Price ', 'Precio '),
  R(/,? (?:rok výroby|ročník) /g, ', Baujahr ', ', année ', ', anno ', ', year ', ', año '),
  R(/,? najazdené (\d[\d\s]*?)(?=,| –)/g, ', Kilometerstand $1 km', ', kilométrage $1 km', ', chilometraggio $1 km', ', mileage $1 km', ', kilometraje $1 km'),
  R(/,? najazdené /g, ', Kilometerstand ', ', kilométrage ', ', chilometraggio ', ', mileage ', ', kilometraje '),
  R(/SUV s hybridným pohonom/g, 'SUV mit Hybridantrieb', 'SUV hybride', 'SUV ibrido', 'hybrid SUV', 'SUV híbrido'),
  R(/hybrid \(benz[ií]n\/elektro\)/g, 'Hybrid (Benzin/Elektro)', 'hybride (essence/électrique)', 'ibrido (benzina/elettrico)', 'hybrid (petrol/electric)', 'híbrido (gasolina/eléctrico)'),
  R(/\(benz[ií]n\/elektro\)/g, '(Benzin/Elektro)', '(essence/électrique)', '(benzina/elettrico)', '(petrol/electric)', '(gasolina/eléctrico)'),
  R(/(?<!\p{L})hybrid(?![\p{L} ]\()(?!\p{L})/gu, 'Hybrid', 'hybride', 'ibrido', 'hybrid', 'híbrido'),
  R(/kisautó/g, 'Kleinwagen', 'citadines', 'utilitarie', 'small car', 'utilitarios'),
  R(/kabrió/g, 'Cabrio', 'cabriolets', 'cabrio', 'convertible', 'descapotables'),
  R(/[Pp]ohon všetkých kolies/g, 'Allradantrieb', 'transmission intégrale', 'trazione integrale', 'all-wheel drive', 'tracción total'),
  R(/zadný náhon|Hátsókerékhajtás/g, 'Hinterradantrieb', 'propulsion', 'trazione posteriore', 'rear-wheel drive', 'tracción trasera'),
  R(/športové auto/g, 'Sportwagen', 'voiture de sport', 'auto sportiva', 'sports car', 'deportivo'),
  R(/\b[Kk]abriolet\b/g, 'Cabriolet', 'cabriolet', 'cabriolet', 'convertible', 'descapotable'),
  R(/(?<!\p{L})Limuzína(?!\p{L})/gu, 'Limousine', 'berline', 'berlina', 'saloon', 'berlina'),
  R(/(?<!\p{L})benz[ií]n(?!\p{L})/gu, 'Benzin', 'essence', 'benzina', 'petrol', 'gasolina'),
  R(/\belektro\b/g, 'Elektro', 'électrique', 'elettrico', 'electric', 'eléctrico'),
  R(/\b[Aa]utomat\b/g, 'Automatik', 'automatique', 'automatico', 'automatic', 'automático'),
  R(/(?<!\p{L})manuál(?!\p{L})/gu, 'Schaltgetriebe', 'manuelle', 'manuale', 'manual', 'manual'),
  R(/(\d) k\b/g, '$1 PS', '$1 ch', '$1 CV', '$1 hp', '$1 CV'),
  R(/(\d) km, – /g, '$1 km, ', '$1 km, ', '$1 km, ', '$1 km, ', '$1 km, '),
  // ---- Mercedes osztályok ----
  R(/(?<!\p{L})[Tt]rieda (?:Elet|([A-Z]{1,3}))(?![\p{L}\p{N}])/gu, (m, c) => `${c || 'E'}-Klasse`, (m, c) => `Classe ${c || 'E'}`, (m, c) => `Classe ${c || 'E'}`, (m, c) => `${c || 'E'}-Class`, (m, c) => `Clase ${c || 'E'}`),
  R(/(\d+)-stupňová DSG/g, '$1-Gang-DSG', 'DSG à $1 rapports', 'DSG a $1 rapporti', '$1-speed DSG', 'DSG de $1 velocidades'),
  R(/ zboku — výrazný tvar SUV, verzia M Sport/g, ' von der Seite — markante SUV-Form, M Sport', ' de profil — silhouette SUV marquée, version M Sport', ' di lato — forma SUV decisa, versione M Sport', ' side view — distinctive SUV shape, M Sport', ' de perfil — forma SUV marcada, versión M Sport'),
  R(/ spredu, počas jazdy/g, ' von vorne, in Fahrt', ' de face, en roulant', ' di fronte, in movimento', ' front view, driving', ' de frente, en marcha'),
  R(/ – pohľad spredu zo strany/g, ' – Ansicht schräg von vorne', ' – vue avant de trois quarts', ' – vista anteriore di tre quarti', ' – front three-quarter view', ' – vista delantera lateral'),
  R(/ – pohľad zozadu zo strany, počas jazdy/g, ' – Ansicht schräg von hinten, in Fahrt', ' – vue arrière de trois quarts, en roulant', ' – vista posteriore di tre quarti, in movimento', ' – rear three-quarter view, driving', ' – vista trasera lateral, en marcha'),
  R(/" disky z ľahkej zliatiny, paket M Sport/g, '"-Leichtmetallräder, M Sportpaket', '" jantes alliage, pack M Sport', '" cerchi in lega, pacchetto M Sport', '" alloy wheels, M Sport package', '" llantas de aleación, paquete M Sport'),
  R(/^napr\. ťažné zariadenie, panoramatická strecha, vyhrievané sedadlá, head-up, len nehavarované(?:, slovenské doklady)?…$/, 'z. B. Anhängerkupplung, Panoramadach, Sitzheizung, Head-up, nur unfallfrei…', 'p. ex. attelage, toit panoramique, sièges chauffants, affichage tête haute, jamais accidentée…', 'es. gancio traino, tetto panoramico, sedili riscaldati, head-up, solo non incidentate…', 'e.g. tow bar, panoramic roof, heated seats, head-up display, accident-free only…', 'p. ej. enganche, techo panorámico, asientos calefactados, head-up, solo sin accidentes…'),
  // ---- rövid címkék ----
  R(/^Hlavná stránka$/, 'Startseite', 'Accueil', 'Home', 'Home', 'Inicio'),
  R(/^Naše autá$/, 'Unsere Autos', 'Nos voitures', 'Le nostre auto', 'Our cars', 'Nuestros coches'),
  R(/^Požiadať o ponuku$/, 'Angebot anfordern', 'Demander une offre', 'Richiedi un’offerta', 'Request an offer', 'Solicitar oferta'),
  R(/^Záujem o financovanie – súhlas s kontaktom partnerskej lízingovej spoločnosti$/, 'Interesse an einer Finanzierung – Einwilligung zur Kontaktaufnahme durch die Partner-Leasinggesellschaft', 'Intérêt pour un financement – accord pour être contacté par la société de leasing partenaire', 'Interesse al finanziamento – consenso al contatto da parte della società di leasing partner', 'Interested in financing – consent to be contacted by our partner leasing company', 'Interés en financiación – consentimiento para ser contactado por la empresa de leasing colaboradora'),
  R(/^(?:Cena na požiadanie|Ár kérésre)$/, 'Preis auf Anfrage', 'Prix sur demande', 'Prezzo su richiesta', 'Price on request', 'Precio a consultar'),
  R(/^Čoskoro$/, 'Demnächst', 'Bientôt', 'Prossimamente', 'Coming soon', 'Próximamente'),
  R(/^Max\. výkon$/, 'Max. Leistung', 'Puissance max.', 'Potenza max.', 'Max. power', 'Potencia máx.'),
  R(/^Zrýchlenie\b/, 'Beschleunigung', 'Accélération', 'Accelerazione', 'Acceleration', 'Aceleración'),
  R(/^Maximálna rýchlosť$/, 'Höchstgeschwindigkeit', 'Vitesse max.', 'Velocità massima', 'Top speed', 'Velocidad máxima'),
  R(/^Batožinový priestor$/, 'Kofferraum', 'Coffre', 'Bagagliaio', 'Boot space', 'Maletero'),
  R(/^Tepelné čerpadlo$/, 'Wärmepumpe', 'Pompe à chaleur', 'Pompa di calore', 'Heat pump', 'Bomba de calor'),
  R(/^Elektrický$/, 'Elektrisch', 'Électrique', 'Elettrico', 'Electric', 'Eléctrico'),
  R(/\(elektrický\)/g, '(elektrisch)', '(électrique)', '(elettrico)', '(electric)', '(eléctrico)'),
  R(/^Značka$/, 'Marke', 'Marque', 'Marca', 'Make', 'Marca'),
  R(/^Súkromná osoba — cena s DPH podľa spôsobu dodania$/, 'Privatperson — Preis inkl. MwSt. je nach Lieferart', 'Particulier — prix TTC selon le mode de livraison', 'Privato — prezzo IVA inclusa in base alla consegna', 'Private individual — price incl. VAT depending on delivery', 'Particular — precio con IVA según la entrega'),
  R(/^Firma s IČ DPH — bez DPH \(dodanie v rámci EÚ\)$/, 'Firma mit USt-IdNr. — ohne MwSt. (innergemeinschaftliche Lieferung)', 'Entreprise avec n° de TVA — HT (livraison intracommunautaire)', 'Azienda con partita IVA — IVA esclusa (cessione intracomunitaria)', 'Company with VAT ID — excl. VAT (intra-EU supply)', 'Empresa con NIF-IVA — sin IVA (entrega intracomunitaria)'),
  R(/^Firma s IČ DPH$/, 'Firma mit USt-IdNr.', 'Entreprise avec n° de TVA', 'Azienda con partita IVA', 'Company with VAT ID', 'Empresa con NIF-IVA'),
  R(/^Hotovosť \/ vlastné zdroje$/, 'Barzahlung / Eigenmittel', 'Comptant / fonds propres', 'Contanti / mezzi propri', 'Cash / own funds', 'Contado / fondos propios'),
  R(/\/mes\./g, '/Monat', '/mois', '/mese', '/month', '/mes.'),
  R(/\bod (?=CHF|\d)/g, 'ab ', 'dès ', 'da ', 'from ', 'desde '),
];
const WA = { ch: 'DJbjsf26eljsayu+GLlVHQ', eu: 'ZxOFSK3mMMN97K5yFHaqCQ' }; // Ahrefs Web Analytics: saját CH / EU projekt (nem a magyar)
const VAT = { ch: ['ohne MWST', 'hors TVA', 'IVA esclusa', 'excl. VAT', 'sin IVA'], eu: ['ohne MwSt.', 'HT', 'IVA esclusa', 'excl. VAT', 'sin IVA'] };

function tr(s, li, mk) {
  if (!SK.test(s)) return s;
  let o = s;
  for (const [re, t] of T) o = o.replace(re, t[li]);
  o = o.replace(/\bbez DPH\b/g, VAT[mk][li]);
  if (mk === 'ch' && li === 0) o = o.replace(/ohne MwSt\./g, 'ohne MWST').replace(/ß/g, 'ss');
  o = o.replace(/\b(január|február|marec|apríl|máj|jún|júl|august|september|október|november|december)\b/g, (m) => MON[m][li]);
  return o;
}

const STRONG = /[ľťňĺŕďčšžý]/g;
function fixHtml(h, li, mk, st) {
  const parts = h.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i % 2 === 1) { if (/^<script[^>]*ld\+json/.test(p)) parts[i] = p.replace(/"((?:[^"\\]|\\.)*)"/g, (m, s) => (SK.test(s) ? '"' + tr(s, li, mk) + '"' : m)); continue; }
    let q = p.replace(/>([^<>]+)</g, (m, s) => { const t = tr(s, li, mk); if (t !== s) st.n++; return '>' + t + '<'; });
    q = q.replace(/\b(content|alt|title|aria-label|placeholder|value|data-label|data-price)="([^"]*)"/g, (m, a, s) => { const t = tr(s, li, mk); if (t !== s) st.n++; return a + '="' + t + '"'; });
    // fordíthatatlan szabad szöveges leírás-bekezdés: ki
    q = q.replace(/<p\b[^>]*>((?:(?!<\/?p\b)[\s\S])*?)<\/p>/g, (m, inner) => {
      const txt = inner.replace(/<[^>]+>/g, '');
      if (((txt.match(STRONG) || []).length >= 2 || /Farby na prenájom/.test(txt)) && /\b(je|sa|na|a|s|v|z|so|pre|aj|ako)\b/.test(txt)) { st.drop++; st.dropped.add(txt.slice(0, 90)); return ''; }
      return m;
    });
    parts[i] = q;
  }
  return parts.join('');
}


/* ---------- on-page: title 50–60 / meta 140–160 (csak ami kilóg), hiányzó H1 ---------- */
const BR = /\s*[|—–-]\s*CarAdvance(?:\s+(?:Schweiz|Suisse|Svizzera|Switzerland))?\s*$/;
const FROM = /,\s*(?:from Germany|aus Deutschland|dalla Germania|d’Allemagne|d'Allemagne|depuis l’Allemagne|de Alemania|desde Alemania)\s*$/;
const SALE = /\s(for sale|zu verkaufen|à vendre|in vendita|en venta)$/;
const RENT = /\/(mieten|langzeitmiete|location-longue-duree|noleggio-lungo-termine|renting)\//;
const RSUF = [' – Langzeitmiete', ' – location longue durée', ' – noleggio a lungo termine', ' – long-term rental', ' – renting'];
const CHN = ['CarAdvance Schweiz', 'CarAdvance Suisse', 'CarAdvance Svizzera', 'CarAdvance Switzerland', 'CarAdvance'];
const CTA = ['Jetzt unverbindlich Angebot anfordern.', 'Demandez votre offre sans engagement.', 'Richiedi ora un’offerta senza impegno.', 'Request a no-obligation offer today.', 'Solicite ahora una oferta sin compromiso.'];
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function cutWords(t, n) { if (t.length <= n) return t; let c = t.slice(0, n + 1); c = c.slice(0, Math.max(c.lastIndexOf(' '), c.lastIndexOf('/'))); for (let i = 0; i < 3; i++) c = c.replace(/[\s,;:·/—–-]+$/, '').replace(/\s+(?:–|—|-|und|et|e|and|y|mit|avec|con|with|de|di|von|from|ab|dès|da|desde|à|a|in|en|the|der|die|das|la|le|il|el|étape|passo)$/i, ''); return c; }
function fitTitle(t, li, mk, rel) {
  if (t.length > 60) t = t.replace(BR, '');
  if (t.length > 60) t = t.replace(FROM, '');
  if (t.length > 60) t = t.replace(/\s\([A-Z]{1,2}\d{2,3}\)/, '');
  if (t.length > 60) t = t.replace(/(?::| —| –) (?:alquiler a largo plazo|noleggio a lungo termine|long-term rental|Langzeitmiete|location longue durée)(?= (?:desde|da|from|ab|dès) )/, '');
  if (t.length > 60) { const m = SALE.exec(t); if (m) t = cutWords(t.slice(0, m.index), 60 - m[0].length) + m[0]; }
  if (t.length > 60) { const m = /^(.{25,60}?)\s(?:—|–|:)\s/.exec(t); if (m) t = m[1]; }
  if (t.length > 60) t = cutWords(t, 60);
  if (t.length < 40) {
    const brand = mk === 'ch' ? CHN[li] : 'CarAdvance';
    if (t.length < 30 && RENT.test(rel) && !/miete|location|noleggio|rental|renting/i.test(t.replace(/mieten$/, ''))) { if ((t + RSUF[li]).length <= 60) t += RSUF[li]; }
    if (!/CarAdvance/.test(t) && (t + ' | ' + brand).length <= 60) t += ' | ' + brand;
    else if (!/CarAdvance/.test(t) && (t + ' | CarAdvance').length <= 60) t += ' | CarAdvance';
  }
  return t;
}
function fitMeta(d, li) {
  if (d.length > 160) { const c = d.slice(0, 161); const i = Math.max(c.lastIndexOf('. '), c.lastIndexOf('! '), c.lastIndexOf('? ')); d = i >= 100 ? d.slice(0, i + 1) : cutWords(d, 158) + '…'; }
  else if (d.length < 110 && !d.includes(CTA[li]) && (d.trim() + ' ' + CTA[li]).length <= 160) d = d.trim().replace(/([^.!?…])$/, '$1.') + ' ' + CTA[li];
  return d;
}
function onpage(h, li, mk, rel, st) {
  h = h.replace(/<title>([^<]*)<\/title>/, (m, t) => { const o = unesc(t).trim(); const n = fitTitle(o, li, mk, rel); if (n !== o) { st.t++; h = h; } return n !== o ? `<title>${esc(n)}</title>` : m; });
  const tt = (/<title>([^<]*)<\/title>/.exec(h) || [])[1];
  if (tt) h = h.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, (m, a) => a + tt + '"');
  h = h.replace(/(<meta name="description" content=")([^"]*)"/, (m, a, d) => { const o = unesc(d); const n = fitMeta(o, li); if (n !== o) { st.d++; return a + esc(n) + '"'; } return m; });
  if (!/<h1\b/.test(h)) { const n = h.replace(/<h2( class="lk-title"[^>]*)>([\s\S]*?)<\/h2>/, '<h1$1>$2</h1>'); if (n !== h) { h = n; st.h1++; } }
  h = h.replace(/data-key="hc0fbnlxNtmpnGbelDApVQ"/g, `data-key="${WA[mk]}"`);
  return h;
}

/* ---------- 2–3. lépés: kulcsszótérkép (Ahrefs, 2026-11-24) — fő oldalak title + konfigurátor H1 ---------- */
const KWT = {
  ch: {
    '/': 'Premium-Autos aus Deutschland für die Schweiz | CarAdvance',
    '/kaufen/neuwagen-nach-mass/': 'BMW Konfigurator Schweiz – neuer BMW zum deutschen Preis',
    '/konfigurator/mercedes/': 'Mercedes Konfigurator Schweiz – zum deutschen Preis',
    '/konfigurator/audi/': 'Audi Konfigurator Schweiz – neuer Audi zum deutschen Preis',
    '/konfigurator/mini/': 'MINI Konfigurator Schweiz – neuer MINI zum deutschen Preis',
    '/import/': 'Auto Import aus Deutschland in die Schweiz – schlüsselfertig',
    '/import/importkosten-rechner/': 'Importkosten Auto Schweiz 2026 – Rechner für Zoll & Steuern',
    '/en/': 'Premium cars from Germany for Switzerland | CarAdvance',
    '/en/kaufen/neuwagen-nach-mass/': 'BMW configurator Switzerland – new BMW at German prices',
    '/en/konfigurator/mercedes/': 'Mercedes configurator Switzerland – at German prices',
    '/en/konfigurator/audi/': 'Audi configurator Switzerland – new Audi at German prices',
    '/en/konfigurator/mini/': 'MINI configurator Switzerland – new MINI at German prices',
    '/en/import/importkosten-rechner/': 'Car import costs Switzerland 2026 – duty & tax calculator',
    '/fr/': 'Voitures premium d’Allemagne pour la Suisse | CarAdvance',
    '/fr/mieten/': 'Location voiture longue durée Suisse 2026 | CarAdvance',
    '/fr/kaufen/neuwagen-nach-mass/': 'Configurateur BMW Suisse – BMW neuve au prix allemand',
    '/fr/konfigurator/mercedes/': 'Configurateur Mercedes Suisse – neuve au prix allemand',
    '/fr/konfigurator/audi/': 'Configurateur Audi Suisse – Audi neuve au prix allemand',
    '/fr/konfigurator/mini/': 'Configurateur MINI Suisse – MINI neuve au prix allemand',
    '/fr/import/': 'Importer une voiture d’Allemagne en Suisse – clé en main',
    '/fr/import/importkosten-rechner/': 'Coûts d’importation voiture Suisse 2026 – calculateur',
    '/fr/import/ablauf/': 'Importer une voiture d’Allemagne : processus étape par étape',
    '/it/': 'Auto premium dalla Germania per la Svizzera | CarAdvance',
    '/it/mieten/': 'Noleggio auto a lungo termine Svizzera 2026 | CarAdvance',
    '/it/kaufen/neuwagen-nach-mass/': 'Configuratore BMW Svizzera – BMW nuova a prezzo tedesco',
    '/it/konfigurator/mercedes/': 'Configuratore Mercedes Svizzera – nuova a prezzo tedesco',
    '/it/konfigurator/audi/': 'Configuratore Audi Svizzera – Audi nuova a prezzo tedesco',
    '/it/konfigurator/mini/': 'Configuratore MINI Svizzera – MINI nuova a prezzo tedesco',
    '/it/import/': 'Importare auto dalla Germania in Svizzera – chiavi in mano',
    '/it/import/importkosten-rechner/': 'Costi di importazione auto Svizzera 2026 – calcolatore',
    '/it/import/ablauf/': 'Importare un’auto dalla Germania: la procedura passo passo',
  },
  eu: {
    '/de/': 'Premium-Autos aus Deutschland kaufen & mieten | CarAdvance',
    '/de/kaufen/neuwagen-nach-wunsch/': 'BMW Konfigurator – neuer BMW zum deutschen Preis bestellen',
    '/de/konfigurator/mercedes/': 'Mercedes Konfigurator – neuer Mercedes zum deutschen Preis',
    '/de/konfigurator/audi/': 'Audi Konfigurator – neuer Audi zum deutschen Preis bestellen',
    '/de/konfigurator/mini/': 'MINI Konfigurator – neuer MINI zum deutschen Preis bestellen',
    '/fr/': 'Voitures premium d’Allemagne : achat et LLD | CarAdvance',
    '/fr/location-longue-duree/': 'LLD voiture : location longue durée dès 6 mois | CarAdvance',
    '/fr/achat/voiture-neuve-sur-mesure/': 'Configurateur BMW – BMW neuve au prix allemand | CarAdvance',
    '/fr/configurateur/mercedes/': 'Configurateur Mercedes – Mercedes neuve au prix allemand',
    '/fr/configurateur/audi/': 'Configurateur Audi – Audi neuve au prix allemand',
    '/fr/configurateur/mini/': 'Configurateur MINI – MINI neuve au prix allemand',
    '/it/': 'Auto premium dalla Germania: acquisto e noleggio',
    '/it/noleggio-lungo-termine/': 'Noleggio lungo termine auto premium da 6 mesi | CarAdvance',
    '/it/acquisto/auto-nuova-su-misura/': 'Configuratore BMW – BMW nuova a prezzo tedesco | CarAdvance',
    '/it/configuratore/mercedes/': 'Configuratore Mercedes – Mercedes nuova a prezzo tedesco',
    '/it/configuratore/audi/': 'Configuratore Audi – Audi nuova a prezzo tedesco',
    '/it/configuratore/mini/': 'Configuratore MINI – MINI nuova a prezzo tedesco',
    '/es/': 'Coches premium de Alemania: compra y renting | CarAdvance',
    '/es/compra/coche-nuevo-a-medida/': 'Configurador BMW – BMW nuevo a precio alemán | CarAdvance',
    '/es/configurador/mercedes/': 'Configurador Mercedes – Mercedes nuevo a precio alemán',
    '/es/configurador/audi/': 'Configurador Audi – Audi nuevo a precio alemán | CarAdvance',
    '/es/configurador/mini/': 'Configurador MINI – MINI nuevo a precio alemán | CarAdvance',
  },
};
/* bérlés főoldal: az ár dinamikus, ezért mintából: „Auto-Abo & Langzeitmiete …” (auto abo: CH 3 800, AT 900 keresés/hó) */
const KWRX = [
  [/^Langzeitmiete 2026 — Neuwagen ab (.+?)\/Monat, ab 6 Monaten$/, 'Auto-Abo & Langzeitmiete ab $1/Monat, ab 6 Monaten'],
  [/^Renting 2026: coche nuevo desde (.+?)\/mes, desde 6 meses$/, 'Renting de coches desde $1/mes, desde 6 meses'],
];
const EGLH1 = ['BMW, Mercedes, Audi & MINI Konfigurator – Neuwagen nach Wunsch', 'Configurateur BMW, Mercedes, Audi et MINI – voiture neuve sur mesure', 'Configuratore BMW, Mercedes, Audi e MINI – auto nuova su misura', 'BMW, Mercedes, Audi & MINI configurator – new car to order', 'Configurador BMW, Mercedes, Audi y MINI – coche nuevo a medida'];
function kwmap(h, li, mk, rel, st) {
  const key = rel.replace(/index\.html$/, '');
  const t = KWT[mk] && KWT[mk][key];
  if (t) { h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`); st.kw++; }
  else h = h.replace(/<title>([^<]*)<\/title>/, (m, x) => { let y = unesc(x); for (const [re, r] of KWRX) y = y.replace(re, r); if (y === unesc(x)) return m; st.kw++; return `<title>${esc(y)}</title>`; });
  if (/<h1 id="eglTitle">/.test(h) && /var HERO=\{/.test(h) && /\/(kaufen\/neuwagen-nach-(?:mass|wunsch)|achat\/voiture-neuve-sur-mesure|acquisto\/auto-nuova-su-misura|compra\/coche-nuevo-a-medida)\/$/.test(key)) {
    h = h.replace(/<h1 id="eglTitle">[^<]*<\/h1>/, `<h1 id="eglTitle">${EGLH1[li]}</h1>`).replace(/('':\{crumb:'[^']*',title:')[^']*'/, `$1${EGLH1[li].replace(/'/g, "\\'")}'`);
    st.kw++;
  }
  const tt = (/<title>([^<]*)<\/title>/.exec(h) || [])[1];
  if (tt) h = h.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, (m, a) => a + tt + '"');
  return h;
}

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p); } return out; }

export { fixHtml, tr, onpage, kwmap };

if (process.argv[1] && process.argv[1].endsWith('xlang-sk1124.mjs')) {
  try {
    for (const mk of MARKETS) {
      const root = path.join(DIST, mk);
      if (!fs.existsSync(root)) { console.log(`[xlang-sk1124] nincs ${root}`); continue; }
      const st = { files: 0, n: 0, drop: 0, dropped: new Set(), t: 0, d: 0, h1: 0, kw: 0 };
      for (const f of walk(root)) {
        const h = fs.readFileSync(f, 'utf8');
        const lang = (/<html lang="([a-z]{2})/.exec(h) || [])[1];
        const li = L5.indexOf(lang);
        if (li < 0) continue;
        const rel = '/' + path.relative(root, f).replace(/\\/g, '/');
        const o = kwmap(onpage(fixHtml(h, li, mk, st), li, mk, rel, st), li, mk, rel, st);
        if (o !== h) { fs.writeFileSync(f, o); st.files++; }
      }
      console.log(`[xlang-sk1124] ${mk}: ${st.files} oldal, ${st.n} szövegegység fordítva, ${st.drop} szlovák leírás-bekezdés kivéve; title ${st.t}, meta ${st.d}, H1 ${st.h1} javítva; kulcsszótérkép ${st.kw}`);
    }
  } catch (e) { console.error('[xlang-sk1124] hiba:', e.message); }
  process.exit(0);
}
