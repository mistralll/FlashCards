const SHEET_URL = "https://docs.google.com/spreadsheets/d/1LTbB11q5DJhJQMNNGrr8o45coTZJU1U0c6d0gXx24_c/gviz/tq?tqx=out:json";

let words = [];
let currentIndex = 0;
let isFlipped = false;

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  words = json.table.rows.slice(1).map(r => r.c.map(c => c ? c.v : ""));
}

// モード管理
function showMenu() {
  document.getElementById("menu-screen").style.display = "flex";
  document.getElementById("flashcard-screen").style.display = "none";
  document.getElementById("dictionary-screen").style.display = "none";
}

async function startFlashcardMode() {
  await loadData();
  currentIndex = 0;
  isFlipped = false;
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("flashcard-screen").style.display = "block";
  document.getElementById("dictionary-screen").style.display = "none";
  displayFlashcard();
}

async function startDictionaryMode() {
  await loadData();
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("flashcard-screen").style.display = "none";
  document.getElementById("dictionary-screen").style.display = "block";
  renderDictionary();
}

// 単語帳モード機能
function displayFlashcard() {
  if (words.length === 0) return;
  
  const [english, japanese] = words[currentIndex];
  const flashcardEl = document.getElementById("flashcard");
  
  isFlipped = false;
  flashcardEl.textContent = english;
  flashcardEl.classList.remove("flipped");
  
  document.getElementById("flashcard-count").textContent = `${currentIndex + 1} / ${words.length}`;
  
  document.getElementById("prev-btn").disabled = currentIndex === 0;
  document.getElementById("next-btn").disabled = currentIndex === words.length - 1;
}

function toggleFlashcard() {
  if (words.length === 0) return;
  
  const [english, japanese] = words[currentIndex];
  const flashcardEl = document.getElementById("flashcard");
  
  isFlipped = !isFlipped;
  flashcardEl.textContent = isFlipped ? japanese : english;
  flashcardEl.classList.toggle("flipped");
}

function nextFlashcard() {
  if (currentIndex < words.length - 1) {
    currentIndex++;
    displayFlashcard();
  }
}

function previousFlashcard() {
  if (currentIndex > 0) {
    currentIndex--;
    displayFlashcard();
  }
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
showMenu();
