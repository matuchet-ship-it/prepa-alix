// Mini-serveur (fonction serverless Vercel) — génère un message d'encouragement varié.
// BONUS P1 : garde la clé API Claude CACHÉE côté serveur.
// Sans clé configurée → 503, et l'appli utilise sa banque de messages intégrée.
//
// Reçoit  : { kind: "activite"|"seance"|"jour", contexte?: "...", prenom?: "Alix" }
// Renvoie : { message: "..." }

const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY manquante" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const kind = (body && body.kind) || "activite";
  const contexte = (body && body.contexte) || "";
  const prenom = (body && body.prenom) || "Alix";

  const consigne = {
    activite: "Elle vient de terminer un exercice de muscu/course.",
    seance: "Elle vient de terminer toute sa séance.",
    jour: "Message du jour à l'ouverture de l'appli (peut être un jour de repos).",
  }[kind] || "";

  const system =
    "Tu écris UN court message d'encouragement pour " + prenom + ", 17 ans, footballeuse qui rejoint le FC Rouen (U18 R1). " +
    "Ton : hype, jeune, positif, jamais moqueur, jamais vulgaire. 1 phrase, max 90 caractères, tutoiement, 1 emoji max. " +
    "Couleurs du club : rouge et blanc (🔴⚪), surnom les Diables Rouges. " +
    consigne + " " + (contexte ? "Contexte : " + contexte + ". " : "") +
    "Réponds UNIQUEMENT par le message, sans guillemets ni texte autour.";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 60,
        temperature: 1,
        system,
        messages: [{ role: "user", content: "Donne-moi le message." }],
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      res.status(502).json({ error: "Erreur API Claude", detail: txt.slice(0, 200) });
      return;
    }
    const data = await r.json();
    const text = (data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ message: text.trim().replace(/^["«»]+|["«»]+$/g, "").slice(0, 160) });
  } catch (e) {
    res.status(502).json({ error: "Appel API échoué", detail: String(e).slice(0, 200) });
  }
}
