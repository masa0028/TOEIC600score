/*************************************************
 * TOEIC600ブートキャンプ
 * script.js 完全版（2025-12-09版）
 *
 * 機能:
 *  - 単語クイズ ＋ 復習モード
 *  - 文法クイズ ＋ 復習モード
 *  - 発音トレーニング（音声→テキスト→AIフィードバック）
 *  - AI英語チャット（テキスト）
 *  - AI英会話 Onigiri-kun（音声会話）
 *************************************************/

/* -----------------------------
   共通ヘルパー
----------------------------- */
function $(id) {
  return document.getElementById(id);
}

const screens = {
  home: $("screen-home"),
  quiz: $("screen-quiz"),
  result: $("screen-result"),
  grammar: $("screen-grammar"),
  pronounce: $("screen-pronounce"),
  chat: $("screen-chat"),
  talk: $("screen-talk")   // AI英会話
};

function showScreen(name) {
  Object.values(screens).forEach(s => s && s.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 効果音
const seCorrect = $("se-correct");
const seNext = $("se-next");
const seWrong = $("se-wrong");
const seClick = $("se-click");

function playSE(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

/* -----------------------------
   単語データ / 文法データ
----------------------------- */

// Day1単語
const day1Words = [
  { word: "increase",         meaning_jp: "増加する" },
  { word: "decrease",         meaning_jp: "減少する" },
  { word: "attend",           meaning_jp: "出席する" },
  { word: "participate",      meaning_jp: "参加する" },
  { word: "deliver",          meaning_jp: "届ける" },
  { word: "schedule",         meaning_jp: "予定する" },
  { word: "reschedule",       meaning_jp: "予定変更する" },
  { word: "available",        meaning_jp: "利用可能な" },
  { word: "responsible",      meaning_jp: "責任がある" },
  { word: "require",          meaning_jp: "必要とする" },
  { word: "offer",            meaning_jp: "提供する" },
  { word: "approve",          meaning_jp: "承認する" },
  { word: "prepare",          meaning_jp: "準備する" },
  { word: "complete",         meaning_jp: "完了する" },
  { word: "confirm",          meaning_jp: "確認する" },
  { word: "increase in sales",meaning_jp: "売上の増加" },
  { word: "on time",          meaning_jp: "時間通りに" },
  { word: "in advance",       meaning_jp: "事前に" },
  { word: "be in charge of",  meaning_jp: "担当している" },
  { word: "according to",     meaning_jp: "〜によると" }
];

// 文法
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
    explanation: "has been + 過去分詞 なので postponed。"
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

/* -----------------------------
   単語クイズ & 復習
----------------------------- */

let quizWords = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizMistakes = [];
let reviewWords = [];        // 復習用
let isReviewMode = false;

const quizModeLabel = $("quiz-mode-label");

function updateQuizProgress(done) {
  const total = quizWords.length || day1Words.length;
  $("progress-inner").style.width = (done / total * 100) + "%";
  $("progress-text").textContent = `${done} / ${total}`;
}

function startQuiz() {
  playSE(seClick);
  isReviewMode = false;
  quizWords = shuffle(day1Words);
  quizIndex = 0;
  quizCorrect = 0;
  quizMistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "本番モード";
  updateQuizProgress(0);
  showScreen("quiz");
  renderQuizQuestion();
}

function startReviewQuiz() {
  if (!reviewWords || reviewWords.length === 0) {
    alert("復習できる単語がまだありません。\nまずは単語クイズで問題を解いてください。");
    return;
  }
  playSE(seClick);
  isReviewMode = true;
  quizWords = shuffle(reviewWords);
  quizIndex = 0;
  quizCorrect = 0;
  quizMistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "復習モード（単語）";
  updateQuizProgress(0);
  showScreen("quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizWords.length) {
    showQuizResult();
    return;
  }
  const q = quizWords[quizIndex];

  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent = `${quizIndex + 1} / ${quizWords.length}`;
  $("feedback").textContent = "";
  $("btn-next").style.display = "none";

  const others = shuffle(day1Words.filter(w => w.meaning_jp !== q.meaning_jp));
  const choices = shuffle([
    q.meaning_jp,
    others[0].meaning_jp,
    others[1].meaning_jp,
    others[2].meaning_jp
  ]);

  const box = $("choices");
  box.innerHTML = "";
  choices.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = c;
    btn.onclick = () => {
      playSE(seClick);
      handleQuizAnswer(btn, c, q.meaning_jp, q);
    };
    box.appendChild(btn);
  });
}

// ★ここで「1問でも間違えたら復習ボタン解禁」
function handleQuizAnswer(btn, choice, correctAns, q) {
  Array.from($("choices").children).forEach(b => (b.disabled = true));

  if (choice === correctAns) {
    quizCorrect++;
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correctAns}`;
    quizMistakes.push(q);
    playSE(seWrong);

    reviewWords = quizMistakes.slice();
    const homeReviewBtn = $("btn-review");
    const resultReviewBtn = $("btn-go-review");
    if (homeReviewBtn) homeReviewBtn.disabled = reviewWords.length === 0;
    if (resultReviewBtn) resultReviewBtn.disabled = reviewWords.length === 0;
  }

  updateQuizProgress(quizIndex + 1);
  $("btn-next").style.display = "block";
}

function showQuizResult() {
  const total = quizWords.length || day1Words.length;
  const rate = total > 0 ? Math.round((quizCorrect / total) * 100) : 0;

  $("result-score").textContent = `正解数 ${quizCorrect} / ${total}`;
  $("result-rate").textContent = `正答率 ${rate}%`;
  $("result-rank").textContent =
    "ランク " + (rate >= 90 ? "S" : rate >= 75 ? "A" : rate >= 60 ? "B" : "C");

  const list = $("mistake-list");
  list.innerHTML = "";
  quizMistakes.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.word} - ${w.meaning_jp}`;
    list.appendChild(li);
  });

  reviewWords = quizMistakes.slice();
  const hasReview = reviewWords.length > 0;
  const btnReview = $("btn-review");
  const btnGoReview = $("btn-go-review");
  if (btnReview) btnReview.disabled = !hasReview;
  if (btnGoReview) btnGoReview.disabled = !hasReview;

  showScreen("result");
}

/* -----------------------------
   文法クイズ & 復習
----------------------------- */

let grammarIndex = 0;
let grammarCorrect = 0;
let grammarMistakes = new Set();   // 間違えた問題番号

const grammarQuestionEl = $("grammar-question");
const grammarChoicesEl = $("grammar-choices");
const grammarFeedbackEl = $("grammar-feedback");
const grammarCounterEl = $("grammar-counter");
const grammarProgressEl = $("grammar-progress");

function startGrammarQuiz(options = { reviewOnly: false }) {
  playSE(seClick);

  if (options.reviewOnly) {
    if (!grammarMistakes || grammarMistakes.size === 0) {
      alert("復習できる文法問題がまだありません。");
      return;
    }
    grammarIndex = 0;
    grammarCorrect = 0;
    grammarReviewOrder = Array.from(grammarMistakes);
    $("grammar-mode-label").textContent = "復習モード（文法）";
  } else {
    grammarIndex = 0;
    grammarCorrect = 0;
    grammarReviewOrder = null;
    $("grammar-mode-label").textContent = "通常モード（文法）";
  }

  showScreen("grammar");
  renderGrammarQuestion();
}

let grammarReviewOrder = null; // 復習時の出題順（インデックス配列）

function getCurrentGrammarIndex() {
  if (grammarReviewOrder) {
    return grammarReviewOrder[grammarIndex];
  }
  return grammarIndex;
}

function renderGrammarQuestion() {
  const total = grammarReviewOrder
    ? grammarReviewOrder.length
    : grammarQuestions.length;

  if (grammarIndex >= total) {
    showGrammarResult();
    return;
  }

  const idx = getCurrentGrammarIndex();
  const q = grammarQuestions[idx];

  grammarQuestionEl.textContent = q.question;
  grammarCounterEl.textContent = `${grammarIndex + 1} / ${total}`;
  grammarFeedbackEl.textContent = "";
  $("btn-grammar-next").style.display = "none";

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;

  const shuffled = shuffle(q.options);
  grammarChoicesEl.innerHTML = "";
  shuffled.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => {
      playSE(seClick);
      handleGrammarAnswer(btn, opt, q, idx);
    };
    grammarChoicesEl.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, choice, q, originalIndex) {
  Array.from(grammarChoicesEl.children).forEach(b => (b.disabled = true));

  if (choice === q.correct) {
    btn.classList.add("correct");
    grammarFeedbackEl.textContent = "✅ 正解！ " + q.explanation;
    grammarCorrect++;
    playSE(seCorrect);

    // 復習対象から外す
    grammarMistakes.delete(originalIndex);
  } else {
    btn.classList.add("wrong");
    grammarFeedbackEl.textContent =
      `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    playSE(seWrong);

    // 復習対象に追加
    grammarMistakes.add(originalIndex);
  }

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";

  // 復習モードボタンのON/OFF
  const btnGrammarReview = $("btn-grammar-review");
  if (btnGrammarReview) {
    btnGrammarReview.disabled = grammarMistakes.size === 0;
  }
}

function showGrammarResult() {
  const total = grammarQuestions.length;
  const rate = Math.round((grammarCorrect / total) * 100);
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  grammarFeedbackEl.textContent = msg;
  grammarChoicesEl.innerHTML = "";
  $("btn-grammar-next").style.display = "none";

  const btnGrammarReview = $("btn-grammar-review");
  if (btnGrammarReview) {
    btnGrammarReview.disabled = grammarMistakes.size === 0;
  }
}

/* -----------------------------
   発音トレーニング（音声認識＋AIフィードバック）
----------------------------- */

const PRON_API_ENDPOINT =
  "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/"; // 必要なら変更

let pronRecognition = null;
let pronListening = false;
let pronBuffer = "";

function initPronRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const statusEl = $("pron-status");
  const heardEl = $("pron-heard");

  if (!SpeechRecognition) {
    if (statusEl) {
      statusEl.textContent =
        "このブラウザは音声認識に対応していません。Chrome などでお試しください。";
    }
    return;
  }

  pronRecognition = new SpeechRecognition();
  pronRecognition.lang = "en-US";
  pronRecognition.continuous = true;
  pronRecognition.interimResults = true;

  pronRecognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        finalText += res[0].transcript;
      } else {
        interimText += res[0].transcript;
      }
    }

    if (finalText) {
      pronBuffer += (pronBuffer ? " " : "") + finalText.trim();
    }

    if (heardEl) {
      const display = (pronBuffer + " " + interimText).trim();
      heardEl.textContent = display || "(聞き取り中...)";
    }
  };

  pronRecognition.onerror = (e) => {
    console.log("pron error:", e);
    if (e.error === "no-speech") {
      if ($("pron-status")) {
        $("pron-status").textContent =
          "音声が拾えませんでした。少しマイクに近づいて話してください。";
      }
      // 停止せず、onend で再開
      return;
    }
    pronListening = false;
    if ($("pron-status")) {
      $("pron-status").textContent =
        "音声認識中にエラーが発生しました：" + e.error;
    }
  };

  pronRecognition.onend = () => {
    if (pronListening && pronRecognition) {
      try {
        pronRecognition.start();
      } catch (err) {
        console.log("pron restart error:", err);
      }
    }
  };
}

function startPronunciation() {
  playSE(seClick);
  showScreen("pronounce");
  $("pron-status").textContent =
    "「マイクで話す」を押してから、英語で話してみましょう。";
  $("pron-heard").textContent = "";
  $("pron-feedback").textContent = "";
}

function startPronListening() {
  if (!pronRecognition) initPronRecognition();
  if (!pronRecognition) return;

  pronBuffer = "";
  pronListening = true;

  $("pron-status").textContent =
    "録音中です。話し終えたら「停止してチェック」を押してください。";
  $("pron-heard").textContent = "";

  try {
    pronRecognition.start();
  } catch (e) {
    console.log("pron start error", e);
  }
}

function stopPronListeningAndCheck() {
  if (!pronRecognition) return;
  pronListening = false;
  try {
    pronRecognition.stop();
  } catch (e) {
    console.log("pron stop error", e);
  }

  const text = (pronBuffer || "").trim();
  if (!text) {
    $("pron-status").textContent =
      "音声が認識されませんでした。もう一度試してください。";
    return;
  }

  $("pron-status").textContent = "AIが発音・文をチェックしています…";
  $("pron-heard").textContent = text;

  callPronAPI(text)
    .then((feedback) => {
      $("pron-feedback").textContent = feedback;
      $("pron-status").textContent = "結果が表示されました。お疲れさまです！";
    })
    .catch((e) => {
      console.error(e);
      $("pron-feedback").textContent =
        "AIフィードバック中にエラーが発生しました。";
      $("pron-status").textContent = e.toString();
    });
}

async function callPronAPI(userSentence) {
  const res = await fetch(PRON_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message:
        "次の英語文を、TOEIC 学習者向けに発音と文法の観点から簡単にフィードバックしてください。" +
        "難しい専門用語は避け、シンプルな英語と日本語で説明してください。\n" +
        "【学習者の文】" +
        userSentence
    })
  });

  const data = await res.json();
  if (data.reply) return data.reply;
  if (data.error) {
    return (
      "⚠ AI側のエラーが発生しました: " +
      data.error +
      "\n" +
      JSON.stringify(data.detail || "", null, 2)
    );
  }
  return "⚠ 予期しないレスポンスでした。";
}

/* -----------------------------
   AI英語チャット（テキスト）
----------------------------- */

const CHAT_API_ENDPOINT =
  "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/"; // 必要なら変更

const chatLog = $("chat-log");
const chatInput = $("chat-input");

function startChat() {
  playSE(seClick);
  showScreen("chat");
  if (chatLog) chatLog.innerHTML = "";
  addChatBotMessage(
    "こんにちは！AI英語チャットです。\n" +
      "翻訳・英作文・添削・TOEIC対策・ビジネスメールなど、英語に関することなら何でも質問できます。\n\n" +
      "例：\n" +
      "・「increase ってどういう意味？」\n" +
      "・「この日本語を英訳して：明日10時に打ち合わせをしたいです」\n" +
      "・「営業メールの文面を英語で作って」\n" +
      "・「TOEICでよく出る表現を教えて」"
  );
}

function addChatMessage(text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addChatUserMessage(text) {
  addChatMessage(text, true);
}
function addChatBotMessage(text) {
  addChatMessage(text, false);
}

async function callChatAPI(message) {
  const res = await fetch(CHAT_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (data.reply) return data.reply;
  if (data.error) {
    return (
      "⚠ エラーが発生しました。\n種類: " +
      data.error +
      "\n詳細: " +
      JSON.stringify(data.detail || "", null, 2)
    );
  }
  return "⚠ 予期しないレスポンスです。";
}

async function handleChatSend(customText) {
  const text =
    typeof customText === "string"
      ? customText.trim()
      : (chatInput.value || "").trim();
  if (!text) return;

  addChatUserMessage(text);
  chatInput.value = "";

  addChatBotMessage("考え中…");
  const thinking = chatLog.lastChild;

  try {
    const reply = await callChatAPI(text);
    thinking.textContent = reply;
  } catch (e) {
    console.error(e);
    thinking.textContent = "⚠ JavaScript側でエラーが発生しました。\n" + e;
  }
}

/* -----------------------------
   AI英会話（Onigiri-kun）音声会話
----------------------------- */

const TALK_API_ENDPOINT =
  "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/"; // 必要なら変更

let talkRecognition = null;
let talkListening = false;
let talkBuffer = "";

const talkStatusEl = $("talk-status");
const talkHeardEl = $("talk-heard");
const talkLogEl = $("talk-log");      // 会話ログ（テキスト）

function startTalkScreen() {
  playSE(seClick);
  showScreen("talk");

  if (talkLogEl) talkLogEl.innerHTML = "";

  addTalkMessage(
    "EN: Hi, I'm Onigiri-kun! 🍙 I'm your English speaking partner. " +
      "You can start by telling me your name or asking me a question.\n" +
      "JP: こんにちは、おにぎりくんだよ！まずは自己紹介や質問から始めてみてね。",
    "bot"
  );

  if (talkStatusEl) {
    talkStatusEl.textContent =
      "マイクをオンにして英語で話すと、おにぎりくんが英語で返事をしてくれます。";
  }
  if (talkHeardEl) talkHeardEl.textContent = "";
}

function addTalkMessage(text, role) {
  if (!talkLogEl) return;
  const div = document.createElement("div");
  div.className = "talk-bubble " + (role === "user" ? "user" : "bot");
  div.textContent = text;
  talkLogEl.appendChild(div);
  talkLogEl.scrollTop = talkLogEl.scrollHeight;
}

function initTalkRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (talkStatusEl) {
      talkStatusEl.textContent =
        "このブラウザは音声認識に対応していません。Chrome などでお試しください。";
    }
    return;
  }

  talkRecognition = new SpeechRecognition();
  talkRecognition.lang = "en-US";
  talkRecognition.continuous = true;
  talkRecognition.interimResults = true;

  talkRecognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        finalText += res[0].transcript;
      } else {
        interimText += res[0].transcript;
      }
    }

    if (finalText) {
      talkBuffer += (talkBuffer ? " " : "") + finalText.trim();
    }

    if (talkHeardEl) {
      const display = (talkBuffer + " " + interimText).trim();
      talkHeardEl.textContent = display || "(聞き取り中...)";
    }
  };

  talkRecognition.onerror = (e) => {
    console.log("talk error:", e);
    if (e.error === "no-speech") {
      if (talkStatusEl) {
        talkStatusEl.textContent =
          "声が小さいか、音が拾えませんでした。もう少しはっきり話してみてください。";
      }
      // 停止せず、onendで再開
      return;
    }
    talkListening = false;
    if (talkStatusEl) {
      talkStatusEl.textContent =
        "音声認識中にエラーが発生しました：" + e.error;
    }
  };

  talkRecognition.onend = () => {
    if (talkListening && talkRecognition) {
      try {
        talkRecognition.start();
      } catch (err) {
        console.log("talk restart error:", err);
      }
    }
  };
}

function startTalkListening() {
  if (!talkRecognition) initTalkRecognition();
  if (!talkRecognition) return;

  talkBuffer = "";
  talkListening = true;

  if (talkStatusEl) {
    talkStatusEl.textContent =
      "録音中… 英語で話してください。（停止ボタンを押すまで録音します）";
  }
  if (talkHeardEl) talkHeardEl.textContent = "";

  try {
    talkRecognition.start();
  } catch (e) {
    console.log("talk start error", e);
  }
}

function stopTalkListeningAndSend() {
  if (!talkRecognition) return;
  talkListening = false;
  try {
    talkRecognition.stop();
  } catch (e) {
    console.log("talk stop error", e);
  }

  const text = (talkBuffer || "").trim();
  if (!text) {
    if (talkStatusEl) {
      talkStatusEl.textContent =
        "音声が認識されませんでした。もう一度話してみてください。";
    }
    return;
  }

  if (talkHeardEl) talkHeardEl.textContent = text;
  addTalkMessage("YOU: " + text, "user");

  if (talkStatusEl) {
    talkStatusEl.textContent = "Onigiri-kun が考え中…";
  }

  callTalkAPI(text)
    .then(({ en, ja }) => {
      const message =
        "EN: " + en + (ja ? "\nJP: " + ja : "\n（日本語訳は省略されました）");
      addTalkMessage(message, "bot");
      if (talkStatusEl) talkStatusEl.textContent = "マイクでまた話しかけてみてください。";
      speakEnglish(en); // 若い女性ぽい英語音声で読み上げ
    })
    .catch((e) => {
      console.error(e);
      addTalkMessage("⚠ AI側でエラーが発生しました: " + e.toString(), "bot");
      if (talkStatusEl) talkStatusEl.textContent = "エラーが発生しました。";
    });
}

async function callTalkAPI(userSentence) {
  const prompt =
    "あなたは『Onigiri-kun』という日本のキャラクターです。若いフレンドリーな口調の英語で、" +
    "TOEIC学習者と簡単な英会話をしてください。少し間違った英語でも意味を汲み取って会話を続けます。" +
    "返答は必ず次のJSON形式でください。" +
    '{ "en": "英語の返事", "ja": "その日本語訳" }' +
    "。では、ユーザーの発話はこちらです：\n" +
    userSentence;

  const res = await fetch(TALK_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt })
  });

  const data = await res.json();

  // Worker が {replyEn, replyJa} など返す場合にも対応
  if (data.en || data.ja) {
    return { en: data.en || "(英語メッセージが取得できませんでした)", ja: data.ja || "" };
  }
  if (data.replyEn || data.replyJa) {
    return {
      en: data.replyEn || "(英語メッセージが取得できませんでした)",
      ja: data.replyJa || ""
    };
  }
  if (data.reply) {
    return { en: data.reply, ja: "" };
  }
  if (data.error) {
    throw new Error(
      data.error + " / " + JSON.stringify(data.detail || "", null, 2)
    );
  }
  throw new Error("予期しないレスポンスです。");
}

// ブラウザの音声合成で英語だけ読み上げ（若い女性っぽい声を優先）
function speakEnglish(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length) {
    // 女性っぽい英語の声を探す
    const female = voices.find(v =>
      v.lang.toLowerCase().startsWith("en") &&
      /female|woman|girl|Google US English/i.test(v.name)
    );
    const anyEn = voices.find(v => v.lang.toLowerCase().startsWith("en"));
    utter.voice = female || anyEn || voices[0];
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* -----------------------------
   イベント登録
----------------------------- */

window.addEventListener("DOMContentLoaded", () => {
  // ホームボタン
  const btnStart = $("btn-start");
  const btnReview = $("btn-review");
  const btnGrammar = $("btn-grammar");
  const btnGrammarReview = $("btn-grammar-review");
  const btnPronounce = $("btn-pronounce");
  const btnChat = $("btn-chat");
  const btnTalk = $("btn-talk");

  if (btnStart) btnStart.onclick = startQuiz;
  if (btnReview) btnReview.onclick = startReviewQuiz;
  if (btnGrammar) btnGrammar.onclick = () => startGrammarQuiz({ reviewOnly: false });
  if (btnGrammarReview)
    btnGrammarReview.onclick = () => startGrammarQuiz({ reviewOnly: true });
  if (btnPronounce) btnPronounce.onclick = startPronunciation;
  if (btnChat) btnChat.onclick = startChat;
  if (btnTalk) btnTalk.onclick = startTalkScreen;

  // 単語クイズ画面
  const btnNext = $("btn-next");
  const btnQuit = $("btn-quit");
  if (btnNext)
    btnNext.onclick = () => {
      playSE(seNext);
      quizIndex++;
      renderQuizQuestion();
    };
  if (btnQuit)
    btnQuit.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // 結果画面
  const btnAgain = $("btn-again");
  const btnBackHome = $("btn-back-home");
  const btnGoReview = $("btn-go-review");
  if (btnAgain) btnAgain.onclick = startQuiz;
  if (btnBackHome)
    btnBackHome.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };
  if (btnGoReview) btnGoReview.onclick = startReviewQuiz;

  // 文法画面
  const btnGrammarNext = $("btn-grammar-next");
  const btnGrammarBack = $("btn-grammar-back");
  if (btnGrammarNext)
    btnGrammarNext.onclick = () => {
      playSE(seNext);
      grammarIndex++;
      renderGrammarQuestion();
    };
  if (btnGrammarBack)
    btnGrammarBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // 発音トレーニング画面
  const btnPronStart = $("btn-pron-start");
  const btnPronStop = $("btn-pron-stop");
  const btnPronBack = $("btn-pron-back");
  if (btnPronStart) btnPronStart.onclick = startPronListening;
  if (btnPronStop) btnPronStop.onclick = stopPronListeningAndCheck;
  if (btnPronBack)
    btnPronBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // AI英語チャット画面
  const btnChatSend = $("btn-chat-send");
  const btnChatBack = $("btn-chat-back");
  const btnChatExample = $("btn-chat-example");
  const btnChatSales = $("btn-chat-sales");

  if (btnChatSend) btnChatSend.onclick = () => handleChatSend();
  if (btnChatBack)
    btnChatBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };
  if (btnChatExample)
    btnChatExample.onclick = () =>
      handleChatSend("今日の単語で例文を作って");
  if (btnChatSales)
    btnChatSales.onclick = () =>
      handleChatSend("営業のシーンで使える表現を教えて");

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // AI英会話画面
  const btnTalkStart = $("btn-talk-start");
  const btnTalkStop = $("btn-talk-stop");
  const btnTalkBack = $("btn-talk-back");

  if (btnTalkStart) btnTalkStart.onclick = startTalkListening;
  if (btnTalkStop) btnTalkStop.onclick = stopTalkListeningAndSend;
  if (btnTalkBack)
    btnTalkBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // 復習ボタンは初期状態では無効
  const btnRev = $("btn-review");
  const btnGramRev = $("btn-grammar-review");
  const btnGoRev = $("btn-go-review");
  if (btnRev) btnRev.disabled = true;
  if (btnGramRev) btnGramRev.disabled = true;
  if (btnGoRev) btnGoRev.disabled = true;
});
