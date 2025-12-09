/***********************************************
 * TOEIC600ブートキャンプ - script.js 完全版
 * ・単語クイズ＋復習
 * ・文法クイズ＋復習（1問でも間違えたら即復習OK）
 * ・発音トレーニング（SpeechRecognition + AIフィードバック）
 * ・AI英語チャット（テキスト）
 * ・AI英会話（女性英語ボイス / 長時間録音）
 * ・進捗保存（localStorage）＆レベル表示
 ***********************************************/

// ===== ユーティリティ =====
function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = $(id);
  if (el) el.classList.add("active");
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let seCorrect, seWrong, seNext, seClick;
function playSE(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

// ==== APIエンドポイント（必要に応じて変更） ====
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// ===== データ =====
const WORDS = [
  { word: "increase",         jp: "増加する" },
  { word: "decrease",         jp: "減少する" },
  { word: "attend",           jp: "出席する" },
  { word: "participate",      jp: "参加する" },
  { word: "deliver",          jp: "届ける" },
  { word: "schedule",         jp: "予定する" },
  { word: "reschedule",       jp: "予定変更する" },
  { word: "available",        jp: "利用可能な" },
  { word: "responsible",      jp: "責任がある" },
  { word: "require",          jp: "必要とする" },
  { word: "offer",            jp: "提供する" },
  { word: "approve",          jp: "承認する" },
  { word: "prepare",          jp: "準備する" },
  { word: "complete",         jp: "完了する" },
  { word: "confirm",          jp: "確認する" },
  { word: "increase in sales",jp: "売上の増加" },
  { word: "on time",          jp: "時間通りに" },
  { word: "in advance",       jp: "事前に" },
  { word: "be in charge of",  jp: "担当している" },
  { word: "according to",     jp: "〜によると" }
];

const GRAMMAR = [
  {
    q: "She (_____) the report yesterday.",
    a: "submitted",
    options: ["submits","submitted","submitting","submit"],
    exp: "yesterday があるので過去形 submitted が正解。"
  },
  {
    q: "The meeting has been (_____) to next Monday.",
    a: "postponed",
    options: ["postponed","postpone","postponing","postpones"],
    exp: "has been + 過去分詞 なので postponed。"
  },
  {
    q: "Please (_____) me if you have any questions.",
    a: "contact",
    options: ["contact","contacts","contacting","to contact"],
    exp: "命令文なので動詞の原形 contact が入る。"
  },
  {
    q: "We are looking forward to (_____) you.",
    a: "seeing",
    options: ["see","seeing","seen","to see"],
    exp: "look forward to の後ろは動名詞 seeing。"
  },
  {
    q: "He is responsible (_____) managing the team.",
    a: "for",
    options: ["for","to","at","on"],
    exp: "responsible for ～ で「～に責任がある」。"
  }
];

// ===== 進捗保存 (localStorage) =====
const STORAGE_KEY = "toeic600_bootcamp_stats"; // { totalAnswered, totalCorrect }

let stats = {
  totalAnswered: 0,
  totalCorrect: 0
};

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.totalAnswered === "number") stats.totalAnswered = parsed.totalAnswered;
    if (typeof parsed.totalCorrect === "number") stats.totalCorrect = parsed.totalCorrect;
  } catch (e) {
    console.log("loadStats error", e);
  }
}

function saveStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.log("saveStats error", e);
  }
}

function updateStatsUI() {
  const total = stats.totalAnswered;
  const correct = stats.totalCorrect;

  // レベル計算：正解 20問ごとにレベルアップ
  const level = 1 + Math.floor(correct / 20);
  const within = correct % 20;
  const progress = Math.min(100, (within / 20) * 100);

  const levelLabel = $("level-label");
  const levelBar = $("level-progress-inner");
  const levelText = $("level-progress-text");
  const statTotal = $("stat-total");
  const statCorrect = $("stat-correct");

  if (levelLabel) levelLabel.textContent = `Lv.${level} TOEICチャレンジャー`;
  if (levelBar) levelBar.style.width = progress + "%";
  if (levelText) levelText.textContent = `次のレベルまで ${within} / 20 問`;
  if (statTotal) statTotal.textContent = `${total} 問`;
  if (statCorrect) statCorrect.textContent = `${correct} 問`;
}

// ===== 単語クイズ =====
let wordOrder = [];
let wordIndex = 0;
let wordScore = 0;
let wordMistakes = [];
let reviewWords = [];

function updateWordProgress(done) {
  const total = wordOrder.length || WORDS.length;
  const inner = $("progress-inner");
  const text  = $("progress-text");
  if (inner) inner.style.width = (done / total * 100) + "%";
  if (text)  text.textContent = `${done} / ${total}`;
}

function startWordQuiz(review = false) {
  playSE(seClick);
  if (review) {
    if (!reviewWords || reviewWords.length === 0) {
      alert("復習できる単語がまだありません。まず通常モードで解きましょう。");
      return;
    }
    wordOrder = shuffle(reviewWords.slice());
    $("quiz-mode-label").textContent = "復習モード（単語）";
  } else {
    wordOrder = shuffle(WORDS.slice());
    $("quiz-mode-label").textContent = "本番モード（単語）";
  }
  wordIndex = 0;
  wordScore = 0;
  wordMistakes = [];
  updateWordProgress(0);
  showScreen("screen-quiz");
  renderWordQuestion();
}

function renderWordQuestion() {
  if (wordIndex >= wordOrder.length) {
    return showWordResult();
  }
  const q = wordOrder[wordIndex];
  $("quiz-counter").textContent = `${wordIndex + 1} / ${wordOrder.length}`;
  $("quiz-question").textContent = q.word;
  $("feedback").textContent = "";
  $("btn-next").style.display = "none";

  // 選択肢
  const others = shuffle(WORDS.filter(w => w.jp !== q.jp)).slice(0,3);
  const choices = shuffle([q.jp, ...others.map(o => o.jp)]);
  const box = $("choices");
  box.innerHTML = "";
  choices.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = c;
    btn.onclick = () => handleWordAnswer(btn, c, q.jp, q);
    box.appendChild(btn);
  });
}

function handleWordAnswer(btn, chosen, correct, qObj) {
  Array.from($("choices").children).forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    wordScore++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correct}`;
    wordMistakes.push(qObj);
    playSE(seWrong);

    // 復習用にセット（1問でも間違えたら有効）
    reviewWords = wordMistakes.slice();
    const homeReviewBtn = $("btn-review");
    const resultReviewBtn = $("btn-go-review");
    if (homeReviewBtn)   homeReviewBtn.disabled   = reviewWords.length === 0;
    if (resultReviewBtn) resultReviewBtn.disabled = reviewWords.length === 0;
  }

  updateWordProgress(wordIndex + 1);
  $("btn-next").style.display = "block";
}

function showWordResult() {
  const total = wordOrder.length || WORDS.length;
  const score = wordScore;
  const rate = total ? Math.round((score / total) * 100) : 0;

  $("result-score").textContent = `正解数 ${score} / ${total}`;
  $("result-rate").textContent  = `正答率 ${rate}%`;
  $("result-rank").textContent  =
    "ランク " + (rate >= 90 ? "S" : rate >= 75 ? "A" : rate >= 60 ? "B" : "C");

  const list = $("mistake-list");
  list.innerHTML = "";
  wordMistakes.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.word} - ${w.jp}`;
    list.appendChild(li);
  });

  reviewWords = wordMistakes.slice();
  const homeReviewBtn = $("btn-review");
  const resultReviewBtn = $("btn-go-review");
  const hasReview = reviewWords.length > 0;
  if (homeReviewBtn)   homeReviewBtn.disabled   = !hasReview;
  if (resultReviewBtn) resultReviewBtn.disabled = !hasReview;

  // 進捗保存
  stats.totalAnswered += total;
  stats.totalCorrect  += score;
  saveStats();
  updateStatsUI();

  showScreen("screen-result");
}

// ===== 文法クイズ =====
let grammarOrder = [];
let grammarIndex = 0;
let grammarCorrect = 0;
let grammarMistakeList = [];      // 今回のセットで間違えた問題
let grammarReviewQuestions = [];  // 累積の復習用（★ここが重要）

function startGrammarQuiz(review = false) {
  playSE(seClick);
  if (review) {
    if (!grammarReviewQuestions || grammarReviewQuestions.length === 0) {
      alert("復習できる文法問題がまだありません。");
      return;
    }
    grammarOrder = shuffle(grammarReviewQuestions.slice());
    $("grammar-mode-label").textContent = "復習モード（文法）";
  } else {
    grammarOrder = shuffle(GRAMMAR.slice());
    $("grammar-mode-label").textContent = "通常モード（文法）";
  }
  grammarIndex = 0;
  grammarCorrect = 0;
  grammarMistakeList = [];
  showScreen("screen-grammar");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  const total = grammarOrder.length;
  if (grammarIndex >= total) {
    return showGrammarResult();
  }
  const q = grammarOrder[grammarIndex];
  $("grammar-question").textContent = q.q;
  $("grammar-counter").textContent  = `${grammarIndex + 1} / ${total}`;
  $("grammar-feedback").textContent = "";
  $("grammar-progress").textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;
  $("btn-grammar-next").style.display = "none";

  const box = $("grammar-choices");
  box.innerHTML = "";
  const opts = shuffle(q.options);
  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => handleGrammarAnswer(btn, opt, q);
    box.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, chosen, qObj) {
  Array.from($("grammar-choices").children).forEach(b => b.disabled = true);

  if (chosen === qObj.a) {
    btn.classList.add("correct");
    $("grammar-feedback").textContent = "✅ 正解！ " + (qObj.exp || "");
    grammarCorrect++;
    playSE(seCorrect);

    // 今回のセットでのミスリストから削除
    grammarMistakeList = grammarMistakeList.filter(q => q.q !== qObj.q);
    // 復習用リストからも削除（復習で正解したら消える）
    grammarReviewQuestions = grammarReviewQuestions.filter(q => q.q !== qObj.q);
  } else {
    btn.classList.add("wrong");
    $("grammar-feedback").textContent =
      `❌ 不正解… 正解: ${qObj.a} ／ ${qObj.exp || ""}`;
    playSE(seWrong);

    // 今回のミスリストに追加
    if (!grammarMistakeList.some(q => q.q === qObj.q)) {
      grammarMistakeList.push(qObj);
    }
    // ★復習用リストにも即追加 → 1問でも間違えたら復習モードOK
    if (!grammarReviewQuestions.some(q => q.q === qObj.q)) {
      grammarReviewQuestions.push(qObj);
    }
    const btnReview = $("btn-grammar-review");
    if (btnReview) btnReview.disabled = grammarReviewQuestions.length === 0;
  }

  $("grammar-progress").textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = grammarOrder.length;
  const rate  = total ? Math.round((grammarCorrect / total) * 100) : 0;
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;
  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";
  $("grammar-feedback").textContent = msg;

  // ★ ここでも一応、今回のミスを復習リストにマージしておく
  grammarMistakeList.forEach(q => {
    if (!grammarReviewQuestions.some(g => g.q === q.q)) {
      grammarReviewQuestions.push(q);
    }
  });

  const btnReview = $("btn-grammar-review");
  if (btnReview) btnReview.disabled = grammarReviewQuestions.length === 0;

  // 進捗保存
  stats.totalAnswered += total;
  stats.totalCorrect  += grammarCorrect;
  saveStats();
  updateStatsUI();
}

// ===== 発音トレーニング =====
let pronRecognition = null;
let pronListening = false;
let pronFinalText = "";

function initPronRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusEl = $("pron-status");
  if (!SR) {
    if (statusEl) statusEl.textContent = "このブラウザは音声認識に対応していません。（Chrome推奨）";
    return;
  }

  pronRecognition = new SR();
  pronRecognition.lang = "en-US";
  pronRecognition.continuous = true;
  pronRecognition.interimResults = true;
  pronRecognition.maxAlternatives = 1;

  pronRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        pronFinalText += (pronFinalText ? " " : "") + result[0].transcript.trim();
      } else {
        interim += result[0].transcript;
      }
    }
    const display = (pronFinalText + " " + interim).trim();
    $("pron-text").textContent = display || "(英語を話してください…)";
  };

  pronRecognition.onerror = (e) => {
    console.log("pron error", e);
    if (e.error === "no-speech") {
      if (statusEl) statusEl.textContent = "しばらく音声がありませんでした。もう一度話してください。";
      return; // onendで再開
    }
    pronListening = false;
    if (statusEl) statusEl.textContent = "音声認識エラー: " + e.error;
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

function openPronounceScreen() {
  playSE(seClick);
  showScreen("screen-pronounce");
  pronFinalText = "";
  $("pron-text").textContent = "マイクボタンを押して、英語で話してみましょう。";
  $("pron-feedback").textContent = "文法や表現についてAIがフィードバックします。";
  $("pron-status").textContent = "録音は停止ボタンを押すまで続きます。";
}

function startPronRecording() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("このブラウザでは音声認識が使えません。PC版Chrome推奨です。");
    return;
  }
  if (!pronRecognition) initPronRecognition();
  if (!pronRecognition) return;

  pronFinalText = "";
  pronListening = true;
  $("pron-text").textContent = "Listening...";
  $("pron-status").textContent = "録音中… 話し終わったら停止ボタンを押してください。";

  try {
    pronRecognition.start();
  } catch (e) {
    console.log("pron start error", e);
  }
}

function stopPronRecording() {
  if (!pronRecognition) return;
  pronListening = false;
  try {
    pronRecognition.stop();
  } catch (e) {
    console.log("pron stop error", e);
  }

  const text = (pronFinalText || "").trim();
  if (!text) {
    $("pron-status").textContent = "音声が認識されませんでした。もう一度お試しください。";
    return;
  }
  $("pron-status").textContent = "AIが英文をチェックしています…";

  callChatAPI(
    "次の英文を、TOEIC 学習者向けに簡単にフィードバックしてください。" +
    "1) 発音が難しそうな単語、2) 文法的におかしい箇所、3) より自然な言い換え例を1つ提示してください。" +
    "日本語でやさしく説明してください。\n\n" +
    "【学習者の英文】\n" + text
  ).then(reply => {
    const textReply = normalizeReplyToString(reply);
    $("pron-feedback").textContent = textReply;
    $("pron-status").textContent = "結果が表示されました。";
  }).catch(e => {
    console.log(e);
    $("pron-feedback").textContent = "AIフィードバック中にエラーが発生しました。";
    $("pron-status").textContent = e.toString();
  });
}

// ===== AIチャット共通 =====
async function callChatAPI(message) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (data.reply) return data.reply;     // 文字列 or {en, jp,...} を想定
  if (data.error) {
    return {
      en: "",
      jp: "⚠ エラー: " + data.error + "\n詳細: " +
          JSON.stringify(data.detail || "", null, 2)
    };
  }
  return { en: "", jp: "⚠ 不明なエラーが発生しました。" };
}

// data.reply がオブジェクトでも文字列でも安全に扱うためのヘルパー
function normalizeReplyToString(reply) {
  if (typeof reply === "string") return reply;
  if (reply && typeof reply === "object") {
    // {en, jp} 形式なら整えて返す
    if (reply.en || reply.jp) {
      let s = "";
      if (reply.en) s += "EN: " + reply.en + "\n";
      if (reply.jp) s += "JP: " + reply.jp;
      return s.trim();
    }
    return JSON.stringify(reply);
  }
  return String(reply ?? "");
}

// ===== AI英語チャット（テキスト） =====
function addChatBubble(logEl, text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function openChatScreen() {
  playSE(seClick);
  showScreen("screen-chat");
  const log = $("chat-log");
  if (log) {
    log.innerHTML = "";
    addChatBubble(
      log,
      "こんにちは！AI英語チャットです。\n翻訳・英作文・添削・TOEIC学習相談など、英語に関することなら何でも聞いてください。",
      false
    );
  }
}

async function handleChatSend(customText) {
  const log = $("chat-log");
  const input = $("chat-input");
  if (!log || !input) return;

  const text = (typeof customText === "string" ? customText : input.value).trim();
  if (!text) return;

  addChatBubble(log, text, true);
  input.value = "";

  addChatBubble(log, "考え中…", false);
  const thinking = log.lastChild;

  try {
    const reply = await callChatAPI(text);
    const textReply = normalizeReplyToString(reply);
    thinking.textContent = textReply;
  } catch (e) {
    thinking.textContent = "エラー: " + e.toString();
  }
}

// ===== AI英会話（音声会話） =====
// 音声合成（女性英語ボイス）
let englishVoice = null;
function initSpeechVoices() {
  if (!window.speechSynthesis) return;
  const pick = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;
    englishVoice =
      voices.find(v =>
        v.lang.toLowerCase().startsWith("en") &&
        /female|woman|girl|google us english|samantha|allison|karen/i.test(v.name)
      ) ||
      voices.find(v => v.lang.toLowerCase().startsWith("en")) ||
      voices[0];
  };
  pick();
  window.speechSynthesis.onvoiceschanged = pick;
}

function speakEnglish(text) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  if (englishVoice) u.voice = englishVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// 音声認識（AI英会話）
let talkRecognition = null;
let talkListening = false;
let talkFinalText = "";

function initTalkRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusEl = $("talk-status");
  if (!SR) {
    if (statusEl) statusEl.textContent = "このブラウザは音声認識に対応していません。（Chrome推奨）";
    return;
  }

  talkRecognition = new SR();
  talkRecognition.lang = "en-US";
  talkRecognition.continuous = true;
  talkRecognition.interimResults = true;
  talkRecognition.maxAlternatives = 1;

  talkRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        talkFinalText += (talkFinalText ? " " : "") + result[0].transcript.trim();
      } else {
        interim += result[0].transcript;
      }
    }
    const display = (talkFinalText + " " + interim).trim();
    $("talk-heard").textContent = display || "(英語で話してみてください)";
  };

  talkRecognition.onerror = (e) => {
    console.log("talk error", e);
    if (e.error === "no-speech") {
      if (statusEl) statusEl.textContent = "音声が拾えませんでした。マイクを近づけて話してみてください。";
      return;
    }
    talkListening = false;
    if (statusEl) statusEl.textContent = "音声認識エラー: " + e.error;
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

function openTalkScreen() {
  playSE(seClick);
  showScreen("screen-talk");
  const log = $("talk-log");
  if (log) {
    log.innerHTML = "";
    addTalkMessage(
      "EN: Hi, I'm Onigiri-sensei! 🍙\n" +
      "JP: こんにちは、おにぎり先生だよ。英語で話しかけてみてね。",
      false
    );
  }
  $("talk-status").textContent = "マイクをオンにして英語で話すと、英語で返事＋日本語訳を表示します。";
  $("talk-heard").textContent = "(ここにあなたの英語が表示されます)";
}

function addTalkMessage(text, isUser) {
  const log = $("talk-log");
  if (!log) return;
  const div = document.createElement("div");
  div.className = "talk-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function startTalkRecording() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("このブラウザでは音声認識が使えません。Chrome推奨です。");
    return;
  }
  if (!talkRecognition) initTalkRecognition();
  if (!talkRecognition) return;

  talkFinalText = "";
  talkListening = true;
  $("talk-status").textContent = "録音中… 話し終わったら「停止して返事をもらう」を押してください。";
  $("talk-heard").textContent = "Listening...";

  try {
    talkRecognition.start();
  } catch (e) {
    console.log("talk start error", e);
  }
}

function stopTalkRecordingAndSend() {
  if (!talkRecognition) return;
  talkListening = false;
  try {
    talkRecognition.stop();
  } catch (e) {
    console.log("talk stop error", e);
  }

  const text = (talkFinalText || "").trim();
  if (!text) {
    $("talk-status").textContent = "音声が認識されませんでした。もう一度話してみてください。";
    return;
  }
  $("talk-heard").textContent = text;
  addTalkMessage("YOU: " + text, true);
  $("talk-status").textContent = "おにぎり先生が考え中…";

  callChatAPI(
    "あなたは『おにぎり先生』という若い女性の英会話講師です。" +
    "学習者の英文に対して、優しくカジュアルな英語で返事をし、日本語訳もつけてください。" +
    "必ず以下の形式で出力してください。\n\n" +
    "EN: （英語の返事）\nJP: （日本語訳）\n\n" +
    "【学習者の発話】\n" + text
  ).then(reply => {
    // ここで reply が文字列でもオブジェクトでも安全に扱う
    const replyStr = normalizeReplyToString(reply);

    // シンプルに "EN:" と "JP:" で分割
    let en = replyStr;
    let jp = "";
    const idx = replyStr.indexOf("JP:");
    if (idx !== -1) {
      en = replyStr.slice(0, idx).replace(/^EN:\s*/i, "").trim();
      jp = replyStr.slice(idx).replace(/^JP:\s*/i, "").trim();
    }

    const finalText = jp ? `EN: ${en}\nJP: ${jp}` : replyStr;
    addTalkMessage(finalText, false);
    $("talk-status").textContent = "マイクでまた話しかけてみてください。";

    // ★ 英語部分だけ音声で返す
    speakEnglish(en || replyStr);
  }).catch(e => {
    console.log(e);
    addTalkMessage("エラー: " + e.toString(), false);
    $("talk-status").textContent = "エラーが発生しました。";
  });
}

// ===== イベント登録 =====
window.addEventListener("DOMContentLoaded", () => {
  // 効果音
  seCorrect = $("se-correct");
  seWrong   = $("se-wrong");
  seNext    = $("se-next");
  seClick   = $("se-click");

  // 進捗ロード＆表示
  loadStats();
  updateStatsUI();

  // 音声合成ボイス
  if (window.speechSynthesis) {
    initSpeechVoices();
  }

  // 単語クイズ
  $("btn-start").onclick     = () => startWordQuiz(false);
  $("btn-review").onclick    = () => startWordQuiz(true);
  $("btn-next").onclick      = () => { playSE(seNext); wordIndex++; renderWordQuestion(); };
  $("btn-quit").onclick      = () => { playSE(seClick); showScreen("screen-home"); };
  $("btn-again").onclick     = () => startWordQuiz(false);
  $("btn-back-home").onclick = () => { playSE(seClick); showScreen("screen-home"); };
  $("btn-go-review").onclick = () => startWordQuiz(true);

  $("btn-review").disabled    = true;
  $("btn-go-review").disabled = true;

  // 文法クイズ
  $("btn-grammar").onclick        = () => startGrammarQuiz(false);
  $("btn-grammar-review").onclick = () => startGrammarQuiz(true);
  $("btn-grammar-next").onclick   = () => { playSE(seNext); grammarIndex++; renderGrammarQuestion(); };
  $("btn-grammar-back").onclick   = () => { playSE(seClick); showScreen("screen-home"); };
  $("btn-grammar-review").disabled = true;

  // 発音トレーニング
  $("btn-pronounce").onclick = openPronounceScreen;
  $("btn-pron-start").onclick = startPronRecording;
  $("btn-pron-stop").onclick  = stopPronRecording;
  $("btn-pron-back").onclick  = () => { playSE(seClick); showScreen("screen-home"); };

  // AI英語チャット
  $("btn-chat").onclick       = openChatScreen;
  $("btn-chat-send").onclick  = () => handleChatSend();
  $("btn-chat-back").onclick  = () => { playSE(seClick); showScreen("screen-home"); };
  $("btn-chat-example").onclick = () => handleChatSend("今日の単語で例文を作って");
  $("btn-chat-sales").onclick   = () => handleChatSend("営業のシーンで使える表現を教えて");
  const chatInput = $("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }

  // AI英会話
  $("btn-talk").onclick       = openTalkScreen;
  $("btn-talk-start").onclick = startTalkRecording;
  $("btn-talk-stop").onclick  = stopTalkRecordingAndSend;
  $("btn-talk-back").onclick  = () => { playSE(seClick); showScreen("screen-home"); };

  // 初期画面
  showScreen("screen-home");
});
