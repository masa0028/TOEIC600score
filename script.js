// ==================== 単語データ ====================
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

// ==================== 文法クイズデータ ====================
const grammarQuestionsBase = [
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

// ==================== ヘルパー ====================
function $(id) {
  return document.getElementById(id);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 画面切り替え
const screens = {
  home: $("screen-home"),
  quiz: $("screen-quiz"),
  result: $("screen-result"),
  grammar: $("screen-grammar"),
  pronunciation: $("screen-pronunciation"),
  chat: $("screen-chat"),
  talk: $("screen-talk")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
}

// 効果音
const seCorrect = $("se-correct");
const seNext = $("se-next");
const seWrong = $("se-wrong");
const seClick = $("se-click");

function playSE(el) {
  if (!el) return;
  try {
    el.currentTime = 0;
    el.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

// TTS（日本語）
function speakJP(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ==================== 単語クイズ ====================
let quizWords = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizMistakes = [];
let quizMode = "main"; // "main" or "review"
let reviewWordPool = [];

function updateProgress(done, totalOverride) {
  const total = totalOverride || (quizWords.length || day1Words.length);
  $("progress-inner").style.width = (done / total) * 100 + "%";
  $("progress-text").textContent = `${done} / ${total}`;
}

function startWordQuizMain() {
  playSE(seClick);
  quizMode = "main";
  quizWords = shuffle(day1Words);
  quizIndex = 0;
  quizCorrect = 0;
  quizMistakes = [];
  $("quiz-title-label").textContent = "単語クイズ";
  updateProgress(0, quizWords.length);
  showScreen("quiz");
  renderWordQuestion();
}

function startWordQuizReview() {
  if (!reviewWordPool.length) {
    alert("まだ復習対象の単語がありません。先に単語クイズを解いてください。");
    return;
  }
  playSE(seClick);
  quizMode = "review";
  quizWords = shuffle(reviewWordPool);
  quizIndex = 0;
  quizCorrect = 0;
  quizMistakes = [];
  $("quiz-title-label").textContent = "単語クイズ（復習）";
  updateProgress(0, quizWords.length);
  showScreen("quiz");
  renderWordQuestion();
}

function renderWordQuestion() {
  if (quizIndex >= quizWords.length) {
    showWordResult();
    return;
  }

  const q = quizWords[quizIndex];
  $("quiz-direction").textContent = "英単語の意味を選んでください。";
  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent = `${quizIndex + 1} / ${quizWords.length}`;
  $("feedback").textContent = "";
  $("btn-next").style.display = "none";

  const others = shuffle(day1Words.filter(w => w !== q));
  const choices = shuffle([
    q.meaning_jp,
    others[0].meaning_jp,
    others[1].meaning_jp,
    others[2].meaning_jp
  ]);

  const box = $("choices");
  box.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice;
    btn.onclick = () => {
      playSE(seClick);
      handleWordAnswer(btn, choice, q);
    };
    box.appendChild(btn);
  });
}

function handleWordAnswer(btn, choice, q) {
  Array.from($("choices").children).forEach(b => (b.disabled = true));

  if (choice === q.meaning_jp) {
    quizCorrect++;
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${q.meaning_jp}`;
    quizMistakes.push(q);
    playSE(seWrong);
  }

  updateProgress(quizIndex + 1, quizWords.length);
  $("btn-next").style.display = "block";
}

function showWordResult() {
  const total = quizWords.length;
  const rate = total ? Math.round((quizCorrect / total) * 100) : 0;

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

  // 復習プールを更新
  if (quizMode === "main") {
    reviewWordPool = quizMistakes.slice();
  } else if (quizMode === "review") {
    // 復習で正解したらプールから削除したい場合はここでロジック追加
    // （今回は「復習で全部正解したら自然に減る」挙動は入れていません）
  }

  $("btn-review-words").disabled = reviewWordPool.length === 0;

  showScreen("result");
}

// ==================== 文法クイズ ====================
let grammarQuestions = [];
let grammarIndex = 0;
let grammarCorrect = 0;
let grammarMode = "main"; // "main" or "review"
let grammarMistakePool = [];
let grammarCurrentRoundMistakes = [];

const grammarQuestionEl = $("grammar-question");
const grammarChoicesEl = $("grammar-choices");
const grammarFeedbackEl = $("grammar-feedback");
const grammarCounterEl = $("grammar-counter");
const grammarProgressEl = $("grammar-progress");

function startGrammarQuizMain() {
  playSE(seClick);
  grammarMode = "main";
  grammarQuestions = shuffle(grammarQuestionsBase);
  grammarIndex = 0;
  grammarCorrect = 0;
  grammarCurrentRoundMistakes = [];
  $("grammar-title-label").textContent = "文法クイズ（穴埋め）";
  showScreen("grammar");
  renderGrammarQuestion();
}

function startGrammarQuizReview() {
  if (!grammarMistakePool.length) {
    alert("まだ文法の復習対象がありません。先に文法クイズを解いてください。");
    return;
  }
  playSE(seClick);
  grammarMode = "review";
  grammarQuestions = shuffle(grammarMistakePool);
  grammarIndex = 0;
  grammarCorrect = 0;
  grammarCurrentRoundMistakes = [];
  $("grammar-title-label").textContent = "文法復習モード";
  showScreen("grammar");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  const total = grammarQuestions.length;
  if (grammarIndex >= total) {
    showGrammarResult();
    return;
  }

  const q = grammarQuestions[grammarIndex];
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
      handleGrammarAnswer(btn, opt, q);
    };
    grammarChoicesEl.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, choice, q) {
  Array.from(grammarChoicesEl.children).forEach(b => (b.disabled = true));

  if (choice === q.correct) {
    btn.classList.add("correct");
    grammarFeedbackEl.textContent = "✅ 正解！ " + q.explanation;
    grammarCorrect++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    grammarFeedbackEl.textContent = `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    grammarCurrentRoundMistakes.push(q);
    playSE(seWrong);
  }

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = grammarQuestions.length;
  const rate = total ? Math.round((grammarCorrect / total) * 100) : 0;
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  grammarFeedbackEl.textContent = msg;
  grammarChoicesEl.innerHTML = "";
  $("btn-grammar-next").style.display = "none";

  if (grammarMode === "main") {
    grammarMistakePool = grammarCurrentRoundMistakes.slice();
  }
  $("btn-review-grammar").disabled = grammarMistakePool.length === 0;
}

// ==================== Cloudflare Worker 共通 ====================
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
    return (
      "⚠ エラーが発生しました。\n" +
      "種類: " +
      data.error +
      "\n詳細: " +
      JSON.stringify(data.detail ?? "", null, 2)
    );
  }

  return "⚠ 予期しないレスポンスです。";
}

// ==================== 発音トレーニング（マイク） ====================
let speechRecognition = null;
let speechSupported = false;
let speechListening = false;
let speechMode = null; // "pronunciation" or "talk"
let pronunciationBuffer = "";
let talkBuffer = "";

function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    speechSupported = false;
    $("pronunciation-feedback").textContent =
      "このブラウザでは音声認識がサポートされていません。Chrome をお試しください。";
    $("talk-status").textContent =
      "このブラウザでは音声認識がサポートされていません。";
    return;
  }

  speechRecognition = new SR();
  speechRecognition.lang = "en-US";
  speechRecognition.interimResults = true;
  speechRecognition.continuous = true;

  speechRecognition.onresult = event => {
    let text = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    text = text.trim();
    if (speechMode === "pronunciation") {
      pronunciationBuffer = text;
      $("pronounced-text").textContent =
        text || "（音声を認識しています...）";
    } else if (speechMode === "talk") {
      talkBuffer = text;
      $("talk-heard").textContent = text || "（音声を認識しています...）";
    }
  };

  speechRecognition.onerror = e => {
    console.error("speech error", e);
    const msg = "音声認識中にエラーが発生しました: " + e.error;
    if (speechMode === "pronunciation") {
      $("pronounced-text").textContent = "⚠ " + msg;
    } else if (speechMode === "talk") {
      $("talk-heard").textContent = "⚠ " + msg;
    }
  };

  speechRecognition.onend = () => {
    // 停止ボタンを押していない場合は自動再開
    if (speechListening && speechRecognition) {
      try {
        speechRecognition.start();
      } catch (e) {
        console.log("restart error", e);
      }
    }
  };

  speechSupported = true;
}

async function requestPronunciationFeedback(text) {
  $("pronunciation-feedback").textContent = "AIがチェック中です…";
  const prompt =
    "あなたはTOEIC学習者向けの英語講師です。以下の英文について、文法・発音の観点からやさしくフィードバックしてください。" +
    "学習者が傷つかないように、必ずポジティブなコメントも一言入れてください。\n\n" +
    "【学習者の英文】\n" +
    text;
  const reply = await callWorker(prompt);
  $("pronunciation-feedback").textContent = reply;
  speakJP(reply);
}

function startPronunciation() {
  playSE(seClick);
  if (!speechSupported) {
    alert("このブラウザでは音声認識が使えません。Chrome をおすすめします。");
    return;
  }
  speechMode = "pronunciation";
  speechListening = true;
  pronunciationBuffer = "";
  $("pronounced-text").textContent = "（話し始めてください）";
  $("pronunciation-feedback").textContent =
    "話し終わったら「停止（チェック）」を押してください。";
  try {
    speechRecognition.start();
  } catch (e) {
    console.log("start mic error", e);
  }
}

function stopPronunciation() {
  playSE(seClick);
  speechListening = false;
  try {
    speechRecognition.stop();
  } catch (e) {
    console.log("stop mic error", e);
  }
  if (!pronunciationBuffer) {
    $("pronunciation-feedback").textContent =
      "認識された英語がありませんでした。もう一度お試しください。";
    return;
  }
  requestPronunciationFeedback(pronunciationBuffer);
}

// ==================== AI英語チャット（テキスト） ====================
const chatLog = $("chat-log");
const chatInput = $("chat-input");

function addChatMessage(text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function handleChatSend(customText) {
  const text = (typeof customText === "string" ? customText : chatInput.value)
    .trim();
  if (!text) return;

  addChatMessage(text, true);
  chatInput.value = "";

  addChatMessage("考え中…", false);
  const thinkingBubble = chatLog.lastChild;

  try {
    const reply = await callWorker(text);
    thinkingBubble.textContent = reply;
  } catch (e) {
    console.error(e);
    thinkingBubble.textContent =
      "⚠ JavaScript側でエラーが発生しました。\n" + e.toString();
  }
}

// ==================== AI英会話（キャラ＋マイク） ====================
const talkLog = $("talk-log");

function addTalkMessage(text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  talkLog.appendChild(div);
  talkLog.scrollTop = talkLog.scrollHeight;
}

async function callCharacterAPI(userUtterance) {
  const prompt =
    "【キャラクター設定】\n" +
    "あなたは「Onitama」という、ふわふわのおにぎりの妖精キャラクターです。" +
    "とても優しくフレンドリーで、日本語メイン＋簡単な英語で話します。" +
    "相手の英語が少し間違っていても意味を推測し、会話を途切れさせずに続けてください。" +
    "必要に応じて、より自然な英語の言い方を1行だけ教えてください。\n\n" +
    "【ユーザーの発話（音声認識結果）】\n" +
    userUtterance +
    "\n\n" +
    "Onitamaとして返答してください。";
  return await callWorker(prompt);
}

function startTalk() {
  playSE(seClick);
  if (!speechSupported) {
    alert("このブラウザでは音声認識が使えません。Chrome をおすすめします。");
    return;
  }
  speechMode = "talk";
  speechListening = true;
  talkBuffer = "";
  $("talk-heard").textContent = "（話し始めてください）";
  $("talk-status").textContent = "ステータス：録音中（停止ボタンでAIに送信）";
  try {
    speechRecognition.start();
  } catch (e) {
    console.log("start talk error", e);
  }
}

async function stopTalk() {
  playSE(seClick);
  speechListening = false;
  try {
    speechRecognition.stop();
  } catch (e) {
    console.log("stop talk error", e);
  }
  $("talk-status").textContent = "ステータス：AIに送信中…";

  const text = talkBuffer.trim();
  if (!text) {
    $("talk-status").textContent = "ステータス：音声が認識されませんでした。";
    return;
  }

  addTalkMessage(text, true);

  addTalkMessage("Onitama が考え中…", false);
  const thinkingBubble = talkLog.lastChild;

  try {
    const reply = await callCharacterAPI(text);
    thinkingBubble.textContent = reply;
    $("talk-status").textContent = "ステータス：会話待機中";
    speakJP(reply);
  } catch (e) {
    console.error(e);
    thinkingBubble.textContent =
      "⚠ JavaScript側でエラーが発生しました。\n" + e.toString();
    $("talk-status").textContent = "ステータス：エラーが発生しました";
  }
}

// ==================== イベント登録 ====================
window.addEventListener("DOMContentLoaded", () => {
  initSpeechRecognition();

  const btnStartQuiz = $("btn-start-quiz");
  const btnReviewWords = $("btn-review-words");
  const btnGrammar = $("btn-grammar");
  const btnReviewGrammar = $("btn-review-grammar");
  const btnPronunciation = $("btn-pronunciation");
  const btnChat = $("btn-chat");
  const btnTalk = $("btn-talk");

  const btnNext = $("btn-next");
  const btnQuit = $("btn-quit");
  const btnAgain = $("btn-again");
  const btnBackHome = $("btn-back-home");

  const btnGrammarNext = $("btn-grammar-next");
  const btnGrammarBack = $("btn-grammar-back");

  const btnMicStart = $("btn-mic-start");
  const btnMicStop = $("btn-mic-stop");
  const btnPronunciationBack = $("btn-pronunciation-back");

  const btnChatSend = $("btn-chat-send");
  const btnChatBack = $("btn-chat-back");
  const btnChatExample = $("btn-chat-example");
  const btnChatSales = $("btn-chat-sales");

  const btnTalkStart = $("btn-talk-start");
  const btnTalkStop = $("btn-talk-stop");
  const btnTalkBack = $("btn-talk-back");

  // ホーム
  if (btnStartQuiz) btnStartQuiz.onclick = startWordQuizMain;
  if (btnReviewWords) btnReviewWords.onclick = startWordQuizReview;
  if (btnGrammar) btnGrammar.onclick = startGrammarQuizMain;
  if (btnReviewGrammar) btnReviewGrammar.onclick = startGrammarQuizReview;
  if (btnPronunciation)
    btnPronunciation.onclick = () => {
      playSE(seClick);
      showScreen("pronunciation");
    };
  if (btnChat)
    btnChat.onclick = () => {
      playSE(seClick);
      showScreen("chat");
      chatLog.innerHTML = "";
      addChatMessage(
        "こんにちは！英語に関する質問なら何でもどうぞ。\nTOEIC・ビジネスメール・英作文・文法の質問など、自由に入力してください。",
        false
      );
    };
  if (btnTalk)
    btnTalk.onclick = () => {
      playSE(seClick);
      showScreen("talk");
      $("talk-status").textContent = "ステータス：待機中";
      if (!talkLog.innerHTML) {
        addTalkMessage(
          "やぁ、Onitamaだよ！英語で話しかけてみてね。少しくらい間違っていても大丈夫、一緒に練習しよう🍙",
          false
        );
      }
    };

  // 単語クイズ
  if (btnNext)
    btnNext.onclick = () => {
      playSE(seNext);
      quizIndex++;
      renderWordQuestion();
    };
  if (btnQuit)
    btnQuit.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };
  if (btnAgain)
    btnAgain.onclick = () => {
      playSE(seClick);
      if (quizMode === "main") startWordQuizMain();
      else startWordQuizReview();
    };
  if (btnBackHome)
    btnBackHome.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // 文法
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

  // 発音
  if (btnMicStart) btnMicStart.onclick = startPronunciation;
  if (btnMicStop) btnMicStop.onclick = stopPronunciation;
  if (btnPronunciationBack)
    btnPronunciationBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };

  // チャット
  if (btnChatSend) btnChatSend.onclick = () => handleChatSend();
  if (btnChatBack)
    btnChatBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };
  if (btnChatExample)
    btnChatExample.onclick = () =>
      handleChatSend("今日学んだ単語を使って例文を作って");
  if (btnChatSales)
    btnChatSales.onclick = () =>
      handleChatSend("営業のシーンで使える表現を教えて");

  if (chatInput) {
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // AI英会話
  if (btnTalkStart) btnTalkStart.onclick = startTalk;
  if (btnTalkStop) btnTalkStop.onclick = stopTalk;
  if (btnTalkBack)
    btnTalkBack.onclick = () => {
      playSE(seClick);
      showScreen("home");
    };
});
