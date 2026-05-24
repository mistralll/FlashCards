const SHEET_URL = "https://docs.google.com/spreadsheets/d/1LTbB11q5DJhJQMNNGrr8o45coTZJU1U0c6d0gXx24_c/gviz/tq?tqx=out:json";

let words = [];
let activeWords = [];
let currentIndex = 0;
let isFlipped = false;
let quizOrder = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  words = json.table.rows.slice(1).map(r => r.c.map(c => c ? c.v : ""));
}

function shuffleArray(array) {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function updateDifficultyLabel(value) {
  const labels = ["Easy", "Normal", "Hard"];
  document.getElementById("difficulty-label").textContent = labels[value - 1];
}

function getSelectedDifficulty() {
  return Number(document.getElementById("difficulty-slider").value);
}

function filterWordsByDifficulty(level) {
  if (!words || words.length === 0) return [];

  return words.filter(([english]) => {
    const length = english ? english.length : 0;
    if (level === 1) return length <= 5;
    if (level === 2) return length >= 6 && length <= 9;
    return length >= 10;
  });
}

// モード管理
function showMenu() {
  document.getElementById("menu-screen").style.display = "flex";
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("flashcard-screen").style.display = "none";
  document.getElementById("dictionary-screen").style.display = "none";
}

async function startFlashCardMode() {
  if (words.length === 0) await loadData();
  const difficulty = getSelectedDifficulty();
  activeWords = filterWordsByDifficulty(difficulty);
  if (activeWords.length === 0) {
    alert("選択した難易度の単語が見つかりません。難易度を変更してください。");
    return;
  }

  currentIndex = 0;
  isFlipped = false;
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("flashcard-screen").style.display = "block";
  document.getElementById("dictionary-screen").style.display = "none";
  displayFlashCard();
}

async function startDictionaryMode() {
  if (words.length === 0) await loadData();
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("flashcard-screen").style.display = "none";
  document.getElementById("dictionary-screen").style.display = "block";
  renderDictionary();
}

async function startQuizMode() {
  if (words.length === 0) await loadData();
  const difficulty = getSelectedDifficulty();
  activeWords = filterWordsByDifficulty(difficulty);
  if (activeWords.length === 0) {
    alert("選択した難易度の単語が見つかりません。難易度を変更してください。");
    return;
  }

  quizOrder = shuffleArray(activeWords.map((_, index) => index));
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  document.getElementById("flashcard-screen").style.display = "none";
  document.getElementById("dictionary-screen").style.display = "none";
  renderQuizQuestion();
}

// 単語帳モード機能
function displayFlashCard() {
  if (activeWords.length === 0) return;

  const [english, japanese] = activeWords[currentIndex];
  const flashcardEl = document.getElementById("flashcard");

  isFlipped = false;
  flashcardEl.textContent = english;
  flashcardEl.classList.remove("flipped");

  document.getElementById("flashcard-count").textContent = `${currentIndex + 1} / ${activeWords.length}`;

  document.getElementById("prev-btn").disabled = currentIndex === 0;
  document.getElementById("next-btn").disabled = currentIndex === activeWords.length - 1;
}

function toggleFlashCard() {
  if (activeWords.length === 0) return;

  const [english, japanese] = activeWords[currentIndex];
  const flashcardEl = document.getElementById("flashcard");

  isFlipped = !isFlipped;
  flashcardEl.textContent = isFlipped ? japanese : english;
  flashcardEl.classList.toggle("flipped");
}

function nextFlashCard() {
  if (currentIndex < activeWords.length - 1) {
    currentIndex++;
    displayFlashCard();
  }
}

function previousFlashCard() {
  if (currentIndex > 0) {
    currentIndex--;
    displayFlashCard();
  }
}

// クイズモード機能
function renderQuizQuestion() {
  if (activeWords.length === 0) return;

  const wordIndex = quizOrder[quizIndex];
  const [english] = activeWords[wordIndex];
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const resultEl = document.getElementById("quiz-result");
  const nextBtn = document.getElementById("quiz-next-btn");

  questionEl.textContent = `英語: ${english}`;
  optionsEl.innerHTML = "";
  resultEl.textContent = "";
  quizAnswered = false;

  const options = buildQuizOptions(wordIndex);
  options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.onclick = () => selectQuizAnswer(option);
    optionsEl.appendChild(button);
  });

  document.getElementById("quiz-count").textContent = `${quizIndex + 1} / ${quizOrder.length}`;
  document.getElementById("quiz-score").textContent = `Score: ${quizScore}`;
  nextBtn.textContent = "次の問題 →";
  nextBtn.disabled = true;
  nextBtn.onclick = nextQuizQuestion;
}

function buildQuizOptions(correctIndex) {
  const correctJapanese = activeWords[correctIndex][1];
  const choices = [correctJapanese];
  const otherJapanese = activeWords
    .filter((_, index) => index !== correctIndex)
    .map(row => row[1]);

  const shuffledOther = shuffleArray(otherJapanese).slice(0, 3);
  choices.push(...shuffledOther);
  return shuffleArray(choices);
}

function selectQuizAnswer(answer) {
  if (quizAnswered) return;
  quizAnswered = true;

  const wordIndex = quizOrder[quizIndex];
  const correctJapanese = activeWords[wordIndex][1];
  const optionsEl = document.getElementById("quiz-options");
  const resultEl = document.getElementById("quiz-result");
  const nextBtn = document.getElementById("quiz-next-btn");

  Array.from(optionsEl.children).forEach(button => {
    button.disabled = true;
    if (button.textContent === correctJapanese) {
      button.classList.add("correct");
    }
    if (button.textContent === answer && answer !== correctJapanese) {
      button.classList.add("wrong");
    }
  });

  if (answer === correctJapanese) {
    quizScore++;
    resultEl.textContent = "正解！";
  } else {
    resultEl.textContent = `不正解。正解は「${correctJapanese}」です。`;
  }

  document.getElementById("quiz-score").textContent = `Score: ${quizScore}`;
  nextBtn.disabled = false;
}

function nextQuizQuestion() {
  if (quizIndex < quizOrder.length - 1) {
    quizIndex++;
    renderQuizQuestion();
  } else {
    showQuizSummary();
  }
}

function restartQuiz() {
  quizOrder = shuffleArray(activeWords.map((_, index) => index));
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  renderQuizQuestion();
}

function showQuizSummary() {
  const questionEl = document.getElementById("quiz-question");
  const optionsEl = document.getElementById("quiz-options");
  const resultEl = document.getElementById("quiz-result");
  const nextBtn = document.getElementById("quiz-next-btn");

  questionEl.textContent = `クイズ終了！スコア ${quizScore} / ${quizOrder.length}`;
  optionsEl.innerHTML = "";
  resultEl.textContent = "もう一度挑戦する場合は「もう一度」を押してください。";
  nextBtn.textContent = "もう一度";
  nextBtn.disabled = false;
  nextBtn.onclick = restartQuiz;
}

// 辞書モード機能
function renderDictionary() {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  words.forEach(row => {
    const [english, japanese] = row;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${english}</td>
      <td>${japanese}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 初期化
updateDifficultyLabel(2);
showMenu();
