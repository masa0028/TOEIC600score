// ==================== データ定義 ====================

// 単語データ
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

// 文法クイズ
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


// ==================== ヘルパー・共通 ============

function $(id) { return document.getElementById(id); }

const screens = {
  home:          $("screen-home"),
  quiz:          $("screen-quiz"),
  result:        $("screen-result"),
  grammar:       $("screen-grammar"),
  pronunciation: $("screen-pronunciation"),
  chat:          $("screen-chat"),
  conversation:  $("screen-conversation")
};

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

// 効果音
const seCorrect = $("se-correct");
const seNext    = $("se-next");
const seWrong   = $("se-wrong");
const seClick   = $("se-click");

function playSE(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

// ==================== 単語クイズ ====================

let quizWords = [];
let quizIndex = 0;
let quizCorrect = 0;
let mistakes = [];
let isReviewMode = false;
let reviewWords = [];

const quizModeLabel = $("quiz-mode-label");

function updateProgress(done) {
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
  mistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "本番モード";
  updateProgress(0);
  show("quiz");
  renderQuizQuestion();
}

function startReviewQuiz() {
  if (!reviewWords.length) {
    alert("復習対象の単語がありません。\nまずは単語クイズを解いて、間違えた単語をためましょう。");
    return;
  }
  playSE(seClick);
  isReviewMode = true;
  quizWords = shuffle(reviewWords);
  quizIndex = 0;
  quizCorrect = 0;
  mistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "復習モード";
  updateProgress(0);
  show("quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizWords.length) {
    showQuizResult();
    return;
  }

  const q = quizWords[quizIndex];
  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent  = `${quizIndex + 1} / ${quizWords.length}`;
  $("feedback").textContent      = "";
  $("btn-next").style.display    = "none";

  const others = shuffle(day1Words.filter(w => w.meaning_jp !== q.meaning_jp));
  const choicesArr = shuffle([
    q.meaning_jp,
    others[0].meaning_jp,
    others[1].meaning_jp,
    others[2].meaning_jp
  ]);

  const box = $("choices");
  box.innerHTML = "";
  choicesArr.forEach(c => {
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

function handleQuizAnswer(btn, choice, correctAns, q) {
  Array.from($("choices").children).forEach(b => b.disabled = true);

  if (choice === correctAns) {
    quizCorrect++;
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correctAns}`;
    mistakes.push(q);
    playSE(seWrong);
  }

  updateProgress(quizIndex + 1);

  // 復習ボタンは1問でもミスしたらホーム画面で有効化
  if (mistakes.length > 0) {
    reviewWords = mistakes.slice();
    const btnReview = $("btn-review");
    const btnGoReview = $("btn-go-review");
    if (btnReview)   btnReview.disabled   = false;
    if (btnGoReview) btnGoReview.disabled = false;
  }

  $("btn-next").style.display = "block";
}

function showQuizResult() {
  const total = quizWords.length || day1Words.length;
  const rate  = total > 0 ? Math.round(quizCorrect / total * 100) : 0;

  $("result-score").textContent = `正解数 ${quizCorrect} / ${total}`;
  $("result-rate").textContent  = `正答率 ${rate}%`;
  $("result-rank").textContent  =
    "ランク " + (rate >= 90 ? "S" : rate >= 75 ? "A" : rate >= 60 ? "B" : "C");

  const list = $("mistake-list");
  list.innerHTML = "";
  mistakes.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.word} - ${w.meaning_jp}`;
    list.appendChild(li);
  });

  // reviewWords は handleQuizAnswer ですでに更新しているが念のため
  reviewWords = mistakes.slice();
  const hasReview = reviewWords.length > 0;
  if ($("btn-review"))   $("btn-review").disabled   = !hasReview;
  if ($("btn-go-review"))$("btn-go-review").disabled = !hasReview;

  show("result");
}


// ==================== 文法クイズ ====================

let grammarIndex = 0;
let grammarCorrect = 0;
let grammarIsReview = false;
let grammarMistakes = [];
let grammarReviewQuestions = [];

const grammarQuestionEl = $("grammar-question");
const grammarChoicesEl  = $("grammar-choices");
const grammarFeedbackEl = $("grammar-feedback");
const grammarCounterEl  = $("grammar-counter");
const grammarProgressEl = $("grammar-progress");

function startGrammarQuiz(isReview = false) {
  playSE(seClick);
  grammarIsReview = isReview;

  if (isReview) {
    if (!grammarReviewQuestions.length) {
      alert("文法の復習問題がありません。\nまずは文法クイズを解いてみましょう。");
      return;
    }
  }

  grammarIndex = 0;
  grammarCorrect = 0;
  grammarMistakes = [];

  show("grammar");
  renderGrammarQuestion();
}

function getCurrentGrammarQuestions() {
  if (grammarIsReview && grammarReviewQuestions.length) {
    return grammarReviewQuestions;
  }
  return grammarQuestions;
}

function renderGrammarQuestion() {
  const list = getCurrentGrammarQuestions();
  const total = list.length;

  if (grammarIndex >= total) {
    showGrammarResult();
    return;
  }

  const q = list[grammarIndex];
  grammarQuestionEl.textContent = q.question;
  grammarCounterEl.textContent  = `${grammarIndex + 1} / ${total}`;
  grammarFeedbackEl.textContent = "";
  $("btn-grammar-next").style.display = "none";

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;

  const shuffledOpts = shuffle(q.options);
  grammarChoicesEl.innerHTML = "";
  shuffledOpts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => {
      playSE(seClick);
      handleGrammarAnswer(btn, opt, q);
    };
    grammarChoicesEl.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, choice, q) {
  Array.from(grammarChoicesEl.children).forEach(b => b.disabled = true);

  if (choice === q.correct) {
    btn.classList.add("correct");
    grammarFeedbackEl.textContent = "✅ 正解！ " + q.explanation;
    grammarCorrect++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    grammarFeedbackEl.textContent =
      `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    grammarMistakes.push(q);
    playSE(seWrong);
  }

  // 文法の復習リストも、1問でも間違えたら都度追加
  if (grammarMistakes.length > 0) {
    grammarReviewQuestions = shuffle(
      Array.from(new Set(grammarMistakes.concat(grammarReviewQuestions)))
    );
    const btnGrammarReview = $("btn-grammar-review");
    if (btnGrammarReview) btnGrammarReview.disabled = false;
  }

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const list = getCurrentGrammarQuestions();
  const total = list.length;
  const rate  = total ? Math.round(grammarCorrect / total * 100) : 0;

  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;
  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  grammarFeedbackEl.textContent = msg;
  grammarChoicesEl.innerHTML = "";
  $("btn-grammar-next").style.display = "none";
}


// ==================== 発音トレーニング ====================

const pronTextEl     = $("pron-text");
const pronFeedbackEl = $("pron-feedback");

let recognition = null;
let isRecognizing = false;
let recognizedTextBuffer = "";

// Cloudflare Worker エンドポイント
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// 発音チェック用プロンプト
const PRON_PROMPT = `
You are an English pronunciation and grammar coach.
The learner will speak a short English sentence. You receive the recognized text.

Tasks:
1. Briefly comment on their pronunciation and clarity (in English).
2. Show a corrected version of the sentence if needed.
3. Give a short explanation in Japanese (1–3 sentences).

Format your reply:

＜English comment＞
[...]

＜Corrected sentence＞
[...]

＜日本語フィードバック＞
[...]
`;

function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    pronFeedbackEl.textContent =
      "このブラウザは音声認識に対応していません。Chrome の最新版をおすすめします。";
    return null;
  }

  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = true; // ★ 停止ボタンを押すまで録音継続を試みる

  rec.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + " ";
      } else {
        interimText += transcript;
      }
    }
    recognizedTextBuffer += finalText;
    const display = (recognizedTextBuffer + " " + interimText).trim();
    pronTextEl.textContent = display || "（まだ何も話されていません）";
  };

  rec.onerror = (e) => {
    console.error("recognition error", e);
    pronFeedbackEl.textContent =
      "音声認識中にエラーが発生しました。・マイクが許可されているか・対応ブラウザかを確認してください。";
    isRecognizing = false;
  };

  rec.onend = () => {
    // continuous=true でも、環境によっては数十秒で止まることがあるので、
    // フラグが true なら再開を試みる
    if (isRecognizing) {
      try {
        rec.start();
      } catch (e) {
        console.log("restart error", e);
      }
    }
  };

  return rec;
}

async function startPronunciation() {
  playSE(seClick);
  show("pronunciation");

  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) return;
  }

  recognizedTextBuffer = "";
  pronTextEl.textContent = "（録音中…話してみましょう）";
  pronFeedbackEl.textContent = "録音中です。話し終わったら「停止（チェック）」を押してください。";

  try {
    isRecognizing = true;
    recognition.start();
  } catch (e) {
    console.error(e);
  }
}

async function stopPronunciationAndCheck() {
  playSE(seClick);
  if (recognition && isRecognizing) {
    isRecognizing = false;
    try {
      recognition.stop();
    } catch (e) {
      console.error(e);
    }
  }

  const spoken = pronTextEl.textContent.trim();
  if (!spoken || spoken === "（まだ何も話されていません）" || spoken === "（録音中…話してみましょう）") {
    pronFeedbackEl.textContent = "まだ文章が認識されていません。もう一度話してみてください。";
    return;
  }

  pronFeedbackEl.textContent = "AI がチェック中です…";

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${PRON_PROMPT}\n\n[Learner]: ${spoken}`
      })
    });

    const data = await res.json();
    if (data.reply) {
      pronFeedbackEl.textContent = data.reply;
    } else if (data.error) {
      pronFeedbackEl.textContent =
        "⚠ エラーが発生しました: " +
        JSON.stringify(data.error ?? data.detail ?? "", null, 2);
    } else {
      pronFeedbackEl.textContent = "⚠ 予期しないレスポンスです。";
    }
  } catch (e) {
    console.error(e);
    pronFeedbackEl.textContent =
      "⚠ 通信エラーが発生しました。しばらくしてから再度お試しください。";
  }
}


// ==================== AI英語チャット（既存） ====================

const chatLog   = $("chat-log");
const chatInput = $("chat-input");

function addChatMessage(text, isUser) {
  if (!chatLog) return;
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addUserMessage(text) { addChatMessage(text, true); }
function addBotMessage(text)  { addChatMessage(text, false); }

function startChat() {
  playSE(seClick);
  show("chat");
  if (chatLog) chatLog.innerHTML = "";

  addBotMessage(
    "こんにちは！AI英語チャットです。\n" +
    "翻訳・英作文・添削・TOEIC対策・ビジネスメールなど、英語に関することなら何でも質問できます。\n\n" +
    "例：\n" +
    "・「increase ってどういう意味？」\n" +
    "・「この日本語を英訳して：明日10時に打ち合わせをしたいです」\n" +
    "・「営業メールの文面を英語で作って」\n" +
    "・「TOEICでよく出る表現を教えて」"
  );
}

async function callChatAPI(userMessage) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await res.json();

  if (data.reply) return data.reply;
  if (data.error) {
    return "⚠ エラーが発生しました。\n" +
           "種類: " + data.error + "\n" +
           "詳細: " + JSON.stringify(data.detail ?? "", null, 2);
  }
  return "⚠ 予期しないレスポンスです。";
}

async function handleChatSend(customText) {
  const text = (typeof customText === "string" ? customText : chatInput.value).trim();
  if (!text) return;

  addUserMessage(text);
  chatInput.value = "";

  addBotMessage("考え中…");
  const thinkingBubble = chatLog.lastChild;

  try {
    const reply = await callChatAPI(text);
    thinkingBubble.textContent = reply;
  } catch (e) {
    console.error(e);
    thinkingBubble.textContent =
      "⚠ JavaScript 側でエラーが発生しました。\n" + e.toString();
  }
}


// ==================== AI英会話（Onitama） ====================

const conversationLog   = $("conversation-log");
const conversationInput = $("conversation-input");

const ONITAMA_PROMPT = `
You are "Onigiri-kun", a friendly rice ball character who helps Japanese learners practice English conversation.

Rules:
- Always keep the conversation going in simple English.
- Even if the learner's English is a little wrong, try to understand the intention and respond naturally.
- First, answer in natural English as a short reply (1–2 sentences).
- After that, if there was a mistake, gently give a mini-correction:
  1) Repeat a corrected version of the learner's sentence.
  2) Briefly explain in simple Japanese why it was corrected.

Format your reply exactly in this structure:

＜English＞
[Your natural English reply.]

＜Better English example＞
[Corrected version of the learner's sentence, if needed. If their sentence was fine, say "Good! Your sentence is natural."]

＜日本語ミニ解説＞
[Very short Japanese explanation of 1–3 sentences.]

Be positive and encouraging. Praise their effort often.
`;

function addConversationMessage(text, isUser) {
  if (!conversationLog) return;
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  conversationLog.appendChild(div);
  conversationLog.scrollTop = conversationLog.scrollHeight;
}

function addConversationUser(text) { addConversationMessage(text, true); }
function addConversationBot(text)  { addConversationMessage(text, false); }

function startConversation() {
  playSE(seClick);
  show("conversation");
  if (conversationLog) conversationLog.innerHTML = "";

  addConversationBot(
    "こんにちは、Onigiri-kun だよ🍙\n" +
    "英会話の練習をしよう！少し間違っていても、意味をくみ取って会話を続けるから安心してね。\n\n" +
    "英語で話してもいいし、日本語で「こう言いたい」と相談してもOKだよ。"
  );
}

async function callConversationAPI(userMessage) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `${ONITAMA_PROMPT}\n\n[Learner]: ${userMessage}`
    })
  });

  const data = await res.json();

  if (data.reply) return data.reply;
  if (data.error) {
    return "⚠ エラーが発生しました。\n" +
           "種類: " + data.error + "\n" +
           "詳細: " + JSON.stringify(data.detail ?? "", null, 2);
  }
  return "⚠ 予期しないレスポンスです。";
}

async function handleConversationSend(customText) {
  const text = (typeof customText === "string"
    ? customText
    : (conversationInput ? conversationInput.value : "")
  ).trim();

  if (!text) return;

  addConversationUser(text);
  if (conversationInput) conversationInput.value = "";

  addConversationBot("考え中…");
  const thinkingBubble = conversationLog.lastChild;

  try {
    const reply = await callConversationAPI(text);
    thinkingBubble.textContent = reply;
  } catch (e) {
    console.error(e);
    thinkingBubble.textContent =
      "⚠ JavaScript 側でエラーが発生しました。\n" + e.toString();
  }
}


// ==================== イベント登録 ====================

window.addEventListener("DOMContentLoaded", () => {
  const btnStart          = $("btn-start");
  const btnReview         = $("btn-review");
  const btnNext           = $("btn-next");
  const btnQuit           = $("btn-quit");
  const btnAgain          = $("btn-again");
  const btnBackHome       = $("btn-back-home");
  const btnGoReview       = $("btn-go-review");

  const btnGrammar        = $("btn-grammar");
  const btnGrammarReview  = $("btn-grammar-review");
  const btnGrammarNext    = $("btn-grammar-next");
  const btnGrammarBack    = $("btn-grammar-back");

  const btnPron           = $("btn-pronunciation");
  const btnPronStart      = $("btn-pron-start");
  const btnPronStop       = $("btn-pron-stop");
  const btnPronBack       = $("btn-pron-back");

  const btnChat           = $("btn-chat");
  const btnChatSend       = $("btn-chat-send");
  const btnChatBack       = $("btn-chat-back");
  const btnChatExample    = $("btn-chat-example");
  const btnChatSales      = $("btn-chat-sales");

  const btnConversation   = $("btn-conversation");
  const btnConvSend       = $("btn-conv-send");
  const btnConvBack       = $("btn-conv-back");
  const btnConvSelfintro  = $("btn-conv-selfintro");
  const btnConvBusiness   = $("btn-conv-business");
  const btnConvCafe       = $("btn-conv-cafe");

  // 単語クイズ
  if (btnStart)    btnStart.onclick    = startQuiz;
  if (btnReview)   btnReview.onclick   = startReviewQuiz;
  if (btnNext)     btnNext.onclick     = () => { playSE(seNext); quizIndex++; renderQuizQuestion(); };
  if (btnQuit)     btnQuit.onclick     = () => { playSE(seClick); show("home"); };
  if (btnAgain)    btnAgain.onclick    = startQuiz;
  if (btnBackHome) btnBackHome.onclick = () => { playSE(seClick); show("home"); };
  if (btnGoReview) btnGoReview.onclick = startReviewQuiz;

  // 文法クイズ
  if (btnGrammar)       btnGrammar.onclick       = () => startGrammarQuiz(false);
  if (btnGrammarReview) btnGrammarReview.onclick = () => startGrammarQuiz(true);
  if (btnGrammarNext)   btnGrammarNext.onclick   = () => { playSE(seNext); grammarIndex++; renderGrammarQuestion(); };
  if (btnGrammarBack)   btnGrammarBack.onclick   = () => { playSE(seClick); show("home"); };

  // 発音トレーニング
  if (btnPron)      btnPron.onclick      = startPronunciation;
  if (btnPronStart) btnPronStart.onclick = startPronunciation;
  if (btnPronStop)  btnPronStop.onclick  = stopPronunciationAndCheck;
  if (btnPronBack)  btnPronBack.onclick  = () => { playSE(seClick); show("home"); };

  // AI英語チャット
  if (btnChat)      btnChat.onclick      = startChat;
  if (btnChatSend)  btnChatSend.onclick  = () => handleChatSend();
  if (btnChatBack)  btnChatBack.onclick  = () => { playSE(seClick); show("home"); };
  if (btnChatExample) btnChatExample.onclick = () => {
    playSE(seClick);
    handleChatSend("今日の単語で例文を作って");
  };
  if (btnChatSales)   btnChatSales.onclick = () => {
    playSE(seClick);
    handleChatSend("営業のシーンで使える表現を教えて");
  };
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // AI英会話（Onitama）
  if (btnConversation)  btnConversation.onclick  = startConversation;
  if (btnConvSend)      btnConvSend.onclick      = () => handleConversationSend();
  if (btnConvBack)      btnConvBack.onclick      = () => { playSE(seClick); show("home"); };
  if (btnConvSelfintro) btnConvSelfintro.onclick = () => {
    playSE(seClick);
    handleConversationSend("自己紹介の英会話を練習したいです。");
  };
  if (btnConvBusiness)  btnConvBusiness.onclick  = () => {
    playSE(seClick);
    handleConversationSend("ビジネスシーンの英会話を練習したいです。");
  };
  if (btnConvCafe)      btnConvCafe.onclick      = () => {
    playSE(seClick);
    handleConversationSend("カフェで注文するときの会話を練習したいです。");
  };
  if (conversationInput) {
    conversationInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConversationSend();
      }
    });
  }
});
