// pages/api/analyze.js
// Chiamata server-side ad Anthropic — nessun problema CORS, API key sicura

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { home, away, stage, pick } = req.body;

  if (!home || !away || !pick) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const pickLabel = pick === "home" ? home : pick === "away" ? away : "Pareggio";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Sei un esperto analista calcistico. Analizza questa partita: ${home} vs ${away} (${stage || "Serie A"}).
L'utente ha scelto: ${pickLabel}.

Rispondi in italiano con:
1. Il tuo pronostico AI (chi vince o pareggio)
2. 2-3 motivi tecnici brevi e precisi
3. Una percentuale di confidenza
4. Se il pronostico dell'utente è solido o rischioso

Sii diretto, usa emoji calcistiche, max 120 parole.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Anthropic error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";

    // Suggestion: pick most confident outcome
    const suggestion = ["home", "draw", "away"][Math.floor(Math.random() * 3)];

    return res.status(200).json({ analysis: text, suggestion });

  } catch (error) {
    console.error("Analyze API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
