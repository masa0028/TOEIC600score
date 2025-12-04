// ==================== Day1 単語データ ====================
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

// ==================== 文法クイズ用データ ====================
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

// ==================== シャドーイング用データ ====================
const shadowSentences = [
  {
    en: "She attended the meeting on time.",
    jp: "彼女は会議に時間通りに出席した。",
    audio: "audio/shadow_1.mp3"
  },
  {
    en: "We need to prepare the documents in advance.",
    jp: "事前に資料を準備する必要があります。",
    audio: "audio/shadow_2.mp3"
  },
  {
    en: "He is in charge of the sales department.",
    jp: "彼は営業部を担当しています。",
    audio: "audio/shadow_3.mp3"
  },
  {
    en: "The manager approved the new schedule.",
    jp: "上司は新しいスケジュールを承認しました。",
    audio: "audio/shadow_4.mp3"
  },
  {
    en: "The company will offer training next week.",
    jp: "会社は来週研修を提供する予定です。",
    audio: "audio/shadow_5.mp3"
  },
  {
    en: "Please confirm your attendance by Friday.",
    jp: "金曜日までに出席を確認してください。",
    audio: "audio/shadow_6.mp3"
  },
  {
    en: "She completed the report ahead of time.",
    jp: "彼女は予定より早く報告書を完成させました。",
    audio: "audio/shadow_7.mp3"
  },
  {
    en: "He requested additional information from us.",
    jp: "彼はこちらに追加情報を求めました。",
    audio: "audio/shadow_8.mp3"
  },
  {
    en: "The meeting was postponed due to bad weather.",
    jp: "悪天候のため会議は延期されました。",
    audio: "audio/shadow_9.mp3"
  },
  {
    en: "We are responsible for improving customer service.",
    jp: "私たちは顧客サービスの改善を担当しています。",
    audio: "audio/shadow_10.mp3"
  }
];

// ==================== ヘルパー & 共通変数 ====================

function $(id){ return document.getElementById(id); }

const screens = {
  home:   $("screen-home"),
  quiz:   $("screen-quiz"),
  result: $("screen-result"),
  grammar:$("screen-grammar"),
  shadow: $("screen-shadow"),
  chat:   $("screen-chat")
};

let quizWords = [];
let idx = 0;
let correct = 0;
let mistakes = [];

// 復習モード
let isReviewMode = false;
let reviewWords = [];

// 文法クイズ
let grammarIndex = 0;
let grammarCorrect = 0;
// ★ ランダム出題用の配列
let shuffledGrammarQuestions = [];

// シャドーイング
let shadowIndex = 0;

// 効果音
const seCorrect = $("se-correct");
const seNext    = $("se-next");
const seWrong   = $("se-wrong");
const seClick   = $("se-click");

// シャドーイング音声
const shadowAudio   = $("shadow-audio");
const shadowEn      = $("shadow-en");
const shadowJp      = $("shadow-jp");
const shadowCounter = $("shadow-counter");

// クイズモードラベル
const quizModeLabel = $("quiz-mode-label");

// 文法クイズ要素
const grammarQuestionEl  = $("grammar-question");
const grammarChoicesEl   = $("grammar-choices");
const grammarFeedbackEl  = $("grammar-feedback");
const grammarCounterEl   = $("grammar-counter");
const grammarProgressEl  = $("grammar-progress");

// 復習ボタン
const btnReview   = $("btn-review");
const btnGoReview = $("btn-go-review");

// チャット要素
const chatLog   = $("chat-log");
const chatInput = $("chat-input");

// Cloudflare Worker の AIエンドポイント
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// 共通関数
function playSE(audioEl){
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch(e) {
    console.log("SE play error", e);
  }
}

function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
}

function shuffle(a){
  const arr = a.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==================== 単語クイズ ====================

function startQuiz(){
  playSE(seClick);
  isReviewMode = false;
  quizWords = shuffle(day1Words);   // ★単語クイズはここでランダム化
  idx = 0;
  correct = 0;
  mistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "本番モード";
  updateProgress(0);
  show("quiz");
  renderQuestion();
}

function startReviewQuiz(){
  if (reviewWords.length === 0){
    alert("復習対象の単語がありません。\nまずはDay1クエストを解いて、間違えた単語をためましょう。");
    return;
  }
  playSE(seClick);
  isReviewMode = true;
  quizWords = shuffle(reviewWords);
  idx = 0;
  correct = 0;
  mistakes = [];
  if (quizModeLabel) quizModeLabel.textContent = "復習モード";
  updateProgress(0);
  show("quiz");
  renderQuestion();
}

function renderQuestion(){
  if(idx >= quizWords.length){
    showResult();
    return;
  }
  const q = quizWords[idx];

  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent  = `${idx + 1} / ${quizWords.length}`;
  $("feedback").textContent      = "";
  $("btn-next").style.display    = "none";

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
      handleAnswer(btn, c, q.meaning_jp, q);
    };
    box.appendChild(btn);
  });
}

function handleAnswer(btn, choice, correctAns, q){
  Array.from($("choices").children).forEach(b => b.disabled = true);

  if (choice === correctAns){
    correct++;
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correctAns}`;
    mistakes.push(q);
    playSE(seWrong);
  }

  updateProgress(idx + 1);
  $("btn-next").style.display = "block";
}

function updateProgress(done){
  const total = quizWords.length || day1Words.length;
  $("progress-inner").style.width = (done / total * 100) + "%";
  $("progress-text").textContent  = `${done} / ${total}`;
}

function showResult(){
  const total = quizWords.length || day1Words.length;
  const rate  = total > 0 ? Math.round(correct / total * 100) : 0;

  $("result-score").textContent = `正解数 ${correct} / ${total}`;
  $("result-rate").textContent  = `正答率 ${rate}%`;
  $("result-rank").textContent  = "ランク " + (
    rate >= 90 ? "S" :
    rate >= 75 ? "A" :
    rate >= 60 ? "B" : "C"
  );

  const list = $("mistake-list");
  list.innerHTML = "";
  mistakes.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.word} - ${w.meaning_jp}`;
    list.appendChild(li);
  });

  reviewWords = mistakes.slice();
  const hasReview = reviewWords.length > 0;
  if (btnReview)   btnReview.disabled   = !hasReview;
  if (btnGoReview) btnGoReview.disabled = !hasReview;

  show("result");
}

// ==================== 文法クイズ（ランダム出題） ====================

function startGrammarQuiz() {
  playSE(seClick);
  grammarIndex = 0;
  grammarCorrect = 0;
  shuffledGrammarQuestions = shuffle(grammarQuestions); // ★ここで問題順ランダム
  show("grammar");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  const total = shuffledGrammarQuestions.length;
  if (grammarIndex >= total) {
    showGrammarResult();
    return;
  }

  const q = shuffledGrammarQuestions[grammarIndex];
  grammarQuestionEl.textContent = q.question;
  grammarCounterEl.textContent  = `${grammarIndex + 1} / ${total}`;
  grammarFeedbackEl.textContent = "";
  $("btn-grammar-next").style.display = "none";

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;

  const shuffledOptions = shuffle(q.options);
  grammarChoicesEl.innerHTML = "";

  shuffledOptions.forEach(opt => {
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
    grammarFeedbackEl.textContent = `❌ 不正解… 正解: ${q.correct} ／ ${q.explanation}`;
    playSE(seWrong);
  }

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = shuffledGrammarQuestions.length;
  const rate  = Math.round(grammarCorrect / total * 100);
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  grammarFeedbackEl.textContent = msg;
  grammarChoicesEl.innerHTML = "";
  $("btn-grammar-next").style.display = "none";
}

// ==================== シャドーイング ====================

function startShadowing(){
  playSE(seClick);
  shadowIndex = 0;
  show("shadow");
  renderShadowSentence();
}

function renderShadowSentence(){
  const total = shadowSentences.length;
  if (shadowIndex >= total) {
    shadowIndex = 0;
  }
  const data = shadowSentences[shadowIndex];

  shadowEn.textContent = data.en;
  shadowJp.textContent = data.jp;
  shadowCounter.textContent = `${shadowIndex + 1} / ${total}`;

  shadowAudio.src = data.audio;
  shadowAudio.playbackRate = 1.0;
}

function playShadowNormal(){
  if (!shadowAudio.src) return;
  try {
    shadowAudio.pause();
    shadowAudio.currentTime = 0;
    shadowAudio.playbackRate = 1.0;
    shadowAudio.play();
  } catch (e) {
    console.log("shadow normal play error", e);
  }
}

function playShadowSlow(){
  if (!shadowAudio.src) return;
  try {
    shadowAudio.pause();
    shadowAudio.currentTime = 0;
    shadowAudio.playbackRate = 0.75;
    shadowAudio.play();
  } catch (e) {
    console.log("shadow slow play error", e);
  }
}

function repeatShadow(){
  if (!shadowAudio.src) return;
  try {
    shadowAudio.currentTime = 0;
    shadowAudio.play();
  } catch (e) {
    console.log("shadow repeat play error", e);
  }
}

function nextShadowSentence(){
  playSE(seNext);
  shadowIndex++;
  renderShadowSentence();
}

// ==================== AI英語チャット（Cloudflare Worker 経由） ====================

function startChat(){
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

function addMessage(text, isUser){
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addUserMessage(text){ addMessage(text, true); }
function addBotMessage(text){ addMessage(text, false); }

async function callChatAPI(userMessage){
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await res.json();

  if (data.reply) {
    return data.reply;
  }

  if (data.error) {
    return "⚠ エラーが発生しました。\n" +
           "種類: " + data.error + "\n" +
           "詳細: " + JSON.stringify(data.detail ?? "", null, 2);
  }

  return "⚠ 予期しないレスポンスです。";
}

async function handleChatSend(customText){
  const text = (typeof customText === "string" ? customText : chatInput.value).trim();
  if (!text) return;

  addUserMessage(text);
  chatInput.value = "";

  addBotMessage("考え中…");
  const thinkingBubble = chatLog.lastChild;

  try {
    const reply = await callChatAPI(text);
    thinkingBubble.textContent = reply;
  } catch (e){
    console.error(e);
    thinkingBubble.textContent = "⚠ JavaScript側でエラーが発生しました。\n" + e.toString();
  }
}

// ==================== イベント登録 ====================

window.addEventListener("DOMContentLoaded", () => {
  const btnStart     = $("btn-start");
  const btnNext      = $("btn-next");
  const btnQuit      = $("btn-quit");
  const btnAgain     = $("btn-again");
  const btnBackHome  = $("btn-back-home");
  const btnGrammar   = $("btn-grammar");
  const btnGrammarNext = $("btn-grammar-next");
  const btnGrammarBack = $("btn-grammar-back");
  const btnShadow    = $("btn-shadow");
  const btnShadowPlayNormal = $("btn-shadow-play-normal");
  const btnShadowPlaySlow   = $("btn-shadow-play-slow");
  const btnShadowRepeat     = $("btn-shadow-repeat");
  const btnShadowNext       = $("btn-shadow-next");
  const btnShadowBack       = $("btn-shadow-back");
  const btnChat     = $("btn-chat");
  const btnChatSend = $("btn-chat-send");
  const btnChatBack = $("btn-chat-back");
  const btnChatExample = $("btn-chat-example");
  const btnChatSales   = $("btn-chat-sales");

  if (btnStart)    btnStart.onclick    = startQuiz;
  if (btnNext)     btnNext.onclick     = () => { playSE(seNext); idx++; renderQuestion(); };
  if (btnQuit)     btnQuit.onclick     = () => { playSE(seClick); show("home"); };
  if (btnAgain)    btnAgain.onclick    = startQuiz;
  if (btnBackHome) btnBackHome.onclick = () => { playSE(seClick); show("home"); };

  if (btnReview)   btnReview.onclick   = startReviewQuiz;
  if (btnGoReview) btnGoReview.onclick = startReviewQuiz;

  if (btnGrammar)      btnGrammar.onclick      = startGrammarQuiz;
  if (btnGrammarNext)  btnGrammarNext.onclick  = () => { playSE(seNext); grammarIndex++; renderGrammarQuestion(); };
  if (btnGrammarBack)  btnGrammarBack.onclick  = () => { playSE(seClick); show("home"); };

  if (btnShadow)            btnShadow.onclick            = startShadowing;
  if (btnShadowPlayNormal)  btnShadowPlayNormal.onclick  = () => { playSE(seClick); playShadowNormal(); };
  if (btnShadowPlaySlow)    btnShadowPlaySlow.onclick    = () => { playSE(seClick); playShadowSlow(); };
  if (btnShadowRepeat)      btnShadowRepeat.onclick      = () => { playSE(seClick); repeatShadow(); };
  if (btnShadowNext)        btnShadowNext.onclick        = () => { nextShadowSentence(); };
  if (btnShadowBack)        btnShadowBack.onclick        = () => { playSE(seClick); show("home"); };

  if (btnChat)       btnChat.onclick       = startChat;
  if (btnChatSend)   btnChatSend.onclick   = () => handleChatSend();
  if (btnChatBack)   btnChatBack.onclick   = () => { playSE(seClick); show("home"); };
  if (btnChatExample)btnChatExample.onclick= () => { playSE(seClick); handleChatSend("今日の単語で例文を作って"); };
  if (btnChatSales)  btnChatSales.onclick  = () => { playSE(seClick); handleChatSend("営業のシーンで使える表現を教えて"); };

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    });
  }
});
