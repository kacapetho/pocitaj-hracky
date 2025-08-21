import { useMemo, useState, useEffect } from "react";
import "./styles.css";

type Task = { count: number; options: number[]; answer: number };

/** Generátor úlohy – rešpektuje MAX cap (napr. 10). */
function genTask(maxCap: number): Task {
  const count = Math.floor(Math.random() * maxCap) + 1; // 1..maxCap
  const candidates = new Set<number>([count]);

  // Distraktory len v rozsahu 1..maxCap (nie za hranicou slidera)
  const deltas = [-2, -1, 1, 2, 3, -3].sort(() => 0.5 - Math.random());
  for (const d of deltas) {
    const v = count + d;
    if (v >= 1 && v <= maxCap) candidates.add(v);
    if (candidates.size >= 4) break;
  }
  // Doplň na min. 3 možnosti
  while (candidates.size < 3) {
    candidates.add(Math.floor(Math.random() * maxCap) + 1);
  }
  const options = Array.from(candidates).sort(() => 0.5 - Math.random());
  return { count, options, answer: count };
}

export default function App() {
  const [screen, setScreen] = useState<"home"|"game">("home");

  /** maxCap = „Vami nastavený strop“ (slider) */
  const [maxCap, setMaxCap] = useState(10);

  /** currentMax = aktuálny pracovný strop pre adaptivitu, nikdy neprekročí maxCap */
  const [currentMax, setCurrentMax] = useState(10);

  const [done, setDone] = useState(0);
  const [streak, setStreak] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState<"ok"|"wrong"|null>(null);

  const task = useMemo(() => genTask(currentMax), [currentMax, done]);

  function submit(opt: number) {
    const correct = opt === task.answer;
    setFeedback(correct ? "ok" : "wrong");
    setTimeout(() => setFeedback(null), 350);

    if (correct) {
      const s = streak + 1;
      setStreak(s);
      setDone(d => d + 1);
      if (s % 5 === 0) setStars(x => x + 1);
      // Adaptívne zvýšenie len do maxCap
      if (s >= 3 && currentMax < maxCap) {
        setCurrentMax(m => Math.min(maxCap, m + 2));
      }
    } else {
      setStreak(0);
      // Adaptívne zníženie, ale nie pod 5
      if (currentMax > 5) {
        setCurrentMax(m => Math.max(5, m - 2));
      }
    }
  }

  useEffect(() => {
    if (done >= 20) {
      alert(`Hotovo! Úloh: ${done}\nHviezdičky: ${stars}\nAktuálny rozsah: 1–${currentMax}`);
      setDone(0); setStars(0); setStreak(0);
      setCurrentMax(maxCap); // po bloku držíme Vami nastavené maximum
      setScreen("home");
    }
  }, [done, stars, currentMax, maxCap]);

  // Keď zmeníte slider, aktualizuje sa strop a zmenší sa currentMax, ak bol vyšší
  function onChangeMaxCap(val: number) {
    setMaxCap(val);
    setCurrentMax(m => Math.min(m, val));
  }

  if (screen === "home") {
    return (
      <div className="wrap">
        <h1>Počítaj hračky</h1>
        <p>Vyber správne číslo podľa počtu obrázkov. 20 úloh v bloku.</p>

        <div className="panel">
          <label>Maximálny rozsah úloh: 1–{maxCap}</label>
          <input
            type="range"
            min={5}
            max={20}
            value={maxCap}
            onChange={(e)=>onChangeMaxCap(Number(e.target.value))}
          />
          <div className="hint">Aktuálny pracovný rozsah: 1–{currentMax}</div>
        </div>

        <button className="primary" onClick={() => setScreen("game")}>Začať</button>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="bar">
        <div>Úlohy: {done}/20</div>
        <div>Hviezdičky: {stars}</div>
        <div>Rozsah: 1–{currentMax} (max {maxCap})</div>
        <button onClick={() => setScreen("home")}>Domov</button>
      </header>

      <div className={`playground ${feedback ?? ""}`} aria-live="polite">
        {Array.from({length: task.count}).map((_, i) => (
          <span key={i} className="toy" title="hračka" aria-hidden="true">🧸</span>
        ))}
      </div>

      <div className="options">
        {task.options.map((o, i) => (
          <button
            key={i}
            className="option"
            onClick={() => submit(o)}
            aria-label={`odpoveď ${o}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
