import { useState, useEffect } from "react";
import Head from "next/head";
import { formatTime, formatStage } from "../lib/flags";
import { supabase } from "../lib/supabase";

const COMPETITIONS = [
  { code: "PL",  label: "Premier League", crest: "https://crests.football-data.org/PL.png" },
  { code: "SA",  label: "Serie A",        crest: "https://crests.football-data.org/SA.png" },
  { code: "WC",  label: "Mondiali",       crest: "https://crests.football-data.org/WC.png" },
  { code: "CL",  label: "Champions",      crest: "https://crests.football-data.org/CL.png" },
];

const PLANS = [
  { name: "Free", price: "€0", features: ["3 pronostici/giorno", "Analisi AI base", "Classifica pubblica"], cta: "Inizia gratis", highlight: false },
  { name: "Pro", price: "€4.99/mese", features: ["Pronostici illimitati", "Analisi AI approfondita", "Statistiche avanzate", "Notifiche live", "Badge esclusivi"], cta: "Abbonati ora", highlight: true },
];

const LEADERBOARD = [
  { name: "AlexGoal99", pts: 420, correct: 14 },
  { name: "ForzaCalcio", pts: 388, correct: 13 },
  { name: "WorldFan", pts: 355, correct: 12 },
  { name: "Tu", pts: 210, correct: 7 },
  { name: "PredictKing", pts: 180, correct: 6 },
];

function buildDays() {
  const days = [];
  for (let i = -30; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      offset: i,
      label: i === 0 ? "Oggi" : d.toLocaleDateString("it-IT", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("it-IT", { month: "short" }),
      iso: d.toISOString().split("T")[0],
      isPast: i < 0,
      isToday: i === 0,
    });
  }
  return days;
}

export default function Home() {
  const days = buildDays();
  const todayIndex = days.findIndex(d => d.isToday);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [competition, setCompetition] = useState("PL");
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [userPick, setUserPick] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [tab, setTab] = useState("matches");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setMatchLoading(true);
      setMatchError(null);
      setActiveMatch(null);
      setAiAnalysis("");
      setAiSuggestion(null);
      try {
        const res = await fetch(`/api/matches?date=${days[selectedDay].iso}&competition=${competition}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore API");
        setMatches((data.matches || []).map(m => ({
          id: m.id,
          home: m.home,
          homeTla: m.homeTla,
          homeCrest: m.homeCrest,
          away: m.away,
          awayTla: m.awayTla,
          awayCrest: m.awayCrest,
          date: m.date,
          time: formatTime(m.utcDate),
          stage: formatStage(m.stage),
          status: m.status,
          score: { home: m.scoreHome, away: m.scoreAway },
        })));
      } catch (e) {
        setMatchError(e.message);
      }
      setMatchLoading(false);
    }
    load();
  }, [selectedDay, competition, user]);

  async function analyzeMatch(match, pick) {
    setAiLoading(true);
    setAiAnalysis("");
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home: match.home, away: match.away, stage: match.stage, pick }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiAnalysis(data.analysis);
      setAiSuggestion(data.suggestion);
    } catch (e) {
      setAiAnalysis("Errore nell'analisi AI. Riprova.");
    }
    setAiLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function selectMatch(m) {
    if (activeMatch?.id === m.id) {
      setActiveMatch(null);
    } else {
      setActiveMatch(m);
      setUserPick(null);
      setAiAnalysis("");
      setAiSuggestion(null);
    }
  }

  function submitPick(pick) {
    setUserPick(pick);
    analyzeMatch(activeMatch, pick);
  }

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a9e7a", fontFamily: "'Barlow Condensed', sans-serif" }}>
      <span className="spin" style={{ fontSize: 30 }}>⚙️</span>
    </div>
  );

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <>
      <Head>
        <title>GoalCast AI — Pronostici Mondiali 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>

        <header style={{ background: "linear-gradient(180deg,var(--bg2) 0%,transparent 100%)", padding: "20px 20px 0", borderBottom: "1px solid #0f1e36", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,var(--green),#0d7a54)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚽</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, lineHeight: 1 }}>GOALCAST AI</div>
              <div style={{ fontSize: 11, color: "#4a9e7a", letterSpacing: 2, textTransform: "uppercase" }}>Mondiali 2026</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: "#0d2a3a", border: "1px solid var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "var(--green-light)", fontWeight: 700 }}>🟢 LIVE</div>
              <button onClick={handleLogout} style={{ background: "none", border: "1px solid #1a2a4a", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 1 }}>ESCI</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            {user.email}
          </div>
          <nav style={{ display: "flex" }}>
            {["matches", "ranking", "pricing"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "var(--green)" : "transparent"}`, color: tab === t ? "var(--green-light)" : "var(--muted)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                {t === "matches" ? "Partite" : t === "ranking" ? "Classifica" : "Pro"}
              </button>
            ))}
          </nav>
        </header>

        <main style={{ padding: "20px", maxWidth: 480, margin: "0 auto" }}>
          {tab === "matches" && (
            <div className="animate-in">

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {COMPETITIONS.map(c => (
                  <button key={c.code} onClick={() => setCompetition(c.code)} style={{ flex: 1, padding: "14px 4px", background: competition === c.code ? "linear-gradient(135deg,var(--green),#0d7a54)" : "linear-gradient(135deg,#0d1f3c,#0a1628)", border: `2px solid ${competition === c.code ? "var(--green)" : "#1e3050"}`, borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .2s", boxShadow: competition === c.code ? "0 0 20px rgba(26,158,110,.3)" : "none" }}>
                    <img src={c.crest} alt={c.label} style={{ width: 36, height: 36, objectFit: "contain", filter: competition === c.code ? "none" : "grayscale(40%) opacity(0.75)", transition: "all .2s" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: competition === c.code ? "#fff" : "var(--muted2)", lineHeight: 1.2, textAlign: "center" }}>{c.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
                {days.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} style={{ minWidth: 52, background: selectedDay === i ? "linear-gradient(135deg,var(--green),#0d7a54)" : d.isPast ? "#080f1e" : "var(--bg3)", border: `1px solid ${selectedDay === i ? "var(--green)" : d.isPast ? "#0f1e36" : "var(--border)"}`, borderRadius: 10, padding: "8px 6px", cursor: "pointer", textAlign: "center", transition: "all .2s", color: "var(--text)", opacity: d.isPast && selectedDay !== i ? 0.6 : 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: selectedDay === i ? "rgba(255,255,255,.75)" : "var(--muted)", textTransform: "uppercase" }}>{d.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{d.dayNum}</div>
                    <div style={{ fontSize: 10, color: selectedDay === i ? "rgba(255,255,255,.6)" : "var(--muted)", textTransform: "uppercase" }}>{d.month}</div>
                    {d.isPast && <div style={{ fontSize: 8, color: selectedDay === i ? "rgba(255,255,255,.5)" : "var(--green)", marginTop: 2 }}>●</div>}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                {days[selectedDay]?.isToday ? "Partite di oggi" : days[selectedDay]?.isPast ? `Risultati — ${days[selectedDay].dayNum} ${days[selectedDay].month}` : `Partite — ${days[selectedDay]?.dayNum} ${days[selectedDay]?.month}`}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {matchLoading && (
                  <div style={{ textAlign: "center", padding: 30, color: "#4a9e7a" }}>
                    <span className="spin" style={{ fontSize: 26 }}>⚙️</span>
                    <div style={{ fontSize: 13, letterSpacing: 1, marginTop: 8 }}>CARICAMENTO...</div>
                  </div>
                )}
                {matchError && <div style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: 10, padding: 14, color: "var(--red)", fontSize: 13 }}>⚠️ {matchError}</div>}
                {!matchLoading && !matchError && matches.length === 0 && (
                  <div style={{ textAlign: "center", padding: 30, color: "var(--muted)", fontSize: 14 }}>Nessuna partita per questo giorno.</div>
                )}
                {matches.map(m => (
                  <div key={m.id}>
                    <div onClick={() => selectMatch(m)} style={{ background: activeMatch?.id === m.id ? "linear-gradient(135deg,#0d2a3a,#0a1e30)" : "linear-gradient(135deg,var(--bg3),var(--bg2))", border: `1px solid ${activeMatch?.id === m.id ? "var(--green)" : "var(--border)"}`, borderRadius: activeMatch?.id === m.id ? "12px 12px 0 0" : 12, padding: 16, cursor: "pointer", transition: "all .2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, letterSpacing: 2 }}>{m.stage}</span>
                          <span style={{ fontSize: 10, color: "#2a4060" }}>· {new Date(m.date + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {(m.status === "IN_PLAY" || m.status === "LIVE") && <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 700 }}>🔴 LIVE</span>}
                          {m.status === "FINISHED" && <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>FINITA</span>}
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>🕐 {m.time}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                          {m.homeCrest ? <img src={m.homeCrest} alt={m.home} style={{ width: 28, height: 28, objectFit: "contain" }} /> : <span style={{ fontSize: 20 }}>⚽</span>}
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{m.home}</span>
                        </div>
                        {(m.status === "FINISHED" || m.status === "IN_PLAY" || m.status === "LIVE")
                          ? <span style={{ fontSize: 18, fontWeight: 900, color: "var(--green-light)", minWidth: 60, textAlign: "center" }}>{m.score.home ?? "?"} — {m.score.away ?? "?"}</span>
                          : <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, minWidth: 30, textAlign: "center" }}>VS</span>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{m.away}</span>
                          {m.awayCrest ? <img src={m.awayCrest} alt={m.away} style={{ width: 28, height: 28, objectFit: "contain" }} /> : <span style={{ fontSize: 20 }}>⚽</span>}
                        </div>
                      </div>
                    </div>

                    {activeMatch?.id === m.id && (
                      <div className="animate-in" style={{ background: "#07111f", border: "1px solid var(--green)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 16 }}>
                        <div style={{ fontSize: 11, color: "#4a9e7a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Il tuo pronostico</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                          {[
                            ["home", activeMatch.home, activeMatch.homeCrest],
                            ["draw", "Pareggio", null],
                            ["away", activeMatch.away, activeMatch.awayCrest],
                          ].map(([val, label, crest]) => (
                            <button key={val} onClick={() => submitPick(val)} style={{ flex: 1, padding: "10px 4px", border: `2px solid ${userPick === val ? "var(--green)" : "var(--border)"}`, background: userPick === val ? "#0d3d2a" : "var(--bg2)", color: userPick === val ? "var(--green-light)" : "var(--muted2)", borderRadius: 8, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              {crest ? <img src={crest} alt={label} style={{ width: 26, height: 26, objectFit: "contain" }} /> : <span style={{ fontSize: 20 }}>🤝</span>}
                              <span>{val === "draw" ? "Pareggio" : "Vince"}</span>
                            </button>
                          ))}
                        </div>
                        {aiLoading && (
                          <div style={{ textAlign: "center", padding: 16, color: "#4a9e7a" }}>
                            <span className="spin" style={{ fontSize: 20 }}>⚙️</span>
                            <div style={{ fontSize: 12, letterSpacing: 1, marginTop: 6 }}>ANALISI AI IN CORSO...</div>
                          </div>
                        )}
                        {aiAnalysis && !aiLoading && (
                          <div className="animate-in" style={{ background: "var(--bg)", borderRadius: 10, padding: 14, border: "1px solid #1a3a2a", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                              <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, letterSpacing: 2 }}>ANALISI AI</span>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#c0d0e8", fontFamily: "'Barlow',sans-serif" }}>{aiAnalysis}</p>
                          </div>
                        )}
                        {aiSuggestion && !aiLoading && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: "var(--muted)" }}>Suggerimento AI:</span>
                            <span style={{ color: "var(--green-light)", fontWeight: 700 }}>
                              {aiSuggestion === "home" ? activeMatch.home : aiSuggestion === "away" ? activeMatch.away : "Pareggio"}
                            </span>
                            <span style={{ color: userPick === aiSuggestion ? "var(--green-light)" : "var(--red)" }}>
                              {userPick === aiSuggestion ? "✓ In linea!" : "⚠ Diverso"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "ranking" && (
            <div className="animate-in">
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Classifica globale</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LEADERBOARD.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: s.name === "Tu" ? "linear-gradient(135deg,#0d2a3a,#0a1e30)" : "var(--bg3)", border: `1px solid ${s.name === "Tu" ? "var(--green)" : "var(--border)"}`, borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#ffd700,#ffaa00)" : i === 1 ? "linear-gradient(135deg,#c0c0c0,#909090)" : i === 2 ? "linear-gradient(135deg,#cd7f32,#a05020)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: i < 3 ? "#050a14" : "var(--muted)" }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--green-light)" }}>{s.pts}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.correct} corretti</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="animate-in">
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Abbonamento</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Gioca al<br />livello Pro</div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20, fontFamily: "'Barlow',sans-serif" }}>Analisi AI illimitate per tutta la durata dei Mondiali</p>
              <div style={{ display: "flex", gap: 12 }}>
                {PLANS.map(p => (
                  <div key={p.name} style={{ flex: 1, background: p.highlight ? "linear-gradient(135deg,#0d2a3a,#0a1e30)" : "linear-gradient(135deg,var(--bg3),var(--bg2))", border: `1px solid ${p.highlight ? "var(--green)" : "var(--border)"}`, borderRadius: 16, padding: 20, boxShadow: p.highlight ? "0 0 40px rgba(26,158,110,.2)" : "none" }}>
                    {p.highlight && <div style={{ fontSize: 10, color: "var(--green)", letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>CONSIGLIATO</div>}
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{p.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: p.highlight ? "var(--green-light)" : "var(--text)", margin: "8px 0" }}>{p.price}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                      {p.features.map(f => (
                        <div key={f} style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--muted2)", fontFamily: "'Barlow',sans-serif" }}>
                          <span style={{ color: p.highlight ? "var(--green)" : "var(--muted)" }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop: 18, width: "100%", padding: "11px 0", border: "none", borderRadius: 8, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", background: p.highlight ? "linear-gradient(135deg,var(--green),#0d7a54)" : "var(--border)", color: p.highlight ? "#fff" : "var(--muted2)" }}>
                      {p.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
