/***********************************************
 * TOEIC600 BootCamp - script.js 完全版
 * ・単語クイズ＋復習
 * ・文法クイズ＋復習
 * ・発音トレーニング（SpeechRecognition + AIフィードバック）
 * ・AI英語チャット（テキスト）
 * ・AI英会話（女性ボイス / 英語のみ発話）
 ***********************************************/

// ===== 共通ユーティリティ =====
function $(id) { return document.getElementById(id); }

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = $(screenId);
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

function playSE(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    console.log("SE error", e);
  }
}

// 効果音（DOMContentLoadedで代入）
let seCorrect, seWrong, seNext, seClick;

// OpenAI（Cloudflare Worker）エンドポイント
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// ===== 単語データ =====
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

// ===== 文法データ =====
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

// ================= 単語クイズ =================
let wordOrder = [];
let wordIndex = 0;
let wordScore = 0;
let wordMistakes = [];   // 間違えた問題
let reviewWords = [];    // 復習用

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
  const counter = $("quiz-counter");
  const qWord   = $("quiz-question");
  const feedback = $("feedback");
  const btnNext  = $("btn-next");

  if (counter)  counter.textContent = `${wordIndex + 1} / ${wordOrder.length}`;
  if (qWord)    qWord.textContent   = q.word;
  if (feedback) feedback.textContent = "";
  if (btnNext)  btnNext.style.display = "none";

  // 選択肢作成
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
  const box = $("choices");
  const feedback = $("feedback");
  const btnNext = $("btn-next");

  Array.from(box.children).forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add("correct");
    if (feedback) feedback.textContent = "正解！";
    wordScore++;
    playSE(seCorrect);
  } else {
    btn.classList.add("wrong");
    if (feedback) feedback.textContent = `不正解… 正解: ${correct}`;
    wordMistakes.push(qObj);
    playSE(seWrong);

    // ★ここで復習用にセット
    reviewWords = wordMistakes.slice();
    const homeReviewBtn = $("btn-review");
    const resultReviewBtn = $("btn-go-review");
    if (homeReviewBtn)   homeReviewBtn.disabled = reviewWords.length === 0;
    if (resultReviewBtn) resultReviewBtn.disabled = reviewWords.length === 0;
  }

  updateWordProgress(wordIndex + 1);
  if (btnNext) btnNext.style.display = "block";
}

function showWordResult() {
  const total = wordOrder.length || WORDS.length;
  const score = wordScore;
  const rate = total ? Math.round(score / total * 100) : 0;

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

  showScreen("screen-result");
}

// ================= 文法クイズ =================
let grammarQuestionsOrder = [];
let grammarIndex = 0;
let grammarCorrect = 0;
let grammarMistakeList = [];   // オブジェクトごと保存
let grammarReviewQuestions = [];

function startGrammarQuiz(review = false) {
  playSE(seClick);
  if (review) {
    if (!grammarReviewQuestions || grammarReviewQuestions.length === 0) {
      alert("復習できる文法問題がまだありません。");
      return;
    }
    grammarQuestionsOrder = shuffle(grammarReviewQuestions.slice());
    $("grammar-mode-label").textContent = "復習モード（文法）";
  } else {
    grammarQuestionsOrder = shuffle(GRAMMAR.slice());
    $("grammar-mode-label").textContent = "通常モード（文法）";
  }
  grammarIndex = 0;
  grammarCorrect = 0;
  grammarMistakeList = [];
  showScreen("screen-grammar");
  renderGrammarQuestion();
}

function renderGrammarQuestion() {
  const total = grammarQuestionsOrder.length;
  if (grammarIndex >= total) {
    return showGrammarResult();
  }
  const qObj = grammarQuestionsOrder[grammarIndex];

  $("grammar-question").textContent = qObj.q;
  $("grammar-counter").textContent  = `${grammarIndex + 1} / ${total}`;
  $("grammar-feedback").textContent = "";
  $("grammar-progress").textContent = `正解数 ${grammarCorrect} / ${grammarIndex}`;
  $("btn-grammar-next").style.display = "none";

  const box = $("grammar-choices");
  box.innerHTML = "";
  const opts = shuffle(qObj.options);
  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;
    btn.onclick = () => handleGrammarAnswer(btn, opt, qObj);
    box.appendChild(btn);
  });
}

function handleGrammarAnswer(btn, chosen, qObj) {
  const box = $("grammar-choices");
  const fb  = $("grammar-feedback");
  const prog = $("grammar-progress");

  Array.from(box.children).forEach(b => b.disabled = true);

  if (chosen === qObj.a) {
    btn.classList.add("correct");
    fb.textContent = "✅ 正解！ " + (qObj.exp || "");
    grammarCorrect++;
    playSE(seCorrect);
    // 復習対象から削除
    grammarMistakeList = grammarMistakeList.filter(q => q.q !== qObj.q);
  } else {
    btn.classList.add("wrong");
    fb.textContent = `❌ 不正解… 正解: ${qObj.a} ／ ${qObj.exp || ""}`;
    playSE(seWrong);

    // 復習対象に追加（重複を避ける）
    if (!grammarMistakeList.some(q => q.q === qObj.q)) {
      grammarMistakeList.push(qObj);
    }
  }

  prog.textContent = `正解数 ${grammarCorrect} / ${grammarIndex + 1}`;
  $("btn-grammar-next").style.display = "block";
}

function showGrammarResult() {
  const total = grammarQuestionsOrder.length;
  const rate = total ? Math.round(grammarCorrect / total * 100) : 0;
  let msg = `文法クイズ 結果：${grammarCorrect} / ${total}（${rate}%）`;
  if (rate >= 90) msg += " すばらしい！Part5 もかなり強いです。";
  else if (rate >= 70) msg += " 良い感じです。もう一周して精度アップを。";
  else msg += " 苦手パターンを中心に復習しましょう。";

  $("grammar-feedback").textContent = msg;

  grammarReviewQuestions = grammarMistakeList.slice();
  const btnReview = $("btn-grammar-review");
  if (btnReview) btnReview.disabled = grammarReviewQuestions.length === 0;
}

// ================= 発音トレーニング =================
// 「停止ボタンを押すまで録音」＋「AIが英文をチェック」

let pronRecognition = null;
let pronListening = false;
let pronFinalText = "";

function initPronRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusEl = $("pron-status");

  if (!SR) {
    if (statusEl) statusEl.textContent = "このブラウザは音声認識に対応していません。Chrome推奨です。";
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
        // Finalだけ蓄積 → 途中のノイズを減らす
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
      if (statusEl) statusEl.textContent = "しばらく音声がありませんでした。もう一度話してみてください。";
      // 停止せず、onendで再開
      return;
    }
    pronListening = false;
    if (statusEl) statusEl.textContent = "音声認識エラー：" + e.error;
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
  $("pron-feedback").textContent = "";
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
    "1) 発音が難しい単語や、2) 文法的に不自然な箇所があれば指摘し、" +
    "最後により良い例文を1つだけ提示してください。（日本語メインでOK）\n\n" +
    "【学習者の英文】\n" + text
  )
    .then(reply => {
      $("pron-feedback").textContent = reply;
      $("pron-status").textContent = "結果が表示されました。";
    })
    .catch(e => {
      console.log(e);
      $("pron-feedback").textContent = "AIフィードバック中にエラーが発生しました。";
      $("pron-status").textContent = e.toString();
    });
}

// ================= AI英語チャット（テキスト） =================
function addChatBubble(logEl, text, isUser) {
  const div = document.createElement("div");
  div.className = "chat-bubble " + (isUser ? "user" : "bot");
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

async function callChatAPI(message) {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (data.reply) return data.reply;
  if (data.error) {
    return "⚠ エラー: " + data.error + "\n詳細: " +
      JSON.stringify(data.detail || "", null, 2);
  }
  return "⚠ 不明なエラーです。";
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
    thinking.textContent = reply;
  } catch (e) {
    thinking.textContent = "エラー: " + e.toString();
  }
}

// ================= AI英会話（Onigiri-kun：音声会話） =================

// 音声合成（女性英語ボイス優先）
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

function speakEnglish(enText) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(enText);
  u.lang = "en-US";
  if (englishVoice) u.voice = englishVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// 音声認識（会話用）
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
  talkRecognition.continuous = true;      // 停止ボタンまで
  talkRecognition.interimResults = true;  // 途中経過も見る
  talkRecognition.maxAlternatives = 1;

  talkRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        // Final結果だけ蓄積 → 認識ブレを少し軽減
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
      // onendで再開
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
      "EN: Hi, I'm Onigiri-kun! 🍙 I'm your English speaking partner.\n" +
      "JP: こんにちは、おにぎりくんだよ！英語で話しかけてみてね。",
      false
    );
  }
  $("talk-status").textContent = "マイクをオンにして英語で話すと、英語で返事します。（日本語訳はテキスト表示）";
  $("talk-heard").textContent = "";
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
  $("talk-status").textContent = "録音中… 話し終わったら停止ボタンを押してください。";
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
  $("talk-status").textContent = "Onigiri-kun が考え中…";

  callChatAPI(
    "あなたは『Onigiri-kun』という日本の若い女性キャラクターです。" +
    "英会話相手として、以下の英文に対してカジュアルで優しい英語で返事をしてください。" +
    "必ず、\nEN: (英語の返事)\nJP: (日本語訳)\nという2行だけで出力してください。\n\n" +
    "【学習者の発話】\n" + text
  )
    .then(reply => {
      // reply から EN/JP をざっくり分割
      let en = reply;
      let jp = "";
      const jpIndex = reply.indexOf("JP:");
      if (jpIndex !== -1) {
        en = reply.slice(0, jpIndex).replace(/^EN:\s*/i, "").trim();
        jp = reply.slice(jpIndex).replace(/^JP:\s*/i, "").trim();
      }
      const finalText = jp ? `EN: ${en}\nJP: ${jp}` : reply;
      addTalkMessage(finalText, false);
      $("talk-status").textContent = "またマイクで話しかけてみてください。";
      speakEnglish(en || reply); // 英語だけ音声再生
    })
    .catch(e => {
      console.log(e);
      addTalkMessage("エラー: " + e.toString(), false);
      $("talk-status").textContent = "エラーが発生しました。";
    });
}

// ================= イベント登録 =================
window.addEventListener("DOMContentLoaded", () => {
  // 効果音
  seCorrect = $("se-correct");
  seWrong   = $("se-wrong");
  seNext    = $("se-next");
  seClick   = $("se-click");

  // 音声合成ボイスの初期化
  if (window.speechSynthesis) {
    initSpeechVoices();
  }

  // 単語クイズ関連
  const btnStart     = $("btn-start");
  const btnReview    = $("btn-review");
  const btnNext      = $("btn-next");
  const btnQuit      = $("btn-quit");
  const btnAgain     = $("btn-again");
  const btnBackHome  = $("btn-back-home");
  const btnGoReview  = $("btn-go-review");

  if (btnStart)     btnStart.onclick    = () => startWordQuiz(false);
  if (btnReview)    btnReview.onclick   = () => startWordQuiz(true);
  if (btnNext)      btnNext.onclick     = () => { playSE(seNext); wordIndex++; renderWordQuestion(); };
  if (btnQuit)      btnQuit.onclick     = () => { playSE(seClick); showScreen("screen-home"); };
  if (btnAgain)     btnAgain.onclick    = () => startWordQuiz(false);
  if (btnBackHome)  btnBackHome.onclick = () => { playSE(seClick); showScreen("screen-home"); };
  if (btnGoReview)  btnGoReview.onclick = () => startWordQuiz(true);

  if (btnReview)   btnReview.disabled   = true;
  if (btnGoReview) btnGoReview.disabled = true;

  // 文法クイズ
  const btnGrammar       = $("btn-grammar");
  const btnGrammarReview = $("btn-grammar-review");
  const btnGrammarNext   = $("btn-grammar-next");
  const btnGrammarBack   = $("btn-grammar-back");

  if (btnGrammar)       btnGrammar.onclick       = () => startGrammarQuiz(false);
  if (btnGrammarReview) btnGrammarReview.onclick = () => startGrammarQuiz(true);
  if (btnGrammarNext)   btnGrammarNext.onclick   = () => { playSE(seNext); grammarIndex++; renderGrammarQuestion(); };
  if (btnGrammarBack)   btnGrammarBack.onclick   = () => { playSE(seClick); showScreen("screen-home"); };

  if (btnGrammarReview) btnGrammarReview.disabled = true;

  // 発音トレーニング
  const btnPronounce  = $("btn-pronounce"); // ホームのボタン（発音トレーニング）
  const btnPronStart  = $("btn-pron-start");
  const btnPronStop   = $("btn-pron-stop");
  const btnPronBack   = $("btn-pron-back");

  if (btnPronounce) btnPronounce.onclick = openPronounceScreen;
  if (btnPronStart) btnPronStart.onclick = startPronRecording;
  if (btnPronStop)  btnPronStop.onclick  = stopPronRecording;
  if (btnPronBack)  btnPronBack.onclick  = () => { playSE(seClick); showScreen("screen-home"); };

  // AI英語チャット
  const btnChat       = $("btn-chat");
  const btnChatSend   = $("btn-chat-send");
  const btnChatBack   = $("btn-chat-back");
  const btnChatExample= $("btn-chat-example");
  const btnChatSales  = $("btn-chat-sales");
  const chatInput     = $("chat-input");

  if (btnChat)       btnChat.onclick       = openChatScreen;
  if (btnChatSend)   btnChatSend.onclick   = () => handleChatSend();
  if (btnChatBack)   btnChatBack.onclick   = () => { playSE(seClick); showScreen("screen-home"); };
  if (btnChatExample)btnChatExample.onclick= () => handleChatSend("今日の単語で例文を作って");
  if (btnChatSales)  btnChatSales.onclick  = () => handleChatSend("営業のシーンで使える表現を教えて");

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

  if (btnTalk)      btnTalk.onclick      = openTalkScreen;
  if (btnTalkStart) btnTalkStart.onclick = startTalkRecording;
  if (btnTalkStop)  btnTalkStop.onclick  = stopTalkRecordingAndSend;
  if (btnTalkBack)  btnTalkBack.onclick  = () => { playSE(seClick); showScreen("screen-home"); };

  // 初期画面
  showScreen("screen-home");
});
