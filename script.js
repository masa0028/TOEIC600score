// ==================== 共通ユーティリティ ====================
function $(id) { return document.getElementById(id); }

let screens = {};
let seCorrect, seNext, seWrong, seClick;

function show(name) {
  Object.values(screens).forEach(s => s && s.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playSE(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

// ==================== データ ====================
const day1Words = [
  { word: "increase", meaning_jp: "増加する" },
  { word: "decrease", meaning_jp: "減少する" },
  { word: "attend", meaning_jp: "出席する" },
  { word: "participate", meaning_jp: "参加する" },
  { word: "deliver", meaning_jp: "届ける" },
  { word: "schedule", meaning_jp: "予定する" },
  { word: "reschedule", meaning_jp: "予定変更する" },
  { word: "available", meaning_jp: "利用可能な" },
  { word: "responsible", meaning_jp: "責任がある" },
  { word: "require", meaning_jp: "必要とする" },
  { word: "offer", meaning_jp: "提供する" },
  { word: "approve", meaning_jp: "承認する" },
  { word: "prepare", meaning_jp: "準備する" },
  { word: "complete", meaning_jp: "完了する" },
  { word: "confirm", meaning_jp: "確認する" },
  { word: "increase in sales", meaning_jp: "売上の増加" },
  { word: "on time", meaning_jp: "時間通りに" },
  { word: "in advance", meaning_jp: "事前に" },
  { word: "be in charge of", meaning_jp: "担当している" },
  { word: "according to", meaning_jp: "〜によると" }
];

const grammarQuestions = [
  {
    question: "She (_____) the report yesterday.",
    options: ["submits", "submitted", "submitting", "submit"],
    correct: "submitted",
    explanation: "yesterday があるので過去形 submitted が正解。"
  },
  {
    question: "The meeting has been (_____) to next Monday.",
    options: ["postponed", "postpone", "postponing", "postpones"],
    correct: "postponed",
    explanation: "has been + 過去分詞 なので postponed."
  },
  {
    question: "Please (_____) me if you have any questions.",
    options: ["contact", "contacts", "contacting", "to contact"],
    correct: "contact",
    explanation: "命令文なので動詞の原形 contact が入る。"
  },
  {
    question: "We are looking forward to (_____) you.",
    options: ["see", "seeing", "seen", "to see"],
    correct: "seeing",
    explanation: "look forward to の後ろは動名詞 seeing。"
  },
  {
    question: "The new system is expected (_____) costs.",
    options: ["reduce", "to reduce", "reducing", "reduced"],
    correct: "to reduce",
    explanation: "is expected to + 動詞の原形 → to reduce。"
  },
  {
    question: "He is responsible (_____) managing the team.",
    options: ["for", "to", "at", "on"],
    correct: "for",
    explanation: "responsible for ～ で「～に責任がある」。"
  },
  {
    question: "The documents must be (_____) by Friday.",
    options: ["submit", "submitting", "submitted", "to submit"],
    correct: "submitted",
    explanation: "must be + 過去分詞 → 受動態 submitted。"
  },
  {
    question: "Our office is closed (_____) weekends.",
    options: ["in", "on", "at", "for"],
    correct: "on",
    explanation: "曜日・週末には on を使う。"
  },
  {
    question: "She has worked here (_____) three years.",
    options: ["for", "since", "during", "from"],
    correct: "for",
    explanation: "for + 期間（three years）で「〜の間」。"
  },
  {
    question: "The manager asked him (_____) the report.",
    options: ["rewrite", "rewriting", "to rewrite", "rewritten"],
    correct: "to rewrite",
    explanation: "ask 人 to 動詞 で「〜するよう頼む」。"
  }
];

// ==================== 単語クイズ状態 ====================
let quizOrder = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizReviewMode = false;
let wordMistakes = new Set(); // 復習対象（単語）の集合

// ==================== 文法クイズ状態 ====================
let grammarOrder = [];
let grammarIndex = 0;
let grammarCorrect = 0;
let grammarReviewMode = false;
let grammarMistakes = new Set(); // 復習対象（文法）の集合

// ==================== 発音・AI会話 ====================
let pronRecognition = null;
let pronListening = false;
let pronBuffer = "";

let talkRecognition = null;
let talkListening = false;
let talkBuffer = "";

// ==================== AIエンドポイント ====================
const API_ENDPOINT =
  "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

async function callWorker(message) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (data.reply) return data.reply;
  if (data.error) {
    throw new Error(
      data.error + (data.detail ? " / " + JSON.stringify(data.detail) : "")
    );
  }
  throw new Error("Unexpected response from API");
}

// ==================== 単語クイズ ====================
function startWordQuiz(review = false) {
  playSE(seClick);
  quizReviewMode = review;

  const quizModeLabelEl = $("quiz-mode-label");

  if (review) {
    if (wordMistakes.size === 0) {
      alert("復習する単語がありません。まず通常モードで解いてみましょう。");
      return;
    }
    quizOrder = shuffle(Array.from(wordMistakes));
    if (quizModeLabelEl) quizModeLabelEl.textContent = "復習モード（単語）";
  } else {
    quizOrder = shuffle([...day1Words.keys()]);
    if (quizModeLabelEl) quizModeLabelEl.textContent = "本番モード（単語）";
  }

  quizIndex = 0;
  quizCorrect = 0;
  updateWordProgress(0);
  const feedbackEl = $("feedback");
  if (feedbackEl) feedbackEl.textContent = "";
  const btnNext = $("btn-next");
  if (btnNext) btnNext.style.display = "none";

  show("quiz");
  renderWordQuestion();
}

function renderWordQuestion() {
  if (quizIndex >= quizOrder.length) {
    showWordResult();
    return;
  }
  const qIndex = quizOrder[quizIndex];
  const q = day1Words[qIndex];

  const questionEl = $("quiz-question");
  const counterEl  = $("quiz-counter");
  const feedbackEl = $("feedback");
  const btnNext    = $("btn-next");

  if (questionEl) questionEl.textContent = q.word;
  if (counterEl)  counterEl.textContent  = `${quizIndex + 1} / ${quizOrder.length}`;
  if (feedbackEl) feedbackEl.textContent = "";
  if (btnNext)    btnNext.style.display = "none";

  const others = shuffle(day1Words.filter((w, i) => i !== qIndex)).slice(0, 3);
  const options = shuffle([q.meaning_jp, ...others.map(o => o.meaning_jp)]);

  const box = $("choices");
  if (!box) return;
  box.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => {
      playSE(seClick);
      handleWordAnswer(btn, opt, qIndex);
    };
    box.appendChild(btn);
  });
}

function handleWordAnswer(btn, chosen, qIndex) {
  const q = day1Words[qIndex];
  const correctAns = q.meaning_jp;
  const box = $("choices");
  const feedbackEl = $("feedback");
  const btnNext = $("btn-next");

  if (box) {
    Array.from(box.children).forEach(b => b.disabled = true);
  }

  if (chosen === correctAns) {
    btn.classList.add("correct");
    if (feedbackEl) feedbackEl.textContent = "正解！";
    quizCorrect++;
    // 復習モードで正解したら復習リストから削除
    if (quizReviewMode) {
      wordMistakes.delete(qIndex);
    }
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    if (feedbackEl) feedbackEl.textContent = `不正解… 正解: ${correctAns}`;
    wordMistakes.add(qIndex);
    playSE(seWrong);
  }

  updateWordProgress(quizIndex + 1);
  if (btnNext) btnNext.style.display = "block";
}

function updateWordProgress(done) {
  const total = quizOrder.length || day1Words.length;
  const inner = $("progress-inner");
  const text  = $("progress-text");
  if (inner) inner.style.width = (done / total * 100) + "%";
  if (text)  text.textContent  = `${done} / ${total}`;
}

function showWordResult() {
  const total = quizOrder.length;
  const rate = total ? Math.round(quizCorrect / total * 100) : 0;

  const scoreEl = $("result-score");
  const rateEl  = $("result-rate");
  const rankEl  = $("result-rank");
  if (scoreEl) scoreEl.textContent = `正解数 ${quizCorrect} / ${total}`;
  if (rateEl)  rateEl.textContent  = `正答率 ${rate}%`;
  if (rankEl) {
    rankEl.textContent =
      "ランク " + (rate >= 90 ? "S" : rate >= 75 ? "A" : rate >= 60 ? "B" : "C");
  }

  const list = $("mistake-list");
  if (list) {
    list.innerHTML = "";
    Array.from(wordMistakes).forEach(idx => {
      const w = day1Words[idx];
      const li = document.createElement("li");
      li.textContent = `${w.word} - ${w.meaning_jp}`;
      list.appendChild(li);
    });
  }

  const hasReview = wordMistakes.size > 0;
  const btnReview   = $("btn-review");
  const btnGoReview = $("btn-go-review");
  if (btnReview)   btnReview.disabled   = !hasReview;
  if (btnGoReview) btnGoReview.disabled = !hasReview;

  show("result");
}

// ==================== 文法クイズ ====================
function startGrammarQuiz(review = false) {
  playSE(seClick);
  grammarReviewMode = review;

  if (review) {
    if (grammarMistakes.size === 0) {
      alert("復習する文法問題がありません。まず通常モードで解いてみましょう。");
      return;
    }
    grammarOrder = shuffle(Array.from(grammarMistakes));
  } else {
    grammarOrder = shuffle([...grammarQuestions.keys()]);
  }

  grammarIndex = 0;
  grammarCorrect = 0;
  const fb = $("grammar-feedback");
  const btnNext = $("btn-grammar-next");
  if (fb) fb.textContent = "";
  if (btnNext) btnNext.style.display = "none";

  show("grammar");
  renderGrammarQuestion();
}

// 「文法クイズ」ボタン押したとき：復習するかどうか選ばせる
function handleGrammarButtonClick() {
  if (grammarMistakes.size > 0) {
    const useReview = confirm(
      "前回までに間違えた文法問題を復習しますか？\n\nOK：復習モード\nキャンセル：新規で10問解く"
    );
    if (useReview) {
      startGrammarQuiz(true);
      return;
    }
  }
  startGrammarQuiz(false);
}

function renderGrammarQuestion() {
  if (grammarIndex >= grammarOrder.length) {
    showGrammarResult();
    return;
  }
  const qIndex = grammarOrder[grammarIndex];
  const q = grammarQuestions[qIndex];

  const qEl   = $("grammar-question");
  const cntEl = $("grammar-counter");
  const fbEl  = $("grammar-feedback");
  const progEl= $("grammar-progress");
  const btnNext = $("btn-grammar-next");

  if (qEl)   qEl.textContent   = q.question;
  if (cntEl) cntEl.textContent = `${grammarIndex + 1} / ${grammarOrder.length}`;
  if (fbEl)  fbEl.textContent  = "";
  if (progEl)progEl.textContent= `正解数 ${grammarCorrect} / ${grammarIndex}`;
  if (btnNext) btnNext.style.display = "none";

  const box = $("grammar-choices");
  if (!box) return;
  box.innerHTML = "";
  shuffle(q.options).forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => {
      playSE(seClick);
      handleGrammarAnswer(btn, opt, qIndex);
    };
    box.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, chosen, qIndex) {
  const q = grammarQuestions[qIndex];

  const box = $("grammar-choices");
  const fbEl = $("grammar-feedback");
  const progEl = $("grammar-progress");
  const btnNext = $("btn-grammar-next");

  if (box) {
    Array.from(box.children).forEach(b => b.disabled = true);
  }

  if (chosen === q.correct) {
    btn.classList.add("correct");
    if (fbEl) fbEl.textContent = "✅ 正解！ " + q.explanation;
    grammarCorrect++;
    if (grammarReviewMode) {
      grammarMistakes.delete(qIndex);
    }
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    if (fbEl)
      fbEl.textContent = `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    grammarMistakes.add(qIndex);
    playSE(seWrong);
  }

  if (progEl)
    progEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  if (btnNext) btnNext.style.display = "block";
}

function showGrammarResult() {
  const total = grammarOrder.length;
  const rate = total ? Math.round(grammarCorrect / total * 100) : 0;
  let msg = `文法クイズ結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5 もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  const fbEl = $("grammar-feedback");
  if (fbEl) fbEl.textContent = msg;
}

// ==================== 発音トレーニング ====================
function initPronRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const fbEl = $("pron-feedback");
  if (!SR) {
    if (fbEl)
      fbEl.textContent =
        "このブラウザでは音声認識が使えません（Chrome 推奨）。";
    return;
  }
  pronRecognition = new SR();
  pronRecognition.lang = "en-US";
  pronRecognition.interimResults = true;
  pronRecognition.continuous = true;

  // final 結果を順次蓄積（間が空いても消えない）
  pronRecognition.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) {
        pronBuffer += " " + result[0].transcript;
      }
    }
    pronBuffer = pronBuffer.trim();
    const txtEl = $("pron-text");
    if (txtEl)
      txtEl.textContent = pronBuffer || "（音声を認識しています…）";
  };

  pronRecognition.onerror = (e) => {
    console.log("pron error", e);
    if (fbEl)
      fbEl.textContent =
        "音声認識中にエラーが発生しました：" + e.error;
  };

  pronRecognition.onend = () => {
    if (pronListening && pronRecognition) {
      try {
        pronRecognition.start();
      } catch (e) {
        console.log("pron restart error", e);
      }
    }
  };
}

function startPron() {
  playSE(seClick);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !pronRecognition) {
    alert("このブラウザでは音声認識が使えません。Chrome を使ってください。");
    return;
  }
  pronListening = true;
  pronBuffer = "";
  const txtEl = $("pron-text");
  const fbEl  = $("pron-feedback");
  if (txtEl) txtEl.textContent = "話し始めてください…";
  if (fbEl)
    fbEl.textContent = "録音中… 話し終わったら停止ボタンを押してください。";
  try {
    pronRecognition.start();
  } catch (e) {
    console.log("pron start error", e);
  }
}

async function stopPron() {
  playSE(seClick);
  pronListening = false;
  try {
    if (pronRecognition) pronRecognition.stop();
  } catch (e) {
    console.log("pron stop error", e);
  }

  const fbEl = $("pron-feedback");
  const text = (pronBuffer || "").trim();
  if (!text) {
    if (fbEl)
      fbEl.textContent =
        "音声が認識されませんでした。もう一度お試しください。";
    return;
  }

  if (fbEl) fbEl.textContent = "AIコーチがチェック中…";

  const prompt =
    "あなたは TOEIC 学習者向けの英語コーチです。次の英文について、" +
    "1) 文法が自然かどうか、2) よりよい表現があれば1つ提案してください。" +
    "解説は日本語で、最後に模範英作文を1つだけ示してください。\n\n" +
    "【学習者の英文】\n" + text;

  try {
    const reply = await callWorker(prompt);
    if (fbEl) fbEl.textContent = reply;
  } catch (e) {
    if (fbEl)
      fbEl.textContent =
        "AI コーチ呼び出し中にエラーが発生しました：" + e.toString();
  }
}

// ==================== チャット共通UI ====================
function addChatBubble(logEl, text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// ==================== AI英語チャット ====================
function showChatIntro() {
  const log = $("chat-log");
  if (!log) return;
  log.innerHTML = "";
  const intro =
    "こんにちは！AI英語チャットです。\n\n" +
    "▼できること\n" +
    "・英単語の意味／例文\n" +
    "・英文の添削\n" +
    "・日本語→英語の翻訳\n" +
    "・TOEICの勉強方法の相談 など\n\n" +
    "💡下の「クイック質問ボタン」か、入力欄に自由に質問を書いてください。";
  addChatBubble(log, intro, false);
}

async function handleChatSend(customText) {
  const log = $("chat-log");
  const input = $("chat-input");
  if (!log || !input) return;

  const text = (customText ?? input.value).trim();
  if (!text) return;

  addChatBubble(log, text, true);
  input.value = "";

  addChatBubble(log, "考え中…", false);
  const thinking = log.lastChild;

  const prompt =
    "あなたは TOEIC 学習者向けの英語コーチです。次の質問に対して、" +
    "必要に応じて日本語で解説しながら、丁寧に答えてください。\n\n" +
    text;

  try {
    const reply = await callWorker(prompt);
    thinking.textContent = reply;
  } catch (e) {
    thinking.textContent = "エラーが発生しました：" + e.toString();
  }
}

// ==================== AI英会話（Onigiri-kun：若い女性ボイス） ====================
let talkVoice = null;

function pickTalkVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;

  // 英語の女性っぽい声を優先
  const candidates = voices.filter(v =>
    v.lang && v.lang.toLowerCase().startsWith("en") &&
    /female|samantha|google uk english female|google us english/i.test(v.name)
  );
  talkVoice =
    candidates[0] ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith("en")) ||
    voices[0];
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = pickTalkVoice;
  pickTalkVoice();
}

function initTalkRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusEl = $("talk-status");
  const heardEl  = $("talk-heard");

  if (!SR) {
    if (statusEl)
      statusEl.textContent =
        "このブラウザでは音声認識が使えません（Chrome 推奨）。";
    return;
  }
  talkRecognition = new SR();
  talkRecognition.lang = "en-US";
  talkRecognition.interimResults = true;
  talkRecognition.continuous = true;

  // final 結果だけを蓄積（間が空いても消えない）
  talkRecognition.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      if (result.isFinal) {
        talkBuffer += " " + result[0].transcript;
      }
    }
    talkBuffer = talkBuffer.trim();
    if (heardEl)
      heardEl.textContent = talkBuffer || "（音声を認識しています…）";
  };

  talkRecognition.onerror = (e) => {
    console.log("talk error", e);
    if (heardEl)
      heardEl.textContent =
        "音声認識中にエラーが発生しました：" + e.error;
  };

  // 停止ボタンを押すまで自動で再スタート
  talkRecognition.onend = () => {
    if (talkListening && talkRecognition) {
      try {
        talkRecognition.start();
      } catch (e) {
        console.log("talk restart error", e);
      }
    }
  };
}

function addTalkMessage(text, isUser) {
  const log = $("talk-log");
  if (!log) return;
  addChatBubble(log, text, isUser);
}

function startVoiceTalk() {
  playSE(seClick);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !talkRecognition) {
    alert("このブラウザでは音声認識が使えません。Chrome（PC or Android）でお試しください。");
    return;
  }
  talkListening = true;
  talkBuffer = "";
  const heardEl  = $("talk-heard");
  const statusEl = $("talk-status");
  if (heardEl)  heardEl.textContent  = "話し始めてください…";
  if (statusEl) statusEl.textContent = "ステータス：録音中（停止ボタンで送信）";
  try {
    talkRecognition.start();
  } catch (e) {
    console.log("talk start error", e);
  }
}

async function stopVoiceTalk() {
  playSE(seClick);
  talkListening = false;
  try {
    if (talkRecognition) talkRecognition.stop();
  } catch (e) {
    console.log("talk stop error", e);
  }

  const statusEl = $("talk-status");
  const text = (talkBuffer || "").trim();
  if (!text) {
    if (statusEl)
      statusEl.textContent =
        "ステータス：音声が認識されませんでした。もう一度お試しください。";
    return;
  }

  if (statusEl)
    statusEl.textContent = "ステータス：Onigiri-kun が考え中…";

  addTalkMessage(text, true);
  addTalkMessage("Onigiri-kun is thinking…", false);
  const log = $("talk-log");
  const thinking = log ? log.lastChild : null;

  const prompt =
    "You are 'Onigiri-kun', a friendly young Japanese woman English speaking partner.\n" +
    "Have a casual conversation in ENGLISH with a Japanese learner of English.\n" +
    "Their sentence may have some mistakes, but you should understand the meaning and reply naturally.\n" +
    "Use simple, natural English (around CEFR B1 level).\n" +
    "IMPORTANT:\n" +
    "- Do NOT explain grammar.\n" +
    "- Do NOT speak Japanese in the English sentence.\n" +
    "- After your English reply, provide one short Japanese translation on the next line.\n" +
    "- Format STRICTLY as:\n" +
    "EN: (your English reply)\n" +
    "JP: (Japanese translation)\n\n" +
    "User said:\n" + text + "\n\nNow reply in the required format:";

  try {
    const reply = await callWorker(prompt);

    let en = reply;
    let jp = "";
    const jpIndex = reply.indexOf("JP:");
    if (jpIndex !== -1) {
      en = reply.slice(0, jpIndex).replace(/^EN:\s*/i, "").trim();
      jp = reply.slice(jpIndex).replace(/^JP:\s*/i, "").trim();
    }

    const finalText = jp ? `EN: ${en}\nJP: ${jp}` : reply;
    if (thinking) thinking.textContent = finalText;
    if (statusEl) statusEl.textContent = "ステータス：会話待機中";

    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(en || reply);
      u.lang = "en-US";
      if (talkVoice) u.voice = talkVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    if (thinking) thinking.textContent = "Error: " + e.toString();
    if (statusEl) statusEl.textContent = "ステータス：エラーが発生しました";
  }
}

// ==================== 初期化 ====================
window.addEventListener("DOMContentLoaded", () => {
  screens = {
    home: $("screen-home"),
    quiz: $("screen-quiz"),
    result: $("screen-result"),
    grammar: $("screen-grammar"),
    pronunciation: $("screen-pronunciation"),
    chat: $("screen-chat"),
    talk: $("screen-talk")
  };

  seCorrect = $("se-correct");
  seNext    = $("se-next");
  seWrong   = $("se-wrong");
  seClick   = $("se-click");

  initPronRecognition();
  initTalkRecognition();

  // 単語クイズ
  const btnStart      = $("btn-start");
  const btnReview     = $("btn-review");
  const btnNext       = $("btn-next");
  const btnQuit       = $("btn-quit");
  const btnAgain      = $("btn-again");
  const btnGoReview   = $("btn-go-review");
  const btnBackHome   = $("btn-back-home");

  if (btnStart)    btnStart.onclick    = () => startWordQuiz(false);
  if (btnReview)   btnReview.onclick   = () => startWordQuiz(true);
  if (btnNext)     btnNext.onclick     = () => { playSE(seNext); quizIndex++; renderWordQuestion(); };
  if (btnQuit)     btnQuit.onclick     = () => { playSE(seClick); show("home"); };
  if (btnAgain)    btnAgain.onclick    = () => startWordQuiz(false);
  if (btnGoReview) btnGoReview.onclick = () => startWordQuiz(true);
  if (btnBackHome) btnBackHome.onclick = () => { playSE(seClick); show("home"); };

  // 文法
  const btnGrammar      = $("btn-grammar");
  const btnGrammarNext  = $("btn-grammar-next");
  const btnGrammarBack  = $("btn-grammar-back");

  if (btnGrammar)      btnGrammar.onclick      = handleGrammarButtonClick;
  if (btnGrammarNext)  btnGrammarNext.onclick  = () => { playSE(seNext); grammarIndex++; renderGrammarQuestion(); };
  if (btnGrammarBack)  btnGrammarBack.onclick  = () => { playSE(seClick); show("home"); };

  // 発音トレーニング
  const btnPronScreen = $("btn-pronunciation");
  const btnPronStart  = $("btn-pron-start");
  const btnPronStop   = $("btn-pron-stop");
  const btnPronBack   = $("btn-pron-back");

  if (btnPronScreen) btnPronScreen.onclick = () => { playSE(seClick); show("pronunciation"); };
  if (btnPronStart)  btnPronStart.onclick  = startPron;
  if (btnPronStop)   btnPronStop.onclick   = stopPron;
  if (btnPronBack)   btnPronBack.onclick   = () => { playSE(seClick); show("home"); };

  // AI英語チャット
  const btnChat        = $("btn-chat");
  const btnChatSend    = $("btn-chat-send");
  const btnChatExample = $("btn-chat-example");
  const btnChatSales   = $("btn-chat-sales");
  const btnChatBack    = $("btn-chat-back");
  const chatInput      = $("chat-input");

  if (btnChat) {
    btnChat.onclick = () => {
      playSE(seClick);
      show("chat");
      showChatIntro();
    };
  }
  if (btnChatSend)   btnChatSend.onclick   = () => handleChatSend();
  if (btnChatExample)btnChatExample.onclick= () => handleChatSend("今日の単語で例文を作って");
  if (btnChatSales)  btnChatSales.onclick  = () => handleChatSend("営業のシーンで使える表現を教えて");
  if (btnChatBack)   btnChatBack.onclick   = () => { playSE(seClick); show("home"); };
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // AI英会話
  const btnTalk      = $("btn-talk");
  const btnTalkStart = $("btn-talk-start");
  const btnTalkStop  = $("btn-talk-stop");
  const btnTalkBack  = $("btn-talk-back");

  if (btnTalk) {
    btnTalk.onclick = () => {
      playSE(seClick);
      show("talk");
      const log = $("talk-log");
      if (log && log.children.length === 0) {
        addTalkMessage(
          "EN: Hi, I'm Onigiri-kun! 🍙 I'm your English speaking partner. You can start by telling me your name or asking me a question.\n" +
          "JP: こんにちは、おにぎりくんだよ！まずは自己紹介や質問から始めてみてね。",
          false
        );
      }
    };
  }
  if (btnTalkStart) btnTalkStart.onclick = startVoiceTalk;
  if (btnTalkStop)  btnTalkStop.onclick  = stopVoiceTalk;
  if (btnTalkBack)  btnTalkBack.onclick  = () => { playSE(seClick); show("home"); };

  // 初期進捗
  updateWordProgress(0);
});
