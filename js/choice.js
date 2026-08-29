// === チョイス（選択活動）管理 ===

function initChoiceScenes() {
  const stored = localStorage.getItem('ecard_choice_scenes_v2');
  if (stored) {
    try {
      choiceScenes = JSON.parse(stored);
    } catch (e) {
      choiceScenes = JSON.parse(JSON.stringify(defaultChoiceScenes));
    }
  } else {
    choiceScenes = JSON.parse(JSON.stringify(defaultChoiceScenes));
  }

  if (!choiceScenes || choiceScenes.length === 0) {
    choiceScenes = JSON.parse(JSON.stringify(defaultChoiceScenes));
  }

  currentChoiceSceneId = choiceScenes[0].id;
  renderChoiceSceneDropdown();
  renderChoiceBoard();
}

function saveChoiceScenesToStorage() {
  localStorage.setItem('ecard_choice_scenes_v2', JSON.stringify(choiceScenes));
}

function renderChoiceSceneDropdown() {
  const select = document.getElementById('choice-scene-select');
  select.innerHTML = choiceScenes.map(s => `
    <option value="${s.id}" ${s.id === currentChoiceSceneId ? 'selected' : ''}>${s.title}</option>
  `).join('');
}

function onChoiceSceneSelectChange(newId) {
  currentChoiceSceneId = newId;
  selectedChoiceCardIndex = null;
  renderChoiceBoard();
}

function getActiveChoiceScene() {
  return choiceScenes.find(s => s.id === currentChoiceSceneId) || choiceScenes[0];
}

function setChoiceCount(count) {
  const scene = getActiveChoiceScene();
  scene.count = count;
  selectedChoiceCardIndex = null;
  saveChoiceScenesToStorage();
  renderChoiceBoard();
}

function renderChoiceBoard() {
  const scene = getActiveChoiceScene();
  const count = scene.count || 2;
  const cards = scene.cards || [];

  [2, 3, 4, 5].forEach(num => {
    const btn = document.getElementById(`btn-choice-count-${num}`);
    if (btn) {
      if (num === count) {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-indigo-600 text-white shadow-sm";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl text-xs font-black transition-all text-slate-600 hover:bg-white/60";
      }
    }
  });

  const container = document.getElementById('choice-cards-container');
  let gridClass = "grid gap-4 sm:gap-6 w-full max-w-5xl ";
  if (count === 2) gridClass += "grid-cols-2 max-w-3xl";
  else if (count === 3) gridClass += "grid-cols-3 max-w-4xl";
  else if (count === 4) gridClass += "grid-cols-2 sm:grid-cols-4 max-w-5xl";
  else if (count === 5) gridClass += "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-6xl";

  let html = `<div class="${gridClass}">`;

  for (let i = 0; i < count; i++) {
    const card = cards[i] || null;
    const isSelected = selectedChoiceCardIndex === i;
    const isDimmed = selectedChoiceCardIndex !== null && selectedChoiceCardIndex !== i;

    html += `
      <div id="choice-box-${i}" onclick="selectChoiceCard(${i})" 
           class="group relative bg-white border-8 ${isSelected ? 'border-indigo-400 bg-indigo-50/20' : 'border-white'} card-shadow rounded-[32px] p-4 sm:p-5 flex flex-col items-center justify-between aspect-square cursor-pointer transition-all duration-300 active:scale-95 transform hover:-translate-y-1 select-none overflow-hidden ${isSelected ? 'selected-bounce' : ''}">
        
        <button onclick="openChoicePickerForIndex(${i}, event)" class="absolute top-2 right-2 bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black z-20 shadow transition-all" title="カードを変更">
          <i class="fa-solid fa-repeat"></i>
        </button>

        <span class="absolute top-2 left-2 w-6 h-6 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full flex items-center justify-center border border-slate-200">
          ${i + 1}
        </span>

        ${card ? `
          <div class="w-full h-full flex flex-col items-center justify-between py-1">
            <div class="aspect-square w-4/5 bg-slate-50 rounded-2xl flex items-center justify-center p-2 mt-2">
              <img class="w-full h-full object-contain pointer-events-none" src="${card.imageUrl}" alt="${card.word}">
            </div>
            <span class="text-xl sm:text-3xl font-black text-slate-800 tracking-wider text-center truncate w-full mt-2">${card.word}</span>
          </div>
        ` : `
          <div onclick="openChoicePickerForIndex(${i}, event)" class="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <i class="fa-solid fa-plus text-4xl"></i>
            <span class="font-bold text-xs">カードをえらぶ</span>
          </div>
        `}

        <div class="absolute inset-0 bg-slate-900/40 backdrop-grayscale rounded-[24px] pointer-events-none transition-all duration-300 flex items-center justify-center ${isDimmed ? 'opacity-100' : 'opacity-0'}">
          <i class="fa-solid fa-ban text-white/40 text-5xl"></i>
        </div>

      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function selectChoiceCard(idx) {
  const scene = getActiveChoiceScene();
  const card = scene.cards[idx];
  if (!card) {
    openChoicePickerForIndex(idx, null);
    return;
  }

  selectedChoiceCardIndex = idx;
  playSound('complete');

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${card.word}、をえらんだね！`);
    utterance.lang = 'ja-JP';
    window.speechSynthesis.speak(utterance);
  }

  renderChoiceBoard();
}

function resetPracticeSelection() {
  selectedChoiceCardIndex = null;
  renderChoiceBoard();
}

async function openChoicePickerForIndex(idx, event) {
  if (event) event.stopPropagation();
  currentChoicePickerIndex = idx;
  await loadLibrary();

  const modal = document.getElementById('picker-modal');
  const grid = document.getElementById('picker-grid');
  const emptyMsg = document.getElementById('picker-empty');

  if (library.length === 0) {
    emptyMsg.classList.remove('hidden');
    grid.innerHTML = '';
  } else {
    emptyMsg.classList.add('hidden');
    grid.innerHTML = library.map(card => `
      <div onclick="selectCardForChoiceIndex('${card.id}')" class="bg-white p-3 rounded-2xl border-2 border-slate-100 hover:border-indigo-400 card-shadow cursor-pointer flex flex-col items-center transition-all active:scale-95">
        <div class="aspect-square w-full bg-slate-50 rounded-xl mb-2 flex items-center justify-center p-1">
          <img class="w-full h-full object-contain pointer-events-none" src="${card.imageUrl}" alt="${card.word}">
        </div>
        <span class="font-bold text-slate-700 text-xs text-center truncate w-full">${card.word}</span>
      </div>
    `).join('');
  }
  modal.classList.remove('hidden');
}

function selectCardForChoiceIndex(cardId) {
  const scene = getActiveChoiceScene();
  const selected = library.find(c => c.id === cardId);
  if (selected && currentChoicePickerIndex !== null) {
    if (!scene.cards) scene.cards = [null, null, null, null, null];
    scene.cards[currentChoicePickerIndex] = selected;
    saveChoiceScenesToStorage();
    playSound('complete');
  }
  closeCardPicker();
  renderChoiceBoard();
}

function closeCardPicker() {
  document.getElementById('picker-modal').classList.add('hidden');
  currentChoicePickerIndex = null;
}

function openNewChoiceSceneModal() {
  document.getElementById('new-choice-scene-title-input').value = "";
  document.getElementById('new-choice-scene-modal').classList.remove('hidden');
}

function closeNewChoiceSceneModal() {
  document.getElementById('new-choice-scene-modal').classList.add('hidden');
}

function submitCreateNewChoiceScene() {
  const title = document.getElementById('new-choice-scene-title-input').value.trim();
  if (!title) {
    showCustomAlert("warning", "入力エラー", "場面の名前を入れてね！");
    return;
  }

  const newId = 'c_' + Date.now();
  const newScene = {
    id: newId,
    title: title,
    count: 2,
    cards: [null, null, null, null, null]
  };

  choiceScenes.push(newScene);
  currentChoiceSceneId = newId;
  selectedChoiceCardIndex = null;

  saveChoiceScenesToStorage();
  renderChoiceSceneDropdown();
  closeNewChoiceSceneModal();
  renderChoiceBoard();

  showCustomAlert("success", "場面を追加しました 🌟", `「<strong>${title}</strong>」を作成しました！`);
}
