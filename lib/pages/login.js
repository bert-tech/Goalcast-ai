import { useState } from "react";
import { supabase } from "../lib/supabase";
import Head from "next/head";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Controlla la tua email per confermare la registrazione!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>GoalCast AI — Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Barlow Condensed', sans-serif" }}>

        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,var(--green),#0d7a54)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px" }}>⚽</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>GOALCAST AI</div>
          <div style={{ fontSize: 12, color: "#4a9e7a", letterSpacing: 2, textTransform: "uppercase" }}>Mondiali 2026</div>
        </div>

        <div style={{ width: "100%", maxWidth: 360, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>
            {isSignup ? "Crea account" : "Accedi"}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tua@email.com"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 15, fontFamily: "'Barlow Condensed', sans-serif", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 15, fontFamily: "'Barlow Condensed', sans-serif", outline: "none" }}
            />
          </div>

          {error && <div style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, padding: 12, color: "var(--red)", fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
          {message && <div style={{ background: "#0a1a0a", border: "1px solid #1a5a1a", borderRadius: 8, padding: 12, color: "var(--green-light)", fontSize: 13, marginBottom: 14 }}>✓ {message}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,var(--green),#0d7a54)", border: "none", borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "..." : isSignup ? "Registrati" : "Accedi"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
            {isSignup ? "Hai già un account?" : "Non hai un account?"}
            <span onClick={() => { setIsSignup(!isSignup); setError(""); setMessage(""); }} style={{ color: "var(--green-light)", cursor: "pointer", marginLeft: 6, fontWeight: 700 }}>
              {isSignup ? "Accedi" : "Registrati"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
