// ==================== 共通ユーティリティ ====================
function $(id) {
  return document.getElementById(id);
}

let screens = {};
let seCorrect, seNext, seWrong, seClick;

function show(name) {
  Object.values(screens).forEach((s) => s && s.classList.remove("active"));
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
  { word: "according to", meaning_jp: "〜によると" },
];

const grammarQuestions = [
  {
    question: "She (_____) the report yesterday.",
    options: ["submits", "submitted", "submitting", "submit"],
    correct: "submitted",
    explanation: "yesterday があるので過去形 submitted が正解。",
  },
  {
    question: "The meeting has been (_____) to next Monday.",
    options: ["postponed", "postpone", "postponing", "postpones"],
    correct: "postponed",
    explanation: "has been + 過去分詞 なので postponed。",
  },
  {
    question: "Please (_____) me if you have any questions.",
    options: ["contact", "contacts", "contacting", "to contact"],
    correct: "contact",
    explanation: "命令文なので動詞の原形 contact が入る。",
  },
  {
    question: "We are looking forward to (_____) you.",
    options: ["see", "seeing", "seen", "to see"],
    correct: "seeing",
    explanation: "look forward to の後ろは動名詞 seeing。",
  },
  {
    question: "The new system is expected (_____) costs.",
    options: ["reduce", "to reduce", "reducing", "reduced"],
    correct: "to reduce",
    explanation: "is expected to + 動詞の原形 → to reduce。",
  },
  {
    question: "He is responsible (_____) managing the team.",
    options: ["for", "to", "at", "on"],
    correct: "for",
    explanation: "responsible for ～ で「～に責任がある」。",
  },
  {
    question: "The documents must be (_____) by Friday.",
    options: ["submit", "submitting", "submitted", "to submit"],
    correct: "submitted",
    explanation: "must be + 過去分詞 → 受動態 submitted。",
  },
  {
    question: "Our office is closed (_____) weekends.",
    options: ["in", "on", "at", "for"],
    correct: "on",
    explanation: "曜日・週末には on を使う。",
  },
  {
    question: "She has worked here (_____) three years.",
    options: ["for", "since", "during", "from"],
    correct: "for",
    explanation: "for + 期間（three years）で「〜の間」。",
  },
  {
    question: "The manager asked him (_____) the report.",
    options: ["rewrite", "rewriting", "to rewrite", "rewritten"],
    correct: "to rewrite",
    explanation: "ask 人 to 動詞 で「〜するよう頼む」。",
  },
];

// ==================== 単語クイズ状態 ====================
let quizOrder = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizWrongIndices = [];
let quizReviewMode = false;

// ==================== 文法クイズ状態 ====================
let grammarOrder = [];
let grammarIndex = 0;
let grammarCorrect = 0;
let grammarWrongIndices = [];
let grammarReviewMode = false;

// ==================== 発音・AI会話 ====================
let pronRecognition = null;
let pronListening = false;
let pronBuffer = "";

let talkRecognition = null;
let talkListening = false;
let talkBuffer = "";

// ==================== API ====================
const API_ENDPOINT =
  "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

async function callWorker(message) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
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

  let indices;
  if (review) {
    if (quizWrongIndices.length === 0) {
      alert("復習する単語がありません。まず通常モードで解いてみましょう。");
      return;
    }
    indices = shuffle(quizWrongIndices);
    quizWrongIndices = [];
    $("quiz-mode-label").textContent = "復習モード（単語）";
  } else {
    indices = shuffle([...day1Words.keys()]);
    $("quiz-mode-label").textContent = "本番モード（単語）";
  }

  quizOrder = indices;
  quizIndex = 0;
  quizCorrect = 0;
  updateWordProgress(0);
  $("feedback").textContent = "";
  $("btn-next").style.display = "none";

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

  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent = `${quizIndex + 1} / ${quizOrder.length}`;
  $("feedback").textContent = "";
  $("btn-next").style.display = "none";

  const others = shuffle(day1Words.filter((w, i) => i !== qIndex)).slice(0, 3);
  const options = shuffle([q.meaning_jp, ...others.map((o) => o.meaning_jp)]);

  const box = $("choices");
  box.innerHTML = "";
  options.forEach((opt) => {
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

  Array.from($("choices").children).forEach((b) => (b.disabled = true));

  if (chosen === correctAns) {
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    quizCorrect++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correctAns}`;
    if (!quizWrongIndices.includes(qIndex)) quizWrongIndices.push(qIndex);
    playSE(seWrong);
  }

  updateWordProgress(quizIndex + 1);
  $("btn-next").style.display = "block";
}

function updateWordProgress(done) {
  const total = quizOrder.length || day1Words.length;
  $("progress-inner").style.width = (done / total) * 100 + "%";
  $("progress-text").textContent = `${done} / ${total}`;
}

function showWordResult() {
  const total = quizOrder.length;
  const rate = total ? Math.round((quizCorrect / total) * 100) : 0;

  $("result-score").textContent = `正解数 ${quizCorrect} / ${total}`;
  $("result-rate").textContent = `正答率 ${rate}%`;
  $("result-rank").textContent =
    "ランク " + (rate >= 90 ? "S" : rate >= 75 ? "A" : rate >= 60 ? "B" : "C");

  const list = $("mistake-list");
  list.innerHTML = "";
  quizWrongIndices.forEach((idx) => {
    const w = day1Words[idx];
    const li = document.createElement("li");
    li.textContent = `${w.word} - ${w.meaning_jp}`;
    list.appendChild(li);
  });

  const hasReview = quizWrongIndices.length > 0;
  $("btn-review").disabled = !hasReview;
  $("btn-go-review").disabled = !hasReview;

  show("result");
}

// ==================== 文法クイズ ====================
function startGrammarQuiz(review = false) {
  playSE(seClick);
  grammarReviewMode = review;

  let indices;
  if (review) {
    if (grammarWrongIndices.length === 0) {
      alert("復習する文法問題がありません。まず通常モードで解いてみましょう。");
      return;
    }
    indices = shuffle(grammarWrongIndices);
    grammarWrongIndices = [];
    $("grammar-mode-label").textContent = "文法復習モード";
  } else {
    indices = shuffle([...grammarQuestions.keys()]);
    $("grammar-mode-label").textContent = "文法クイズ（例文穴埋め）";
  }

  grammarOrder = indices;
  grammarIndex = 0;
  grammarCorrect = 0;
  $("grammar-feedback").textContent = "";
  $("btn-grammar-next").style.display = "none";

  show("grammar");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  if (grammarIndex >= grammarOrder.length) {
    showGrammarResult();
    return;
  }
  const qIndex = grammarOrder[grammarIndex];
  const q = grammarQuestions[qIndex];

  $("grammar-question").textContent = q.question;
  $("grammar-counter").textContent = `${grammarIndex + 1} / ${
    grammarOrder.length
  }`;
  $("grammar-feedback").textContent = "";
  $("grammar-progress").textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;
  $("btn-grammar-next").style.display = "none";

  const box = $("grammar-choices");
  box.innerHTML = "";
  shuffle(q.options).forEach((opt) => {
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

  Array.from($("grammar-choices").children).forEach(
    (b) => (b.disabled = true)
  );

  if (chosen === q.correct) {
    btn.classList.add("correct");
    $("grammar-feedback").textContent = "✅ 正解！ " + q.explanation;
    grammarCorrect++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("grammar-feedback").textContent = `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    if (!grammarWrongIndices.includes(qIndex)) grammarWrongIndices.push(qIndex);
    playSE(seWrong);
  }

  $("grammar-progress").textContent = `正解数 ${grammarCorrect} / ${
    grammarIndex + 1
  }`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = grammarOrder.length;
  const rate = total ? Math.round((grammarCorrect / total) * 100) : 0;
  let msg = `文法クイズ結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5 もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  $("grammar-feedback").textContent = msg;

  const hasReview = grammarWrongIndices.length > 0;
  $("btn-grammar-review").disabled = !hasReview;
}

// ==================== 発音トレーニング ====================
function initPronRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    $("pron-feedback").textContent =
      "このブラウザでは音声認識が使えません（Chrome 推奨）。";
    return;
  }
  pronRecognition = new SR();
  pronRecognition.lang = "en-US";
  pronRecognition.interimResults = true;
  pronRecognition.continuous = true;

  pronRecognition.onresult = (e) => {
    let text = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
    }
    pronBuffer = text.trim();
    $("pron-text").textContent =
      pronBuffer || "（音声を認識しています…）";
  };

  pronRecognition.onerror = (e) => {
    console.log("pron error", e);
    $("pron-feedback").textContent =
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
  if (!pronRecognition) {
    alert("このブラウザでは音声認識が使えません。Chrome を使ってください。");
    return;
  }
  pronListening = true;
  pronBuffer = "";
  $("pron-text").textContent = "話し始めてください…";
  $("pron-feedback").textContent = "録音中… 話し終わったら停止ボタンを押してください。";
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
    pronRecognition.stop();
  } catch (e) {
    console.log("pron stop error", e);
  }

  const text = pronBuffer.trim();
  if (!text) {
    $("pron-feedback").textContent =
      "音声が認識されませんでした。もう一度お試しください。";
    return;
  }

  $("pron-feedback").textContent = "AIコーチがチェック中…";

  const prompt =
    "あなたは TOEIC 学習者向けの英語コーチです。次の英文について、" +
    "1) 文法が自然かどうか、2) よりよい表現があれば1つ提案してください。" +
    "解説は日本語で、最後に模範英作文を1つだけ示してください。\n\n" +
    "【学習者の英文】\n" +
    text;

  try {
    const reply = await callWorker(prompt);
    $("pron-feedback").textContent = reply;
  } catch (e) {
    $("pron-feedback").textContent =
      "AI コーチ呼び出し中にエラーが発生しました：" + e.toString();
  }
}

// ==================== AI英語チャット ====================
function addChatBubble(logEl, text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

async function handleChatSend(customText) {
  const log = $("chat-log");
  const input = $("chat-input");
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

// ==================== AI英会話（Onigiri-kun） ====================
function initTalkRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    const status = $("talk-status");
    if (status)
      status.textContent =
        "このブラウザでは音声認識が使えません（Chrome 推奨）。";
    return;
  }
  talkRecognition = new SR();
  talkRecognition.lang = "en-US";
  talkRecognition.interimResults = true;
  talkRecognition.continuous = true;

  talkRecognition.onresult = (e) => {
    let text = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
    }
    talkBuffer = text.trim();
    $("talk-heard").textContent =
      talkBuffer || "（音声を認識しています…）";
  };

  talkRecognition.onerror = (e) => {
    console.log("talk error", e);
    $("talk-heard").textContent =
      "音声認識中にエラーが発生しました：" + e.error;
  };

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
  if (!talkRecognition) {
    alert("このブラウザでは音声認識が使えません。Chrome を使ってください。");
    return;
  }
  talkListening = true;
  talkBuffer = "";
  $("talk-heard").textContent = "話し始めてください…";
  $("talk-status").textContent = "ステータス：録音中（停止ボタンで送信）";
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
    talkRecognition.stop();
  } catch (e) {
    console.log("talk stop error", e);
  }

  const text = talkBuffer.trim();
  if (!text) {
    $("talk-status").textContent =
      "ステータス：音声が認識されませんでした。もう一度お試しください。";
    return;
  }

  $("talk-status").textContent = "ステータス：Onigiri-kun が考え中…";

  addTalkMessage(text, true);
  addTalkMessage("Onigiri-kun is thinking…", false);
  const log = $("talk-log");
  const thinking = log.lastChild;

  // ★ 英会話専用: 英語のみで返事。文法分析・日本語解説なし。
  const prompt =
    "You are 'Onigiri-kun', a friendly rice-ball character and English speaking partner.\n" +
    "Have a casual conversation in English only with a Japanese learner of English.\n" +
    "Their sentence may have some mistakes, but you should understand the meaning and reply naturally.\n" +
    "Use simple, natural English (around CEFR B1 level). Do NOT explain grammar, do NOT switch to Japanese.\n" +
    "Keep the conversation going by asking a short follow-up question at the end.\n\n" +
    "User said:\n" +
    text +
    "\n\nReply as Onigiri-kun in English only:";

  try {
    const reply = await callWorker(prompt);
    thinking.textContent = reply;
    $("talk-status").textContent = "ステータス：会話待機中";

    // 英語音声で読み上げ（不要ならこのブロックごと消してOK）
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(reply);
      u.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    thinking.textContent = "Error: " + e.toString();
    $("talk-status").textContent = "ステータス：エラーが発生しました";
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
    talk: $("screen-talk"),
  };

  seCorrect = $("se-correct");
  seNext = $("se-next");
  seWrong = $("se-wrong");
  seClick = $("se-click");

  initPronRecognition();
  initTalkRecognition();

  // 単語クイズ
  $("btn-start").onclick = () => startWordQuiz(false);
  $("btn-review").onclick = () => startWordQuiz(true);
  $("btn-next").onclick = () => {
    playSE(seNext);
    quizIndex++;
    renderWordQuestion();
  };
  $("btn-quit").onclick = () => {
    playSE(seClick);
    show("home");
  };
  $("btn-again").onclick = () => startWordQuiz(false);
  $("btn-go-review").onclick = () => startWordQuiz(true);
  $("btn-back-home").onclick = () => {
    playSE(seClick);
    show("home");
  };

  // 文法
  $("btn-grammar").onclick = () => startGrammarQuiz(false);
  $("btn-grammar-review").onclick = () => startGrammarQuiz(true);
  $("btn-grammar-next").onclick = () => {
    playSE(seNext);
    grammarIndex++;
    renderGrammarQuestion();
  };
  $("btn-grammar-back").onclick = () => {
    playSE(seClick);
    show("home");
  };

  // 発音
  $("btn-pronunciation").onclick = () => {
    playSE(seClick);
    show("pronunciation");
  };
  $("btn-pron-start").onclick = startPron;
  $("btn-pron-stop").onclick = stopPron;
  $("btn-pron-back").onclick = () => {
    playSE(seClick);
    show("home");
  };

  // AIチャット
  $("btn-chat").onclick = () => {
    playSE(seClick);
    $("chat-log").innerHTML = "";
    show("chat");
  };
  $("btn-chat-send").onclick = () => handleChatSend();
  $("btn-chat-example").onclick = () =>
    handleChatSend("今日の単語で例文を作って");
  $("btn-chat-sales").onclick = () =>
    handleChatSend("営業のシーンで使える表現を教えて");
  $("btn-chat-back").onclick = () => {
    playSE(seClick);
    show("home");
  };
  $("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleChatSend();
    }
  });

  // AI英会話
  $("btn-talk").onclick = () => {
    playSE(seClick);
    show("talk");
    const log = $("talk-log");
    if (log && log.children.length === 0) {
      addTalkMessage(
        "Hi, I'm Onigiri-kun! 🍙 Let's practice English together. You can start by telling me your name or asking me a question.",
        false
      );
    }
  };
  $("btn-talk-start").onclick = startVoiceTalk;
  $("btn-talk-stop").onclick = stopVoiceTalk;
  $("btn-talk-back").onclick = () => {
    playSE(seClick);
    show("home");
  };

  // 初期進捗
  updateWordProgress(0);
});
