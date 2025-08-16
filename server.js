import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * ENV Variablen (in Render eintragen):
 *  RT_API_KEY    -> RumbleTalk API Key
 *  RT_API_SECRET -> RumbleTalk API Secret (falls vom Endpunkt verlangt)
 *  RT_ROOM_ID    -> (optional) Raum-ID / Hash, wenn euer Account das benötigt
 *  RT_API_BASE   -> RumbleTalk API Base URL für Token-Login (laut RT-Doku)
 *
 *  Beispiel (PLATZHALTER!): https://api.rumbletalk.com/api/1/token
 *  Bitte die korrekte URL aus "Developers / Token Login" im RT-Dashboard nehmen.
 */

const {
  RT_API_KEY,
  RT_API_SECRET,
  RT_ROOM_ID,
  RT_API_BASE
} = process.env;

if (!RT_API_KEY || !RT_API_BASE) {
  console.warn("Fehlende ENV Variablen: RT_API_KEY, RT_API_BASE (und ggf. RT_API_SECRET, RT_ROOM_ID).");
}

// Healthcheck
app.get("/", (_, res) => res.send("RumbleTalk token server OK"));

// Token-Endpunkt: /token?username=Max&role=user&uid=u_abc123
app.get("/token", async (req, res) => {
  try {
    const { username, role = "user", uid } = req.query;
    if (!username) return res.status(400).json({ error: "username ist erforderlich" });

    // ---- Hier RT-spezifischen Request aufbauen (laut eurer RT-Doku) ----
    // Beispiel: (PLATZHALTER!) RT erwartet oft einen Authorization-Header
    // und ein JSON mit username/role/room etc.
    const rtResponse = await fetch(RT_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RT_API_KEY}`
      },
      body: JSON.stringify({
        username,
        role,          // z.B. "user" | "moderator" etc.
        uid,           // eigene ID, falls erlaubt
        room: RT_ROOM_ID,
        // ggf. weitere Felder laut RT-Docs (z.B. expires, displayName, avatar)
        // "secret": RT_API_SECRET  // nur falls von eurem Endpunkt gefordert
      })
    });

    if (!rtResponse.ok) {
      const text = await rtResponse.text();
      return res.status(rtResponse.status).json({ error: "RT API Fehler", details: text });
    }

    const data = await rtResponse.json();
    // Wir erwarten von RT etwas wie { token: "..." }
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfehler", details: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RT-Token-Server läuft auf Port", PORT));
