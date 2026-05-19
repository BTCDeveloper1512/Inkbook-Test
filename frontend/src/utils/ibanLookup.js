// ─── Exact BLZ → { bic, name } ───────────────────────────────────────────────
// German IBAN layout: DE + 2 check digits + 8-digit BLZ + 10-digit account
// BLZ sits at chars index 4-11 of the raw (no-spaces) IBAN
const BLZ_EXACT = {
  // ── Deutsche Bank ──────────────────────────────────────────────────────────
  "10070000": { bic: "DEUTDEBBXXX", name: "Deutsche Bank" },
  "20070000": { bic: "DEUTDEHHXXX", name: "Deutsche Bank" },
  "21070020": { bic: "DEUTDE2HXXX", name: "Deutsche Bank" },
  "23070700": { bic: "DEUTDE2HXXX", name: "Deutsche Bank" },
  "25070024": { bic: "DEUTDE2HXXX", name: "Deutsche Bank" },
  "26070072": { bic: "DEUTDEDB260", name: "Deutsche Bank" },
  "27070024": { bic: "DEUTDEDB260", name: "Deutsche Bank" },
  "28070024": { bic: "DEUTDEDB260", name: "Deutsche Bank" },
  "29070024": { bic: "DEUTDEDB260", name: "Deutsche Bank" },
  "30070010": { bic: "DEUTDEDDXXX", name: "Deutsche Bank" },
  "31070015": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "32070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "33070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "34070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "36070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "37070060": { bic: "DEUTDEDBKOE", name: "Deutsche Bank" },
  "38070724": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "40070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "41070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "42070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "43070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "44070050": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "45070010": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "46070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "47070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "48070024": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "50070010": { bic: "DEUTDEDBFRA", name: "Deutsche Bank" },
  "51070021": { bic: "DEUTDEDB510", name: "Deutsche Bank" },
  "52070024": { bic: "DEUTDEDB510", name: "Deutsche Bank" },
  "53070007": { bic: "DEUTDEDB530", name: "Deutsche Bank" },
  "54070024": { bic: "DEUTDEDB540", name: "Deutsche Bank" },
  "55070040": { bic: "DEUTDEDB550", name: "Deutsche Bank" },
  "57070024": { bic: "DEUTDEDB570", name: "Deutsche Bank" },
  "58070024": { bic: "DEUTDEDB580", name: "Deutsche Bank" },
  "60070070": { bic: "DEUTDEDB600", name: "Deutsche Bank" },
  "61070024": { bic: "DEUTDEDB610", name: "Deutsche Bank" },
  "62070024": { bic: "DEUTDEDB620", name: "Deutsche Bank" },
  "63070024": { bic: "DEUTDEDB630", name: "Deutsche Bank" },
  "65070024": { bic: "DEUTDEDB650", name: "Deutsche Bank" },
  "66070024": { bic: "DEUTDEDB660", name: "Deutsche Bank" },
  "67070010": { bic: "DEUTDEDB670", name: "Deutsche Bank" },
  "68070030": { bic: "DEUTDEDB680", name: "Deutsche Bank" },
  "69070024": { bic: "DEUTDEDB690", name: "Deutsche Bank" },
  "70070010": { bic: "DEUTDEDB700", name: "Deutsche Bank" },
  "71070024": { bic: "DEUTDEDB710", name: "Deutsche Bank" },
  "72070024": { bic: "DEUTDEDB720", name: "Deutsche Bank" },
  "73070024": { bic: "DEUTDEDB730", name: "Deutsche Bank" },
  "74070024": { bic: "DEUTDEDB740", name: "Deutsche Bank" },
  "75070024": { bic: "DEUTDEDB750", name: "Deutsche Bank" },
  "76070012": { bic: "DEUTDEDB760", name: "Deutsche Bank" },
  "78070024": { bic: "DEUTDEDB780", name: "Deutsche Bank" },
  "79070010": { bic: "DEUTDEDB790", name: "Deutsche Bank" },
  "80070000": { bic: "DEUTDE8LXXX", name: "Deutsche Bank" },
  "82070024": { bic: "DEUTDE8LXXX", name: "Deutsche Bank" },
  "83070024": { bic: "DEUTDE8LXXX", name: "Deutsche Bank" },
  "84070024": { bic: "DEUTDE8LXXX", name: "Deutsche Bank" },
  "85070000": { bic: "DEUTDE8DXXX", name: "Deutsche Bank" },
  "86070000": { bic: "DEUTDE8DXXX", name: "Deutsche Bank" },

  // ── Commerzbank ────────────────────────────────────────────────────────────
  "10040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "20041133": { bic: "COBADEHDXXX", name: "Commerzbank" },
  "20041155": { bic: "COBADEHDXXX", name: "Commerzbank" },
  "20040000": { bic: "COBADEHDXXX", name: "Commerzbank" },
  "21040010": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "23040022": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "25040066": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "26040030": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "27040080": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "28040046": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "29040090": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "30040000": { bic: "COBADEDDXXX", name: "Commerzbank" },
  "31040015": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "32040024": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "33040001": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "34040049": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "36040039": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "37040044": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "38040007": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "40040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "41040018": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "42040090": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "43040036": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "44040037": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "45040060": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "46040033": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "47040049": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "48040035": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "50040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "51040038": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "52040021": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "53040004": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "54040042": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "55040022": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "57040035": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "58040044": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "60040071": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "61040014": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "63040073": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "65040085": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "67040031": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "70040041": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "72040046": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "73040075": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "76040061": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "79040047": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "80040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "84040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "85040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "86040000": { bic: "COBADEFFXXX", name: "Commerzbank" },

  // ── Postbank ───────────────────────────────────────────────────────────────
  "10010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "20010020": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "21010020": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "23010024": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "25010030": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "26010060": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "27010040": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "28010070": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "29010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "30010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "31010833": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "32010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "33010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "34010024": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "36010043": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "37010050": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "38010111": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "40010075": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "41010050": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "44010046": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "47010111": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "50010060": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "55010400": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "57010111": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "60010070": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "66010075": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "67010111": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "70010080": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "76010085": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "79010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "80010000": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "85010090": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "86010090": { bic: "PBNKDEFFXXX", name: "Postbank" },

  // ── HypoVereinsbank / UniCredit ────────────────────────────────────────────
  "10020890": { bic: "HYVEDEMM488", name: "HypoVereinsbank (UniCredit)" },
  "20030000": { bic: "HYVEDEMM200", name: "HypoVereinsbank (UniCredit)" },
  "30020900": { bic: "HYVEDEMM300", name: "HypoVereinsbank (UniCredit)" },
  "50020200": { bic: "HYVEDEMM500", name: "HypoVereinsbank (UniCredit)" },
  "60020290": { bic: "HYVEDEMM600", name: "HypoVereinsbank (UniCredit)" },
  "70020270": { bic: "HYVEDEMMXXX", name: "HypoVereinsbank (UniCredit)" },
  "76020214": { bic: "HYVEDEMM760", name: "HypoVereinsbank (UniCredit)" },

  // ── Sparkassen (Auswahl) ───────────────────────────────────────────────────
  "10050000": { bic: "BELADEBEXXX", name: "Berliner Sparkasse" },
  "10050500": { bic: "BELADEBEXXX", name: "Berliner Sparkasse" },
  "20050550": { bic: "HASPDEHHXXX", name: "Hamburger Sparkasse" },
  "21050170": { bic: "NOLADE21KIE", name: "Förde Sparkasse" },
  "25050180": { bic: "SPKHDE2HXXX", name: "Sparkasse Hannover" },
  "26050001": { bic: "BRLADE22XXX", name: "Sparkasse Bremen" },
  "27050000": { bic: "BRLADE22OHZ", name: "Kreissparkasse Stade" },
  "30050110": { bic: "DUSSDEDDXXX", name: "Stadtsparkasse Düsseldorf" },
  "31050000": { bic: "WELADED1WUP", name: "Stadtsparkasse Wuppertal" },
  "33050000": { bic: "WELADED1BIE", name: "Sparkasse Bielefeld" },
  "37050198": { bic: "COLSDE33XXX", name: "Sparkasse KölnBonn" },
  "40050150": { bic: "WELADED1MST", name: "Sparkasse Münster" },
  "44050199": { bic: "DORTDE33XXX", name: "Stadtsparkasse Dortmund" },
  "44050201": { bic: "WELADED1ESS", name: "Stadtsparkasse Essen" },
  "46050001": { bic: "WELADED1BOC", name: "Sparkasse Bochum" },
  "50050201": { bic: "HELADEF1822", name: "Frankfurter Sparkasse" },
  "51050015": { bic: "HELADEF1WIE", name: "Nassauische Sparkasse" },
  "51210800": { bic: "NASSDE55XXX", name: "Nassauische Sparkasse" },
  "55050120": { bic: "LUHSDE6AXXX", name: "Sparkasse Vorderpfalz" },
  "60050101": { bic: "SOLADEST600", name: "Kreissparkasse Stuttgart" },
  "63050000": { bic: "BYLADEM1AUG", name: "Stadtsparkasse Augsburg" },
  "70050000": { bic: "SSKMDEMMXXX", name: "Stadtsparkasse München" },
  "75050000": { bic: "BYLADEM1INI", name: "Sparkasse Ingolstadt" },
  "76050101": { bic: "SSKNDE77XXX", name: "Sparkasse Nürnberg" },
  "80050100": { bic: "MIBEDE8LXXX", name: "Mittelbrandenburgische Sparkasse" },
  "85050300": { bic: "NOLADE21HAL", name: "Sparkasse Halle" },
  "86050200": { bic: "OSDDDE81XXX", name: "Stadtsparkasse Dresden" },

  // ── Volksbank / Raiffeisen / Sparda ───────────────────────────────────────
  "10090000": { bic: "BEVODEBB", name: "Berliner Volksbank" },
  "20090602": { bic: "GENODEF1HH2", name: "Volksbank Hamburg" },
  "30060010": { bic: "GENODED1CGN", name: "Volksbank Köln" },
  "30092400": { bic: "GENODEM1DUS", name: "Volksbank Düsseldorf" },
  "37060590": { bic: "GENODED1CGN", name: "Volksbank Köln Bonn" },
  "50060400": { bic: "GENODE51FUL", name: "Volksbank Frankfurt" },
  "70090100": { bic: "GENODEF1M01", name: "Volksbank München" },
  "76090500": { bic: "GENODEF1N02", name: "Volksbank Nürnberg" },

  // ── Direktbanken / Neobanken ───────────────────────────────────────────────
  "12030000": { bic: "DELBDE33XXX", name: "DKB – Deutsche Kreditbank" },
  "50011760": { bic: "INGDDEFFXXX", name: "ING" },
  "20041133": { bic: "COBADEHDXXX", name: "Comdirect" },
  "10011001": { bic: "NTSBDEB1XXX", name: "N26" },
  "10110400": { bic: "SOBKDEBBXXX", name: "Solarisbank" },
  "30010700": { bic: "SSKMDEMMXXX", name: "Santander Consumer Bank" },
  "31010833": { bic: "SCFBDE33XXX", name: "Santander" },

  // ── GLS / Ethik ───────────────────────────────────────────────────────────
  "43060967": { bic: "GENODEM1GLS", name: "GLS Gemeinschaftsbank" },
  "55060998": { bic: "GENODE61KAG", name: "Volksbank Karlsruhe (ehem. GLS)" },

  // ── Targobank ──────────────────────────────────────────────────────────────
  "30020400": { bic: "CMCIDEDDXXX", name: "Targobank" },

  // ── Oldenburgische Landesbank ──────────────────────────────────────────────
  "28020050": { bic: "OLBODEH2XXX", name: "Oldenburgische Landesbank" },
};

// ─── Pattern-based fallback (when exact BLZ not in map) ──────────────────────
// Uses BLZ digit at index 3 (bank group code) + special prefix patterns.
function patternLookup(blz) {
  // Postbank: positions 3-5 are "010"
  if (blz.slice(3, 6) === "010") return { bic: "PBNKDEFFXXX", name: "Postbank" };

  const g = blz[3]; // bank group digit

  // Commerzbank (group 4) and former Dresdner (group 8, now Commerzbank)
  if (g === "4" || g === "8") return { bic: "COBADEFFXXX", name: "Commerzbank" };

  // Deutsche Bank (group 7) — BIC varies by region; derive from BLZ prefix
  if (g === "7" && blz[4] === "0") {
    const prefix = blz.slice(0, 2);
    const regionBic = {
      "10": "DEUTDEBBXXX", "11": "DEUTDEBBXXX",
      "12": "DEUTDEBBXXX", "13": "DEUTDEBBXXX",
      "14": "DEUTDEBBXXX", "15": "DEUTDEBBXXX",
      "16": "DEUTDEBBXXX", "17": "DEUTDEBBXXX",
      "20": "DEUTDEHHXXX", "21": "DEUTDE2HXXX",
      "22": "DEUTDEHHXXX", "23": "DEUTDE2HXXX",
      "24": "DEUTDE2HXXX", "25": "DEUTDE2HXXX",
      "26": "DEUTDEDB260", "27": "DEUTDEDB260",
      "28": "DEUTDEDB260", "29": "DEUTDEDB260",
      "30": "DEUTDEDDXXX", "31": "DEUTDEDWXXX",
      "32": "DEUTDEDWXXX", "33": "DEUTDEDWXXX",
      "34": "DEUTDEDWXXX", "35": "DEUTDEDWXXX",
      "36": "DEUTDEDWXXX", "37": "DEUTDEDBKOE",
      "38": "DEUTDEDWXXX", "39": "DEUTDEDWXXX",
      "40": "DEUTDEDWXXX", "41": "DEUTDEDWXXX",
      "42": "DEUTDEDWXXX", "43": "DEUTDEDWXXX",
      "44": "DEUTDEDWXXX", "45": "DEUTDEDWXXX",
      "46": "DEUTDEDWXXX", "47": "DEUTDEDWXXX",
      "48": "DEUTDEDWXXX", "49": "DEUTDEDWXXX",
      "50": "DEUTDEDBFRA", "51": "DEUTDEDB510",
      "52": "DEUTDEDB510", "53": "DEUTDEDB530",
      "54": "DEUTDEDB540", "55": "DEUTDEDB550",
      "56": "DEUTDEDB560", "57": "DEUTDEDB570",
      "58": "DEUTDEDB580", "59": "DEUTDEDB590",
      "60": "DEUTDEDB600", "61": "DEUTDEDB610",
      "62": "DEUTDEDB620", "63": "DEUTDEDB630",
      "64": "DEUTDEDB640", "65": "DEUTDEDB650",
      "66": "DEUTDEDB660", "67": "DEUTDEDB670",
      "68": "DEUTDEDB680", "69": "DEUTDEDB690",
      "70": "DEUTDEDB700", "71": "DEUTDEDB710",
      "72": "DEUTDEDB720", "73": "DEUTDEDB730",
      "74": "DEUTDEDB740", "75": "DEUTDEDB750",
      "76": "DEUTDEDB760", "77": "DEUTDEDB770",
      "78": "DEUTDEDB780", "79": "DEUTDEDB790",
      "80": "DEUTDE8LXXX", "81": "DEUTDE8LXXX",
      "82": "DEUTDE8LXXX", "83": "DEUTDE8LXXX",
      "84": "DEUTDE8LXXX", "85": "DEUTDE8DXXX",
      "86": "DEUTDE8DXXX", "87": "DEUTDE8DXXX",
      "88": "DEUTDE8DXXX", "89": "DEUTDE8DXXX",
    }[prefix];
    if (regionBic) return { bic: regionBic, name: "Deutsche Bank" };
    return { bic: null, name: "Deutsche Bank" };
  }

  // Sparkasse (group 5)
  if (g === "5") return { bic: null, name: "Sparkasse (regional)" };

  // Volksbank / Raiffeisen / Sparda (group 9 or 6)
  if (g === "9" || g === "6") return { bic: null, name: "Volksbank / Raiffeisen" };

  // HypoVereinsbank (group 2 in Bavaria/Hamburg regions)
  if (g === "2") return { bic: "HYVEDEMMXXX", name: "HypoVereinsbank (UniCredit)" };

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up BIC and bank name from a German IBAN.
 * Returns { bic, name } or null.
 * bic may be null if the bank is regional and the BIC can't be derived.
 */
export function lookupIban(iban) {
  const raw = iban.replace(/\s/g, "").toUpperCase();
  if (!raw.startsWith("DE") || raw.length < 12) return null;
  const blz = raw.slice(4, 12);
  if (blz.length < 8) return null;
  return BLZ_EXACT[blz] || patternLookup(blz) || null;
}

/** Format a raw IBAN string into groups of 4 for display. */
export function formatIban(raw) {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}
