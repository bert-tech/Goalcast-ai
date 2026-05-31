// getFlag usato solo per Mondiali (bandiere nazionali)
export function getFlag(tla) {
  const WC = {
    BRA:"🇧🇷", ARG:"🇦🇷", FRA:"🇫🇷", ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", ESP:"🇪🇸",
    GER:"🇩🇪", POR:"🇵🇹", NED:"🇳🇱", ITA:"🇮🇹", URU:"🇺🇾",
    USA:"🇺🇸", MEX:"🇲🇽", MAR:"🇲🇦", JPN:"🇯🇵", CRO:"🇭🇷",
  };
  return WC[tla] || null;
}

export function formatTime(utcDate) {
  if (!utcDate) return "--:--";
  return new Date(utcDate).toLocaleTimeString("it-IT", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
  });
}

export function formatStage(stage) {
  const map = {
    REGULAR_SEASON: "Serie A",
    GROUP_STAGE: "Fase Gironi",
    LAST_16: "Ottavi",
    QUARTER_FINALS: "Quarti",
    SEMI_FINALS: "Semifinale",
    FINAL: "Finale",
  };
  return map[stage] || stage;
}
