import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Flame, ChevronLeft, Check, Timer, Dumbbell, Activity, TrendingUp,
  User, Shield, Users, Home, Trophy, Calendar, Settings, Lock, Plus,
  Minus, Zap, Heart, Footprints, RotateCcw, Award, BarChart3, CheckCircle2,
  Save, LogOut, Sparkles, Bell,
} from "lucide-react";

/* ============================================================
   PRÉPA ALIX — FC Rouen 🔴⚪
   Front sans build : React 18 (CDN) + Tailwind + Babel navigateur.
   Données : /api/state?profile=alix|guest (Vercel KV) + fallback localStorage.
   ============================================================ */

const RED = "#D50000";
const BLACK = "#1A1A1A";
const VERSION = "prepa_alix_v1";

/* ------------------------------------------------------------
   PROGRAMME EMBARQUÉ (cibles v1) — modifiable par Papa (admin)
   type : "run" (km/h + min) | "machine" (kg + séries×reps) | "abs" (séries×reps ou reps+durée)
   ------------------------------------------------------------ */
const DEFAULT_PROGRAM = {
  A: {
    id: "A",
    titre: "Séance A — Course + Abdos",
    duree: 45,
    couleur: "#D50000",
    icone: "run",
    activites: [
      { id: "a_footing_ech", nom: "Footing échauffement", type: "run", cible: "5 min à 8 km/h",
        vitesse: 8, duree: 5, progression: "—" },
      { id: "a_frac", nom: "Frac 1 min / 1 min", type: "run", cible: "×4 à 11 km/h (trot 6–7)",
        vitesse: 11, reps: 4, progression: "×5 puis +0,5 km/h", isFrac: true },
      { id: "a_footing_fin", nom: "Footing fin", type: "run", cible: "5–8 min à 8–8,5 km/h",
        vitesse: 8, duree: 6, progression: "—" },
      { id: "a_crunch", nom: "Crunch machine", type: "machine", cible: "4×12 à 10–15 kg",
        charge: 12, series: 4, reps: 12, progression: "+2,5 kg si facile" },
      { id: "a_torso", nom: "Rotation du buste (torso)", type: "machine", cible: "3×12/côté à 15–20 kg",
        charge: 17, series: 3, reps: 12, progression: "+2,5 kg si facile" },
      { id: "a_chaise", nom: "Chaise romaine — relevés genoux", type: "abs", cible: "3×10",
        series: 3, reps: 10, progression: "+2 reps, puis jambes tendues" },
    ],
  },
  B: {
    id: "B",
    titre: "Séance B — Puissance + Haut",
    duree: 45,
    couleur: "#1A1A1A",
    icone: "power",
    activites: [
      { id: "b_marche", nom: "Échauffement marche rapide", type: "run", cible: "8 min à 5,5–6 km/h, pente 3–4 %",
        vitesse: 6, duree: 8, progression: "—" },
      { id: "b_presse2", nom: "Presse 2 jambes", type: "machine", cible: "3×10 à 30–35 kg",
        charge: 32, series: 3, reps: 10, progression: "objectif 50–60 kg fin août" },
      { id: "b_presse1", nom: "Presse 1 jambe", type: "machine", cible: "3×8/jambe à 15–20 kg",
        charge: 17, series: 3, reps: 8, progression: "+2,5 kg si facile" },
      { id: "b_add", nom: "Adducteurs", type: "machine", cible: "3×12 à 15–20 kg",
        charge: 17, series: 3, reps: 12, progression: "vers 25–30 kg" },
      { id: "b_abd", nom: "Abducteurs", type: "machine", cible: "3×12 à 15–20 kg",
        charge: 17, series: 3, reps: 12, progression: "vers 25–30 kg" },
      { id: "b_lat", nom: "Tirage vertical (Lat Pulldown)", type: "machine", cible: "3×10 à 15–20 kg",
        charge: 17, series: 3, reps: 10, progression: "vers 25 kg" },
      { id: "b_shoulder", nom: "Shoulder Press machine", type: "machine", cible: "3×10 à 10–15 kg",
        charge: 12, series: 3, reps: 10, progression: "puis haltères 3–4 kg" },
      { id: "b_rowing", nom: "Rowing machine", type: "machine", cible: "2×10 à 15–20 kg",
        charge: 17, series: 2, reps: 10, progression: "+2,5 kg si facile" },
    ],
  },
};

/* ------------------------------------------------------------
   PLANNING 6 → 27 juillet
   ------------------------------------------------------------ */
const PLANNING = [
  { date: "2026-07-06", label: "Lun 6/07", type: "A", note: "Course + abdos" },
  { date: "2026-07-08", label: "Mer 8/07", type: "B", note: "Puissance + haut" },
  { date: "2026-07-10", label: "Ven 10/07", type: "A", note: "+ début individuelles club" },
  { date: "2026-07-12", label: "Dim 12/07", type: "B", note: "" },
  { date: "2026-07-14", label: "Mar 14/07", type: "light", note: "Allégée : footing 20 min à 8 km/h + abdos, pas de frac" },
  { date: "2026-07-15", label: "Mer 15/07", type: "fcr", note: "🔴 Reprise FCR — pas de salle" },
  { date: "2026-07-16", label: "Jeu 16/07", type: "B", note: "" },
  { date: "2026-07-18", label: "Sam 18/07", type: "A", note: "frac seulement si pas de course club" },
  { date: "2026-07-21", label: "Mar 21/07", type: "B", note: "" },
  { date: "2026-07-23", label: "Jeu 23/07", type: "A", note: "" },
  { date: "2026-07-25", label: "Sam 25/07", type: "rest", note: "Repos ou footing léger selon club" },
  { date: "2026-07-27", label: "Lun 27/07", type: "B", note: "" },
  { date: "2026-07-29", label: "Mer 29/07", type: "A", note: "à ajuster selon planning FCR" },
  { date: "2026-07-31", label: "Ven 31/07", type: "B", note: "dernière séance salle de juillet" },
];

/* ------------------------------------------------------------
   BANQUE DE MESSAGES (langage jeune) — rotation aléatoire, jamais 2× d'affilée
   ------------------------------------------------------------ */
const MSG = {
  activite: [
    "T'as tout cassé 🔥 la presse elle s'en remet pas",
    "Wesh la machine !! Encore une de pliée 💪",
    "C'est carré, c'est propre, c'est toi 😤",
    "Les défenseuses de R1 vont rien comprendre 🚀",
    "Ça pousse, ça pousse, la boss est là 👑",
    "Une de plus au compteur, t'es pas là pour rigoler 😮‍💨",
    "Propre. Net. Sans bavure ✅",
    "La régularité paie, et là tu régales 🤝",
    "Grosse énergie, on sent la reprise arriver 💥",
    "T'es en train de construire la version béton de toi 🧱",
    "Elle a dit « encore une série » et elle l'a faite 🫡",
    "Les jambes vont te dire merci en R1 🦵",
    "Discrète mais redoutable, continue 🥷",
    "Ça c'est fait, next 🔁",
    "Tu coches, tu progresses, tu gagnes 📈",
    "Le travail dans l'ombre, la lumière en match 🌟",
    "Cette rep valait de l'or 🏅",
    "Solide comme un mur défensif 🧱",
    "T'as mis l'intensité, respect 🙌",
    "Machine validée, boss confirmée 🤖",
    "Pas d'excuse aujourd'hui, que du taf 🛠️",
    "Ta future toi te dit merci 🙏",
    "Petit à petit, la bombe se prépare 💣",
    "Encore une brique posée 🧱 la maison monte",
    "Ça sent la joueuse qui monte en puissance ⚡",
    "T'es constante, c'est ça qui fait la diff 🎯",
    "Le corps encaisse, la confiance grimpe 📊",
    "Bien joué, on lâche rien 🤜",
    "Séance après séance, tu deviens injouable 🕹️",
    "C'est ça l'état d'esprit d'une pro 💼",
    "La sueur d'aujourd'hui = les buts de demain ⚽",
  ],
  seance: [
    "SÉANCE VALIDÉE ✅ T'es une tueuse, repos bien mérité",
    "Le FCR sait pas encore la chance qu'il a 🔴⚪",
    "Grosse séance, grosse mentalité. On est fiers 💪",
    "Terminé en beauté 🏁 récupère bien, championne",
    "Ça c'est du sérieux. Continue comme ça et t'es imparable 🚀",
    "Journée cochée, mission accomplie 😤 hydrate-toi !",
    "T'as donné, maintenant tu récupères. Bravo 🙌",
    "Une séance de plus vers ta meilleure version 🔝",
    "Boulot d'athlète pro aujourd'hui 🏆",
    "Fin de séance, début de la légende 📖🔴⚪",
  ],
  jourSeance: [
    "C'est aujourd'hui que ça se joue, la salle t'attend 😈",
    "Réveille les Diables Rouges qui sommeillent 🔴⚪ séance du jour !",
    "Aujourd'hui on coche une case de plus vers la R1 ✅",
    "La salle, c'est ton terrain d'entraînement. On y va 💪",
    "Objectif du jour : sortir de la salle plus forte qu'en entrant 🔥",
    "Personne va le faire à ta place. Go 🚀",
    "Une séance aujourd'hui = un pas d'avance sur les autres 🏃‍♀️",
    "Prépa mode ON. Montre à la presse ce que tu vaux 😤",
  ],
  jourRepos: [
    "Repos = progression aussi. Hydrate-toi, mange bien, demain on remet ça 💧",
    "Jour off : le muscle se construit au repos 😴 profite",
    "Récup intelligente aujourd'hui, tu reviens plus forte 💪",
    "Pas de salle, mais garde la tête dans le projet 🔴⚪",
    "Étire-toi, dors bien, la championne se recharge 🔋",
    "Le repos fait partie du plan. Respecte-le 🧘‍♀️",
  ],
};

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtDate = (iso) => {
  try {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}`;
  } catch (e) { return iso; }
};
const fmtDateLong = (iso) => {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  } catch (e) { return iso; }
};

// tirage aléatoire évitant le dernier index utilisé
function pickMsg(cat, lastRef) {
  const arr = MSG[cat] || [];
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  let i = Math.floor(Math.random() * arr.length);
  if (i === lastRef.current) i = (i + 1) % arr.length;
  lastRef.current = i;
  return arr[i];
}

/* ------------------------------------------------------------
   STATE : chargement / sauvegarde (cloud + fallback local)
   Un « store » par profil (alix / guest). Papa lit alix.
   ------------------------------------------------------------ */
const emptyStore = () => ({ seances: [], records: {}, settings: { notifHour: 18 }, program: null });

function localKey(profile) { return `${VERSION}_${profile}`; }

function loadLocal(profile) {
  try {
    const raw = localStorage.getItem(localKey(profile));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return emptyStore();
}
function saveLocal(profile, store) {
  try { localStorage.setItem(localKey(profile), JSON.stringify(store)); } catch (e) {}
}

async function loadCloud(profile) {
  const r = await fetch(`/api/state?profile=${profile}`, { method: "GET" });
  if (!r.ok) throw new Error("cloud indisponible");
  const j = await r.json();
  return j.data;
}
async function saveCloud(profile, store) {
  const r = await fetch(`/api/state?profile=${profile}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: store }),
  });
  if (!r.ok) throw new Error("save cloud échouée");
  return true;
}

/* Hook de persistance : renvoie [store, setStore, status] pour un profil donné */
function useStore(profile) {
  const [store, setStoreState] = useState(emptyStore());
  const [status, setStatus] = useState("loading"); // loading | cloud | local
  const cloudOK = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const data = await loadCloud(profile);
        if (!alive) return;
        cloudOK.current = true;
        setStoreState(data || emptyStore());
        setStatus("cloud");
      } catch (e) {
        if (!alive) return;
        cloudOK.current = false;
        setStoreState(loadLocal(profile));
        setStatus("local");
      }
    })();
    return () => { alive = false; };
  }, [profile]);

  const setStore = (updater) => {
    setStoreState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLocal(profile, next); // toujours une copie locale
      if (cloudOK.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => { saveCloud(profile, next).catch(() => {}); }, 400);
      }
      return next;
    });
  };

  return [store, setStore, status];
}

/* ============================================================
   PETITS COMPOSANTS UI
   ============================================================ */
function Header({ title, subtitle, onBack, right, color = RED }) {
  return (
    <div className="sticky top-0 z-20" style={{ background: color }}>
      <div className="px-4 pt-3 pb-3 flex items-center gap-3 text-white"
           style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 rounded-full active:bg-white/20">
            <ChevronLeft size={26} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg leading-tight truncate">{title}</div>
          {subtitle && <div className="text-white/85 text-xs truncate">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

function Stepper({ label, value, set, step = 1, min = 0, max = 999, suffix = "" }) {
  const dec = () => set(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => set(Math.min(max, +(value + step).toFixed(2)));
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold text-neutral-700">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={dec}
          className="w-11 h-11 rounded-2xl bg-neutral-100 active:bg-neutral-200 flex items-center justify-center text-neutral-800">
          <Minus size={20} />
        </button>
        <div className="w-20 text-center">
          <span className="text-2xl font-black tabular-nums" style={{ color: BLACK }}>{value}</span>
          {suffix && <span className="text-xs text-neutral-400 ml-0.5">{suffix}</span>}
        </div>
        <button onClick={inc}
          className="w-11 h-11 rounded-2xl text-white flex items-center justify-center active:opacity-80"
          style={{ background: RED }}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

function HypeBanner({ text, onClose }) {
  if (!text) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40" onClick={onClose}
         style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-[pop_.25s_ease]"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E9F9EE" }}>
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
        </div>
        <p className="text-center text-lg font-black leading-snug" style={{ color: BLACK }}>{text}</p>
        <button onClick={onClose}
          className="mt-5 w-full py-3.5 rounded-2xl text-white font-black text-base active:opacity-80"
          style={{ background: RED }}>Continuer</button>
      </div>
      <style>{`@keyframes pop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

/* Logo FCR & CO (light = version blanche pour fond rouge) */
function Logo({ size = 44, light = false }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-2xl flex items-center justify-center font-black shadow-md"
           style={{ width: size, height: size, background: light ? "#fff" : RED, color: light ? RED : "#fff", fontSize: size * 0.42 }}>
        FCR
      </div>
      <div className="leading-none">
        <div className="font-black tracking-tight" style={{ color: light ? "#fff" : BLACK, fontSize: size * 0.42 }}>&amp; CO</div>
        <div className="text-[10px] font-bold tracking-widest" style={{ color: light ? "rgba(255,255,255,.85)" : RED }}>PRÉPA ALIX</div>
      </div>
    </div>
  );
}

/* Écusson FCR stylisé (motif club, dessiné — pas le blason officiel) */
function FcrCrest({ className = "", style = {} }) {
  return (
    <svg viewBox="0 0 200 240" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 6 L188 34 V120 C188 178 150 216 100 234 C50 216 12 178 12 120 V34 Z"
            fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M100 22 L172 45 V120 C172 168 140 200 100 216 C60 200 28 168 28 120 V45 Z"
            fill="currentColor" opacity="0.14" />
      <text x="100" y="118" textAnchor="middle" fontSize="66" fontWeight="900"
            fontFamily="ui-sans-serif, system-ui, sans-serif" fill="currentColor" letterSpacing="-4">FCR</text>
      <text x="100" y="158" textAnchor="middle" fontSize="20" fontWeight="800"
            fontFamily="ui-sans-serif, system-ui, sans-serif" fill="currentColor" letterSpacing="2">&amp; CO</text>
      {/* ballon stylisé */}
      <circle cx="100" cy="190" r="15" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M100 179 l9 7 -3.5 11 h-11 L91 186 Z" fill="currentColor" />
    </svg>
  );
}

/* ============================================================
   ÉCRAN D'ACCUEIL — choix du profil
   ============================================================ */
function ProfileHome({ onPick }) {
  const btn = (id, label, sub, Icon, bg, fg, iconBg) => (
    <button onClick={() => onPick(id)}
      className="w-full rounded-3xl p-5 flex items-center gap-4 shadow-lg active:scale-[.98] transition-transform text-left"
      style={{ background: bg, color: fg }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
           style={{ background: iconBg }}>
        <Icon size={28} />
      </div>
      <div className="min-w-0">
        <div className="font-black text-xl">{label}</div>
        <div className="text-sm opacity-85">{sub}</div>
      </div>
    </button>
  );
  return (
    <div className="min-h-full flex flex-col px-5 relative overflow-hidden"
         style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "2rem",
                  background: "linear-gradient(160deg, #E00000 0%, #D50000 45%, #9E0000 100%)" }}>
      {/* écusson FCR en filigrane */}
      <FcrCrest className="absolute pointer-events-none"
                style={{ color: "#fff", opacity: 0.08, width: "115%", top: "12%", left: "-8%" }} />
      {/* halo lumineux */}
      <div className="absolute pointer-events-none" style={{ top: "-20%", left: "-10%", width: "120%", height: "50%",
           background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 60%)" }} />

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex justify-center mt-4 mb-3"><Logo size={58} light /></div>
        <div className="text-center mb-8">
          <div className="text-3xl font-black text-white drop-shadow">Prêt·e pour la reprise ?</div>
          <div className="text-white/80 text-sm mt-1 font-semibold">Choisis ton profil 🔴⚪</div>
        </div>
        <div className="space-y-4 max-w-md w-full mx-auto">
          {btn("alix", "ALIX", "Mon programme, mes séances, mes records", Flame, "#fff", RED, "rgba(213,0,0,.12)")}
          {btn("papa", "PAPA", "Suivi & courbes de progression", BarChart3, BLACK, "#fff", "rgba(255,255,255,.16)")}
          {btn("guest", "GUEST", "Essayer sans toucher aux données d'Alix", Users, "rgba(255,255,255,.14)", "#fff", "rgba(255,255,255,.16)")}
        </div>
        <div className="mt-auto pt-8 text-center text-[11px] text-white/50">
          FCR &amp; CO · v1 · Allez Rouen 🔴⚪
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GATE CODE (garde-fou simple, côté navigateur)
   ============================================================ */
function CodeGate({ profile, expected, onOK, onBack }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (code.trim().toLowerCase() === expected.toLowerCase()) onOK();
    else { setErr(true); setCode(""); }
  };
  return (
    <div className="min-h-full flex flex-col">
      <Header title={profile === "papa" ? "Espace PAPA" : "Espace ALIX"} onBack={onBack}
              color={profile === "papa" ? BLACK : RED} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#F2F2F2" }}>
          <Lock size={30} className="text-neutral-500" />
        </div>
        <p className="text-neutral-600 text-sm text-center">Entre le code d'accès</p>
        <input
          type="password" value={code} inputMode="text" autoFocus
          onChange={(e) => { setCode(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={`w-full max-w-xs text-center text-xl font-bold tracking-widest rounded-2xl border-2 px-4 py-3 outline-none ${err ? "border-red-400" : "border-neutral-200"}`}
          placeholder="••••" />
        {err && <p className="text-red-500 text-xs">Code incorrect</p>}
        <button onClick={submit}
          className="w-full max-w-xs py-3.5 rounded-2xl text-white font-black active:opacity-80"
          style={{ background: profile === "papa" ? BLACK : RED }}>Entrer</button>
      </div>
    </div>
  );
}

/* ============================================================
   FLOW ATHLÈTE (Alix / Guest) — accueil, séance, saisie, récap
   ============================================================ */
const iconRun = <Footprints size={18} />;
const activityIcon = (type) => type === "run" ? <Footprints size={18} /> : type === "abs" ? <Zap size={18} /> : <Dumbbell size={18} />;

function AthleteHome({ profile, store, setStore, program, onOpenSession, onRecords, onExit }) {
  const dayMsgRef = useRef(-1);
  const today = todayISO();

  const plan = PLANNING.find((p) => p.date === today);
  const isSessionDay = plan && (plan.type === "A" || plan.type === "B" || plan.type === "light");
  const dayMsg = useMemo(() => pickMsg(isSessionDay ? "jourSeance" : "jourRepos", dayMsgRef), [today, isSessionDay]);

  // séance du jour déjà démarrée ?
  const seances = store.seances || [];
  const todaySeances = seances.filter((s) => s.date === today);

  // stats rapides
  const doneCount = seances.filter((s) => s.statut === "terminee").length;
  const streak = computeStreak(seances);

  return (
    <div className="min-h-full pb-8">
      <Header
        title={profile === "guest" ? "GUEST" : "Salut Alix 👋"}
        subtitle={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        color={RED}
        right={<button onClick={onExit} className="p-1.5 rounded-full active:bg-white/20"><LogOut size={20} /></button>}
      />

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* message du jour */}
        <div className="rounded-3xl p-4 flex items-start gap-3 text-white" style={{ background: BLACK }}>
          <Bell size={20} className="mt-0.5 shrink-0" style={{ color: "#FF6B6B" }} />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold">Message du jour</div>
            <div className="font-bold leading-snug mt-0.5">{dayMsg}</div>
          </div>
        </div>

        {/* mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-bold"><Flame size={14} /> SÉRIE</div>
            <div className="text-3xl font-black mt-1" style={{ color: RED }}>{streak}<span className="text-base text-neutral-400 font-bold ml-1">j</span></div>
          </div>
          <button onClick={onRecords} className="rounded-2xl bg-white p-4 shadow-sm text-left active:bg-neutral-50">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-bold"><Trophy size={14} /> SÉANCES</div>
            <div className="text-3xl font-black mt-1" style={{ color: BLACK }}>{doneCount}</div>
          </button>
        </div>

        {/* choix de la séance */}
        <div>
          <div className="font-black text-lg mb-2 mt-2" style={{ color: BLACK }}>Ta séance du jour</div>
          {plan?.note && plan.type !== "A" && plan.type !== "B" && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 mb-3 font-semibold">
              {plan.label} — {plan.note}
            </div>
          )}
          <div className="space-y-3">
            {["A", "B"].map((t) => {
              const s = program[t];
              const suggested = plan?.type === t;
              return (
                <button key={t} onClick={() => onOpenSession(t)}
                  className="w-full rounded-3xl p-5 text-left text-white active:scale-[.98] transition-transform shadow-sm relative overflow-hidden"
                  style={{ background: t === "A" ? RED : BLACK }}>
                  {suggested && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-white/90 rounded-full px-2 py-0.5" style={{ color: t === "A" ? RED : BLACK }}>
                      AUJOURD'HUI
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    {t === "A" ? <Footprints size={22} /> : <Dumbbell size={22} />}
                    <span className="font-black text-xl">Séance {t}</span>
                  </div>
                  <div className="text-white/85 text-sm">{s.titre.split("—")[1]?.trim()}</div>
                  <div className="text-white/60 text-xs mt-1">{s.activites.length} exos · ~{s.duree} min</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* planning */}
        <PlanningStrip seances={seances} />
      </div>
    </div>
  );
}

function PlanningStrip({ seances }) {
  const doneDates = new Set((seances || []).filter((s) => s.statut === "terminee").map((s) => s.date));
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 font-black mb-3" style={{ color: BLACK }}>
        <Calendar size={16} /> Planning 6 → 27 juillet
      </div>
      <div className="space-y-1.5">
        {PLANNING.map((p) => {
          const done = doneDates.has(p.date);
          const tag = p.type === "A" ? "A" : p.type === "B" ? "B" : p.type === "light" ? "Allégée"
            : p.type === "fcr" ? "FCR" : "Repos";
          const col = p.type === "A" ? RED : p.type === "B" ? BLACK : "#9CA3AF";
          return (
            <div key={p.date} className="flex items-center gap-3 text-sm">
              <span className="w-16 text-neutral-500 shrink-0">{p.label}</span>
              <span className="text-white text-[11px] font-black rounded-full px-2 py-0.5 shrink-0" style={{ background: col }}>{tag}</span>
              <span className="text-neutral-400 text-xs truncate flex-1">{p.note}</span>
              {done && <Check size={16} className="text-green-600 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- streak & records -------- */
function computeStreak(seances) {
  const dates = [...new Set((seances || []).filter((s) => s.statut === "terminee").map((s) => s.date))].sort().reverse();
  if (dates.length === 0) return 0;
  return dates.length; // séries = nb de séances terminées (simple & motivant)
}

function updateRecords(records, act) {
  const r = { ...(records || {}) };
  const stamp = todayISO();
  if (act.type === "machine" && typeof act.realise?.charge === "number") {
    const prev = r[act.exo];
    if (!prev || act.realise.charge > prev.valeur) {
      r[act.exo] = { valeur: act.realise.charge, unite: "kg", date: stamp, nom: act.nom, isNew: true };
      return { records: r, newRecord: r[act.exo] };
    }
  }
  if (act.type === "run" && typeof act.realise?.vitesse === "number") {
    const key = act.exo;
    const prev = r[key];
    if (!prev || act.realise.vitesse > prev.valeur) {
      r[key] = { valeur: act.realise.vitesse, unite: "km/h", date: stamp, nom: act.nom, isNew: true };
      return { records: r, newRecord: r[key] };
    }
  }
  return { records: r, newRecord: null };
}

/* ============================================================
   ÉCRAN SÉANCE — liste des activités + progression
   ============================================================ */
function SessionScreen({ profile, seance, program, onUpdate, onFinish, onBack, hypeRef, lastEntryFor }) {
  const [editing, setEditing] = useState(null); // activité en cours de saisie
  const [hype, setHype] = useState("");

  const def = program[seance.type];
  const totalDone = seance.activites.length;
  const total = def.activites.length;
  const allDone = totalDone >= total;

  const openEntry = (actDef) => {
    const existing = seance.activites.find((a) => a.exo === actDef.id);
    const last = existing ? null : lastEntryFor(actDef.id); // perf de la dernière fois (autre séance)
    setEditing({ def: actDef, existing, last });
  };

  const validate = (actDef, realise, difficulte) => {
    const entry = {
      exo: actDef.id, nom: actDef.nom, type: actDef.type, cible: actDef.cible,
      realise, difficulte, ts: Date.now(),
    };
    onUpdate((s) => {
      const acts = s.activites.filter((a) => a.exo !== actDef.id).concat(entry);
      return { ...s, activites: acts };
    }, entry);
    setEditing(null);
    // message hype (bonus : encouragement adapté si c'était trop facile)
    const msg = difficulte === "facile"
      ? "Trop facile ?! 😏 On monte la charge la prochaine fois 🔥"
      : pickMsg("activite", hypeRef);
    setHype(msg);
  };

  return (
    <div className="min-h-full pb-28">
      <Header
        title={`Séance ${seance.type}`}
        subtitle={`${def.titre.split("—")[1]?.trim()} · ${totalDone}/${total} faits`}
        onBack={onBack}
        color={seance.type === "A" ? RED : BLACK}
      />

      {/* barre de progression */}
      <div className="h-1.5 bg-neutral-200">
        <div className="h-full transition-all" style={{ width: `${(totalDone / total) * 100}%`, background: "#16A34A" }} />
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-md mx-auto">
        {def.activites.map((a) => {
          const entry = seance.activites.find((x) => x.exo === a.id);
          const done = !!entry;
          return (
            <button key={a.id} onClick={() => openEntry(a)}
              className="w-full rounded-3xl p-4 text-left shadow-sm active:scale-[.99] transition-transform border-2"
              style={{ background: done ? "#F0FDF4" : "#fff", borderColor: done ? "#86EFAC" : "transparent" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white"
                     style={{ background: done ? "#16A34A" : (seance.type === "A" ? RED : BLACK) }}>
                  {done ? <Check size={20} /> : activityIcon(a.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black leading-tight" style={{ color: BLACK }}>{a.nom}</div>
                  <div className="text-sm text-neutral-500">🎯 {a.cible}</div>
                  {done && <div className="text-sm font-bold text-green-700 mt-1">✅ {realiseLabel(entry)}</div>}
                </div>
              </div>
            </button>
          );
        })}

        <button
          disabled={!allDone}
          onClick={onFinish}
          className="w-full mt-3 py-4 rounded-3xl font-black text-white text-lg disabled:opacity-40 active:opacity-80"
          style={{ background: "#16A34A" }}>
          {allDone ? "Terminer la séance 🏁" : `Encore ${total - totalDone} exo${total - totalDone > 1 ? "s" : ""}`}
        </button>
      </div>

      {editing && (
        <EntrySheet
          actDef={editing.def}
          existing={editing.existing}
          last={editing.last}
          color={seance.type === "A" ? RED : BLACK}
          onClose={() => setEditing(null)}
          onValidate={(r, diff) => validate(editing.def, r, diff)}
        />
      )}

      <HypeBanner text={hype} onClose={() => setHype("")} />
    </div>
  );
}

function realiseLabel(entry) {
  const r = entry.realise || {};
  if (entry.type === "run") {
    const bits = [];
    if (r.vitesse) bits.push(`${r.vitesse} km/h`);
    if (r.duree) bits.push(`${r.duree} min`);
    if (r.reps) bits.push(`×${r.reps}`);
    return bits.join(" · ");
  }
  if (entry.type === "machine") return `${r.charge} kg · ${r.series}×${r.reps}`;
  return `${r.series}×${r.reps}`; // abs
}

/* ---- suggestion de charge/vitesse selon le ressenti de la dernière fois ---- */
function suggestFromLast(actDef, last) {
  // last = { realise, difficulte } de la séance précédente (même exo), ou null
  const base = { ...(last?.realise || {}) };
  if (!last) return { start: {}, hint: null };
  const facile = last.difficulte === "facile";
  const dur = last.difficulte === "dur";
  let hint = null;
  const start = { ...base };
  if (actDef.type === "machine") {
    if (facile) { start.charge = (base.charge ?? actDef.charge ?? 15) + 2.5; hint = `La dernière fois c'était trop facile → +2,5 kg, on passe à ${start.charge} kg 💪`; }
    else if (dur) { start.charge = Math.max(2.5, (base.charge ?? actDef.charge ?? 15) - 2.5); hint = `La dernière fois c'était dur → on garde ${start.charge} kg, tu vas la dompter 😤`; }
    else if (base.charge != null) { hint = `Dernière fois : ${base.charge} kg. On confirme et on progresse 📈`; }
  } else if (actDef.type === "run" && actDef.isFrac) {
    if (facile) { start.vitesse = (base.vitesse ?? actDef.vitesse ?? 11) + 0.5; hint = `Trop facile la dernière fois → +0,5 km/h, à ${start.vitesse} km/h 🚀`; }
    else if (base.vitesse != null) { hint = `Dernière fois : ${base.vitesse} km/h au frac.`; }
  } else if (actDef.type === "abs") {
    if (facile) { start.reps = (base.reps ?? actDef.reps ?? 10) + 2; hint = `Trop facile → +2 reps, objectif ${start.reps} 💥`; }
  } else if (actDef.type === "run" && base.vitesse != null) {
    hint = `Dernière fois : ${base.vitesse} km/h.`;
  }
  return { start, hint };
}

/* ---- feuille de saisie : étape 1 saisie, étape 2 ressenti ---- */
function EntrySheet({ actDef, existing, last, color, onClose, onValidate }) {
  const { start, hint } = useMemo(() => suggestFromLast(actDef, last), [actDef, last]);
  const r0 = existing?.realise || {};
  const [step, setStep] = useState(1); // 1 = perf, 2 = ressenti
  const [charge, setCharge] = useState(r0.charge ?? start.charge ?? actDef.charge ?? 15);
  const [series, setSeries] = useState(r0.series ?? start.series ?? actDef.series ?? 3);
  const [reps, setReps] = useState(r0.reps ?? start.reps ?? actDef.reps ?? 10);
  const [vitesse, setVitesse] = useState(r0.vitesse ?? start.vitesse ?? actDef.vitesse ?? 8);
  const [duree, setDuree] = useState(r0.duree ?? start.duree ?? actDef.duree ?? 5);
  const [fracReps, setFracReps] = useState(r0.reps ?? start.reps ?? actDef.reps ?? 4);

  const buildRealise = () => {
    if (actDef.type === "machine") return { charge, series, reps };
    if (actDef.type === "abs") return { series, reps };
    return actDef.isFrac ? { vitesse, reps: fracReps } : { vitesse, duree };
  };

  const finish = (difficulte) => onValidate(buildRealise(), difficulte);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}
           style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: color }}>
            {activityIcon(actDef.type)}
          </div>
          <div className="font-black text-lg" style={{ color: BLACK }}>{actDef.nom}</div>
        </div>

        {step === 1 && (<>
          <div className="text-sm text-neutral-500 mb-2">🎯 Cible : {actDef.cible}</div>
          {hint && (
            <div className="rounded-2xl px-3 py-2 mb-3 text-sm font-bold" style={{ background: "#FFF0F0", color: RED }}>
              {hint}
            </div>
          )}
          <div className="rounded-2xl bg-neutral-50 px-4 py-1 divide-y divide-neutral-100">
            {actDef.type === "machine" && (<>
              <Stepper label="Charge" value={charge} set={setCharge} step={2.5} suffix="kg" />
              <Stepper label="Séries" value={series} set={setSeries} step={1} min={1} />
              <Stepper label="Reps / série" value={reps} set={setReps} step={1} min={1} />
            </>)}
            {actDef.type === "abs" && (<>
              <Stepper label="Séries" value={series} set={setSeries} step={1} min={1} />
              <Stepper label="Reps / série" value={reps} set={setReps} step={1} min={1} />
            </>)}
            {actDef.type === "run" && actDef.isFrac && (<>
              <Stepper label="Vitesse (frac)" value={vitesse} set={setVitesse} step={0.5} suffix="km/h" />
              <Stepper label="Répétitions" value={fracReps} set={setFracReps} step={1} min={1} />
            </>)}
            {actDef.type === "run" && !actDef.isFrac && (<>
              <Stepper label="Vitesse" value={vitesse} set={setVitesse} step={0.5} suffix="km/h" />
              <Stepper label="Durée" value={duree} set={setDuree} step={1} min={1} suffix="min" />
            </>)}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold bg-neutral-100 text-neutral-600 active:bg-neutral-200">Annuler</button>
            <button onClick={() => setStep(2)} className="flex-[2] py-3.5 rounded-2xl font-black text-white active:opacity-80" style={{ background: "#16A34A" }}>
              Valider ✅
            </button>
          </div>
        </>)}

        {step === 2 && (<>
          <div className="text-center mt-2 mb-4">
            <div className="font-black text-lg" style={{ color: BLACK }}>C'était comment ? 🤔</div>
            <div className="text-sm text-neutral-500">On ajuste la charge pour la prochaine fois</div>
          </div>
          <div className="space-y-3">
            <button onClick={() => finish("facile")}
              className="w-full rounded-2xl p-4 flex items-center gap-3 border-2 border-green-200 bg-green-50 active:scale-[.98] transition-transform">
              <span className="text-2xl">😅</span>
              <div className="text-left"><div className="font-black text-green-700">Trop facile</div><div className="text-xs text-green-600">On monte la charge la prochaine fois</div></div>
            </button>
            <button onClick={() => finish("parfait")}
              className="w-full rounded-2xl p-4 flex items-center gap-3 border-2 border-neutral-200 bg-white active:scale-[.98] transition-transform">
              <span className="text-2xl">💪</span>
              <div className="text-left"><div className="font-black" style={{ color: BLACK }}>Parfait</div><div className="text-xs text-neutral-500">Bien dosé, on garde le rythme</div></div>
            </button>
            <button onClick={() => finish("dur")}
              className="w-full rounded-2xl p-4 flex items-center gap-3 border-2 border-red-200 bg-red-50 active:scale-[.98] transition-transform">
              <span className="text-2xl">🥵</span>
              <div className="text-left"><div className="font-black text-red-700">Trop dur</div><div className="text-xs text-red-600">On reste sur cette charge, tu vas l'avoir</div></div>
            </button>
          </div>
          <button onClick={() => setStep(1)} className="w-full mt-4 py-2 text-sm font-bold text-neutral-400">← Modifier la saisie</button>
        </>)}
      </div>
    </div>
  );
}

/* ---- écran séance terminée ---- */
function SessionDone({ seance, program, onHome, hypeRef }) {
  const def = program[seance.type];
  const msg = useMemo(() => pickMsg("seance", hypeRef), []);
  const dureeMin = seance.debut && seance.fin ? Math.max(1, Math.round((seance.fin - seance.debut) / 60000)) : def.duree;
  return (
    <div className="min-h-full flex flex-col" style={{ background: seance.type === "A" ? RED : BLACK }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white text-center"
           style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mb-6">
          <Trophy size={54} />
        </div>
        <div className="text-3xl font-black mb-2">Séance {seance.type} validée !</div>
        <p className="text-white/90 text-lg font-bold max-w-sm">{msg}</p>
        <div className="flex gap-6 mt-8">
          <div><div className="text-3xl font-black">{seance.activites.length}</div><div className="text-white/70 text-xs">exos</div></div>
          <div><div className="text-3xl font-black">{dureeMin}</div><div className="text-white/70 text-xs">min</div></div>
          <div><div className="text-3xl font-black">🔴⚪</div><div className="text-white/70 text-xs">FCR</div></div>
        </div>
      </div>
      <div className="p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <button onClick={onHome} className="w-full py-4 rounded-2xl bg-white font-black text-lg active:opacity-90"
                style={{ color: seance.type === "A" ? RED : BLACK }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   RECORDS (Alix / Guest)
   ============================================================ */
function RecordsScreen({ store, program, onBack }) {
  const records = store.records || {};
  const entries = Object.entries(records).sort((a, b) => (b[1].valeur - a[1].valeur));
  const streak = computeStreak(store.seances);
  return (
    <div className="min-h-full pb-8">
      <Header title="Mes records 🏆" subtitle={`Série de ${streak} séance${streak > 1 ? "s" : ""}`} onBack={onBack} color={RED} />
      <div className="px-4 pt-4 space-y-3 max-w-md mx-auto">
        {entries.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center text-neutral-400 shadow-sm">
            Fais ta première séance pour débloquer des records 💪
          </div>
        )}
        {entries.map(([exo, r]) => (
          <div key={exo} className="rounded-3xl bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: RED }}>
              <Award size={24} />
            </div>
            <div className="flex-1">
              <div className="font-black" style={{ color: BLACK }}>{r.nom}</div>
              <div className="text-xs text-neutral-400">Record du {fmtDate(r.date)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: RED }}>{r.valeur}</div>
              <div className="text-xs text-neutral-400">{r.unite}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD PAPA (lecture seule)
   ============================================================ */
function LineChart({ points, color = RED, unit = "" }) {
  // points : [{ x: iso, y: number }]
  if (!points || points.length === 0) return null;
  const W = 300, H = 90, pad = 8;
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = maxY - minY || 1;
  const stepX = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0;
  const coord = (p, i) => {
    const x = pad + i * stepX;
    const y = H - pad - ((p.y - minY) / span) * (H - pad * 2);
    return [x, y];
  };
  const path = points.map((p, i) => { const [x, y] = coord(p, i); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => { const [x, y] = coord(p, i); return <circle key={i} cx={x} cy={y} r="3" fill={color} />; })}
      {points.length > 0 && (() => {
        const [x, y] = coord(points[points.length - 1], points.length - 1);
        return <text x={Math.min(x, W - 26)} y={Math.max(y - 6, 10)} fontSize="11" fontWeight="800" fill={color}>{points[points.length - 1].y}{unit}</text>;
      })()}
    </svg>
  );
}

function PapaDashboard({ program, onBack }) {
  const [alix, , status] = useStore("alix");
  const [tab, setTab] = useState("seances"); // seances | progression | assiduite

  const seances = (alix.seances || []).filter((s) => s.statut === "terminee")
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // séries d'exercices pour les courbes
  const exoSeries = useMemo(() => {
    const map = {};
    const chrono = [...(alix.seances || [])].filter((s) => s.statut === "terminee").sort((a, b) => a.date.localeCompare(b.date));
    chrono.forEach((s) => {
      s.activites.forEach((a) => {
        const val = a.type === "machine" ? a.realise?.charge : a.type === "run" ? a.realise?.vitesse : null;
        if (val == null) return;
        if (!map[a.exo]) map[a.exo] = { nom: a.nom, type: a.type, points: [] };
        map[a.exo].points.push({ x: s.date, y: val });
      });
    });
    return map;
  }, [alix]);

  // assiduité : séances faites vs prévues (planning jusqu'à aujourd'hui)
  const today = todayISO();
  const prevues = PLANNING.filter((p) => (p.type === "A" || p.type === "B" || p.type === "light") && p.date <= today);
  const faitesDates = new Set(seances.map((s) => s.date));
  const faitesPrevues = prevues.filter((p) => faitesDates.has(p.date)).length;
  const assiduite = prevues.length ? Math.round((faitesPrevues / prevues.length) * 100) : 0;

  return (
    <div className="min-h-full pb-8" style={{ background: "#F4F4F5" }}>
      <Header title="Dashboard — Alix" subtitle={status === "cloud" ? "Données synchronisées ☁️" : "Données locales"} onBack={onBack} color={BLACK} />

      {/* onglets */}
      <div className="px-4 pt-3 sticky top-0 z-10" style={{ background: "#F4F4F5" }}>
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm max-w-md mx-auto">
          {[["seances", "Séances"], ["progression", "Progression"], ["assiduite", "Assiduité"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-xl text-sm font-black ${tab === k ? "text-white" : "text-neutral-500"}`}
              style={{ background: tab === k ? BLACK : "transparent" }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-md mx-auto">
        {tab === "seances" && (<>
          {seances.length === 0 && <div className="rounded-3xl bg-white p-8 text-center text-neutral-400 shadow-sm">Aucune séance enregistrée pour l'instant.</div>}
          {seances.map((s) => (
            <div key={s.id} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-xs font-black rounded-full px-2 py-0.5" style={{ background: s.type === "A" ? RED : BLACK }}>Séance {s.type}</span>
                <span className="font-bold text-sm" style={{ color: BLACK }}>{fmtDateLong(s.date)}</span>
                {s.debut && s.fin && <span className="text-xs text-neutral-400 ml-auto">{Math.max(1, Math.round((s.fin - s.debut) / 60000))} min</span>}
              </div>
              <div className="space-y-1">
                {s.activites.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-green-600 shrink-0" />
                    <span className="text-neutral-700 flex-1 truncate">{a.nom}</span>
                    {a.difficulte && <span className="shrink-0" title={a.difficulte}>{a.difficulte === "facile" ? "😅" : a.difficulte === "dur" ? "🥵" : "💪"}</span>}
                    <span className="font-bold text-neutral-900 shrink-0">{realiseLabel(a)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>)}

        {tab === "progression" && (<>
          {Object.keys(exoSeries).length === 0 && <div className="rounded-3xl bg-white p-8 text-center text-neutral-400 shadow-sm">Pas encore assez de données pour tracer des courbes.</div>}
          {Object.entries(exoSeries).map(([exo, d]) => (
            <div key={exo} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-black text-sm" style={{ color: BLACK }}>{d.nom}</div>
                <div className="text-xs text-neutral-400">{d.type === "machine" ? "charge (kg)" : "vitesse (km/h)"}</div>
              </div>
              <LineChart points={d.points} color={d.type === "machine" ? RED : "#2563EB"} unit={d.type === "machine" ? "" : ""} />
              <div className="text-xs text-neutral-400 mt-1">
                {d.points.length} pts · départ {d.points[0].y} → actuel {d.points[d.points.length - 1].y}
                {d.points.length > 1 && d.points[d.points.length - 1].y > d.points[0].y && (
                  <span className="text-green-600 font-bold"> (+{(d.points[d.points.length - 1].y - d.points[0].y).toFixed(1)})</span>
                )}
              </div>
            </div>
          ))}
        </>)}

        {tab === "assiduite" && (<>
          <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
            <div className="text-sm font-bold text-neutral-500 mb-2">Assiduité (séances faites / prévues)</div>
            <div className="text-6xl font-black" style={{ color: assiduite >= 80 ? "#16A34A" : assiduite >= 50 ? "#D97706" : RED }}>{assiduite}%</div>
            <div className="text-sm text-neutral-500 mt-2">{faitesPrevues} / {prevues.length} séances prévues à ce jour</div>
            <div className="h-3 bg-neutral-100 rounded-full mt-4 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${assiduite}%`, background: assiduite >= 80 ? "#16A34A" : assiduite >= 50 ? "#D97706" : RED }} />
            </div>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="font-black text-sm mb-2" style={{ color: BLACK }}>Détail du planning</div>
            {prevues.map((p) => (
              <div key={p.date} className="flex items-center gap-2 text-sm py-1">
                <span className="w-16 text-neutral-500">{p.label}</span>
                <span className="text-white text-[11px] font-black rounded-full px-2 py-0.5" style={{ background: p.type === "A" ? RED : p.type === "B" ? BLACK : "#9CA3AF" }}>{p.type === "light" ? "Allégée" : p.type}</span>
                <span className="ml-auto">{faitesDates.has(p.date) ? <Check size={16} className="text-green-600" /> : <span className="text-red-400 text-xs font-bold">manquée</span>}</span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

/* ============================================================
   CONTRÔLEUR ATHLÈTE (Alix / Guest)
   ============================================================ */
function AthleteApp({ profile, onExit }) {
  const [store, setStore, status] = useStore(profile);
  const [screen, setScreen] = useState("home"); // home | session | done | records
  const [activeId, setActiveId] = useState(null);
  const hypeRef = useRef(-1);

  const program = store.program || DEFAULT_PROGRAM;
  const seance = (store.seances || []).find((s) => s.id === activeId);

  const openSession = (type) => {
    // reprendre une séance du jour non terminée du même type, sinon en créer une
    const today = todayISO();
    let existing = (store.seances || []).find((s) => s.date === today && s.type === type && s.statut !== "terminee");
    if (existing) { setActiveId(existing.id); setScreen("session"); return; }
    const s = { id: uid(), profil: profile, date: today, type, debut: Date.now(), fin: null, statut: "en_cours", activites: [] };
    setStore((prev) => ({ ...prev, seances: [...(prev.seances || []), s] }));
    setActiveId(s.id);
    setScreen("session");
  };

  const updateSeance = (updater, entry) => {
    setStore((prev) => {
      let newRec = null;
      const seances = (prev.seances || []).map((s) => {
        if (s.id !== activeId) return s;
        return updater(s);
      });
      let records = prev.records;
      if (entry) {
        const res = updateRecords(prev.records, entry);
        records = res.records;
      }
      return { ...prev, seances, records };
    });
  };

  const finishSession = () => {
    setStore((prev) => ({
      ...prev,
      seances: (prev.seances || []).map((s) => s.id === activeId ? { ...s, statut: "terminee", fin: Date.now() } : s),
    }));
    setScreen("done");
  };

  // dernière perf saisie pour un exo (séance antérieure), pour ajuster la charge
  const lastEntryFor = (exoId) => {
    const past = (store.seances || [])
      .filter((s) => s.id !== activeId)
      .flatMap((s) => (s.activites || []).map((a) => ({ ...a, _date: s.date, _ts: a.ts || 0 })))
      .filter((a) => a.exo === exoId)
      .sort((a, b) => (b._ts - a._ts));
    return past[0] || null;
  };

  if (status === "loading") {
    return <div className="min-h-full flex items-center justify-center text-neutral-400 font-bold">Chargement…</div>;
  }

  if (screen === "session" && seance) {
    return <SessionScreen profile={profile} seance={seance} program={program} hypeRef={hypeRef}
             onUpdate={updateSeance} onFinish={finishSession} onBack={() => setScreen("home")} lastEntryFor={lastEntryFor} />;
  }
  if (screen === "done" && seance) {
    return <SessionDone seance={seance} program={program} hypeRef={hypeRef} onHome={() => { setScreen("home"); setActiveId(null); }} />;
  }
  if (screen === "records") {
    return <RecordsScreen store={store} program={program} onBack={() => setScreen("home")} />;
  }
  return (
    <div>
      <AthleteHome profile={profile} store={store} setStore={setStore} program={program}
        onOpenSession={openSession} onRecords={() => setScreen("records")} onExit={onExit} />
      {status === "local" && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-[11px] bg-neutral-800 text-white/80 rounded-full px-3 py-1 shadow">
          Mode local (base non connectée)
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APP RACINE — routeur de profils
   ============================================================ */
const CODES = { alix: "FCR", papa: "papa" }; // garde-fous simples (comme l'appli bac)

function App() {
  const [profile, setProfile] = useState(null); // null | alix | papa | guest
  const [unlocked, setUnlocked] = useState({}); // { alix:true, papa:true }

  const reset = () => setProfile(null);

  if (!profile) return <ProfileHome onPick={setProfile} />;

  if (profile === "guest") return <AthleteApp profile="guest" onExit={reset} />;

  if (profile === "alix") {
    if (!unlocked.alix)
      return <CodeGate profile="alix" expected={CODES.alix} onBack={reset} onOK={() => setUnlocked((u) => ({ ...u, alix: true }))} />;
    return <AthleteApp profile="alix" onExit={reset} />;
  }

  if (profile === "papa") {
    if (!unlocked.papa)
      return <CodeGate profile="papa" expected={CODES.papa} onBack={reset} onOK={() => setUnlocked((u) => ({ ...u, papa: true }))} />;
    return <PapaDashboard program={DEFAULT_PROGRAM} onBack={reset} />;
  }
  return null;
}

const boot = document.getElementById("boot");
if (boot) boot.remove();
createRoot(document.getElementById("root")).render(<App />);
