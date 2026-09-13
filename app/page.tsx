"use client";
import { useState } from "react";

const quotes = ["עם ישראל חי-יזרים.", "אנשים מחפשים זהב ומדלגים על יהלומים.", "כמה שאתה יותר רחוק מהמציאות אתה יותר כוכב."];

export default function Home() {
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  function draw() { setLoading(true); window.setTimeout(() => { setQuote(quotes[Math.floor(Math.random()*quotes.length)]); setLoading(false); }, 1400); }
  return <main><nav><b>משפט ביום<span>.</span></b><a href="https://github.com/333LDAR/mishpat-bayom">GitHub</a></nav><section><p>משפט אחד. רגע אחד. כל יום מחדש.</p><h1>משפט ביום<span>.</span></h1>{loading ? <div className="loading">א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת<br/><small>מחפשים לך משהו טוב…</small></div> : quote ? <article><i>״</i><blockquote>{quote}</blockquote><button onClick={draw}>הגרלה נוספת</button></article> : <button className="draw" onClick={draw}>הגרל לי משפט ↙</button>}<a className="submit" href="#submit">יש לכם משפט לשתף?</a></section><footer id="submit">בקרוב: פרופילים, הגשות ושיח סביב כל משפט.</footer></main>;
}
