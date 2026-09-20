import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { openDB } from "idb";
import {
  Home, Brain, Grid3x3, User, Users, Settings as SettingsIcon, Volume2, Mic,
  Bell, Calendar, CheckCircle2, TrendingUp, Award, ChevronRight, ArrowLeft,
  Globe, Contrast, LogOut, ShieldCheck, Clock, Star, AlertTriangle, Info,
  WifiOff, Wifi, Type as TypeIcon, Eye, PlayCircle, RotateCcw, Flame,
  ClipboardList, Pill, Sparkles, BarChart3, UserCog, Gamepad2, Puzzle,
  Plus, Trophy, Target, Lock, ChevronDown, Trash2, Pencil,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

/* =========================================================================
   MINDMATE AI — Cognitive Gaming & Memory Assistance Platform (SIH26003)
   Single-file interactive prototype. All game logic, scoring, and the
   adaptive-difficulty engine run for real against in-memory state — nothing
   here is a static mock of a result.
   ========================================================================= */

/* ---------------------------- i18n ---------------------------- */
const STRINGS = {
  en: {
    appName: "MindMate", tagline: "Train the Mind. Support the Memory.",
    goodMorning: "Good morning", startTraining: "Start Today's Training",
    memoryAssistant: "Memory Assistant", myProgress: "My Progress", help: "Help",
    todaysActivities: "Today's Activities", todaysProgress: "Today's Progress",
    trainingScore: "Cognitive Training Score", streak: "Day Streak",
    readPage: "Read this page", memoryGame: "Memory Match", objectRecall: "Object Recall",
    patternGame: "Pattern Recognition", attentionGame: "Attention Game",
    greatJob: "Great job!", playAgain: "Play Again", nextActivity: "Next Activity",
    backHome: "Back Home", score: "Score", accuracy: "Accuracy", responseTime: "Response Time",
    difficulty: "Difficulty", level: "Level", start: "Start", next: "Next", submit: "Submit",
    logout: "Log out", settings: "Settings", language: "Language", fontSize: "Font Size",
    highContrast: "High Contrast", reduceMotion: "Reduce Animation",
    caregiverDashboard: "Caregiver Dashboard", adminDashboard: "Admin Dashboard",
    reminders: "Reminders", dailyRoutine: "Daily Routine", disclaimer:
      "MindMate provides cognitive training and memory assistance. It is not a medical diagnostic tool and does not replace professional medical advice.",
    whichSaw: "Which objects did you see?", memorize: "Take your time and memorize these:",
    whatComesNext: "What comes next?", howMany: "How many did you see?",
    whichMissing: "Which object was missing?", loading: "Loading your activities...",
    noInternet: "No internet connection. Your activity will be saved and synced later.",
    offline: "Offline Mode", synced: "Synced", elderlyHome: "Home",
  },
  hi: {
    appName: "माइंडमेट", tagline: "मन को प्रशिक्षित करें। याददाश्त का साथ दें।",
    goodMorning: "सुप्रभात", startTraining: "आज का प्रशिक्षण शुरू करें",
    memoryAssistant: "याददाश्त सहायक", myProgress: "मेरी प्रगति", help: "सहायता",
    todaysActivities: "आज की गतिविधियाँ", todaysProgress: "आज की प्रगति",
    trainingScore: "संज्ञानात्मक प्रशिक्षण स्कोर", streak: "दिन की लगातार अभ्यास",
    readPage: "यह पृष्ठ पढ़ें", memoryGame: "याददाश्त खेल", objectRecall: "वस्तु स्मरण",
    patternGame: "पैटर्न पहचान", attentionGame: "ध्यान खेल",
    greatJob: "बहुत अच्छा!", playAgain: "फिर से खेलें", nextActivity: "अगली गतिविधि",
    backHome: "मुख्य पृष्ठ पर जाएँ", score: "स्कोर", accuracy: "सटीकता", responseTime: "प्रतिक्रिया समय",
    difficulty: "कठिनाई", level: "स्तर", start: "शुरू करें", next: "अगला", submit: "जमा करें",
    logout: "लॉग आउट", settings: "सेटिंग्स", language: "भाषा", fontSize: "फ़ॉन्ट आकार",
    highContrast: "उच्च कंट्रास्ट", reduceMotion: "कम एनिमेशन",
    caregiverDashboard: "देखभालकर्ता डैशबोर्ड", adminDashboard: "व्यवस्थापक डैशबोर्ड",
    reminders: "अनुस्मारक", dailyRoutine: "दैनिक दिनचर्या", disclaimer:
      "माइंडमेट संज्ञानात्मक प्रशिक्षण और याददाश्त सहायता प्रदान करता है। यह एक चिकित्सा निदान उपकरण नहीं है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
    whichSaw: "आपने कौन-सी वस्तुएँ देखीं?", memorize: "समय लें और इन्हें याद करें:",
    whatComesNext: "आगे क्या आएगा?", howMany: "आपने कितने देखे?",
    whichMissing: "कौन-सी वस्तु गायब थी?", loading: "आपकी गतिविधियाँ लोड हो रही हैं...",
    noInternet: "इंटरनेट कनेक्शन नहीं है। आपकी गतिविधि बाद में सहेजी और समन्वयित होगी।",
    offline: "ऑफ़लाइन मोड", synced: "समन्वयित", elderlyHome: "मुख्य पृष्ठ",
  },
};

/* ---------------------------- Theme tokens ---------------------------- */
const palette = {
  pine: "#0D9488", pineDark: "#0B7268", marigold: "#F59E0B", marigoldDark: "#B45309",
  clay: "#EF4444", paper: "#EEF2FB", paperDeep: "#E6F6F3", ink: "#1E2A45", inkSoft: "#64748B",
  mist: "#E3E9F6", danger: "#DC2626", ok: "#16A34A",
  green: "#22C55E", greenBg: "#E7F8ED", purple: "#A855F7", purpleBg: "#F3E8FF",
  blue: "#3B82F6", blueBg: "#E7EFFE", amberBg: "#FFF4E0",
};

/* ---------------------------- Game content ---------------------------- */
const OBJECT_BANK = [
  { id: "cup", label: { en: "Tea Cup", hi: "चाय का कप" }, icon: "☕" },
  { id: "bowl", label: { en: "Rice Bowl", hi: "चावल का कटोरा" }, icon: "🍚" },
  { id: "umbrella", label: { en: "Umbrella", hi: "छाता" }, icon: "☂️" },
  { id: "basket", label: { en: "Basket", hi: "टोकरी" }, icon: "🧺" },
  { id: "apple", label: { en: "Apple", hi: "सेब" }, icon: "🍎" },
  { id: "key", label: { en: "Key", hi: "चाबी" }, icon: "🔑" },
  { id: "book", label: { en: "Book", hi: "किताब" }, icon: "📕" },
  { id: "clock", label: { en: "Clock", hi: "घड़ी" }, icon: "🕰️" },
  { id: "shirt", label: { en: "Shawl", hi: "शॉल" }, icon: "🧣" },
  { id: "spade", label: { en: "Farming Tool", hi: "खेती का औज़ार" }, icon: "🛠️" },
  { id: "flower", label: { en: "Flower", hi: "फूल" }, icon: "🌸" },
  { id: "lamp", label: { en: "Oil Lamp", hi: "दीया" }, icon: "🪔" },
];

const LEVELS_OBJECT_COUNT = { 1: 4, 2: 6, 3: 8, 4: 10 };
const LEVELS_ATTENTION_COUNT = { 1: 4, 2: 8, 3: 12, 4: 20 };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n) { return shuffle(arr).slice(0, n); }

/* ---------------------------- Adaptive engine ---------------------------- */
// Transparent, bounded (±1 level) adaptive difficulty engine.
function computeNextDifficulty({ currentLevel, sessionAccuracy, recentAccuracies, lang }) {
  const recent = [...recentAccuracies, sessionAccuracy].slice(-3);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  let nextLevel = currentLevel;
  let reasonKey = "maintain";

  if (sessionAccuracy >= 80 && avgRecent >= 75) {
    nextLevel = Math.min(4, currentLevel + 1);
    reasonKey = nextLevel > currentLevel ? "increase" : "maintainHigh";
  } else if (sessionAccuracy < 50) {
    nextLevel = Math.max(1, currentLevel - 1);
    reasonKey = nextLevel < currentLevel ? "decrease" : "maintainLow";
  } else {
    nextLevel = currentLevel;
    reasonKey = "maintain";
  }

  const reasons = {
    en: {
      increase: "Difficulty increased — strong, consistent performance across recent sessions.",
      decrease: "Difficulty was eased to make the activity more comfortable.",
      maintain: "Level kept the same — steady, comfortable performance.",
      maintainHigh: "Already at the top level — great consistent performance.",
      maintainLow: "Already at the easiest level — take your time, no rush.",
    },
    hi: {
      increase: "कठिनाई बढ़ाई गई — हाल के सत्रों में मजबूत, लगातार प्रदर्शन।",
      decrease: "गतिविधि को अधिक सहज बनाने के लिए कठिनाई कम की गई।",
      maintain: "स्तर वही रखा गया — स्थिर, सहज प्रदर्शन।",
      maintainHigh: "पहले से ही उच्चतम स्तर पर — शानदार लगातार प्रदर्शन।",
      maintainLow: "पहले से ही सबसे आसान स्तर पर — समय लें, जल्दी न करें।",
    },
  };

  return {
    nextLevel,
    reason: reasons[lang][reasonKey],
    changed: nextLevel !== currentLevel,
  };
}

function computeScore(accuracy, avgResponseSec) {
  const penalty = Math.max(0, (avgResponseSec - 10) * 0.6);
  return Math.max(0, Math.min(100, Math.round(accuracy - penalty)));
}

/* ---------------------------- Demo data ---------------------------- */
const DEMO_ELDERLY_NAMES = [
  "Ramesh Baruah", "Anjali Devi", "Tenzin Lhamo", "Bipul Das", "Mongshi Rani",
  "Sundari Gogoi", "Hemanta Sharma", "Lalrinawmi", "Wangchuk Bhutia", "Kironmoyee Barman",
];

function makeTrendSeries(base, days = 7) {
  let v = base;
  return Array.from({ length: days }, (_, i) => {
    v = Math.max(35, Math.min(96, v + (Math.random() * 10 - 3)));
    return { day: `Day ${i + 1}`, score: Math.round(v) };
  });
}

function buildDemoUsers() {
  return DEMO_ELDERLY_NAMES.map((name, i) => {
    const memory = makeTrendSeries(60 + i);
    const objectRecall = makeTrendSeries(58 + i);
    const attention = makeTrendSeries(55 + i);
    const pattern = makeTrendSeries(65 + i);
    const last = memory[memory.length - 1].score;
    return {
      id: `u${i + 1}`,
      name,
      age: 62 + (i % 14),
      language: i % 3 === 0 ? "hi" : "en",
      level: 1 + (i % 4),
      status: i === 3 ? "Inactive" : "Active",
      lastActivity: i === 3 ? "3 days ago" : "Today",
      accuracy: 60 + ((i * 7) % 35),
      trainingScore: last,
      memory, objectRecall, attention, pattern,
      difficulties: { memory: 1 + (i % 4), objectRecall: 1 + ((i + 1) % 4), pattern: 1 + ((i + 2) % 4), attention: 1 + ((i + 3) % 4) },
    };
  });
}

const DEMO_CAREGIVERS = [
  { id: "c1", name: "Dr. Nilakshi Phukan", relation: "Primary Caregiver" },
  { id: "c2", name: "Sonam Wangdi", relation: "Family Caregiver" },
  { id: "c3", name: "Priya Rai", relation: "Community Health Worker" },
];

/* ---------------------------- Small UI atoms ---------------------------- */
function BigButton({ icon: Icon, label, onClick, tone = "primary", sub, disabled }) {
  const tones = {
    primary: { bg: palette.pine, fg: "#fff" },
    gold: { bg: palette.marigold, fg: palette.ink },
    outline: { bg: "#fff", fg: palette.pine, border: `2px solid ${palette.pine}` },
    success: { bg: palette.green, fg: "#fff" },
    ghost: { bg: "#fff", fg: palette.inkSoft, border: `1px solid ${palette.mist}` },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: t.bg, color: t.fg, border: t.border || "none",
        borderRadius: 14, padding: "17px 18px", width: "100%",
        display: "flex", alignItems: "center", gap: 14, fontSize: 18,
        fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 8px 22px rgba(37,99,235,0.10)", opacity: disabled ? 0.5 : 1,
        transition: "transform 0.08s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={30} strokeWidth={2.2} />}
      <span style={{ textAlign: "left", lineHeight: 1.25 }}>
        {label}
        {sub && <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.85 }}>{sub}</div>}
      </span>
      <ChevronRight size={26} style={{ marginLeft: "auto" }} />
    </button>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div className={`mm-card-hover ${className}`} style={{
      background: "#fff", borderRadius: 16, padding: 20,
      boxShadow: "0 8px 26px rgba(15,23,42,0.06)", border: `1px solid #E4ECF7`,
      transition: "transform .2s ease, box-shadow .2s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          background: palette.mist, border: "none", borderRadius: 14, padding: 10, cursor: "pointer",
        }}>
          <ArrowLeft size={22} color={palette.pine} />
        </button>
      )}
      <div style={{ fontSize: 24, fontWeight: 800, color: palette.ink, flex: 1 }}>{title}</div>
      {right}
    </div>
  );
}

function SpeakButton({ text, label }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  return (
    <button onClick={speak} style={{
      display: "flex", alignItems: "center", gap: 8, background: "#fff",
      border: `2px solid ${palette.pine}`, color: palette.pine, borderRadius: 14,
      padding: "10px 16px", fontWeight: 700, fontSize: 15, cursor: "pointer",
    }}>
      <Volume2 size={18} className={speaking ? "pulse" : ""} />
      {label}
    </button>
  );
}

function VoiceMicButton({ onResult, listenPrompt }) {
  const [state, setState] = useState("idle"); // idle | listening | error
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setState("error"); setTimeout(() => setState("idle"), 1800); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onstart = () => setState("listening");
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); setState("idle"); };
    rec.onerror = () => { setState("error"); setTimeout(() => setState("idle"), 1800); };
    rec.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    try { rec.start(); } catch { setState("error"); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button onClick={start} aria-label="Speak your answer" style={{
        width: 64, height: 64, borderRadius: 999, border: "none", cursor: "pointer",
        background: state === "listening" ? palette.clay : palette.pine, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}>
        <Mic size={28} />
      </button>
      <div style={{ fontSize: 13, color: palette.inkSoft, fontWeight: 600, textAlign: "center" }}>
        {state === "listening" ? listenPrompt : state === "error" ? "We couldn't hear you. Try again." : "Tap to speak"}
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = palette.pine }) {
  return (
    <div style={{ background: palette.mist, borderRadius: 999, height: 14, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 999, transition: "width .4s ease" }} />
    </div>
  );
}

function Ring({ pct, color, label, size = 84, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke={palette.mist} strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: size * 0.22, color: palette.ink,
        }}>{Math.round(pct)}%</div>
      </div>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: palette.inkSoft }}>{label}</div>}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, background: "#fff", padding: 5, borderRadius: 14, border: `1px solid ${palette.mist}`, marginBottom: 16 }}>
      {tabs.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} style={{
          flex: 1, border: "none", borderRadius: 10, padding: "9px 6px", cursor: "pointer",
          fontWeight: 700, fontSize: 13, background: active === key ? palette.pine : "transparent",
          color: active === key ? "#fff" : palette.inkSoft, transition: "background .15s ease",
        }}>{label}</button>
      ))}
    </div>
  );
}

function DisclaimerBanner({ compact }) {
  return (
    <div style={{
      background: "#FFF7E8", border: `1px solid ${palette.marigold}`, borderRadius: 14,
      padding: compact ? "8px 12px" : "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
      fontSize: compact ? 12 : 13, color: palette.inkSoft,
    }}>
      <Info size={compact ? 14 : 16} color={palette.marigoldDark} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>MindMate provides cognitive training and memory assistance only. It does not diagnose or treat dementia and is not a substitute for professional medical advice.</span>
    </div>
  );
}

/* ---------------------------- Games ---------------------------- */

function useTimer(active) {
  const startRef = useRef(null);
  useEffect(() => { if (active) startRef.current = Date.now(); }, [active]);
  return () => (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);
}

/* ---- Game 1: Memory Match ---- */
function MemoryMatchGame({ level, lang, onComplete }) {
  const t = STRINGS[lang];
  const count = LEVELS_OBJECT_COUNT[level];
  const [phase, setPhase] = useState("show"); // show -> recall -> done
  const [items] = useState(() => pickN(OBJECT_BANK, count));
  const [options] = useState(() => shuffle([...items, ...pickN(OBJECT_BANK.filter(o => !items.includes(o)), Math.min(4, OBJECT_BANK.length - count))]));
  const [selected, setSelected] = useState([]);
  const elapsed = useTimer(phase === "recall");
  const seconds = Math.max(4, Math.min(10, count));

  useEffect(() => {
    if (phase !== "show") return;
    const t = setTimeout(() => setPhase("recall"), seconds * 1000);
    return () => clearTimeout(t);
  }, [phase, seconds]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const submit = () => {
    const correctIds = new Set(items.map(i => i.id));
    const correctSelected = selected.filter(id => correctIds.has(id)).length;
    const wrongSelected = selected.filter(id => !correctIds.has(id)).length;
    const accuracy = Math.round((Math.max(0, correctSelected - wrongSelected) / items.length) * 100);
    onComplete({ accuracy: Math.max(0, Math.min(100, accuracy)), responseTime: elapsed(), totalQuestions: items.length, correct: correctSelected });
  };

  if (phase === "show") {
    return (
      <div>
        <p style={{ fontSize: 20, fontWeight: 700, color: palette.ink, marginBottom: 16 }}>{t.memorize}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14 }}>
          {items.map(o => (
            <div key={o.id} style={{ background: palette.paperDeep, borderRadius: 18, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 42 }}>{o.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{o.label[lang]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}><ProgressBar pct={100} color={palette.marigold} /></div>
        <p style={{ textAlign: "center", color: palette.inkSoft, marginTop: 8, fontWeight: 600 }}>Memorizing… {seconds}s</p>
      </div>
    );
  }
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 700, color: palette.ink, marginBottom: 16 }}>{t.whichSaw}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14 }}>
        {options.map(o => (
          <button key={o.id} onClick={() => toggle(o.id)} style={{
            background: selected.includes(o.id) ? palette.pine : "#fff",
            color: selected.includes(o.id) ? "#fff" : palette.ink,
            border: `2px solid ${selected.includes(o.id) ? palette.pine : palette.mist}`,
            borderRadius: 18, padding: 18, textAlign: "center", cursor: "pointer",
          }}>
            <div style={{ fontSize: 40 }}>{o.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{o.label[lang]}</div>
          </button>
        ))}
      </div>
      <button onClick={submit} disabled={selected.length === 0} style={{
        marginTop: 20, width: "100%", padding: 18, borderRadius: 16, border: "none",
        background: palette.pine, color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer",
        opacity: selected.length === 0 ? 0.5 : 1,
      }}>{t.submit}</button>
    </div>
  );
}

/* ---- Game 2: Object Recall (missing object) ---- */
function ObjectRecallGame({ level, lang, onComplete }) {
  const t = STRINGS[lang];
  const count = Math.min(OBJECT_BANK.length, LEVELS_OBJECT_COUNT[level]);
  const [items] = useState(() => pickN(OBJECT_BANK, count));
  const [missing] = useState(() => items[Math.floor(Math.random() * items.length)]);
  const [phase, setPhase] = useState("show");
  const shown = items.filter(i => i.id !== missing.id);
  const [optionSet] = useState(() => shuffle([
    missing,
    ...pickN(items.filter(i => i.id !== missing.id), Math.min(3, items.length - 1)),
  ]));
  const elapsed = useTimer(phase === "recall");
  const seconds = Math.max(4, Math.min(9, count));

  useEffect(() => {
    if (phase !== "show") return;
    const timer = setTimeout(() => setPhase("recall"), seconds * 1000);
    return () => clearTimeout(timer);
  }, [phase, seconds]);

  const answer = (id) => {
    const correct = id === missing.id;
    onComplete({ accuracy: correct ? 100 : 0, responseTime: elapsed(), totalQuestions: 1, correct: correct ? 1 : 0 });
  };

  if (phase === "show") {
    return (
      <div>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{t.memorize}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 14 }}>
          {items.map(o => (
            <div key={o.id} style={{ background: palette.paperDeep, borderRadius: 18, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 38 }}>{o.icon}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: palette.inkSoft, marginTop: 12, fontWeight: 600 }}>Memorizing… {seconds}s</p>
      </div>
    );
  }
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{t.whichMissing}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 14, opacity: 0.9 }}>
        {shown.map(o => (
          <div key={o.id} style={{ background: palette.paperDeep, borderRadius: 18, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>{o.icon}</div>
          </div>
        ))}
      </div>
      <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Pick the one that's missing:</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 14 }}>
        {optionSet.map(o => (
          <button key={o.id} onClick={() => answer(o.id)} style={{
            background: "#fff", border: `2px solid ${palette.mist}`, borderRadius: 18,
            padding: 16, textAlign: "center", cursor: "pointer",
          }}>
            <div style={{ fontSize: 36 }}>{o.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{o.label[lang]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Game 3: Pattern Recognition ---- */
const SHAPE_SET = ["🔵", "🔴", "🟢", "🟡"];
function generatePattern(level) {
  if (level === 1) { // simple 2-item alternating
    const [a, b] = pickN(SHAPE_SET, 2);
    return { seq: [a, b, a, b], next: a, options: shuffle(pickN(SHAPE_SET, 4)) };
  }
  if (level === 2) { // 3-item repeating
    const [a, b, c] = pickN(SHAPE_SET, 3);
    return { seq: [a, b, c, a, b], next: c, options: shuffle(pickN(SHAPE_SET, 4)) };
  }
  if (level === 3) { // numeric pattern
    const start = 1 + Math.floor(Math.random() * 3);
    const step = 1 + Math.floor(Math.random() * 3);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    const next = start + 4 * step;
    const opts = shuffle([next, next + step, next - 1, next + 2]).map(String);
    return { seq: seq.map(String), next: String(next), options: opts, numeric: true };
  }
  // level 4: complex visual (growing repeat + shape)
  const [a, b, c, d] = pickN(SHAPE_SET, 4);
  const seq = [a, b, a, c, a, b, a];
  const next = c;
  return { seq, next, options: shuffle([a, b, c, d]) };
}

function PatternGame({ level, lang, onComplete }) {
  const t = STRINGS[lang];
  const [round] = useState(() => generatePattern(level));
  const elapsed = useTimer(true);
  const answer = (val) => {
    const correct = val === round.next;
    onComplete({ accuracy: correct ? 100 : 0, responseTime: elapsed(), totalQuestions: 1, correct: correct ? 1 : 0 });
  };
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{t.whatComesNext}</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 40, marginBottom: 24, justifyContent: "center" }}>
        {round.seq.map((s, i) => <span key={i} style={{ background: palette.paperDeep, borderRadius: 14, padding: "10px 16px" }}>{s}</span>)}
        <span style={{ background: "#fff", border: `2px dashed ${palette.pine}`, borderRadius: 14, padding: "10px 16px", fontSize: 30, color: palette.pine, display: "flex", alignItems: "center" }}>?</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 14 }}>
        {round.options.map((o, i) => (
          <button key={i} onClick={() => answer(o)} style={{
            fontSize: 34, background: "#fff", border: `2px solid ${palette.mist}`, borderRadius: 16,
            padding: 18, cursor: "pointer",
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

/* ---- Game 4: Attention Game ---- */
const FRUITS = ["🍎", "🍌", "🍊", "🍇", "🍉"];
function generateAttention(level) {
  const n = LEVELS_ATTENTION_COUNT[level];
  const target = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const others = FRUITS.filter(f => f !== target);
  const targetCount = 2 + Math.floor(Math.random() * Math.max(2, Math.floor(n / 4)));
  const arr = [];
  for (let i = 0; i < targetCount; i++) arr.push(target);
  while (arr.length < n) arr.push(others[Math.floor(Math.random() * others.length)]);
  return { grid: shuffle(arr), target, targetCount };
}

function AttentionGame({ level, lang, onComplete }) {
  const t = STRINGS[lang];
  const [round] = useState(() => generateAttention(level));
  const elapsed = useTimer(true);
  const choices = useMemo(() => {
    const base = round.targetCount;
    const set = new Set([base, base + 1, Math.max(0, base - 1), base + 2]);
    return shuffle([...set]).slice(0, 4);
  }, [round]);
  const answer = (n) => {
    const correct = n === round.targetCount;
    onComplete({ accuracy: correct ? 100 : 0, responseTime: elapsed(), totalQuestions: 1, correct: correct ? 1 : 0 });
  };
  return (
    <div>
      <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        {t.howMany} <span style={{ fontSize: 26 }}>{round.target}</span>
      </p>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, fontSize: 34, background: palette.paperDeep,
        borderRadius: 18, padding: 18, marginBottom: 20, justifyContent: "center",
      }}>
        {round.grid.map((f, i) => <span key={i}>{f}</span>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {choices.map((c) => (
          <button key={c} onClick={() => answer(c)} style={{
            fontSize: 26, fontWeight: 800, background: "#fff", border: `2px solid ${palette.mist}`,
            borderRadius: 16, padding: "16px 0", cursor: "pointer", color: palette.pine,
          }}>{c}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Screens ---------------------------- */

function Splash({ onDone }) {
  return (
    <div className="mm-splash" style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: `linear-gradient(160deg, ${palette.pine} 0%, #0B7268 60%, #0A5F57 100%)`,
      color: "#fff", gap: 14, borderRadius: 28, padding: 32, position: "relative", overflow: "hidden",
    }}>
      <div className="mm-splash-glow" />
      <div className="mm-pop-in" style={{
        width: 88, height: 88, borderRadius: 26, background: "rgba(255,255,255,0.16)",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1,
      }}><Brain size={46} /></div>
      <div className="mm-fade-up" style={{ fontSize: 30, fontWeight: 800, letterSpacing: 0.5, animationDelay: ".15s", position: "relative", zIndex: 1 }}>MindMate AI</div>
      <div className="mm-fade-up" style={{ fontSize: 15, opacity: 0.9, textAlign: "center", animationDelay: ".28s", position: "relative", zIndex: 1 }}>Train the Mind. Support the Memory.</div>
      <button onClick={onDone} className="mm-fade-up mm-splash-cta" style={{
        marginTop: 22, background: "#fff", color: palette.pine, border: "none", borderRadius: 14,
        padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex",
        alignItems: "center", gap: 8, animationDelay: ".42s", position: "relative", zIndex: 1,
      }}>Get Started <ChevronRight size={18} /></button>
      <div className="mm-fade-up" style={{ fontSize: 11, opacity: 0.65, marginTop: 18, position: "relative", zIndex: 1, animationDelay: ".5s" }}>SIH26003 · Cognitive Gaming &amp; Memory Assistance</div>
    </div>
  );
}

function RoleSelect({ onSelect }) {
  const roles = [
    { key: "elderly", icon: User, title: "Elderly User", desc: "Play games, train your mind, get reminders", color: palette.blue, bg: palette.blueBg },
    { key: "caregiver", icon: Users, title: "Caregiver", desc: "Monitor progress, view reports, manage care", color: palette.green, bg: palette.greenBg },
    { key: "admin", icon: UserCog, title: "Administrator", desc: "Manage users, games and system settings", color: palette.purple, bg: palette.purpleBg },
  ];
  return (
    <div style={{ padding: 28 }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div className="mm-pop-in" style={{
          width: 60, height: 60, borderRadius: 18, background: palette.pine, margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Brain color="#fff" size={30} /></div>
        <div style={{ fontSize: 22, fontWeight: 800, color: palette.ink }}>Select Your Role</div>
        <div style={{ color: palette.inkSoft, fontSize: 14 }}>Choose how you want to use MindMate AI</div>
      </div>
      <div className="mm-stagger-row" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {roles.map(r => (
          <button key={r.key} onClick={() => onSelect(r.key)} style={{
            display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
            background: "#fff", border: `1px solid ${palette.mist}`, borderRadius: 18, padding: 16,
            boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, background: r.bg, color: r.color, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><r.icon size={24} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: palette.ink }}>{r.title}</div>
              <div style={{ fontSize: 13, color: palette.inkSoft, marginTop: 2 }}>{r.desc}</div>
            </div>
            <ChevronRight size={20} color={palette.inkSoft} />
          </button>
          ))}
      </div>
      <div style={{ marginTop: 26 }}><DisclaimerBanner compact /></div>
    </div>
  );
}

function Login({ role, onLogin, onDemo, onBack, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const roleLabel = { elderly: "Elderly User", caregiver: "Caregiver", admin: "Administrator" }[role];
  const submit = async () => {
    setError("");
    try {
      if (mode === "register") await onRegister({ name, email, password, age: age ? Number(age) : undefined, role });
      else await onLogin({ email, password });
    } catch (e) { setError(e.message || "Something went wrong"); }
  };
  return (
    <div style={{ padding: 28 }}>
      <TopBar title={`${roleLabel} ${mode === "register" ? "Register" : "Login"}`} onBack={onBack} />
      <Card style={{ marginBottom: 18 }}>
        {mode === "register" && <>
          <label style={{ fontSize: 15, fontWeight: 700, color: palette.inkSoft }}>Full name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" style={{ width:"100%",padding:14,marginTop:8,borderRadius:12,border:`2px solid ${palette.mist}`,fontSize:17 }} />
          {role === "elderly" && <><label style={{ fontSize:15,fontWeight:700,color:palette.inkSoft,display:"block",marginTop:14 }}>Age</label><input type="number" value={age} onChange={e=>setAge(e.target.value)} placeholder="Age" style={{ width:"100%",padding:14,marginTop:8,borderRadius:12,border:`2px solid ${palette.mist}`,fontSize:17 }} /></>}
        </>}
        <label style={{ fontSize: 15, fontWeight: 700, color: palette.inkSoft, display:"block", marginTop:14 }}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{ width:"100%",padding:14,marginTop:8,borderRadius:12,border:`2px solid ${palette.mist}`,fontSize:17 }} />
        <label style={{ fontSize: 15, fontWeight: 700, color: palette.inkSoft, display:"block", marginTop:14 }}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} style={{ width:"100%",padding:14,marginTop:8,borderRadius:12,border:`2px solid ${palette.mist}`,fontSize:17 }} />
        {error && <div style={{ marginTop:12,padding:10,borderRadius:10,background:"#FDECEA",color:palette.danger,fontSize:13,fontWeight:700 }}>{error}</div>}
        <button onClick={submit} style={{ width:"100%",marginTop:18,padding:16,borderRadius:14,border:"none",background:palette.pine,color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer" }}>{mode === "register" ? "Create Account" : "Log In"}</button>
        {role !== "admin" && <button onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("");}} style={{ width:"100%",marginTop:10,padding:12,border:"none",background:"transparent",color:palette.pine,fontWeight:800,cursor:"pointer" }}>{mode === "login" ? "New user? Create an account" : "Already have an account? Log in"}</button>}
      </Card>
      <button onClick={onDemo} style={{ width:"100%",padding:16,borderRadius:14,border:`2px dashed ${palette.marigold}`,background:"#FFF7E8",color:palette.marigoldDark,fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}><Sparkles size={18}/> Load Demo {roleLabel}</button>
    </div>
  );
}
function ElderlyHome({ user, lang, onNav, netOnline }) {
  const t = STRINGS[lang];
  const activities = [
    { key: "memory", label: t.memoryGame, icon: Gamepad2, color: "#D97706", bg: "#FEF3E2" },
    { key: "attention", label: t.attentionGame, icon: Target, color: palette.pine, bg: palette.paperDeep },
    { key: "pattern", label: t.patternGame, icon: Grid3x3, color: palette.purple, bg: palette.purpleBg },
  ];
  const doneToday = user.doneToday || 0;
  const pct = Math.round((doneToday / 3) * 100);
  return (
    <div style={{ padding: 22 }}>
      {/* App header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: palette.pine, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: palette.ink }}>MindMate AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span title={netOnline ? t.synced : t.offline} style={{ color: netOnline ? palette.ok : palette.danger, display: "flex" }}>
            {netOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          </span>
          <span style={{ background: palette.paperDeep, color: palette.pine, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>
            {lang === "hi" ? "हिं" : "EN"}
          </span>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="mm-pop-in" style={{
          width: 46, height: 46, borderRadius: "50%", background: palette.pine, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0,
        }}>{(user.name || "R")[0]}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: palette.ink }}>{t.goodMorning}, {user.name} ji 👋</div>
          <div style={{ fontSize: 13, color: palette.inkSoft }}>Keep going! You're doing great!</div>
        </div>
      </div>

      {/* Today's Activities */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: palette.ink }}>{t.todaysActivities}</span>
        <button onClick={() => onNav("training")} style={{ background: "none", border: "none", color: palette.pine, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>View All</button>
      </div>
      <div className="mm-stagger-row" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {activities.map(a => (
          <button key={a.key} onClick={() => onNav("playing", a.key)} style={{
            flex: 1, background: "#fff", border: `1px solid ${palette.mist}`, borderRadius: 16, padding: "14px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer",
            boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <a.icon size={20} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: palette.ink, textAlign: "center", lineHeight: 1.2 }}>{a.label}</span>
            <small style={{ fontSize: 10, color: palette.inkSoft }}>5 min</small>
          </button>
        ))}
      </div>

      {/* Progress card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 800 }}>{t.todaysProgress}</span>
          <span style={{ fontWeight: 800, color: palette.pine }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: palette.inkSoft }}>{t.trainingScore}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: palette.pine }}>{user.trainingScore}%</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: palette.inkSoft }}>{t.streak}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: palette.marigoldDark }}><span className="mm-flame" style={{ display: "inline-flex", verticalAlign: -3 }}><Flame size={20} /></span> {user.streak} <span style={{fontSize:13}}>Days</span></div>
          </div>
        </div>
      </Card>

      <button onClick={() => onNav("training")} className="mm-shimmer-btn" style={{
        width: "100%", padding: "16px 18px", borderRadius: 16, border: "none", background: palette.pine,
        color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10, boxShadow: "0 10px 24px rgba(13,148,136,0.25)", marginBottom: 14,
      }}><PlayCircle size={20} /> {t.startTraining} →</button>

      <div className="mm-stagger-row" style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[
          { key: "assistant", label: t.memoryAssistant, icon: ClipboardList, color: palette.green, bg: palette.greenBg },
          { key: "progress", label: t.myProgress, icon: TrendingUp, color: palette.purple, bg: palette.purpleBg },
          { key: "help", label: t.help, icon: Info, color: "#D97706", bg: "#FEF3E2" },
        ].map(c => (
          <button key={c.key} onClick={() => onNav(c.key)} style={{
            flex: 1, background: c.bg, color: c.color, border: "none", borderRadius: 14, padding: "12px 6px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 700, fontSize: 12,
          }}>
            <c.icon size={18} />
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <SpeakButton text={`${t.goodMorning}, ${user.name}. ${t.todaysActivities}: ${activities.map(a=>a.label).join(", ")}.`} label={`🔊 ${t.readPage}`} />
      </div>
      <div style={{ marginTop: 18 }}><DisclaimerBanner compact /></div>
    </div>
  );
}

function DailyTraining({ lang, onStart, onBack }) {
  const t = STRINGS[lang];
  const plan = [
    { key: "memory", label: t.memoryGame, minutes: 5, icon: Brain },
    { key: "attention", label: t.attentionGame, minutes: 5, icon: Eye },
    { key: "pattern", label: t.patternGame, minutes: 5, icon: Puzzle },
  ];
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="Today's Training" onBack={onBack} />
      <Card>
        {plan.map((p, i) => (
          <div key={p.key} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 0",
            borderBottom: i < plan.length - 1 ? `1px solid ${palette.mist}` : "none",
          }}>
            <p.icon size={24} color={palette.pine} />
            <div style={{ flex: 1, fontWeight: 700 }}>{p.label}</div>
            <div style={{ color: palette.inkSoft, fontWeight: 600 }}>{p.minutes} min</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontWeight: 800 }}>
          <span>Total</span><span>15 min</span>
        </div>
      </Card>
      <p style={{ color: palette.inkSoft, fontSize: 14, margin: "16px 0" }}>This plan is personalized based on your recent performance — weaker areas come first.</p>
      <BigButton icon={PlayCircle} label="Start Training" onClick={() => onStart(plan.map(p => p.key))} />
    </div>
  );
}

function GameSelection({ lang, games, onPick, onBack, difficulties }) {
  const t = STRINGS[lang];
  const meta = {
    memory: { label: t.memoryGame, icon: Brain, desc: "Observe objects, then recall them." },
    objectRecall: { label: t.objectRecall, icon: Grid3x3, desc: "Spot the object that's missing." },
    pattern: { label: t.patternGame, icon: Puzzle, desc: "Find what comes next in the sequence." },
    attention: { label: t.attentionGame, icon: Eye, desc: "Count carefully among distractions." },
  };
  const list = games || Object.keys(meta);
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="Choose an Activity" onBack={onBack} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map((k) => (
          <Card key={k}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ background: palette.mist, borderRadius: 14, padding: 12 }}>
                {React.createElement(meta[k].icon, { color: palette.pine, size: 26 })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{meta[k].label}</div>
                <div style={{ color: palette.inkSoft, fontSize: 13 }}>{meta[k].desc}</div>
                <div style={{ color: palette.marigoldDark, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{t.level} {difficulties[k]}</div>
              </div>
              <button onClick={() => onPick(k)} style={{
                background: palette.pine, color: "#fff", border: "none", borderRadius: 12,
                padding: "10px 16px", fontWeight: 800, cursor: "pointer",
              }}>{t.start}</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GamePlayScreen({ gameKey, level, lang, onBack, onComplete }) {
  const t = STRINGS[lang];
  const titles = { memory: t.memoryGame, objectRecall: t.objectRecall, pattern: t.patternGame, attention: t.attentionGame };
  return (
    <div style={{ padding: 24 }}>
      <TopBar title={titles[gameKey]} onBack={onBack} right={
        <span style={{ background: palette.mist, borderRadius: 10, padding: "6px 12px", fontWeight: 800, fontSize: 13, color: palette.pine }}>{t.level} {level}</span>
      } />
      <Card>
        {gameKey === "memory" && <MemoryMatchGame level={level} lang={lang} onComplete={onComplete} />}
        {gameKey === "objectRecall" && <ObjectRecallGame level={level} lang={lang} onComplete={onComplete} />}
        {gameKey === "pattern" && <PatternGame level={level} lang={lang} onComplete={onComplete} />}
        {gameKey === "attention" && <AttentionGame level={level} lang={lang} onComplete={onComplete} />}
      </Card>
    </div>
  );
}

function ResultScreen({ lang, gameKey, result, adaptive, onPlayAgain, onNext, onHome }) {
  const t = STRINGS[lang];
  const titles = { memory: t.memoryGame, objectRecall: t.objectRecall, pattern: t.patternGame, attention: t.attentionGame };
  const increased = adaptive.changed && adaptive.nextLevel > adaptive.prevLevel;
  const decreased = adaptive.changed && adaptive.nextLevel < adaptive.prevLevel;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div className="mm-bounce-in" style={{ fontSize: 36 }}>🎉</div>
        <div className="mm-bounce-in" style={{
          width: 54, height: 54, borderRadius: "50%", background: palette.amberBg, color: "#D97706",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "6px auto",
          animationDelay: ".1s",
        }}><Trophy size={26} /></div>
        <div className="mm-fade-up" style={{ fontSize: 22, fontWeight: 800, color: palette.ink, animationDelay: ".25s" }}>{t.greatJob}</div>
        <div className="mm-fade-up" style={{ color: palette.inkSoft, animationDelay: ".32s" }}>{titles[gameKey]} Complete</div>
      </div>

      <div className="mm-stagger-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: t.score, value: `${result.score}%`, color: palette.pine },
          { label: t.accuracy, value: `${result.correct}/${result.totalQuestions}`, color: palette.green },
          { label: t.responseTime, value: `${result.responseTime.toFixed(0)}s`, color: palette.purple },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: `1px solid ${palette.mist}`, borderRadius: 14, padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: palette.inkSoft, fontWeight: 700 }}>{t.difficulty}</span>
        <span style={{ background: palette.paperDeep, color: palette.pine, borderRadius: 999, padding: "5px 14px", fontWeight: 800, fontSize: 13 }}>
          Level {adaptive.prevLevel}{adaptive.changed ? ` → Level ${adaptive.nextLevel}` : ""}
        </span>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 12 }}>
          <Sparkles size={17} color={palette.pine} /> AI Adaptive Engine
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: palette.inkSoft, marginBottom: 8 }}>Performance Analysis</div>
        {[`Accuracy: ${result.accuracy}%`, "Response Time: Good", `Consecutive Correct: ${result.correct}`].map(line => (
          <div key={line} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: palette.ink, padding: "5px 0" }}>
            <CheckCircle2 size={15} color={palette.green} /> {line}
          </div>
        ))}
        <div style={{
          marginTop: 12, background: increased ? palette.amberBg : decreased ? palette.paperDeep : palette.mist,
          borderRadius: 12, padding: 12,
        }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: increased ? "#B45309" : palette.ink, marginBottom: 3 }}>
            {increased ? "Difficulty Increased" : decreased ? "Difficulty Eased" : "Level Maintained"}
          </div>
          <div style={{ fontSize: 12.5, color: palette.inkSoft }}>{adaptive.reason}</div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <BigButton icon={RotateCcw} label={t.playAgain} onClick={onPlayAgain} tone="outline" />
        <BigButton icon={ChevronRight} label={t.nextActivity} onClick={onNext} tone="success" />
        <BigButton icon={Home} label={t.backHome} tone="ghost" onClick={onHome} />
      </div>
    </div>
  );
}
function Row({ label, value, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${palette.mist}` }}>
      <span style={{ color: palette.inkSoft, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: big ? 20 : 15, color: big ? palette.pine : palette.ink }}>{value}</span>
    </div>
  );
}

function ProgressScreen({ lang, demoUser, token, sessions, onBack }) {
  const t = STRINGS[lang];
  const [tab, setTab] = useState("overview");
  const [remoteSessions, setRemoteSessions] = useState([]);

  useEffect(() => {
    if (!token) {
      setRemoteSessions([]);
      return undefined;
    }
    let cancelled = false;
    api("/me/performance", {}, token)
      .then(({ sessions: loaded = [] }) => { if (!cancelled) setRemoteSessions(loaded); })
      .catch(() => { if (!cancelled) setRemoteSessions([]); });
    return () => { cancelled = true; };
  }, [token]);

  const labels = { memory: "Memory Match", objectRecall: "Object Recall", pattern: "Pattern Recognition", attention: "Attention Game" };
  const normalizeSession = (session) => ({
    id: session.id,
    gameKey: session.gameKey || session.game_key,
    label: session.label || labels[session.gameKey || session.game_key] || session.gameKey || session.game_key,
    score: Number(session.score || 0),
    accuracy: Number(session.accuracy || 0),
    date: session.date || session.client_created_at || session.created_at,
  });
  const merged = new Map();
  [...remoteSessions, ...sessions].map(normalizeSession).forEach(session => merged.set(session.id, session));
  const allSessions = [...merged.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  const gameKeys = ["memory", "objectRecall", "pattern", "attention"];
  const series = Object.fromEntries(gameKeys.map(key => {
    const actual = allSessions.filter(session => session.gameKey === key).map(session => ({
      day: new Date(session.date).toLocaleDateString(), score: session.score, accuracy: session.accuracy,
    }));
    const fallback = demoUser ? demoUser[key] || [] : [];
    return [key, actual.length ? actual : fallback];
  }));
  const chartLength = Math.max(1, ...gameKeys.map(key => series[key].length));
  const data = Array.from({ length: chartLength }, (_, i) => ({
    day: gameKeys.map(key => series[key][i]?.day).find(Boolean) || `Session ${i + 1}`,
    memory: series.memory[i]?.score,
    objectRecall: series.objectRecall[i]?.score,
    pattern: series.pattern[i]?.score,
    attention: series.attention[i]?.score,
  }));
  const recent = allSessions.slice(-6).reverse();
  const last = (arr) => arr[arr.length - 1]?.score ?? 0;
  const currentScores = gameKeys.map(key => last(series[key])).filter((score, index) => series[gameKeys[index]].length);
  const overall = currentScores.length ? Math.round(currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length) : 0;
  return (
    <div style={{ padding: 24 }}>
      <TopBar title={t.myProgress} onBack={onBack} />
      <Tabs tabs={[["overview", "Overview"], ["history", "Game History"], ["badges", "Badges"]]} active={tab} onChange={setTab} />
      {tab !== "overview" && (
        <Card style={{ textAlign: "center", padding: 32, color: palette.inkSoft }}>
          <Award size={30} color={palette.mist} style={{ marginBottom: 10 }} />
          <div>{tab === "history" ? "Your full game history will appear here." : "Earn badges by keeping up your daily streak."}</div>
        </Card>
      )}
      {tab === "overview" && <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Your Cognitive Training Progress</div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.mist} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="memory" name="Memory" stroke={palette.green} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="objectRecall" name="Object Recall" stroke={palette.marigold} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="attention" name="Attention" stroke={palette.purple} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="pattern" name="Pattern" stroke={palette.blue} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 16 }}>Game Performance</div>
        <div className="mm-stagger-row" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 14 }}>
          <Ring pct={last(series.memory)} color={palette.green} label="Memory" />
          <Ring pct={last(series.objectRecall)} color={palette.marigold} label="Object Recall" />
          <Ring pct={last(series.attention)} color={palette.purple} label="Attention" />
          <Ring pct={last(series.pattern)} color={palette.blue} label="Pattern" />
          <Ring pct={overall} color={palette.ink} label="Overall" />
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Recent Sessions</div>
        {recent.length === 0 && <div style={{ color: palette.inkSoft }}>No activities recorded yet today. Start your first activity!</div>}
        {recent.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${palette.mist}` }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: palette.inkSoft }}>{new Date(s.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {s.accuracy}% accuracy</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, color: palette.pine }}>{s.score}%</span>
            </div>
          </div>
        ))}
      </Card>
      </>}
    </div>
  );
}

function MemoryAssistant({ lang, onBack, token, reminders, routine, remindersLoading, remindersError, onToggleRoutine, onAddReminder, onDeleteReminder }) {
  const t = STRINGS[lang];
  const [tab, setTab] = useState("medicine");
  const [form, setForm] = useState({ title: "", time: "", note: "" });
  const [showForm, setShowForm] = useState(false);
  const [enabled, setEnabled] = useState(() => reminders.map(() => true));
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(Boolean(token));
  const [appointmentsError, setAppointmentsError] = useState("");
  useEffect(() => setEnabled(reminders.map(() => true)), [reminders]);
  useEffect(() => {
    if (!token) {
      setAppointmentsLoading(false);
      return;
    }
    setAppointmentsLoading(true);
    api("/appointments", {}, token).then(({ appointments: loaded = [] }) => {
      setAppointments(loaded);
      setAppointmentsLoading(false);
    }).catch(() => {
      setAppointments([]);
      setAppointmentsLoading(false);
      setAppointmentsError("Appointments could not be loaded. Try again later.");
    });
  }, [token]);
  const toggleEnabled = (i) => setEnabled(e => e.map((v, idx) => idx === i ? !v : v));
  return (
    <div style={{ padding: 24 }}>
      <TopBar title={t.memoryAssistant} onBack={onBack} />
      <Tabs tabs={[["medicine", "Medicine"], ["appointment", "Appointment"], ["routine", t.dailyRoutine]]} active={tab} onChange={setTab} />

      {tab === "medicine" && <>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
              <Pill size={18} color={palette.pine} /> Medicine Reminder
            </div>
            <button onClick={() => setShowForm(s => !s)} style={{
              display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
              color: palette.pine, fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}><Plus size={16} /> Add Reminder</button>
          </div>
          {remindersLoading && <div style={{ color: palette.inkSoft, fontSize: 14, padding: "8px 0" }}>Loading reminders...</div>}
          {remindersError && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10, marginBottom: 10 }}>{remindersError}</div>}
          {!remindersLoading && !remindersError && reminders.length === 0 && <div style={{ color: palette.inkSoft, fontSize: 14, padding: "8px 0" }}>No reminders yet. Add one to get started.</div>}
          {reminders.map((r, i) => (
            <div key={r.id || `${r.title}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
              borderBottom: i < reminders.length - 1 ? `1px solid ${palette.mist}` : "none",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: palette.amberBg, color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: palette.inkSoft }}>{r.note}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: palette.pine, fontSize: 13, marginBottom: 4 }}>{r.time}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => toggleEnabled(i)} aria-label="Toggle reminder" style={{
                    width: 38, height: 22, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
                    background: enabled[i] !== false ? palette.pine : palette.mist,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute",
                      top: 3, left: enabled[i] !== false ? 19 : 3, transition: "left .15s ease",
                    }} />
                  </button>
                  <button onClick={() => onDeleteReminder(r.id)} aria-label={`Delete ${r.title}`} title="Delete reminder" style={{ background: "none", border: "none", color: palette.danger, cursor: "pointer", padding: 2 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {showForm && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <input placeholder="e.g. Blood pressure tablet" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ flex: 2, minWidth: 140, padding: 10, borderRadius: 10, border: `1px solid ${palette.mist}` }} />
              <input placeholder="8:00 AM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                style={{ flex: 1, minWidth: 90, padding: 10, borderRadius: 10, border: `1px solid ${palette.mist}` }} />
              <textarea placeholder="Note (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                style={{ flex: "1 1 100%", minHeight: 64, padding: 10, borderRadius: 10, border: `1px solid ${palette.mist}`, resize: "vertical" }} />
              <button onClick={() => { if (form.title && form.time) { onAddReminder(form); setForm({ title: "", time: "", note: "" }); setEnabled(e => [...e, true]); setShowForm(false); } }} style={{
                background: palette.pine, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer",
              }}>Add</button>
            </div>
          )}
          <div style={{ marginTop: 12, background: palette.amberBg, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#92400E" }}>
            Always follow your healthcare provider's instructions.
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 800 }}>Upcoming Reminders</span>
            <span style={{ color: palette.pine, fontWeight: 700, fontSize: 12 }}>View All</span>
          </div>
          {reminders.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <Bell size={14} color={palette.marigoldDark} /> {r.title}
              </div>
              <span style={{ fontSize: 12, color: palette.inkSoft, fontWeight: 700 }}>{r.time}</span>
            </div>
          ))}
        </Card>
      </>}

      {tab === "appointment" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 12 }}><Calendar size={19} color={palette.pine} /> Doctor Appointments</div>
          {appointmentsLoading && <div style={{ color: palette.inkSoft }}>Loading appointments...</div>}
          {appointmentsError && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10 }}>{appointmentsError}</div>}
          {!token && <div style={{ color: palette.inkSoft, fontSize: 14 }}>Sign in to view your saved doctor appointments.</div>}
          {!appointmentsLoading && !appointmentsError && token && appointments.length === 0 && <div style={{ color: palette.inkSoft, fontSize: 14 }}>No doctor appointments scheduled.</div>}
          {appointments.map(appointment => (
            <div key={appointment.id} style={{ padding: "12px 0", borderBottom: `1px solid ${palette.mist}` }}>
              <div style={{ fontWeight: 800 }}>{appointment.doctor_name}</div>
              <div style={{ color: palette.inkSoft, fontSize: 13, marginTop: 3 }}>{appointment.clinic} · {new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString()} at {appointment.appointment_time}</div>
              {appointment.notes && <div style={{ fontSize: 13, marginTop: 5 }}>{appointment.notes}</div>}
            </div>
          ))}
        </Card>
      )}

      {tab === "routine" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 10 }}>
            <CheckCircle2 size={20} color={palette.pine} /> {t.dailyRoutine}
          </div>
          {routine.map((r, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", fontSize: 17, cursor: "pointer" }}>
              <input type="checkbox" checked={r.done} onChange={() => onToggleRoutine(i)} style={{ width: 22, height: 22, accentColor: palette.pine }} />
              <span style={{ textDecoration: r.done ? "line-through" : "none", color: r.done ? palette.inkSoft : palette.ink }}>{r.label}</span>
            </label>
          ))}
        </Card>
      )}
    </div>
  );
}

function HelpVoiceScreen({ lang, onBack, voiceAssist, textToSpeech }) {
  const t = STRINGS[lang];
  const [transcript, setTranscript] = useState("");
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="Voice & Help" onBack={onBack} />
      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>Tap the microphone and speak your answer or question.</p>
        {voiceAssist ? <VoiceMicButton onResult={setTranscript} listenPrompt="Listening…" /> : <div style={{ color: palette.inkSoft, fontSize: 14 }}>Voice assistance is disabled in Settings.</div>}
        {transcript && <div style={{ marginTop: 16, background: palette.paperDeep, borderRadius: 12, padding: 12 }}>You said: "{transcript}"</div>}
        {textToSpeech && <div style={{ marginTop: 18 }}><SpeakButton text="Welcome to MindMate. Tap start today's training on the home screen to begin your daily activities." label={`🔊 ${t.readPage}`} /></div>}
      </Card>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Need help?</div>
        <p style={{ color: palette.inkSoft, fontSize: 14 }}>Ask a family member or caregiver, or call your community health worker. MindMate is here to support your daily memory and thinking activities — not for emergencies.</p>
      </Card>
    </div>
  );
}
function ProfileScreen({ account, onBack }) {
    return (
        <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
              <button
                      onClick={onBack}
                              style={{
                                        border: "none",
                                                  background: "none",
                                                            cursor: "pointer",
                                                                      fontWeight: 700,
                                                                                marginBottom: 20,
                                                                                        }}
                                                                                              >
                                                                                                      ← Back
                                                                                                            </button>

                                                                                                                  <Card style={{ marginBottom: 16 }}>
                                                                                                                          <div style={{ textAlign: "center", marginBottom: 24 }}>
                                                                                                                                    <div
                                                                                                                                                style={{
                                                                                                                                                              width: 80,
                                                                                                                                                                            height: 80,
                                                                                                                                                                                          borderRadius: "50%",
                                                                                                                                                                                                        background: palette.pine,
                                                                                                                                                                                                                      color: "#fff",
                                                                                                                                                                                                                                    display: "flex",
                                                                                                                                                                                                                                                  alignItems: "center",
                                                                                                                                                                                                                                                                justifyContent: "center",
                                                                                                                                                                                                                                                                              margin: "0 auto 12px",
                                                                                                                                                                                                                                                                                            fontSize: 32,
                                                                                                                                                                                                                                                                                                          fontWeight: 800,
                                                                                                                                                                                                                                                                                                                      }}
                                                                                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                                                                                            {(account?.name || "U").charAt(0).toUpperCase()}
                                                                                                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                                                                                                <div style={{ fontSize: 22, fontWeight: 800, color: palette.ink }}>
                                                                                                                                                                                                                                                                                                                                                                            {account?.name || "User"}
                                                                                                                                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                                                                                                                                <div style={{ color: palette.inkSoft, marginTop: 4 }}>
                                                                                                                                                                                                                                                                                                                                                                                                            {account?.email || "No email available"}
                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                      <div style={{ padding: 14, borderRadius: 12, background: "#F5F7F6", marginBottom: 10 }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                <div style={{ fontSize: 12, color: palette.inkSoft }}>Name</div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                          <div style={{ fontWeight: 700, marginTop: 4 }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {account?.name || "Not available"}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div style={{ padding: 14, borderRadius: 12, background: "#F5F7F6", marginBottom: 10 }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <div style={{ fontSize: 12, color: palette.inkSoft }}>Email</div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div style={{ fontWeight: 700, marginTop: 4 }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {account?.email || "Not available"}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <div style={{ padding: 14, borderRadius: 12, background: "#F5F7F6" }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div style={{ fontSize: 12, color: palette.inkSoft }}>Account Type</div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <div style={{ fontWeight: 700, marginTop: 4, textTransform: "capitalize" }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          {account?.role || "User"}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </Card>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }

function SettingsScreen({ lang, setLang, fontScale, setFontScale, highContrast, setHighContrast, reduceMotion, setReduceMotion, voiceAssist, setVoiceAssist, textToSpeech, setTextToSpeech, onBack, onProfile, onChangePassword, onPrivacySecurity }) {
  const t = STRINGS[lang];
  return (
    <div style={{ padding: 24 }}>
      <TopBar title={t.settings} onBack={onBack} />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 12 }}><Globe size={18} color={palette.pine} /> {t.language}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {["en", "hi"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, padding: 12, borderRadius: 12, cursor: "pointer",
              border: `2px solid ${lang === l ? palette.pine : palette.mist}`,
              background: lang === l ? palette.pine : "#fff", color: lang === l ? "#fff" : palette.ink, fontWeight: 700,
            }}>{l === "en" ? "English" : "हिन्दी"}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: palette.inkSoft, marginTop: 8 }}>More regional languages can be added without changing app logic (translation-file architecture).</div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 12 }}><TypeIcon size={18} color={palette.pine} /> {t.fontSize}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ k: 1, l: "Normal" }, { k: 1.18, l: "Large" }, { k: 1.4, l: "Extra Large" }].map(o => (
            <button key={o.l} onClick={() => setFontScale(o.k)} style={{
              flex: 1, padding: 12, borderRadius: 12, cursor: "pointer",
              border: `2px solid ${fontScale === o.k ? palette.pine : palette.mist}`,
              background: fontScale === o.k ? palette.pine : "#fff", color: fontScale === o.k ? "#fff" : palette.ink, fontWeight: 700,
            }}>{o.l}</button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <ToggleRow icon={Contrast} label={t.highContrast} value={highContrast} onChange={setHighContrast} />
        <div style={{ height: 14 }} />
        <ToggleRow icon={Sparkles} label={t.reduceMotion} value={reduceMotion} onChange={setReduceMotion} />
        <div style={{ height: 14 }} />
        <ToggleRow icon={Mic} label="Voice Assistance" value={voiceAssist} onChange={setVoiceAssist} />
        <div style={{ height: 14 }} />
        <ToggleRow icon={Volume2} label="Text to Speech" value={textToSpeech} onChange={setTextToSpeech} />
      </Card>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13, color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>Account</div>
        {[
          { icon: User, label: "Profile", onClick: onProfile },
          { icon: Lock, label: "Change Password", onClick: onChangePassword },
          { icon: ShieldCheck, label: "Privacy & Security", onClick: onPrivacySecurity },
        ].map((row, i, arr) => (
          <button key={row.label} onClick={row.onClick} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 2px",
            background: "none", border: "none", cursor: "pointer", textAlign: "left",
            borderBottom: i < arr.length - 1 ? `1px solid ${palette.mist}` : "none",
          }}>
            <row.icon size={18} color={palette.pine} />
            <span style={{ flex: 1, fontWeight: 700, color: palette.ink, fontSize: 14 }}>{row.label}</span>
            <ChevronRight size={18} color={palette.inkSoft} />
          </button>
        ))}
      </Card>
    </div>
  );
}

function ChangePasswordScreen({ token, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");
    setSaving(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }, token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully.");
    } catch (e) {
      setError(e.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: "100%", padding: "12px 14px", border: `1px solid ${palette.mist}`,
    borderRadius: 10, fontSize: 16, color: palette.ink, background: "#fff",
  };

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <TopBar title="Change Password" onBack={onBack} />
      <Card>
        <form onSubmit={submit}>
          {[
            ["Current Password", currentPassword, setCurrentPassword, "current-password"],
            ["New Password", newPassword, setNewPassword, "new-password"],
            ["Confirm New Password", confirmPassword, setConfirmPassword, "new-password"],
          ].map(([label, value, setter, autocomplete]) => (
            <label key={label} style={{ display: "block", marginBottom: 16, fontWeight: 700 }}>
              {label}
              <input
                type="password"
                value={value}
                onChange={(event) => setter(event.target.value)}
                autoComplete={autocomplete}
                required
                style={{ ...fieldStyle, display: "block", marginTop: 7 }}
              />
            </label>
          ))}
          {error && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", padding: 10, borderRadius: 10, marginBottom: 14 }}>{error}</div>}
          {success && <div role="status" style={{ color: palette.ok, background: palette.greenBg, padding: 10, borderRadius: 10, marginBottom: 14 }}>{success}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, border: "none", borderRadius: 10, background: palette.pine, color: "#fff", fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Changing..." : "Change Password"}
            </button>
            <button type="button" onClick={onBack} style={{ flex: 1, padding: 12, border: `1px solid ${palette.mist}`, borderRadius: 10, background: "#fff", color: palette.ink, fontWeight: 700, cursor: "pointer" }}>
              Back / Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function PrivacySecurityScreen({ account, token, onBack, onLogout }) {
  const sectionStyle = { display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${palette.mist}` };
  const iconStyle = { color: palette.pine, flexShrink: 0, marginTop: 2 };
  return (
    <div style={{ padding: 24, maxWidth: 650, margin: "0 auto" }}>
      <TopBar title="Privacy & Security" onBack={onBack} />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 4 }}>
          <ShieldCheck size={19} color={palette.pine} /> Account security
        </div>
        <div style={{ color: palette.inkSoft, fontSize: 14 }}>Your MindMate account is protected by authenticated access.</div>
        <div style={sectionStyle}>
          <User size={19} style={iconStyle} />
          <div><div style={{ fontWeight: 700 }}>Signed-in account</div><div style={{ color: palette.inkSoft, fontSize: 14, marginTop: 3 }}>{account?.email || account?.name || "Current account"}</div></div>
        </div>
        <div style={sectionStyle}>
          <Lock size={19} style={iconStyle} />
          <div><div style={{ fontWeight: 700 }}>Login/session security</div><div style={{ color: palette.inkSoft, fontSize: 14, marginTop: 3 }}>{token ? "This device has an active secure session." : "No active session information is available."}</div></div>
        </div>
        <div style={{ ...sectionStyle, borderBottom: "none" }}>
          <Clock size={19} style={iconStyle} />
          <div><div style={{ fontWeight: 700 }}>Session control</div><div style={{ color: palette.inkSoft, fontSize: 14, marginTop: 3 }}>Use Logout from this device to end this session immediately.</div></div>
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 4 }}>
          <Info size={19} color={palette.pine} /> Privacy information
        </div>
        <div style={sectionStyle}>
          <ShieldCheck size={19} style={iconStyle} />
          <div><div style={{ fontWeight: 700 }}>Data protection</div><div style={{ color: palette.inkSoft, fontSize: 14, marginTop: 3 }}>MindMate uses your authenticated account to associate training activity and reminders with you. Passwords are handled securely by the backend and are never shown here.</div></div>
        </div>
        <div style={{ ...sectionStyle, borderBottom: "none" }}>
          <Eye size={19} style={iconStyle} />
          <div><div style={{ fontWeight: 700 }}>Privacy by design</div><div style={{ color: palette.inkSoft, fontSize: 14, marginTop: 3 }}>Only the information needed for your account and app features is displayed in this app.</div></div>
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 8 }}>
          <LogOut size={19} color={palette.danger} /> Logout from this device
        </div>
        <div style={{ color: palette.inkSoft, fontSize: 14, marginBottom: 14 }}>This clears the saved login session on this device and returns you to the login screen.</div>
        <button onClick={onLogout} style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, background: palette.danger, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Log out securely
        </button>
      </Card>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={18} color={palette.pine} />
      <span style={{ flex: 1, fontWeight: 700 }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        width: 50, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
        background: value ? palette.pine : palette.mist, position: "relative",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute",
          top: 3, left: value ? 25 : 3, transition: "left .15s ease",
        }} />
      </button>
    </div>
  );
}

/* ---------------------------- Caregiver ---------------------------- */
function CaregiverDashboard({ users, onSelectUser, onBack, alerts, loading, error }) {
  const total = users.length;
  const active = users.filter(u => u.status === "Active").length;
  const completedToday = users.filter(u => u.lastActivity === "Today").length;
  const avgScore = total ? Math.round(users.reduce((a, u) => a + u.trainingScore, 0) / total) : 0;
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="Caregiver Dashboard" onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Users" value={total} icon={Users} />
        <StatCard label="Active Users" value={active} icon={CheckCircle2} />
        <StatCard label="Completed Today" value={completedToday} icon={PlayCircle} />
        <StatCard label="Avg. Training Score" value={`${avgScore}%`} icon={TrendingUp} />
      </div>

      {alerts.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Alerts</div>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start", borderBottom: i < alerts.length - 1 ? `1px solid ${palette.mist}` : "none" }}>
              <span style={{ fontSize: 16 }}>{a.type === "performance" ? "🟡" : "🔵"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.user}</div>
                <div style={{ fontSize: 13, color: palette.inkSoft }}>{a.message}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Users</div>
        {loading && <div style={{ color: palette.inkSoft, padding: "12px 0" }}>Loading users...</div>}
        {error && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10, marginBottom: 10 }}>{error}</div>}
        {!loading && !error && users.length === 0 && <div style={{ color: palette.inkSoft, padding: "12px 0" }}>No linked users found.</div>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", color: palette.inkSoft }}>
                {["Name", "Age", "Last Activity", "Score", "Accuracy", "Level", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "8px 6px", borderBottom: `2px solid ${palette.mist}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && !error && users.map(u => (
                <tr key={u.id} onClick={() => onSelectUser(u)} style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.paperDeep}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 6px", fontWeight: 700, borderBottom: `1px solid ${palette.mist}` }}>{u.name}</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>{u.age}</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>{u.lastActivity}</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}`, fontWeight: 700, color: palette.pine }}>{u.trainingScore}%</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>{u.accuracy}%</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>Level {u.level}</td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>
                    <span style={{
                      background: u.status === "Active" ? "#E7F4EC" : "#FDECEA",
                      color: u.status === "Active" ? palette.ok : palette.danger,
                      padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12,
                    }}>{u.status}</span>
                  </td>
                  <td style={{ padding: "10px 6px", borderBottom: `1px solid ${palette.mist}` }}>
                    <button onClick={(e) => { e.stopPropagation(); onSelectUser(u); }} style={{
                      background: palette.paperDeep, color: palette.pine, border: "none", borderRadius: 8,
                      padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex",
                      alignItems: "center", gap: 4, whiteSpace: "nowrap",
                    }}>View <ChevronRight size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
function StatCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: palette.mist, padding: 10, borderRadius: 12 }}><Icon size={20} color={palette.pine} /></div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: palette.ink }}>{value}</div>
          <div style={{ fontSize: 12, color: palette.inkSoft }}>{label}</div>
        </div>
      </div>
    </Card>
  );
}

function UserAnalytics({ user, onBack, token, loading, error }) {
  const [tab, setTab] = useState("performance");
  const gameKeys = ["memory", "objectRecall", "attention", "pattern"];
  const gameLabels = { memory: "Memory", objectRecall: "Object Recall", attention: "Attention", pattern: "Pattern" };
  const series = Object.fromEntries(gameKeys.map(key => [key, user[key] || []]));
  const chartLength = Math.max(1, ...gameKeys.map(key => series[key].length));
  const data = Array.from({ length: chartLength }, (_, i) => ({
    day: gameKeys.map(key => series[key][i]?.day).find(Boolean) || `Session ${i + 1}`,
    Memory: series.memory[i]?.score,
    ObjectRecall: series.objectRecall[i]?.score,
    Attention: series.attention[i]?.score,
    Pattern: series.pattern[i]?.score,
  }));
  const last = (arr) => arr[arr.length - 1]?.score ?? 0;
  const currentScores = gameKeys.map(key => last(series[key])).filter((score, index) => series[gameKeys[index]].length);
  const overall = currentScores.length ? Math.round(currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length) : 0;
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="User Analytics" onBack={onBack} />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: palette.pine, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0,
          }}>{user.name[0]}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: palette.inkSoft }}>Age {user.age} · {user.language === "hi" ? "Hindi" : "English"}</div>
          </div>
        </div>
      </Card>

      <Tabs tabs={[["performance", "Performance Overview"], ["history", "Activity History"]]} active={tab} onChange={setTab} />

      {loading && <Card style={{ color: palette.inkSoft }}>Loading performance data...</Card>}
      {error && <Card><div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10 }}>{error}</div></Card>}
      {!loading && !error && tab === "performance" && <>
        <Card style={{ marginBottom: 16 }}>
          {(user.sessions || []).length === 0 && <div style={{ color: palette.inkSoft, fontSize: 14, marginBottom: 14 }}>No game sessions recorded for this user yet.</div>}
          <div className="mm-stagger-row" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 14 }}>
            {gameKeys.map(key => <Ring key={key} pct={last(series[key])} color={key === "memory" ? palette.green : key === "objectRecall" ? palette.marigold : key === "attention" ? palette.purple : palette.blue} label={gameLabels[key]} />)}
            <Ring pct={overall} color={palette.ink} label="Overall Training" />
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Performance Trend</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.mist} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="Memory" stroke={palette.green} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ObjectRecall" name="Object Recall" stroke={palette.marigold} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Attention" stroke={palette.purple} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Pattern" stroke={palette.blue} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Difficulty Levels</div>
          {Object.entries(user.difficulties).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
              <span style={{ textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
              <span style={{ fontWeight: 700, color: palette.pine }}>Level {v}</span>
            </div>
          ))}
        </Card>
      </>}

      {!loading && !error && tab === "history" && (
        <Card style={{ textAlign: "center", padding: 32, color: palette.inkSoft }}>
          <Clock size={30} color={palette.mist} style={{ marginBottom: 10 }} />
          {(user.sessions || []).length === 0 && <div>{user.name} has no recorded sessions yet.</div>}
          {(user.sessions || []).map(session => (
            <div key={session.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${palette.mist}`, textAlign: "left" }}>
              <span>{session.label}</span><span>{session.score}% · {session.accuracy}% accuracy</span>
            </div>
          ))}
        </Card>
      )}
      <DoctorAppointments user={user} token={token} />
    </div>
  );
}

function DoctorAppointments({ user, token }) {
  const emptyForm = { doctorName: "", clinic: "", appointmentDate: "", appointmentTime: "", notes: "" };
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAppointments = useCallback(async () => {
    if (!token || !user?.id) {
      setLoading(false);
      setError("Sign in as a caregiver to manage appointments.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { appointments: loaded = [] } = await api(`/caregiver/users/${user.id}/appointments`, {}, token);
      setAppointments(loaded);
    } catch (e) {
      setAppointments([]);
      setError(e.message || "Appointments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const path = editingId ? `/caregiver/appointments/${editingId}` : `/caregiver/users/${user.id}/appointments`;
      const { appointment } = await api(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) }, token);
      setAppointments(current => editingId ? current.map(item => item.id === editingId ? appointment : item) : [...current, appointment].sort((a, b) => `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`)));
      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? "Appointment updated." : "Appointment added.");
    } catch (e) {
      setError(e.message || "Appointment could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (appointment) => {
    setEditingId(appointment.id);
    setForm({ doctorName: appointment.doctor_name, clinic: appointment.clinic, appointmentDate: String(appointment.appointment_date).slice(0, 10), appointmentTime: appointment.appointment_time, notes: appointment.notes || "" });
    setMessage("");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    setError("");
    try {
      await api(`/caregiver/appointments/${id}`, { method: "DELETE" }, token);
      setAppointments(current => current.filter(item => item.id !== id));
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
      setMessage("Appointment deleted.");
    } catch (e) {
      setError(e.message || "Appointment could not be deleted.");
    }
  };

  return (
    <Card style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}><Calendar size={19} color={palette.pine} /> Doctor Appointments</div>
        <span style={{ color: palette.inkSoft, fontSize: 13 }}>For {user.name}</span>
      </div>
      {loading && <div style={{ color: palette.inkSoft, padding: "8px 0" }}>Loading appointments...</div>}
      {error && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10, marginBottom: 10 }}>{error}</div>}
      {message && <div role="status" style={{ color: palette.ok, background: palette.greenBg, borderRadius: 10, padding: 10, marginBottom: 10 }}>{message}</div>}
      {!loading && !error && appointments.length === 0 && <div style={{ color: palette.inkSoft, fontSize: 14, marginBottom: 12 }}>No appointments for this elderly user.</div>}
      {!loading && appointments.map(appointment => (
        <div key={appointment.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: `1px solid ${palette.mist}`, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800 }}>{appointment.doctor_name} · {appointment.clinic}</div>
            <div style={{ color: palette.inkSoft, fontSize: 13, marginTop: 3 }}>{new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString()} at {appointment.appointment_time}</div>
            {appointment.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{appointment.notes}</div>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => edit(appointment)} aria-label="Edit appointment" style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${palette.mist}`, borderRadius: 8, background: "#fff", color: palette.pine, padding: "8px 10px", cursor: "pointer", fontWeight: 700 }}><Pencil size={14} /> Edit</button>
            <button onClick={() => remove(appointment.id)} aria-label="Delete appointment" style={{ display: "flex", alignItems: "center", gap: 4, border: "none", borderRadius: 8, background: "#FDEAEA", color: palette.danger, padding: "8px 10px", cursor: "pointer", fontWeight: 700 }}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      ))}
      <form onSubmit={submit} style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${palette.mist}` }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>{editingId ? "Edit Appointment" : "+ Add Appointment"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {[["doctorName", "Doctor Name", "text"], ["clinic", "Hospital / Clinic", "text"], ["appointmentDate", "Appointment Date", "date"], ["appointmentTime", "Appointment Time", "time"]].map(([key, label, type]) => (
            <label key={key} style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{label}
              <input required type={type} value={form[key]} onChange={event => updateForm(key, event.target.value)} style={{ width: "100%", display: "block", marginTop: 5, padding: 10, borderRadius: 9, border: `1px solid ${palette.mist}` }} />
            </label>
          ))}
          <label style={{ gridColumn: "1 / -1", display: "block", fontSize: 13, fontWeight: 700 }}>Reason / Notes
            <textarea value={form.notes} onChange={event => updateForm("notes", event.target.value)} rows={2} style={{ width: "100%", display: "block", marginTop: 5, padding: 10, borderRadius: 9, border: `1px solid ${palette.mist}`, resize: "vertical" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button disabled={saving || !token} type="submit" style={{ background: palette.pine, color: "#fff", border: "none", borderRadius: 9, padding: "10px 14px", fontWeight: 800, cursor: saving ? "wait" : "pointer", opacity: saving || !token ? 0.6 : 1 }}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Appointment"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ background: "#fff", color: palette.ink, border: `1px solid ${palette.mist}`, borderRadius: 9, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Cancel Edit</button>}
        </div>
      </form>
    </Card>
  );
}

function AdminDashboard({ users, allUsers, games, onBack, onViewUser, onDeleteUser, loading, error, demoMode, initialTab = "overview" }) {
  const [tab, setTab] = useState(initialTab);
  const [busyId, setBusyId] = useState(null);
  useEffect(() => setTab(initialTab), [initialTab]);
  const managedUsers = demoMode && !allUsers.length ? users : allUsers;
  const caregiverCount = demoMode && !allUsers.length ? DEMO_CAREGIVERS.length : allUsers.filter(u => u.role === "caregiver").length;
  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.role})? This permanently removes their account, sessions, and reminders. This cannot be undone.`)) return;
    setBusyId(u.id);
    try { await onDeleteUser(u.id); }
    catch (e) { alert(e.message || "Could not delete user"); }
    finally { setBusyId(null); }
  };
  return (
    <div style={{ padding: 24 }}>
      <TopBar title="Admin Dashboard" onBack={onBack} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["overview", "users", "games", "languages"].map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
            background: tab === k ? palette.pine : palette.mist, color: tab === k ? "#fff" : palette.ink,
            fontWeight: 700, textTransform: "capitalize", fontSize: 13,
          }}>{k}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          <StatCard label="Total Elderly Users" value={users.length} icon={Users} />
          <StatCard label="Registered Caregivers" value={caregiverCount} icon={ShieldCheck} />
          <StatCard label="Game Types" value={games.length} icon={Gamepad2} />
          <StatCard label="Avg. Platform Score" value={`${users.length ? Math.round(users.reduce((a, u) => a + u.trainingScore, 0) / users.length) : 0}%`} icon={BarChart3} />
        </div>
      )}
      {tab === "users" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>Manage Users &amp; Caregivers</div>
            <span style={{ fontSize: 12, color: palette.inkSoft }}>{managedUsers.length} total</span>
          </div>
          {demoMode && !allUsers.length && (
            <div style={{ fontSize: 12, color: palette.inkSoft, background: palette.paperDeep, borderRadius: 10, padding: 10, marginBottom: 10 }}>
              Showing demo data — connect a live backend to manage real accounts.
            </div>
          )}
          {loading && <div style={{ color: palette.inkSoft, padding: "12px 0" }}>Loading users...</div>}
          {error && <div role="alert" style={{ color: palette.danger, background: "#FDECEA", borderRadius: 10, padding: 10, marginBottom: 10 }}>{error}</div>}
          {!loading && !error && managedUsers.length === 0 && <div style={{ color: palette.inkSoft, padding: "12px 0" }}>No users found.</div>}
          {!loading && !error && managedUsers.map(u => (
            <div key={u.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0", flexWrap: "wrap",
              borderBottom: `1px solid ${palette.mist}`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
                background: u.role === "caregiver" ? palette.greenBg : palette.blueBg,
                color: u.role === "caregiver" ? palette.ok : palette.blue, flexShrink: 0,
              }}>{u.role || "elderly"}</span>
              <div style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: palette.inkSoft }}>
                  {u.role === "caregiver"
                    ? `${u.linked_elderly_count ?? 0} linked elderly · ${u.email || ""}`
                    : `${u.language === "hi" ? "Hindi" : "English"} · Level ${u.level} · ${u.email || ""}`}
                </div>
              </div>
              {u.role !== "caregiver" && (
                <button onClick={() => onViewUser(u)} style={{
                  background: palette.paperDeep, color: palette.pine, border: "none", borderRadius: 8,
                  padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                }}>View</button>
              )}
              <button onClick={() => handleDelete(u)} disabled={busyId === u.id} style={{
                background: "#FDEAEA", color: palette.danger, border: "none", borderRadius: 8,
                padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: busyId === u.id ? "wait" : "pointer",
                opacity: busyId === u.id ? 0.6 : 1, whiteSpace: "nowrap",
              }}>{busyId === u.id ? "…" : "Delete"}</button>
            </div>
          ))}
        </Card>
      )}
      {tab === "games" && (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Manage Games</div>
          {games.map(g => (
            <div key={g.key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${palette.mist}`, fontSize: 14 }}>
              <span>{g.label}</span><span style={{ color: palette.inkSoft }}>4 difficulty levels</span>
            </div>
          ))}
        </Card>
      )}
      {tab === "languages" && (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Language Content</div>
          {["English", "Hindi"].map(l => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${palette.mist}`, fontSize: 14 }}>
              <span>{l}</span><span style={{ color: palette.ok, fontWeight: 700 }}>Active</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14 }}>
            <span>Regional (Assamese, Bodo, Khasi…)</span><span style={{ color: palette.inkSoft }}>Architecture ready</span>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------- API + offline sync ---------------------------- */
const API_URL = import.meta.env.VITE_API_URL || "https://mind-mate-ai-sxj7.onrender.com/api";
const SYNC_DB = "mindmate-offline";
async function offlineDB(){ return openDB(SYNC_DB,1,{upgrade(db){ if(!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions",{keyPath:"id"}); }}); }
async function queueSession(session){ const db=await offlineDB(); await db.put("sessions",session); }
async function queuedSessions(){ const db=await offlineDB(); return db.getAll("sessions"); }
async function removeQueued(ids){ const db=await offlineDB(); const tx=db.transaction("sessions","readwrite"); for(const id of ids) tx.store.delete(id); await tx.done; }
async function api(path, options={}, token){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const r=await fetch(`${API_URL}${path}`,{...options,headers});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
function normalizeReminder(reminder){
  return { id: reminder.id, title: reminder.title, time: reminder.reminder_time || reminder.time, note: reminder.note || "" };
}
async function syncOffline(token, userId){
  if(!navigator.onLine || !token) return {count:0};
  const pending=(await queuedSessions()).filter(session => session.userId === userId);
  if(!pending.length) return {count:0};
  const result=await api('/game-sessions/sync',{method:'POST',body:JSON.stringify({sessions:pending})},token);
  await removeQueued(pending.map(x=>x.id));
  return {count:pending.length,result};
}


function AppSidebar({ role, screen, onNav, onLogout }) {
  const items = role === "elderly"
    ? [
        ["elderlyHome", "Home", Home], ["training", "Training / Games", Brain],
        ["progress", "Progress", TrendingUp], ["assistant", "Memory Assistant", ClipboardList],
        ["assistant", "Reminders", Bell], ["settings", "Settings", SettingsIcon],
      ]
    : role === "caregiver"
      ? [["caregiverDashboard", "Dashboard", Home], ["caregiverUsers", "Users", Users], ["userAnalytics", "Analytics", BarChart3], ["settings", "Settings", SettingsIcon]]
      : [["adminDashboard", "Dashboard", Home], ["adminUsers", "Users", Users], ["adminGames", "Games", Gamepad2], ["settings", "Settings", SettingsIcon]];
  return (
    <aside className="mm-sidebar">
      <div className="mm-brand">
        <div className="mm-brand-mark"><Brain size={22}/></div>
        <div><strong>MindMate AI</strong><small>Train the Mind.</small></div>
      </div>
      <nav className="mm-nav">
        {items.map(([target, label, Icon]) => (
          <button key={label} className={screen === target || (target === "caregiverDashboard" && screen === "caregiverUsers") ? "active" : ""} onClick={() => onNav(target)}>
            <Icon size={18}/><span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="mm-logout" onClick={onLogout}><LogOut size={17}/> Log out</button>
    </aside>
  );
}

/* ---------------------------- App shell ---------------------------- */
const GAME_META = [
  { key: "memory", label: "Memory Match" }, { key: "objectRecall", label: "Object Recall" },
  { key: "pattern", label: "Pattern Recognition" }, { key: "attention", label: "Attention Game" },
];

export default function MindMateAI() {
  const [token, setToken] = useState(() => localStorage.getItem("mindmate_token") || "");
  const [screen, setScreen] = useState(() => token ? "authChecking" : "splash");
  const [authChecking, setAuthChecking] = useState(Boolean(token));
  const [role, setRole] = useState(null);
  const [lang, setLang] = useState("en");
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(true);
  const [textToSpeech, setTextToSpeech] = useState(true);
  const [netOnline, setNetOnline] = useState(navigator.onLine);
  const [account, setAccount] = useState(() => { try { return JSON.parse(localStorage.getItem("mindmate_user") || "null"); } catch { return null; } });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [elderly, setElderly] = useState({
    name: "", trainingScore: 0, streak: 0, doneToday: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [difficulties, setDifficulties] = useState({ memory: 2, objectRecall: 2, pattern: 2, attention: 2 });
  const [recentAcc, setRecentAcc] = useState({ memory: [], objectRecall: [], pattern: [], attention: [] });

  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(Boolean(token));
  const [remindersError, setRemindersError] = useState("");
  const [routine, setRoutine] = useState([
    { label: "Wake up", done: false }, { label: "Breakfast", done: false },
    { label: "Morning walk", done: false }, { label: "Call family", done: false },
  ]);

  const [demoUsers] = useState(() => buildDemoUsers());
  const [selectedUser, setSelectedUser] = useState(null);
  const [caregiverUsersLoading, setCaregiverUsersLoading] = useState(false);
  const [caregiverUsersError, setCaregiverUsersError] = useState("");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [lastAdaptive, setLastAdaptive] = useState(null);

  useEffect(() => {
    const authenticated = Boolean(token && account?.id);
    setElderly({ name: authenticated ? account.name : "", trainingScore: 0, streak: 0, doneToday: 0 });
    setSessions([]);
    setDifficulties({ memory: 2, objectRecall: 2, pattern: 2, attention: 2 });
    setRecentAcc({ memory: [], objectRecall: [], pattern: [], attention: [] });
    setRemoteUsers([]);
    setAllUsers([]);
    setSelectedUser(null);
    setTrainingPlan(null);
    setActiveGame(null);
    setLastResult(null);
    setLastAdaptive(null);
    setRoutine([
      { label: "Wake up", done: false }, { label: "Breakfast", done: false },
      { label: "Morning walk", done: false }, { label: "Call family", done: false },
    ]);
    if (!authenticated) setReminders([]);
  }, [account?.id]);

  useEffect(() => {
    const goOffline = () => setNetOnline(false);
    const goOnline = () => setNetOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setAuthChecking(false);
      return () => { active = false; };
    }
    setAuthChecking(true);
    api('/auth/me',{},token).then(({user})=>{
      if (!active) return;
      setAccount(user);
      setRole(user.role);
      setScreen(user.role === 'elderly' ? 'elderlyHome' : user.role === 'caregiver' ? 'caregiverDashboard' : 'adminDashboard');
      setAuthChecking(false);
    }).catch(()=>{
      if (!active) return;
      localStorage.removeItem('mindmate_token');
      localStorage.removeItem('mindmate_user');
      setToken('');
      setAccount(null);
      setRole(null);
      setScreen('roleSelect');
      setAuthChecking(false);
    });
    if (account?.id) syncOffline(token, account.id).catch(()=>{});
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !account?.id || account.role !== "elderly") return undefined;
    let active = true;
    api('/me/performance', {}, token).then(({ sessions: loaded = [] }) => {
      if (!active) return;
      const mapped = loaded.map(session => ({
        id: session.id,
        gameKey: session.game_key,
        label: GAME_META.find(game => game.key === session.game_key)?.label || session.game_key,
        score: Number(session.score || 0),
        accuracy: Number(session.accuracy || 0),
        date: session.created_at || session.client_created_at,
      }));
      setSessions(mapped);
      if (mapped.length) {
        const average = Math.round(mapped.reduce((sum, session) => sum + session.score, 0) / mapped.length);
        setElderly(user => ({ ...user, trainingScore: average, doneToday: mapped.filter(session => new Date(session.date).toDateString() === new Date().toDateString()).length }));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [token, account?.id, account?.role]);

  useEffect(() => {
    if (!token) {
      setRemindersLoading(false);
      setRemindersError("");
      return;
    }
    setRemindersLoading(true);
    setRemindersError("");
    setReminders([]);
    api('/reminders',{},token).then(({reminders: loaded = []}) => {
      setReminders(loaded.map(normalizeReminder));
      setRemindersLoading(false);
    }).catch(() => {
      setReminders([]);
      setRemindersLoading(false);
      setRemindersError("Reminders could not be loaded. Try again later.");
    });
  }, [token]);

  useEffect(() => {
    if (!token || !account || !['caregiver','admin'].includes(account.role)) {
      setCaregiverUsersLoading(false);
      return;
    }
    setCaregiverUsersLoading(true);
    setCaregiverUsersError("");
    api('/caregiver/users',{},token).then(({users})=>{
      setRemoteUsers(users || []);
      setCaregiverUsersLoading(false);
    }).catch(()=>{
      setRemoteUsers([]);
      setCaregiverUsersLoading(false);
      setCaregiverUsersError("Users could not be loaded. Try again later.");
    });
  }, [token, account]);

  useEffect(() => {
    if (!token || account?.role !== 'admin') {
      setAdminUsersLoading(false);
      return;
    }
    setAdminUsersLoading(true);
    setAdminUsersError("");
    api('/admin/users',{},token).then(({users})=>{
      setAllUsers(users || []);
      setAdminUsersLoading(false);
    }).catch(()=>{
      setAllUsers([]);
      setAdminUsersLoading(false);
      setAdminUsersError("Users could not be loaded. Try again later.");
    });
  }, [token, account]);

  const deleteUser = useCallback(async (userId) => {
    await api(`/admin/users/${userId}`, { method: 'DELETE' }, token);
    setAllUsers(list => list.filter(u => u.id !== userId));
    setRemoteUsers(list => list.filter(u => u.id !== userId));
  }, [token]);

  const viewUserAnalytics = useCallback(async (u) => {
    const grouped = { memory: [], objectRecall: [], attention: [], pattern: [] };
    const base = { ...u, ...grouped, sessions: [], difficulties: { memory: u.level || 1, objectRecall: u.level || 1, pattern: u.level || 1, attention: u.level || 1 } };
    setSelectedUser(base);
    setAnalyticsError("");
    setAnalyticsLoading(Boolean(token && u.id));
    setScreen("userAnalytics");
    if (!token || !u.id) return;
    try {
      const x = await api(`/caregiver/users/${u.id}/performance`, {}, token);
      const sessions = (x.sessions || []).map(s => ({
        id: s.id,
        gameKey: s.game_key,
        label: { memory: "Memory Match", objectRecall: "Object Recall", attention: "Attention Game", pattern: "Pattern Recognition" }[s.game_key] || s.game_key,
        score: Number(s.score || 0), accuracy: Number(s.accuracy || 0),
        date: s.created_at || s.client_created_at,
      }));
      sessions.forEach(s => { if (grouped[s.gameKey]) grouped[s.gameKey].push({ day: new Date(s.date).toLocaleDateString(), score: s.score }); });
      setSelectedUser({ ...base, ...grouped, sessions });
    } catch {
      setAnalyticsError("Performance data could not be loaded. Try again later.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token]);

  const alerts = useMemo(() => {
    const out = [];
    demoUsers.forEach(u => {
      if (u.status === "Inactive") out.push({ type: "activity", user: u.name, message: "No training activity recorded today." });
      if (u.accuracy < 65) out.push({ type: "performance", user: u.name, message: "Performance was lower than the user's recent average. Consider checking in." });
    });
    return out.slice(0, 4);
  }, [demoUsers]);

  const t = STRINGS[lang];

  const handleGameComplete = useCallback((raw) => {
    const gameKey = activeGame;
    const score = computeScore(raw.accuracy, raw.responseTime);
    const currentLevel = difficulties[gameKey];
    const adaptive = computeNextDifficulty({
      currentLevel, sessionAccuracy: raw.accuracy, recentAccuracies: recentAcc[gameKey], lang,
    });
    setDifficulties(d => ({ ...d, [gameKey]: adaptive.nextLevel }));
    setRecentAcc(r => ({ ...r, [gameKey]: [...r[gameKey], raw.accuracy].slice(-5) }));
    const sessionId = crypto.randomUUID();
    const session = { id: sessionId, gameKey, score, accuracy: raw.accuracy, responseTime: raw.responseTime, difficultyBefore: currentLevel, difficultyAfter: adaptive.nextLevel, totalQuestions: raw.totalQuestions, correctAnswers: raw.correct, clientCreatedAt: new Date().toISOString() };
    setSessions(s => [...s, { id: sessionId, gameKey, label: GAME_META.find(g => g.key === gameKey)?.label || gameKey, score, accuracy: raw.accuracy, date: session.clientCreatedAt }]);
    const ownedSession = { ...session, userId: account?.id };
    if (token && navigator.onLine) api('/game-sessions',{method:'POST',body:JSON.stringify(session)},token).catch(()=>queueSession(ownedSession));
    else if (account?.id) queueSession(ownedSession).catch(()=>{});
    setElderly(e => ({ ...e, doneToday: Math.min(3, e.doneToday + 1), trainingScore: Math.round((e.trainingScore * 4 + score) / 5) }));
    setLastResult({ ...raw, score });
    setLastAdaptive({ ...adaptive, prevLevel: currentLevel });
    setScreen("result");
  }, [activeGame, difficulties, recentAcc, lang, token, account?.id]);

  const loadDemoElderly = () => {
    setElderly({ name: "Ramesh", trainingScore: 78, streak: 5, doneToday: 0 });
    setRole("elderly"); setScreen("elderlyHome");
  };

  /* ---- container chrome (phone-like frame) ---- */
  const contrastStyle = highContrast ? {
    background: "#000", color: "#FFF700",
  } : { background: palette.paper, color: palette.ink };
  const isPublic = ["splash", "authChecking", "roleSelect", "login"].includes(screen);
  const isElderlyLoggedIn = role === "elderly" && !isPublic;
  const doLogout = () => { localStorage.removeItem("mindmate_token"); localStorage.removeItem("mindmate_user"); setToken(""); setAccount(null); setRole(null); setScreen("roleSelect"); };
  const handleSidebarNav = (target) => {
    if (role === "caregiver" && target === "userAnalytics") {
      const users = token ? remoteUsers : demoUsers;
      if (selectedUser) return setScreen("userAnalytics");
      if (users[0]) return viewUserAnalytics(users[0]);
      return setScreen("caregiverUsers");
    }
    if (role === "admin" && !["adminDashboard", "adminUsers", "adminGames", "settings"].includes(target)) return;
    if (role === "caregiver" && !["caregiverDashboard", "caregiverUsers", "userAnalytics", "settings"].includes(target)) return;
    if (role === "elderly" && !["elderlyHome", "training", "progress", "assistant", "settings"].includes(target)) return;
    setScreen(target);
  };
  const handleAddReminder = async (form) => {
    const temporary = { id: `local-${crypto.randomUUID()}`, title: form.title, time: form.time, note: form.note || "" };
    setReminders(r => [temporary, ...r]);
    if (!token || !navigator.onLine) return;
    try {
      const { reminder } = await api("/reminders", { method: "POST", body: JSON.stringify({ title: form.title, reminderTime: form.time, note: form.note || "" }) }, token);
      setReminders(r => r.map(item => item.id === temporary.id ? normalizeReminder(reminder) : item));
    } catch {
      setReminders(r => r.filter(item => item.id !== temporary.id));
    }
  };
  const handleDeleteReminder = async (id) => {
    if (token && navigator.onLine && id && !id.startsWith("local-")) {
      try { await api(`/reminders/${id}`, { method: "DELETE" }, token); }
      catch { return; }
    }
    setReminders(r => r.filter(item => item.id !== id));
  };

  return (
    <div className={`mindmate-app${isElderlyLoggedIn ? " mm-elderly-shell" : ""}`} style={{
      fontFamily: "'Atkinson Hyperlegible','Segoe UI',sans-serif",
      fontSize: 16 * fontScale, ...contrastStyle,
      transition: reduceMotion ? "none" : "background .2s ease",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input, button { font-family: inherit; }
        .pulse { animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
      `}</style>

      {isPublic ? (
      <div className="mm-public-content" style={{ maxWidth: 480, margin: "0 auto" }}>
      {!netOnline && screen !== "splash" && (
        <div style={{ background: "#FDECEA", color: palette.danger, padding: "8px 16px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <WifiOff size={14} /> {t.noInternet}
        </div>
      )}

      {screen === "splash" && <Splash onDone={() => setScreen("roleSelect")} />}

      {screen === "authChecking" && <div style={{ minHeight: 300, display: "grid", placeItems: "center", padding: 24, color: palette.inkSoft, fontWeight: 700 }}>Restoring your session...</div>}

      {screen === "roleSelect" && <RoleSelect onSelect={(r) => { setRole(r); setScreen("login"); }} />}

      {screen === "login" && (
        <Login
          role={role}
          onBack={() => setScreen("roleSelect")}
          onLogin={async ({email,password}) => {
            const {user,token:newToken} = await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
            setToken(newToken); setAccount(user); localStorage.setItem('mindmate_token',newToken); localStorage.setItem('mindmate_user',JSON.stringify(user));
            setRole(user.role);
            if (user.role === 'elderly') { setElderly(e => ({...e,name:user.name})); setScreen('elderlyHome'); }
            else if (user.role === 'caregiver') { const x=await api('/caregiver/users',{},newToken); setRemoteUsers(x.users); setScreen('caregiverDashboard'); }
            else { const x=await api('/caregiver/users',{},newToken); setRemoteUsers(x.users); setScreen('adminDashboard'); }
          }}
          onRegister={async ({name,email,password,age,role}) => {
            const {user,token:newToken} = await api('/auth/register',{method:'POST',body:JSON.stringify({name,email,password,age,role})});
            setToken(newToken); setAccount(user); localStorage.setItem('mindmate_token',newToken); localStorage.setItem('mindmate_user',JSON.stringify(user));
            setRole(user.role); if(user.role==='elderly'){setElderly(e=>({...e,name:user.name}));setScreen('elderlyHome');}
            else setScreen(user.role==='caregiver'?'caregiverDashboard':'adminDashboard');
          }}
          onDemo={() => {
            if (role === "elderly") loadDemoElderly();
            else if (role === "caregiver") setScreen("caregiverDashboard");
            else setScreen("adminDashboard");
          }}
        />
      )}
      </div>
      ) : isElderlyLoggedIn ? (
      <>
      <AppSidebar role={role} screen={screen} onNav={handleSidebarNav} onLogout={doLogout} />
      <main className="mm-content mm-elderly-content" style={{ padding: 0 }}>
      <div className="mm-public-content mm-phone-frame">
      {!netOnline && (
        <div style={{ background: "#FDECEA", color: palette.danger, padding: "8px 16px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <WifiOff size={14} /> {t.noInternet}
        </div>
      )}

      {screen === "elderlyHome" && (
        <ElderlyHome
          user={elderly} lang={lang} netOnline={netOnline}
          onNav={(where, gameKey) => {
            if (where === "training") setScreen("training");
            if (where === "assistant") setScreen("assistant");
            if (where === "progress") setScreen("progress");
            if (where === "help") setScreen("help");
            if (where === "settings") setScreen("settings");
            if (where === "playing" && gameKey) { setActiveGame(gameKey); setScreen("playing"); }
          }}
        />
      )}

      {screen === "training" && (
        <DailyTraining lang={lang} onBack={() => setScreen("elderlyHome")}
          onStart={(plan) => { setTrainingPlan(plan); setScreen("gameSelection"); }} />
      )}

      {screen === "gameSelection" && (
        <GameSelection lang={lang} games={["memory", "objectRecall", "pattern", "attention"]}
          difficulties={difficulties} onBack={() => setScreen("elderlyHome")}
          onPick={(k) => { setActiveGame(k); setScreen("playing"); }} />
      )}

      {screen === "playing" && (
        <GamePlayScreen gameKey={activeGame} level={difficulties[activeGame]} lang={lang}
          onBack={() => setScreen("elderlyHome")} onComplete={handleGameComplete} />
      )}

      {screen === "result" && lastResult && lastAdaptive && (
        <ResultScreen lang={lang} gameKey={activeGame} result={lastResult} adaptive={lastAdaptive}
          onPlayAgain={() => setScreen("playing")}
          onNext={() => setScreen("gameSelection")}
          onHome={() => setScreen("elderlyHome")} />
      )}

      {screen === "progress" && (
        <ProgressScreen lang={lang} demoUser={token ? null : demoUsers[0]} token={token} sessions={sessions} onBack={() => setScreen("elderlyHome")} />
      )}

      {screen === "assistant" && (
        <MemoryAssistant lang={lang} token={token} onBack={() => setScreen("elderlyHome")}
          reminders={reminders} routine={routine}
          remindersLoading={remindersLoading} remindersError={remindersError}
          onToggleRoutine={(i) => setRoutine(r => r.map((x, idx) => idx === i ? { ...x, done: !x.done } : x))}
          onAddReminder={handleAddReminder} onDeleteReminder={handleDeleteReminder} />
      )}

      {screen === "help" && <HelpVoiceScreen lang={lang} voiceAssist={voiceAssist} textToSpeech={textToSpeech} onBack={() => setScreen("elderlyHome")} />}

      {screen === "settings" && (
        <SettingsScreen lang={lang} setLang={setLang} fontScale={fontScale} setFontScale={setFontScale}
          highContrast={highContrast} setHighContrast={setHighContrast}
          reduceMotion={reduceMotion} setReduceMotion={setReduceMotion}
          voiceAssist={voiceAssist} setVoiceAssist={setVoiceAssist}
          textToSpeech={textToSpeech} setTextToSpeech={setTextToSpeech}
            onBack={() => setScreen("elderlyHome")} onProfile={() => setScreen("profile")}
            onChangePassword={() => setScreen("changePassword")}
            onPrivacySecurity={() => setScreen("privacySecurity")} />
          )}

          {screen === "profile" && <ProfileScreen account={account} onBack={() => setScreen("settings")} />}

        {screen === "changePassword" && (
          <ChangePasswordScreen token={token} onBack={() => setScreen("settings")} />
        )}

        {screen === "privacySecurity" && (
          <PrivacySecurityScreen account={account} token={token} onBack={() => setScreen("settings")} onLogout={doLogout} />
        )}

        {["elderlyHome", "training", "gameSelection", "playing", "result", "progress", "assistant", "help", "settings", "profile", "changePassword", "privacySecurity"].includes(screen) && (
        <div className="mm-elderly-nav" style={{
          background: "#fff", borderTop: `1px solid ${palette.mist}`,
          display: "flex", justifyContent: "space-around", padding: "6px 12px",
        }}>
          <NavIcon icon={Home} active={screen === "elderlyHome"} onClick={() => setScreen("elderlyHome")} label={t.elderlyHome} />
          <NavIcon icon={ClipboardList} active={screen === "assistant"} onClick={() => setScreen("assistant")} label={t.memoryAssistant.split(" ")[0]} />
          <NavIcon icon={TrendingUp} active={screen === "progress"} onClick={() => setScreen("progress")} label={t.myProgress.split(" ")[1] || "Progress"} />
          <NavIcon icon={SettingsIcon} active={screen === "settings"} onClick={() => setScreen("settings")} label={t.settings} />
        </div>
      )}
      </div>
      </main>
      </>
      ) : (
      <>
      <AppSidebar role={role} screen={screen} onNav={handleSidebarNav} onLogout={doLogout} />
      <main className="mm-content" style={{ padding: 0 }}>
      {!netOnline && (
        <div style={{ background: "#FDECEA", color: palette.danger, padding: "8px 16px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <WifiOff size={14} /> {t.noInternet}
        </div>
      )}

      {screen === "settings" && (
        <SettingsScreen lang={lang} setLang={setLang} fontScale={fontScale} setFontScale={setFontScale}
          highContrast={highContrast} setHighContrast={setHighContrast}
          reduceMotion={reduceMotion} setReduceMotion={setReduceMotion}
          voiceAssist={voiceAssist} setVoiceAssist={setVoiceAssist}
          textToSpeech={textToSpeech} setTextToSpeech={setTextToSpeech}
          onBack={() => setScreen(role === "caregiver" ? "caregiverDashboard" : "adminDashboard")}
            onProfile={() => setScreen("profile")}
            onChangePassword={() => setScreen("changePassword")}
            onPrivacySecurity={() => setScreen("privacySecurity")} />
          )}

          {screen === "profile" && <ProfileScreen account={account} onBack={() => setScreen("settings")} />}

        {screen === "changePassword" && (
          <ChangePasswordScreen token={token} onBack={() => setScreen("settings")} />
        )}

        {screen === "privacySecurity" && (
          <PrivacySecurityScreen account={account} token={token} onBack={() => setScreen("settings")} onLogout={doLogout} />
        )}

          {["caregiverDashboard", "caregiverUsers"].includes(screen) && role === "caregiver" && (
            <CaregiverDashboard users={token ? remoteUsers.map(u => ({...u, trainingScore:Number(u.training_score||0), accuracy:Number(u.accuracy||0), level:Number(u.level||1), status:u.last_activity ? "Active" : "Inactive", lastActivity:u.last_activity && new Date(u.last_activity).toDateString() === new Date().toDateString() ? "Today" : u.last_activity ? new Date(u.last_activity).toLocaleDateString() : "Never"})) : demoUsers} alerts={token ? [] : alerts} loading={token && caregiverUsersLoading} error={token ? caregiverUsersError : ""}
          onBack={() => setScreen("roleSelect")}
          onSelectUser={viewUserAnalytics} />
      )}

          {screen === "userAnalytics" && selectedUser && ["caregiver", "admin"].includes(role) && (
            <UserAnalytics user={selectedUser} token={token} loading={analyticsLoading} error={analyticsError} onBack={() => setScreen(role === "admin" ? "adminDashboard" : "caregiverDashboard")} />
      )}

          {["adminDashboard", "adminUsers", "adminGames"].includes(screen) && role === "admin" && (
        <AdminDashboard
          users={token ? allUsers.filter(u => u.role === "elderly").map(u => ({...u, trainingScore:Number(u.training_score||0), level:Number(u.level||1), language:u.language})) : demoUsers}
          allUsers={allUsers.map(u => ({...u, trainingScore:Number(u.training_score||0), accuracy:Number(u.accuracy||0), level:Number(u.level||1)}))}
          loading={token && adminUsersLoading} error={token ? adminUsersError : ""} demoMode={!token}
          games={GAME_META} initialTab={screen === "adminUsers" ? "users" : screen === "adminGames" ? "games" : "overview"} onBack={() => setScreen("roleSelect")}
          onViewUser={viewUserAnalytics} onDeleteUser={deleteUser} />
      )}

      {["caregiverDashboard", "caregiverUsers", "userAnalytics", "adminDashboard", "adminUsers", "adminGames"].includes(screen) && (
        <div className="mm-mobile-nav" style={{
          background: "#fff", borderTop: `1px solid ${palette.mist}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px",
        }}>
          <span style={{ fontSize: 12, color: palette.inkSoft }}>SIH26003 · MindMate AI</span>
          <button onClick={() => setScreen("settings")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <SettingsIcon size={20} color={palette.inkSoft} />
          </button>
          <button onClick={doLogout} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: palette.inkSoft, fontSize: 12, fontWeight: 700 }}>
            <LogOut size={16} /> {t.logout}
          </button>
        </div>
      )}
      </main>
      </>
      )}
    </div>
  );
}

function NavIcon({ icon: Icon, active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 2, color: active ? palette.pine : palette.inkSoft,
    }}>
      <Icon size={22} strokeWidth={active ? 2.6 : 2} />
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
    </button>
  );
}
