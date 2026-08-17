// Shared between the studio's editable question list (StudioProfileTab) and
// the customer-facing form (HealthConsentModal) — one source of wording so
// the two never drift apart. The backend doesn't know this text at all: it
// only stores whatever was actually shown and answered (see
// healthConsent.ts's own comment on why).

// A studio that hasn't customized its list yet (settings.healthConsentQuestions
// empty/absent) gets this starting point — informed by real tattoo-studio
// consent forms, reworded rather than copied, covering the usual categories:
// pregnancy, blood-thinning conditions, infectious disease, skin conditions
// at the site, allergies, keloid tendency, chronic illness, medication,
// current alcohol/drug influence, and age.
export const DEFAULT_HEALTH_QUESTIONS = [
  "Sind Sie schwanger oder stillen Sie aktuell?",
  "Haben Sie eine Blutgerinnungsstörung oder nehmen Sie blutverdünnende Medikamente ein?",
  "Haben Sie eine Infektionskrankheit (z. B. Hepatitis, HIV)?",
  "Haben Sie Hauterkrankungen im Bereich der geplanten Tätowierung (z. B. Neurodermitis, Schuppenflechte, Ekzeme)?",
  "Sind bei Ihnen Allergien bekannt (z. B. gegen Latex, Pflaster, Tattoofarben, Metalle)?",
  "Neigen Sie zu Keloiden oder übermäßiger Narbenbildung?",
  "Haben Sie eine chronische Erkrankung (z. B. Diabetes, Epilepsie, Herzerkrankung)?",
  "Nehmen Sie regelmäßig Medikamente ein?",
  "Stehen Sie aktuell unter Einfluss von Alkohol oder Drogen?",
  "Sind Sie volljährig (18 Jahre oder älter)?",
];

// Fixed, not studio-editable — these two are the actual legal basis for
// storing health data (Art. 9 Abs. 2 lit. a DSGVO: explicit consent), so
// letting a studio accidentally reword or delete them would quietly break
// that basis. The yes/no questions above are just informational by
// comparison.
export const RISK_ACKNOWLEDGEMENT_TEXT =
  "Mir ist bewusst, dass eine Tätowierung ein Eingriff in die körperliche Unversehrtheit ist und Risiken wie allergische Reaktionen, Infektionen, Narbenbildung oder individuelle Abweichungen im Heilungsverlauf mit sich bringen kann. Ich willige freiwillig und nach ausreichender Bedenkzeit in die Tätowierung ein.";

export const DSGVO_ACKNOWLEDGEMENT_TEXT =
  "Ich bin damit einverstanden, dass meine hier angegebenen Gesundheitsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO ausschließlich zur Durchführung und Nachsorge dieser Tätowierung verarbeitet und gespeichert werden.";
