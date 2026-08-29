// === シーン（手順表）管理 ===

function initScenes() {
  const storedScenes = localStorage.getItem('ecard_dynamic_scenes_v1');
  const storedApiKey = localStorage.getItem('gemini_api_key');

  if (storedApiKey) {
    GEMINI_API_KEY = storedApiKey;
    document.getElementById('settings-api-key-input').value = storedApiKey;
    updateApiStatusBadge(true);
  } else {
    updateApiStatusBadge(false);
  }

  if (storedScenes) {
    try {
      scenes = JSON.parse(storedScenes);
    } catch (e) {
      scenes = JSON.parse(JSON.stringify(defaultScenesData));
    }
  } else {
    scenes = JSON.parse(JSON.stringify(defaultScenesData));
  }

  if (!scenes || scenes.length === 0) {
    scenes = JSON.parse(JSON.stringify(defaultScenesData));
  }

  currentSceneId = scenes[0].id;
  initSceneCheckStates();
  renderSceneDropdowns();
}

function saveScenesToStorage() {
  localStorage.setItem('ecard_dynamic_scenes_v1', JSON.stringify(scenes));
}

function initSceneCheckStates() {
  scenes.forEach(scene => {
    if (!sceneCheckStates[scene.id] || sceneCheckStates[scene.id].length !== (scene.steps ? scene.steps.length : 0)) {
      sceneCheckStates[scene.id] = new Array(scene.steps ? scene.steps.length : 0).fill(false);
    }
  });
}

function renderSceneDropdowns() {
  const select = document.getElementById('scene-select');
  const setSelect = document.getElementById('settings-scene-select');

  select.innerHTML = scenes.map(s => `
    <option value="${s.id}" ${s.id === currentSceneId ? 'selected' : ''}>${s.title}</option>
  `).join('');

  setSelect.innerHTML = scenes.map(s => `
    <option value="${s.id}" ${s.id === currentSceneId ? 'selected' : ''}>${s.title}</option>
  `).join('');

  const activeScene = scenes.find(s => s.id === currentSceneId) || scenes[0];
  document.getElementById('settings-scene-name-input').value = activeScene ? activeScene.title : '';
}

function onSceneSelectChange(newId) {
  currentSceneId = newId;
  isSortModeScene = false;
  document.getElementById('btn-sort-scene').innerHTML = "じゅんばん ⇅";
  document.getElementById('btn-sort-scene').className = "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap";
  renderSceneDropdowns();
  renderSceneBoard();
}

function onSettingsSceneSelectChange(newId) {
  currentSceneId = newId;
  renderSceneDropdowns();
  renderSettingsForms();
}

function renderSceneBoard() {
  const grid = document.getElementById('scene-grid');
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  const steps = activeScene.steps || [];
  const state = sceneCheckStates[activeScene.id] || [];

  const visibleSteps = steps.filter(step => step.enabled !== false);
  if (visibleSteps.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 bg-white rounded-3xl border-2 border-slate-100 text-slate-400 w-full"><p class="font-bold">カードがありません。</p><p class="text-xs mt-1">右上の「カードを追加」ボタンからカードを選んでください。</p></div>`;
    document.getElementById('scene-progress').style.width = `0%`;
    document.getElementById('scene-progress-text').innerText = `0 / 0 できた`;
    return;
  }

  let completedCount = 0;
  steps.forEach((step, idx) => {
    if (step.enabled !== false && state[idx] === true) completedCount++;
  });

  const percentage = Math.round((completedCount / visibleSteps.length) * 100);
  document.getElementById('scene-progress').style.width = `${percentage}%`;
  document.getElementById('scene-progress-text').innerText = `${completedCount} / ${visibleSteps.length} できた`;

  grid.innerHTML = steps.map((step, idx) => {
    if (step.enabled === false) return '';
    const isDone = state[idx];
    const stepNum = steps.filter((s, i) => s.enabled !== false && i < idx).length + 1;

    return `
      <div id="scene-card-${idx}" onclick="handleSceneStepClick(${idx})" 
           class="relative bg-white border-4 ${isDone ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-100'} ${isSortModeScene ? 'border-dashed border-amber-400' : ''} rounded-[24px] p-3 flex flex-col items-center justify-between card-shadow min-h-[260px] md:min-h-[300px] cursor-pointer transition-all duration-300 transform active:scale-95 hover:-translate-y-1 select-none overflow-hidden">
        
        <span class="absolute top-2 left-2 w-6 h-6 bg-slate-100 text-slate-600 text-xs font-black rounded-full flex items-center justify-center border border-slate-200">${stepNum}</span>

        ${isSortModeScene ? `
          <div class="absolute inset-x-0 top-0 bg-amber-50 p-1.5 flex justify-between items-center border-b border-amber-200 z-10">
            <button onclick="moveSceneStep(${idx}, 'left', event)" ${idx === 0 ? 'disabled class="opacity-30"' : ''} class="bg-amber-500 text-white w-8 h-7 rounded-lg flex items-center justify-center text-xs font-bold">◀</button>
            <button onclick="confirmRemoveStepDirectly(${idx}, '${step.word}', event)" class="bg-rose-500 hover:bg-rose-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow transition-all" title="このカードをシーンから削除">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button onclick="moveSceneStep(${idx}, 'right', event)" ${idx === steps.length - 1 ? 'disabled class="opacity-30"' : ''} class="bg-amber-500 text-white w-8 h-7 rounded-lg flex items-center justify-center text-xs font-bold">▶</button>
          </div>
        ` : ''}

        <div class="${isDone && !isSortModeScene ? 'flex' : 'hidden'} absolute inset-0 bg-emerald-500/10 rounded-[18px] pointer-events-none items-center justify-center">
          <div class="bg-white/90 text-emerald-500 rounded-full w-14 h-14 border-4 border-emerald-400 flex items-center justify-center text-3xl shadow-md animate-bounce"><i class="fa-solid fa-check"></i></div>
        </div>

        <div class="aspect-square w-[80%] bg-slate-50 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden mt-4 ${isDone ? 'grayscale opacity-40' : ''}">
          <img class="w-full h-full object-contain pointer-events-none" src="${step.img}" alt="${step.word}">
        </div>

        <div class="text-center w-full mt-2">
          <h4 class="font-black text-slate-800 text-sm sm:text-base tracking-wide truncate ${isDone ? 'line-through text-slate-400' : ''}">${step.word}</h4>
          <p class="text-[10px] text-slate-400 font-bold mt-0.5 leading-tight h-5 overflow-hidden">${step.desc || ''}</p>
        </div>
      </div>
    `;
  }).join('');
}

function confirmRemoveStepDirectly(idx, word, event) {
  if (event) event.stopPropagation();
  showCustomConfirm("danger", "カードの削除", `「${word}」をこのシーンから削除しますか？`, (confirmed) => {
    if (confirmed) {
      removeStepFromScene(idx);
      renderSceneBoard();
    }
  });
}

function handleSceneStepClick(idx) {
  if (isSortModeScene) return;
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  const state = sceneCheckStates[activeScene.id];
  state[idx] = !state[idx];

  const step = activeScene.steps[idx];
  const isCompletedNow = state[idx];

  if (isCompletedNow) {
    playSound('complete');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${step.word}、できたね！えらい！`);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  } else {
    playSound('wrong');
  }

  let allCompleted = true;
  activeScene.steps.forEach((s, i) => {
    if (s.enabled !== false && !state[i]) allCompleted = false;
  });

  renderSceneBoard();

  if (allCompleted && isCompletedNow) {
    setTimeout(() => {
      playSound('fanfare');
      document.getElementById('celebration-overlay').classList.remove('hidden');
    }, 600);
  }
}

function resetCurrentScene() {
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;
  sceneCheckStates[activeScene.id] = new Array(activeScene.steps.length).fill(false);
  playSound('wrong');
  renderSceneBoard();
}

function toggleSceneSortMode() {
  isSortModeScene = !isSortModeScene;
  const btn = document.getElementById('btn-sort-scene');
  btn.className = isSortModeScene 
    ? "bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all animate-pulse"
    : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap";
  btn.innerHTML = isSortModeScene ? "完了 ✓" : "じゅんばん ⇅";
  renderSceneBoard();
}

function moveSceneStep(idx, direction, event) {
  if (event) event.stopPropagation();
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  const steps = activeScene.steps;
  const state = sceneCheckStates[activeScene.id];
  const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= steps.length) return;

  const tempStep = steps[idx];
  steps[idx] = steps[targetIdx];
  steps[targetIdx] = tempStep;

  const tempState = state[idx];
  state[idx] = state[targetIdx];
  state[targetIdx] = tempState;

  saveScenesToStorage();
  playSound('complete');
  renderSceneBoard();
}

function openNewSceneModal() {
  document.getElementById('new-scene-title-input').value = "";
  document.getElementById('new-scene-modal').classList.remove('hidden');
}

function closeNewSceneModal() {
  document.getElementById('new-scene-modal').classList.add('hidden');
}

function submitCreateNewScene() {
  const title = document.getElementById('new-scene-title-input').value.trim();
  if (!title) {
    showCustomAlert("warning", "入力エラー", "シーンの名前を入れてね！");
    return;
  }

  const newId = 'scene_' + Date.now();
  const newScene = {
    id: newId,
    title: title,
    steps: []
  };

  scenes.push(newScene);
  sceneCheckStates[newId] = [];
  currentSceneId = newId;

  saveScenesToStorage();
  renderSceneDropdowns();
  closeNewSceneModal();
  renderSceneBoard();

  showCustomAlert("success", "シーン作成完了 🌟", `新しいシーン「<strong>${title}</strong>」を作成しました！`);
}

function renameCurrentScene() {
  const newName = document.getElementById('settings-scene-name-input').value.trim();
  if (!newName) return;
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  activeScene.title = newName;
  saveScenesToStorage();
  renderSceneDropdowns();
  showCustomAlert("success", "改名完了", `シーンの名前を「${newName}」に変更しました！`);
}

function deleteCurrentScene() {
  if (scenes.length <= 1) {
    showCustomAlert("warning", "削除できません", "シーンは最低1つ以上必要です。");
    return;
  }

  const activeScene = scenes.find(s => s.id === currentSceneId);
  showCustomConfirm("danger", "シーンの削除", `シーン「${activeScene.title}」を削除しますか？`, (confirmed) => {
    if (confirmed) {
      scenes = scenes.filter(s => s.id !== currentSceneId);
      delete sceneCheckStates[currentSceneId];
      currentSceneId = scenes[0].id;
      saveScenesToStorage();
      renderSceneDropdowns();
      renderSettingsForms();
      renderSceneBoard();
      showCustomAlert("success", "削除完了", "シーンを削除しました。");
    }
  });
}

function openAddCardToSceneModal() {
  iconPickerMode = 'add';
  openIconPicker(-1);
}

function addNewStepToCurrentScene() {
  iconPickerMode = 'add';
  openIconPicker(-1);
}

function renderSettingsForms() {
  const container = document.getElementById('settings-form-container');
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  const steps = activeScene.steps || [];

  if (steps.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">ステップがまだありません。右上の「ステップ追加」を押してカードを選んでください。</p>`;
    return;
  }

  container.innerHTML = steps.map((step, idx) => {
    const isEnabled = step.enabled !== false;
    return `
      <div class="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex flex-col md:flex-row items-center gap-4 transition-all">
        <div class="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between">
          <span class="bg-teal-100 text-teal-800 font-black px-3 py-1.5 rounded-lg text-xs">ステップ ${idx + 1}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">表示</span>
            <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" id="toggle-${idx}" onchange="toggleStepActive(${idx})" ${isEnabled ? 'checked' : ''} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer right-4 top-0 transition duration-300 outline-none"/>
              <label for="toggle-${idx}" class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
            </div>
          </div>
        </div>

        <div class="shrink-0 flex flex-col items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-28 h-28 justify-center cursor-pointer hover:border-teal-400 transition-all" onclick="openChangeIconPicker(${idx})">
          <div class="w-14 h-14 flex items-center justify-center p-0.5 overflow-hidden rounded-lg bg-slate-50">
            <img id="settings-preview-img-${idx}" class="w-full h-full object-contain" src="${step.img}" alt="">
          </div>
          <span class="text-[10px] font-black text-slate-400">画像を変更</span>
        </div>

        <div class="flex-grow w-full space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div class="sm:col-span-1">
              <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">名前</label>
              <input type="text" id="settings-word-${idx}" value="${step.word}" oninput="updateStepData(${idx}, 'word', this.value)" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-teal-400 text-sm font-bold bg-white">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">説明</label>
              <input type="text" id="settings-desc-${idx}" value="${step.desc || ''}" oninput="updateStepData(${idx}, 'desc', this.value)" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-teal-400 text-sm font-semibold bg-white">
            </div>
          </div>
        </div>

        <button onclick="confirmRemoveStepFromSettings(${idx}, '${step.word}')" title="このステップを削除" class="text-rose-500 hover:text-rose-700 p-2 text-base self-end md:self-center transition-all">
              <i class="fa-solid fa-trash-can"></i>
            </button>
      </div>
    `;
  }).join('');
}

function confirmRemoveStepFromSettings(idx, word) {
  showCustomConfirm("danger", "ステップの削除", `「${word}」を削除しますか？`, (confirmed) => {
    if (confirmed) {
      removeStepFromScene(idx);
    }
  });
}

function toggleStepActive(idx) {
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;
  activeScene.steps[idx].enabled = !activeScene.steps[idx].enabled;
  saveScenesToStorage();
}

function updateStepData(idx, field, value) {
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;
  activeScene.steps[idx][field] = value;
  saveScenesToStorage();
}

function removeStepFromScene(idx) {
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;
  
  activeScene.steps.splice(idx, 1);
  if (sceneCheckStates[activeScene.id]) {
    sceneCheckStates[activeScene.id].splice(idx, 1);
  }
  
  saveScenesToStorage();
  renderSettingsForms();
}

function openChangeIconPicker(idx) {
  iconPickerMode = 'change';
  openIconPicker(idx);
}

async function openIconPicker(idx) {
  activeEditStepIdx = idx;
  await loadLibrary();

  const modal = document.getElementById('icon-picker-modal');
  const presetsContainer = document.getElementById('icon-picker-presets');
  const customsContainer = document.getElementById('icon-picker-customs');
  const customsEmpty = document.getElementById('icon-picker-customs-empty');

  presetsContainer.innerHTML = Object.entries(routineSVGs).map(([key, svgData]) => `
    <div onclick="selectIconForStep('preset', '${key}')" class="bg-slate-50 border-2 border-slate-100 hover:border-teal-400 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all aspect-square active:scale-90">
      <img class="w-10 h-10 object-contain pointer-events-none" src="${svgData}" alt="">
      <span class="text-[9px] font-bold text-slate-400 mt-1 truncate w-full text-center">${key}</span>
    </div>
  `).join('');

  if (library.length === 0) {
    customsContainer.innerHTML = '';
    customsEmpty.classList.remove('hidden');
  } else {
    customsEmpty.classList.add('hidden');
    customsContainer.innerHTML = library.map(card => `
      <div onclick="selectIconForStep('custom', '${card.id}')" class="bg-slate-50 border-2 border-slate-100 hover:border-teal-400 p-1.5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all aspect-square active:scale-90">
        <img class="w-10 h-10 object-contain rounded pointer-events-none" src="${card.imageUrl}" alt="${card.word}">
        <span class="text-[9px] font-bold text-slate-400 mt-1 truncate w-full text-center">${card.word}</span>
      </div>
    `).join('');
  }
  modal.classList.remove('hidden');
}

function closeIconPicker() {
  document.getElementById('icon-picker-modal').classList.add('hidden');
  activeEditStepIdx = -1;
}

function selectIconForStep(type, id) {
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  let selectedImgSrc = '';
  let defaultWord = 'じゅんび';
  let defaultDesc = 'がんばろう！';

  if (type === 'preset') {
    selectedImgSrc = routineSVGs[id];
    defaultWord = id;
  } else {
    const found = library.find(c => c.id === id);
    if (found) {
      selectedImgSrc = found.imageUrl;
      defaultWord = found.word;
      defaultDesc = `${found.word}をしよう！`;
    }
  }

  if (!selectedImgSrc) return;

  if (iconPickerMode === 'add') {
    const newStep = {
      id: 'step_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      word: defaultWord,
      img: selectedImgSrc,
      desc: defaultDesc,
      enabled: true
    };
    if (!activeScene.steps) activeScene.steps = [];
    activeScene.steps.push(newStep);
    
    if (!sceneCheckStates[activeScene.id]) sceneCheckStates[activeScene.id] = [];
    sceneCheckStates[activeScene.id].push(false);
  } else if (activeEditStepIdx !== -1 && activeScene.steps[activeEditStepIdx]) {
    activeScene.steps[activeEditStepIdx].img = selectedImgSrc;
    if (type === 'custom') {
      activeScene.steps[activeEditStepIdx].word = defaultWord;
      activeScene.steps[activeEditStepIdx].desc = defaultDesc;
    }
  }

  saveScenesToStorage();
  playSound('complete');
  closeIconPicker();

  renderSceneBoard();
  renderSettingsForms();
}
