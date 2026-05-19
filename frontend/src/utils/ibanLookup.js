// German BLZ (8-digit bank code) → { bic, name }
// BLZ sits at chars 4-11 of a raw German IBAN (DE + 2 check digits + 8 BLZ + 10 account)
const BLZ_MAP = {
  // ── Deutsche Bank ─────────────────────────────────────────────────────────
  "10070000": { bic: "DEUTDEBBXXX", name: "Deutsche Bank" },
  "20070000": { bic: "DEUTDEHHXXX", name: "Deutsche Bank" },
  "25070024": { bic: "DEUTDE2HXXX", name: "Deutsche Bank" },
  "30070010": { bic: "DEUTDEDBDUE", name: "Deutsche Bank" },
  "37070060": { bic: "DEUTDEDBKOE", name: "Deutsche Bank" },
  "44070050": { bic: "DEUTDEDWXXX", name: "Deutsche Bank" },
  "50070010": { bic: "DEUTDEDBFRA", name: "Deutsche Bank" },
  "51070021": { bic: "DEUTDEDAWIS", name: "Deutsche Bank" },
  "55070040": { bic: "DEUTDE3BXXX", name: "Deutsche Bank" },
  "60070070": { bic: "DEUTDEDB600", name: "Deutsche Bank" },
  "70070010": { bic: "DEUTDEDB700", name: "Deutsche Bank" },
  "76070012": { bic: "DEUTDEDB760", name: "Deutsche Bank" },
  "80070000": { bic: "DEUTDE8LXXX", name: "Deutsche Bank" },
  "86070000": { bic: "DEUTDE8DXXX", name: "Deutsche Bank" },

  // ── Commerzbank ───────────────────────────────────────────────────────────
  "10040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "20041133": { bic: "COBADEHDXXX", name: "Commerzbank" },
  "20041155": { bic: "COBADEHDXXX", name: "Commerzbank" },
  "25040066": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "30040000": { bic: "COBADEDDXXX", name: "Commerzbank" },
  "37040044": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "40040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "44040037": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "50040000": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "54040042": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "55040022": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "60040071": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "70040041": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "76040061": { bic: "COBADEFFXXX", name: "Commerzbank" },
  "86040000": { bic: "COBADEFFXXX", name: "Commerzbank" },

  // ── Sparkassen (Auswahl) ──────────────────────────────────────────────────
  "10050000": { bic: "BELADEBEXXX", name: "Berliner Sparkasse" },
  "20050550": { bic: "HASPDEHHXXX", name: "Hamburger Sparkasse" },
  "25050180": { bic: "SPKHDE2HXXX", name: "Sparkasse Hannover" },
  "30050110": { bic: "DUSSDEDDXXX", name: "Stadtsparkasse Düsseldorf" },
  "37050198": { bic: "COLSDE33XXX", name: "Sparkasse KölnBonn" },
  "44050199": { bic: "DORTDE33XXX", name: "Sparkasse Dortmund" },
  "50050201": { bic: "HELADEF1822", name: "Frankfurter Sparkasse" },
  "60050101": { bic: "SOLADEST600", name: "Kreissparkasse Stuttgart" },
  "63050000": { bic: "BYLADEM1AUG", name: "Stadtsparkasse Augsburg" },
  "70050000": { bic: "SSKMDEMMXXX", name: "Stadtsparkasse München" },
  "76050101": { bic: "SSKNDE77XXX", name: "Sparkasse Nürnberg" },
  "80050100": { bic: "MIBEDE8LXXX", name: "Mittelbrandenburgische Sparkasse" },
  "85050300": { bic: "NOLADE21HAL", name: "Sparkasse Halle" },
  "86050200": { bic: "OSDDDE81XXX", name: "Stadtsparkasse Dresden" },

  // ── Postbank ──────────────────────────────────────────────────────────────
  "10010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "20010020": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "25010030": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "30010010": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "37010050": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "40010075": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "44010046": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "50010060": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "60010070": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "70010080": { bic: "PBNKDEFFXXX", name: "Postbank" },
  "86010090": { bic: "PBNKDEFFXXX", name: "Postbank" },

  // ── HypoVereinsbank / UniCredit ───────────────────────────────────────────
  "70020270": { bic: "HYVEDEMMXXX", name: "HypoVereinsbank (UniCredit)" },
  "20030000": { bic: "HYVEDEMM200", name: "HypoVereinsbank (UniCredit)" },
  "30020900": { bic: "HYVEDEMM300", name: "HypoVereinsbank (UniCredit)" },
  "50020200": { bic: "HYVEDEMM500", name: "HypoVereinsbank (UniCredit)" },
  "60020290": { bic: "HYVEDEMM600", name: "HypoVereinsbank (UniCredit)" },

  // ── DKB ───────────────────────────────────────────────────────────────────
  "12030000": { bic: "SSKMDEMMXXX", name: "DKB – Deutsche Kreditbank" },

  // ── ING ───────────────────────────────────────────────────────────────────
  "50011760": { bic: "INGDDEFFXXX", name: "ING" },

  // ── Comdirect ─────────────────────────────────────────────────────────────
  "20041133": { bic: "COBADEHDXXX", name: "Comdirect" },

  // ── N26 / Solarisbank ─────────────────────────────────────────────────────
  "10011001": { bic: "NTSBDEB1XXX", name: "N26" },

  // ── GLS Bank ──────────────────────────────────────────────────────────────
  "43060967": { bic: "GENODEM1GLS", name: "GLS Gemeinschaftsbank" },

  // ── Volksbank / Raiffeisenbank (Auswahl) ──────────────────────────────────
  "20090602": { bic: "GENODEF1HH2", name: "Volksbank Hamburg" },
  "30060010": { bic: "DAAEDEDXKRE", name: "Volksbank Rhein-Ruhr" },
  "30092400": { bic: "GENODEM1DUS", name: "Volksbank Düsseldorf" },
  "37060590": { bic: "GENODED1CGN", name: "Volksbank Köln Bonn" },
  "50060400": { bic: "GENODE51FUL", name: "Volksbank Frankfurt" },
  "70090100": { bic: "GENODEF1M01", name: "Volksbank München" },
  "76090500": { bic: "GENODEF1N02", name: "Volksbank Nürnberg" },

  // ── Helaba / Landesbanken ─────────────────────────────────────────────────
  "30020500": { bic: "WELADEDDXXX", name: "Westdeutsche Landesbank" },
  "50050000": { bic: "HELADEFFXXX", name: "Helaba" },
  "60050000": { bic: "LBBWDE61XXX", name: "LBBW" },
  "70050000": { bic: "BYLADEMMXXX", name: "BayernLB" },

  // ── Targobank ─────────────────────────────────────────────────────────────
  "30020400": { bic: "CMCIDEDDXXX", name: "Targobank" },

  // ── Santander ─────────────────────────────────────────────────────────────
  "31010833": { bic: "SCFBDE33XXX", name: "Santander" },

  // ── Oldenburgische Landesbank ─────────────────────────────────────────────
  "28020050": { bic: "OLBODEH2XXX", name: "Oldenburgische Landesbank" },

  // ── Nassauische Sparkasse ─────────────────────────────────────────────────
  "51210800": { bic: "NASSDE55XXX", name: "Nassauische Sparkasse" },

  // ── Berliner Volksbank ────────────────────────────────────────────────────
  "10090000": { bic: "BEVODEBB", name: "Berliner Volksbank" },
};

/**
 * Look up BIC and bank name from a German IBAN.
 * Returns { bic, name } or null if not found.
 */
export function lookupIban(iban) {
  const raw = iban.replace(/\s/g, "").toUpperCase();
  if (!raw.startsWith("DE") || raw.length < 12) return null;
  const blz = raw.slice(4, 12);
  return BLZ_MAP[blz] || null;
}

/**
 * Format a raw IBAN string into groups of 4 for display.
 */
export function formatIban(raw) {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}
