// Stockage cloud de la progression (base Redis : Vercel KV / Upstash via REST).
// Bases SÉPARÉES : Alix et Guest ne se mélangent jamais.
//
//   GET  /api/state?profile=alix        → { data: <blob ou null> }
//   POST /api/state?profile=alix {data} → enregistre le blob
//
// profile accepté : "alix" ou "guest" (défaut : alix). Toute autre valeur est refusée.
// Clés Redis : prepa:alix:state  et  prepa:guest:state
//
// Variables d'environnement (ajoutées automatiquement quand on connecte une base
// Vercel KV / Upstash au projet) : KV_REST_API_URL + KV_REST_API_TOKEN
// (on accepte aussi UPSTASH_REDIS_REST_URL / _TOKEN).
//
// Si la base n'est pas configurée → 503, et l'appli bascule sur le stockage local.

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const KEYS = {
  alix: "prepa:alix:state",
  guest: "prepa:guest:state",
};

async function redis(command) {
  const r = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error("redis " + r.status + " " + (await r.text()).slice(0, 120));
  const j = await r.json();
  return j.result;
}

function resolveKey(req) {
  // profile depuis la query (?profile=alix) ou le body
  let profile = "alix";
  try {
    const url = new URL(req.url, "http://x");
    profile = (url.searchParams.get("profile") || "alix").toLowerCase();
  } catch (e) { /* ignore */ }
  return KEYS[profile] || null;
}

export default async function handler(req, res) {
  if (!REST_URL || !REST_TOKEN) {
    res.status(503).json({ error: "Base de données non configurée" });
    return;
  }

  const KEY = resolveKey(req);
  if (!KEY) {
    res.status(400).json({ error: "Profil inconnu (attendu : alix ou guest)" });
    return;
  }

  try {
    if (req.method === "GET") {
      const v = await redis(["GET", KEY]);
      res.status(200).json({ data: v ? JSON.parse(v) : null });
      return;
    }
    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      const data = body && body.data;
      if (!data) { res.status(400).json({ error: "Aucune donnée" }); return; }
      await redis(["SET", KEY, JSON.stringify(data)]);
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e) {
    res.status(502).json({ error: "Erreur base de données", detail: String(e).slice(0, 200) });
  }
}
