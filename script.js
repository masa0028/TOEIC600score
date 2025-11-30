// ===== Day1 単語データ =====
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

// ===== ヘルパー =====
function $(id){ return document.getElementById(id); }

const screens = {
  home:   $("screen-home"),
  quiz:   $("screen-quiz"),
  result: $("screen-result")
};

let quizWords = [];
let idx = 0;
let correct = 0;
let mistakes = [];

// ▼ 効果音要素
const seCorrect = $("se-correct");
const seNext    = $("se-next");
const seWrong   = $("se-wrong");
const seClick   = $("se-click");

function playSE(audioEl){
  if (!audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch(e) {
    console.log("SE play error", e);
  }
}

// ===== 画面切り替え =====
function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ===== シャッフル =====
function shuffle(a){
  const arr = a.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== クイズ開始 =====
function startQuiz(){
  playSE(seClick);
  quizWords = shuffle(day1Words);
  idx = 0;
  correct = 0;
  mistakes = [];
  updateProgress(0);
  show("quiz");
  render();
}

// ===== 1問表示 =====
function render(){
  if(idx >= quizWords.length){
    finish();
    return;
  }
  const q = quizWords[idx];

  $("quiz-question").textContent = q.word;
  $("quiz-counter").textContent  = `${idx + 1} / ${day1Words.length}`;
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
      playSE(seClick);  // タップ音
      answer(btn, c, q.meaning_jp, q);
    };
    box.appendChild(btn);
  });
}

// ===== 回答処理 =====
function answer(btn, choice, correctAns, q){
  Array.from($("choices").children).forEach(b => b.disabled = true);

  if (choice === correctAns){
    correct++;
    btn.classList.add("correct");
    $("feedback").textContent = "正解！";
    playSE(seCorrect);  // ★ ピンポン音
  } else {
    btn.classList.add("wrong");
    $("feedback").textContent = `不正解… 正解: ${correctAns}`;
    mistakes.push(q);
    playSE(seWrong);    // ★ ブザー音
  }

  updateProgress(idx + 1);
  $("btn-next").style.display = "block";
}

// ===== 進捗バー =====
function updateProgress(done){
  const total = day1Words.length;
  $("progress-inner").style.width = (done / total * 100) + "%";
  $("progress-text").textContent  = `${done} / ${total}`;
}

// ===== 結果表示 =====
function finish(){
  const total = day1Words.length;
  const rate  = Math.round(correct / total * 100);

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

  show("result");
}

// ===== イベント登録 =====
$("btn-start").onclick = startQuiz;

$("btn-next").onclick = () => {
  playSE(seNext);   // ★ 「次へ」で明るくステージ進行音
  idx++;
  render();
};

$("btn-quit").onclick = () => {
  playSE(seClick);
  show("home");
};

$("btn-again").onclick = () => {
  startQuiz();
};

$("btn-back-home").onclick = () => {
  playSE(seClick);
  show("home");
};
