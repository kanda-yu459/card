// === チョイス（選択活動）管理 ===

async function initChoiceScenes() {
  const loaded = await loadAppState('ecard_choice_scenes_v2', window.defaultChoiceScenes);
  if (loaded && Array.isArray(loaded) && loaded.length > 0) {
    window.choiceScenes = loaded;
  } else {
    window.choiceScenes = JSON.parse(JSON.stringify(window.defaultChoiceScenes));
    await saveChoiceScenesToStorage();
  }

  const lastId = localStorage.getItem('ecard_last_choice_scene_id');
  if (lastId && window.choiceScenes.some(s => s.id === lastId)) {
    window.currentChoiceSceneId = lastId;
  } else {
    window.currentChoiceSceneId = window.choiceScenes[0].id;
  }

  renderChoiceSceneDropdown();
  renderChoiceBoard();
}

async function saveChoiceScenesToStorage() {
  await saveAppState('ecard_choice_scenes_v2', window.choiceScenes);
}

function renderChoiceSceneDropdown() {
  const select = document.getElementById('choice-scene-select');
  if (!select) return;
  select.innerHTML = window.choiceScenes.map(s => `
    <option value="${s.id}" ${s.id === window.currentChoiceSceneId ? 'selected' : ''}>${s.title}</option>
  `).join('');
}

function onChoiceSceneSelectChange(newId) {
  window.currentChoiceSceneId = newId;
  window.selectedChoiceCardIndex = null;
  localStorage.setItem('ecard_last_choice_scene_id', newId);
  renderChoiceBoard();
}

function getActiveChoiceScene() {
  return window.choiceScenes.find(s => s.id === window.currentChoiceSceneId) || window.choiceScenes[0];
}

async function setChoiceCount(count) {
  const scene = getActiveChoiceScene();
  if (!scene) return;
  scene.count = count;
  window.selectedChoiceCardIndex = null;
  await saveChoiceScenesToStorage();
  renderChoiceBoard();
}

function renderChoiceBoard() {
  const scene = getActiveChoiceScene();
  if (!scene) return;
  const count = scene.count || 2;
  const cards = scene.cards || [];

 .forEach(num => {
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
  if (!container) return;

  let gridClass = "grid gap-4 sm:gap-6 w-full max-w-5xl ";
  if (count === 2) gridClass += "grid-cols-2 max-w-3xl";
  else if (count === 3) gridClass += "grid-cols-3 max-w-4xl";
  else if (count === 4) gridClass += "grid-cols-2 sm:grid-cols-4 max-w-5xl";
  else if (count === 5) gridClass += "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-6xl";

  let html = `<div class="${gridClass}">`;

  for (let i = 0; i < count; i++) {
    const card = cards[i] || null;
    const isSelected = window.selectedChoiceCardIndex === i;
    const isDimmed = window.selectedChoiceCardIndex !== null && window.selectedChoiceCardIndex !== i;

    html += `
      <div id="choice-box-${i}" onclick="selectChoiceCard(${i})" 
           class="group relative bg-white border-8 ${isSelected ? 'border-indigo-400 bg-indigo-50/20' : 'border-white'} card-shadow rounded-[32px] p-4 sm:p-5 flex flex-col items-center justify-between aspect-square cursor-pointer transition-all duration-300 active:scale-95 transform hover:-translate-y-1 select-none overflow-hidden ${isSelected ? 'selected-bounce' : ''}">
        
        <div class="absolute top-2 right-2 flex items-center gap-1 z-20">
          ${card ? `
            <button onclick="clearChoiceCardIndex(${i}, event)" class="bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow transition-all" title="カードを外す">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
          <button onclick="openChoicePickerForIndex(${i}, event)" class="bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow transition-all" title="カードを変更">
            <i class="fa-solid fa-repeat"></i>
          </button>
        </div>

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
  if (!scene || !scene.cards) return;
  const card = scene.cards[idx];
  if (!card) {
    openChoicePickerForIndex(idx, null);
    return;
  }

  window.selectedChoiceCardIndex = idx;
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
  window.selectedChoiceCardIndex = null;
  renderChoiceBoard();
}

async function openChoicePickerForIndex(idx, event) {
  if (event) event.stopPropagation();
  window.currentChoicePickerIndex = idx;
  await loadLibrary();

  const modal = document.getElementById('picker-modal');
  const grid = document.getElementById('picker-grid');
  const emptyMsg = document.getElementById('picker-empty');

  if (!window.library || window.library.length === 0) {
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    if (grid) grid.innerHTML = '';
  } else {
    if (emptyMsg) emptyMsg.classList.add('hidden');
    if (grid) {
      grid.innerHTML = window.library.map(card => `
        <div onclick="selectCardForChoiceIndex('${card.id}')" class="bg-white p-3 rounded-2xl border-2 border-slate-100 hover:border-indigo-400 card-shadow cursor-pointer flex flex-col items-center transition-all active:scale-95">
          <div class="aspect-square w-full bg-slate-50 rounded-xl mb-2 flex items-center justify-center p-1">
            <img class="w-full h-full object-contain pointer-events-none" src="${card.imageUrl}" alt="${card.word}">
          </div>
          <span class="font-bold text-slate-700 text-xs text-center truncate w-full">${card.word}</span>
        </div>
      `).join('');
    }
  }
  if (modal) modal.classList.remove('hidden');
}

async function selectCardForChoiceIndex(cardId) {
  const scene = getActiveChoiceScene();
  const selected = window.library.find(c => c.id === cardId);
  if (selected && window.currentChoicePickerIndex !== null) {
    if (!scene.cards) scene.cards = [null, null, null, null, null];
    scene.cards[window.currentChoicePickerIndex] = selected;
    await saveChoiceScenesToStorage();
    playSound('complete');
  }
  closeCardPicker();
  renderChoiceBoard();
}

async function clearChoiceCardIndex(idx, event) {
  if (event) event.stopPropagation();
  const scene = getActiveChoiceScene();
  if (scene && scene.cards && scene.cards[idx]) {
    scene.cards[idx] = null;
    if (window.selectedChoiceCardIndex === idx) window.selectedChoiceCardIndex = null;
    await saveChoiceScenesToStorage();
    playSound('wrong');
    renderChoiceBoard();
  }
}

async function removeCurrentPickerCard() {
  if (window.currentChoicePickerIndex !== null) {
    await clearChoiceCardIndex(window.currentChoicePickerIndex, null);
    closeCardPicker();
  }
}

function closeCardPicker() {
  const modal = document.getElementById('picker-modal');
  if (modal) modal.classList.add('hidden');
  window.currentChoicePickerIndex = null;
}

function openNewChoiceSceneModal() {
  const input = document.getElementById('new-choice-scene-title-input');
  if (input) input.value = "";
  const modal = document.getElementById('new-choice-scene-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeNewChoiceSceneModal() {
  const modal = document.getElementById('new-choice-scene-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitCreateNewChoiceScene() {
  const input = document.getElementById('new-choice-scene-title-input');
  const title = input ? input.value.trim() : "";
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

  window.choiceScenes.push(newScene);
  window.currentChoiceSceneId = newId;
  window.selectedChoiceCardIndex = null;
  localStorage.setItem('ecard_last_choice_scene_id', newId);

  await saveChoiceScenesToStorage();
  renderChoiceSceneDropdown();
  closeNewChoiceSceneModal();
  renderChoiceBoard();

  showCustomAlert("success", "場面を追加しました 🌟", `「<strong>${title}</strong>」を作成しました！`);
}

function openManageChoiceScenesModal() {
  const scene = getActiveChoiceScene();
  if (!scene) return;
  const input = document.getElementById('edit-choice-scene-title-input');
  if (input) input.value = scene.title;
  const modal = document.getElementById('manage-choice-scene-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeManageChoiceScenesModal() {
  const modal = document.getElementById('manage-choice-scene-modal');
  if (modal) modal.classList.add('hidden');
}

async function renameActiveChoiceScene() {
  const input = document.getElementById('edit-choice-scene-title-input');
  const newName = input ? input.value.trim() : "";
  if (!newName) {
    showCustomAlert("warning", "入力エラー", "場面の名前を入力してください。");
    return;
  }

  const scene = getActiveChoiceScene();
  if (!scene) return;

  scene.title = newName;
  await saveChoiceScenesToStorage();
  renderChoiceSceneDropdown();
  closeManageChoiceScenesModal();
  showCustomAlert("success", "名前を変更しました", `場面名を「${newName}」に変更しました！`);
}

async function deleteActiveChoiceScene() {
  if (window.choiceScenes.length <= 1) {
    showCustomAlert("warning", "削除できません", "チョイスの場面は最低1つ以上必要です。");
    return;
  }

  const activeScene = getActiveChoiceScene();
  showCustomConfirm("danger", "場面の削除", `チョイス場面「${activeScene.title}」を削除しますか？`, async (confirmed) => {
    if (confirmed) {
      window.choiceScenes = window.choiceScenes.filter(s => s.id !== window.currentChoiceSceneId);
      window.currentChoiceSceneId = window.choiceScenes[0].id;
      window.selectedChoiceCardIndex = null;
      localStorage.setItem('ecard_last_choice_scene_id', window.currentChoiceSceneId);

      await saveChoiceScenesToStorage();
      renderChoiceSceneDropdown();
      closeManageChoiceScenesModal();
      renderChoiceBoard();
      showCustomAlert("success", "削除完了", "チョイス場面を削除しました。");
    }
  });
}
