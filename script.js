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

// 単語クイズ用
let quizWords = [];
let idx = 0;
let correct = 0;
let mistakes = [];
let isReviewMode = false;     // 単語クイズが復習モード中かどうか
let reviewWords = [];         // 単語クイズの復習用（間違えた問題だけ）

// 文法クイズ用
let grammarIndex = 0;
let grammarCorrect = 0;
let shuffledGrammarQuestions = [];
let grammarMistakes = [];     // 文法クイズの間違い（今回分）
let grammarIsReview = false;  // 文法クイズの復習モード中かどうか

// 効果音
const seCorrect = $("se-correct");
const seNext    = $("se-next");
const seWrong   = $("se-wrong");
const seClick   = $("se-click");

// クイズモードラベル
const quizModeLabel = $("quiz-mode-label");

// 文法クイズ要素
const grammarQuestionEl  = $("grammar-question");
const grammarChoicesEl   = $("grammar-choices");
const grammarFeedbackEl  = $("grammar-feedback");
const grammarCounterEl   = $("grammar-counter");
const grammarProgressEl  = $("grammar-progress");

// 復習ボタン
const btnReview            = $("btn-review");
const btnGoReview          = $("btn-go-review");
const btnGrammarReview     = $("btn-grammar-review");
const btnGrammarReviewHome = $("btn-grammar-review-home");

// 発音トレーニング要素
const shadowRecognizedEl = $("shadow-recognized");
const shadowFeedbackEl   = $("shadow-feedback");
let lastRecognizedText   = "";

// チャット要素
const chatLog   = $("chat-log");
const chatInput = $("chat-input");

// Cloudflare Worker の AIエンドポイント（AIチャット＆発音チェック用）
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
  Object.values(screens).forEach(s => {
    if (s) s.classList.remove("active");
  });
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
  quizWords = shuffle(day1Words);   // 本番は全単語をランダム
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
  quizWords = shuffle(reviewWords);   // 間違えた単語だけ
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
    mistakes.push(q);   // 今回間違えた問題
    playSE(seWrong);

    // ★ 本番モードで1問でも間違えたら、その時点で復習モードをONにする
    if (!isReviewMode){
      if (!reviewWords.find(w => w.word === q.word)){
        reviewWords.push(q);
      }
      const hasReview = reviewWords.length > 0;
      if (btnReview)   btnReview.disabled   = !hasReview;
      if (btnGoReview) btnGoReview.disabled = !hasReview;
    }
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

  if (!isReviewMode){
    // ★ セッション終了時にも、間違えた問題をユニークにまとめ直す
    const unique = new Map();
    mistakes.forEach(w => unique.set(w.word, w));
    reviewWords = Array.from(unique.values());

    const hasReview = reviewWords.length > 0;
    if (btnReview)   btnReview.disabled   = !hasReview;
    if (btnGoReview) btnGoReview.disabled = !hasReview;
  } else {
    // 復習モードが終わったら、復習対象から削除（＝もう出題されない）
    reviewWords = [];
    if (btnReview)   btnReview.disabled   = true;
    if (btnGoReview) btnGoReview.disabled = true;
    isReviewMode = false;
  }

  show("result");
}

// ==================== 文法クイズ（本番 + 復習モード） ====================

function startGrammarQuiz() {
  playSE(seClick);
  grammarIndex = 0;
  grammarCorrect = 0;
  grammarIsReview = false;
  grammarMistakes = [];                      // 今回の間違いをリセット
  shuffledGrammarQuestions = shuffle(grammarQuestions); // 本番は全問ランダム
  show("grammar");
  renderGrammarQuestion();
}

function startGrammarReview() {
  if (grammarMistakes.length === 0){
    alert("この回で間違えた文法問題はありません。");
    return;
  }
  playSE(seClick);
  grammarIsReview = true;
  grammarIndex = 0;
  grammarCorrect = 0;
  shuffledGrammarQuestions = shuffle(grammarMistakes);  // 間違えた問題だけ
  if (btnGrammarReviewHome) btnGrammarReviewHome.disabled = true;
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
  if (btnGrammarReview) btnGrammarReview.style.display = "none";

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

    if (!grammarIsReview){
      // ★ 本番モードで1問でも間違えたら、その時点で復習モードをON
      if (!grammarMistakes.includes(q)) {
        grammarMistakes.push(q);
      }
      if (btnGrammarReviewHome) btnGrammarReviewHome.disabled = false;
      if (btnGrammarReview)     btnGrammarReview.style.display = "inline-block";
    }
  }

  grammarProgressEl.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = shuffledGrammarQuestions.length;
  const rate  = total > 0 ? Math.round(grammarCorrect / total * 100) : 0;
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;

  if (rate >= 90) msg += " すばらしい！Part5もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  grammarFeedbackEl.textContent = msg;
  grammarChoicesEl.innerHTML = "";
  $("btn-grammar-next").style.display = "none";

  if (!grammarIsReview && grammarMistakes.length > 0) {
    if (btnGrammarReview)     btnGrammarReview.style.display = "inline-block";
    if (btnGrammarReviewHome) btnGrammarReviewHome.disabled = false;
  } else {
    if (grammarIsReview){
      grammarMistakes = [];
      grammarIsReview = false;
      if (btnGrammarReviewHome) btnGrammarReviewHome.disabled = true;
    }
    if (btnGrammarReview) btnGrammarReview.style.display = "none";
  }
}

// ==================== 発音トレーニング（音声認識＋AIチェック） ====================

// SpeechRecognition の準備
let recognition = null;
let isRecording = false;

if (typeof window !== "undefined") {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("result", (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++){
        text += event.results[i][0].transcript + " ";
      }
      text = text.trim();
      lastRecognizedText = text;
      if (shadowRecognizedEl) {
        shadowRecognizedEl.textContent = text || "（音声がまだ認識されていません）";
      }
      if (shadowFeedbackEl) {
        shadowFeedbackEl.textContent = "録音中… 停止ボタンを押すとチェックします。";
      }
    });

    recognition.addEventListener("end", () => {
      isRecording = false;
    });

    recognition.addEventListener("error", (e) => {
      console.log("speech recognition error", e);
      if (shadowRecognizedEl) {
        shadowRecognizedEl.textContent = "⚠ 音声認識中にエラーが発生しました。もう一度お試しください。";
      }
      if (shadowFeedbackEl) {
        shadowFeedbackEl.textContent = "エラーが発生しました。マイク権限やブラウザ設定を確認してください。";
      }
      isRecording = false;
    });
  }
}

function openPronunciationScreen(){
  playSE(seClick);
  show("shadow");
  lastRecognizedText = "";
  if (shadowRecognizedEl) {
    shadowRecognizedEl.textContent = "（ここにあなたの発話が表示されます）";
  }
  if (shadowFeedbackEl) {
    shadowFeedbackEl.textContent = "停止ボタンを押すと、文法・表現のチェック結果が表示されます。";
  }
}

function startRecording(){
  if (!recognition){
    alert("このブラウザは音声認識に対応していません。\nChrome などの最新ブラウザでお試しください。");
    return;
  }
  if (isRecording) return;
  isRecording = true;
  try {
    recognition.start();
    lastRecognizedText = "";
    if (shadowRecognizedEl) {
      shadowRecognizedEl.textContent = "Listening...（話してください）";
    }
    if (shadowFeedbackEl) {
      shadowFeedbackEl.textContent = "録音中… 話し終わったら「停止（チェック）」を押してください。";
    }
  } catch (e){
    console.log("recognition start error", e);
    isRecording = false;
  }
}

async function stopRecording(){
  if (!recognition && !lastRecognizedText) return;

  // 音声認識を停止
  if (recognition && isRecording) {
    try {
      recognition.stop();
    } catch (e){
      console.log("recognition stop error", e);
    }
  }
  isRecording = false;

  const text = (lastRecognizedText || (shadowRecognizedEl ? shadowRecognizedEl.textContent : "")).trim();

  if (!text || text === "Listening...（話してください）" ||
      text === "（ここにあなたの発話が表示されます）" ||
      text.startsWith("⚠")) {
    if (shadowFeedbackEl) {
      shadowFeedbackEl.textContent = "話した内容が取得できませんでした。もう一度お試しください。";
    }
    return;
  }

  if (shadowFeedbackEl) {
    shadowFeedbackEl.textContent = "AIが文法・表現をチェックしています…";
  }

  try {
    const reply = await evaluateSpeaking(text);
    if (shadowFeedbackEl) {
      shadowFeedbackEl.textContent = reply;
    }
  } catch (e){
    console.error(e);
    if (shadowFeedbackEl) {
      shadowFeedbackEl.textContent = "⚠ チェック中にエラーが発生しました。\n" + e.toString();
    }
  }
}

// ==================== AI英語チャット & 発音チェック共通のAPI呼び出し ====================

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

// 発音チェック用のプロンプト
async function evaluateSpeaking(spokenSentence){
  const prompt =
    "あなたは日本人学習者向けの英語コーチです。\n" +
    "以下の学習者の英文について、文法と表現の自然さを日本語でやさしくフィードバックしてください。\n\n" +
    "学習者の英文: " + spokenSentence + "\n\n" +
    "フィードバックは、\n" +
    "1) 文法がどの程度合っているか（ざっくりでOK）\n" +
    "2) 不自然な表現や直したほうがよいところ\n" +
    "3) 改善した例文（英語）\n" +
    "を、できるだけ短く箇条書きで教えてください。";

  return await callChatAPI(prompt);
}

// ==================== AI英語チャット（通常チャット） ====================

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

  const btnGrammar        = $("btn-grammar");
  const btnGrammarNext    = $("btn-grammar-next");
  const btnGrammarBack    = $("btn-grammar-back");

  const btnShadow         = $("btn-shadow");
  const btnShadowRecord   = $("btn-shadow-record");
  const btnShadowStop     = $("btn-shadow-stop");
  const btnShadowBack     = $("btn-shadow-back");

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
  if (btnGrammarReview)     btnGrammarReview.onclick     = startGrammarReview;
  if (btnGrammarReviewHome) btnGrammarReviewHome.onclick = startGrammarReview;

  if (btnShadow)       btnShadow.onclick       = openPronunciationScreen;
  if (btnShadowRecord) btnShadowRecord.onclick = () => { playSE(seClick); startRecording(); };
  if (btnShadowStop)   btnShadowStop.onclick   = () => { playSE(seClick); stopRecording(); };
  if (btnShadowBack)   btnShadowBack.onclick   = () => { playSE(seClick); show("home"); };

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
