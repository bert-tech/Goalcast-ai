// pages/api/matches.js
export default async function handler(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Missing date" });

  const API_KEY = process.env.FOOTBALL_API_KEY;

  try {
    let response = await fetch(
      `https://api.football-data.org/v4/competitions/SA/matches?dateFrom=${date}&dateTo=${date}`,
      { headers: { "X-Auth-Token": API_KEY } }
    );
    if (!response.ok) throw new Error(`API error ${response.status}`);
    let data = await response.json();
    let matches = data.matches || [];

    if (matches.length === 0) {
      const fb = await fetch(
        `https://api.football-data.org/v4/competitions/SA/matches?status=FINISHED&limit=6`,
        { headers: { "X-Auth-Token": API_KEY } }
      );
      const fbData = await fb.json();
      matches = (fbData.matches || []).slice(-6);
    }

    return res.status(200).json({ matches: formatMatches(matches) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function formatMatches(raw) {
  return raw.map(m => ({
    id:         m.id,
    home:       m.homeTeam.shortName || m.homeTeam.name,
    homeTla:    m.homeTeam.tla,
    homeCrest:  m.homeTeam.crest,   // ← URL stemma reale
    away:       m.awayTeam.shortName || m.awayTeam.name,
    awayTla:    m.awayTeam.tla,
    awayCrest:  m.awayTeam.crest,   // ← URL stemma reale
    date:       m.utcDate.split("T")[0],
    utcDate:    m.utcDate,
    stage:      m.stage,
    status:     m.status,
    scoreHome:  m.score?.fullTime?.home ?? null,
    scoreAway:  m.score?.fullTime?.away ?? null,
  }));
}
