// ======================================================
// 設定：APIエンドポイント（Cloudflare Worker）
// 必要に応じて自分のURLに差し替えてください
// ======================================================
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// ======================================================
// 共通：画面切り替え
// ======================================================
const screens = {
  home: document.getElementById("screen-home"),
  quiz: document.getElementById("screen-quiz"),
  shadow: document.getElementById("screen-shadowing"),
  chat: document.getElementById("screen-chat"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

// ======================================================
// 単語クイズ / 文法クイズ
// ======================================================

// 単語問題リスト（必要に応じて増やしてください）
const wordQuestions = [
  {
    question: "increase の意味は？",
    choices: ["増加する", "減少する", "交換する", "終了する"],
    correct: 0,
  },
  {
    question: "require の意味は？",
    choices: ["必要とする", "避難する", "報告する", "支払う"],
    correct: 0,
  },
  {
    question: "attend の意味は？",
    choices: ["参加する", "依頼する", "配達する", "更新する"],
    correct: 0,
  },
  {
    question: "offer の意味は？",
    choices: ["提案する / 提供する", "拒否する", "解決する", "保存する"],
    correct: 0,
  },
  {
    question: "improve の意味は？",
    choices: ["改善する", "承諾する", "比較する", "連絡する"],
    correct: 0,
  },
];

// 文法問題リスト
const grammarQuestions = [
  {
    question: "I ____ tennis every Sunday.",
    choices: ["play", "plays", "played", "playing"],
    correct: 0,
  },
  {
    question: "She ____ to the office every day.",
    choices: ["go", "goes", "going", "gone"],
    correct: 1,
  },
  {
    question: "They ____ lunch now.",
    choices: ["have", "has", "having", "had"],
    correct: 0,
  },
  {
    question: "He ____ English yesterday.",
    choices: ["study", "studies", "studied", "studying"],
    correct: 2,
  },
  {
    question: "This book ____ written by my teacher.",
    choices: ["is", "are", "was", "were"],
    correct: 2,
  },
];

// 配列シャッフル関数（ランダム出題の核心）
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// クイズ用状態
let quizMode = "word"; // "word" or "grammar"
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

const quizTitle = document.getElementById("quiz-title");
const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizChoices = document.getElementById("quiz-choices");
const quizMessage = document.getElementById("quiz-message");
const btnQuizNext = document.getElementById("btn-quiz-next");

// 効果音
const correctSound = new Audio("sounds/correct.wav");
const wrongSound = new Audio("sounds/wrong.wav");

// クイズ開始
function startQuiz(mode) {
  quizMode = mode;
  quizQuestions = shuffle(mode === "word" ? wordQuestions : grammarQuestions); // ★ここでランダム
  quizIndex = 0;
  quizScore = 0;

  // タイトルをモードに応じて変更（Day1 → 単語クイズ/文法クイズ）
  quizTitle.textContent = mode === "word" ? "単語クイズ" : "文法クイズ";

  showScreen("quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const total = quizQuestions.length;

  if (quizIndex >= total) {
    // 終了
    quizQuestion.textContent = `クイズ終了！スコア：${quizScore} / ${total}`;
    quizChoices.innerHTML = "";
    quizMessage.textContent = "";
    quizProgress.textContent = "";
    btnQuizNext.style.display = "none";
    return;
  }

  const q = quizQuestions[quizIndex];

  quizProgress.textContent = `${quizIndex + 1} / ${total}`;
  quizQuestion.textContent = q.question;
  quizMessage.textContent = "";
  btnQuizNext.style.display = "none";

  quizChoices.innerHTML = "";
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => handleQuizAnswer(idx));
    quizChoices.appendChild(btn);
  });
}

function handleQuizAnswer(selectedIndex) {
  const q = quizQuestions[quizIndex];

  // 一度回答したら選択肢を無効化
  const buttons = quizChoices.querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));

  if (selectedIndex === q.correct) {
    quizMessage.textContent = "⭕ 正解！";
    quizMessage.className = "quiz-message correct";
    quizScore++;
    correctSound.currentTime = 0;
    correctSound.play();
  } else {
    quizMessage.textContent = `❌ 不正解… 正解は「${q.choices[q.correct]}」です。`;
    quizMessage.className = "quiz-message wrong";
    wrongSound.currentTime = 0;
    wrongSound.play();
  }

  btnQuizNext.style.display = "inline-block";
}

btnQuizNext.addEventListener("click", () => {
  quizIndex++;
  renderQuizQuestion();
});

// ======================================================
// シャドーイング
// ======================================================
const shadowData = [
  {
    en: "I increase my study time before the TOEIC test.",
    ja: "TOEICテストの前には勉強時間を増やします。",
  },
  {
    en: "We need to improve our customer service.",
    ja: "私たちはカスタマーサービスを改善する必要があります。",
  },
  {
    en: "Could you attend the meeting tomorrow morning?",
    ja: "明日の朝の会議に参加していただけますか？",
  },
  {
    en: "Please review the document before you sign it.",
    ja: "署名する前にその書類を確認してください。",
  },
  {
    en: "Our sales increased significantly last year.",
    ja: "昨年、私たちの売上は大きく増加しました。",
  },
  {
    en: "He is responsible for customer support.",
    ja: "彼は顧客対応を担当しています。",
  },
  {
    en: "Let’s discuss the new project plan.",
    ja: "新しいプロジェクト計画について話し合いましょう。",
  },
  {
    en: "I’m looking forward to working with you.",
    ja: "あなたと一緒に働くことを楽しみにしています。",
  },
  {
    en: "Could you explain this chart in more detail?",
    ja: "この表について、もう少し詳しく説明していただけますか？",
  },
  {
    en: "We will announce the results next week.",
    ja: "私たちは来週、結果を発表します。",
  },
];

let shadowIndex = 0;
const shadowEn = document.getElementById("shadow-en");
const shadowJa = document.getElementById("shadow-ja");

function renderShadow() {
  const item = shadowData[shadowIndex];
  shadowEn.textContent = item.en;
  shadowJa.textContent = item.ja;
}

document.getElementById("btn-shadow-prev").addEventListener("click", () => {
  shadowIndex = (shadowIndex - 1 + shadowData.length) % shadowData.length;
  renderShadow();
});

document.getElementById("btn-shadow-next").addEventListener("click", () => {
  shadowIndex = (shadowIndex + 1) % shadowData.length;
  renderShadow();
});

// ======================================================
// AI 英語チャット
// ======================================================
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

function addChatBubble(text, who) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function callChatAPI(message) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();

  if (data.reply) {
    return data.reply;
  }

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

async function handleChatSend(customText) {
  const text =
    typeof customText === "string" ? customText : chatInput.value.trim();
  if (!text) return;

  addChatBubble(text, "user");
  chatInput.value = "";

  const thinking = document.createElement("div");
  thinking.className = "chat-bubble bot";
  thinking.textContent = "考え中…";
  chatLog.appendChild(thinking);
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const reply = await callChatAPI(text);
    thinking.textContent = reply;
  } catch (e) {
    thinking.textContent =
      "⚠ JavaScript側でエラーが発生しました。\n" + e.toString();
  }
}

chatSend.addEventListener("click", () => handleChatSend());
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChatSend();
  }
});

// クイック質問ボタン
document.querySelectorAll(".chat-quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.dataset.text;
    handleChatSend(text);
  });
});

// ======================================================
// 画面遷移ボタン
// ======================================================
document
  .getElementById("btn-word-quiz")
  .addEventListener("click", () => startQuiz("word"));
document
  .getElementById("btn-grammar-quiz")
  .addEventListener("click", () => startQuiz("grammar"));

document.getElementById("btn-shadowing").addEventListener("click", () => {
  shadowIndex = 0;
  renderShadow();
  showScreen("shadow");
});

document.getElementById("btn-chat").addEventListener("click", () => {
  showScreen("chat");
});

// 「ホームへ」
document
  .getElementById("btn-quiz-to-home")
  .addEventListener("click", () => showScreen("home"));
document
  .getElementById("btn-shadow-to-home")
  .addEventListener("click", () => showScreen("home"));
document
  .getElementById("btn-chat-to-home")
  .addEventListener("click", () => showScreen("home"));

// 初期表示
showScreen("home");
renderShadow(); // シャドーイング初期表示
