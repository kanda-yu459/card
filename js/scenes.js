// === シーン（手順表）管理 ===

async function initScenes() {
  const loadedScenes = await loadAppState('ecard_dynamic_scenes_v1', defaultScenesData);
  const storedApiKey = localStorage.getItem('gemini_api_key');

  if (storedApiKey) {
    GEMINI_API_KEY = storedApiKey;
    const keyInput = document.getElementById('settings-api-key-input');
    if (keyInput) keyInput.value = storedApiKey;
    updateApiStatusBadge(true);
  } else {
    updateApiStatusBadge(false);
  }

  if (loadedScenes && Array.isArray(loadedScenes) && loadedScenes.length > 0) {
    scenes = loadedScenes;
  } else {
    scenes = JSON.parse(JSON.stringify(defaultScenesData));
    await saveScenesToStorage();
  }

  const lastId = localStorage.getItem('ecard_last_scene_id');
  if (lastId && scenes.some(s => s.id === lastId)) {
    currentSceneId = lastId;
  } else {
    currentSceneId = scenes[0].id;
  }

  initSceneCheckStates();
  renderSceneDropdowns();
  renderSceneBoard();
}

async function saveScenesToStorage() {
  await saveAppState('ecard_dynamic_scenes_v1', scenes);
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

  if (select) {
    select.innerHTML = scenes.map(s => `
      <option value="${s.id}" ${s.id === currentSceneId ? 'selected' : ''}>${s.title}</option>
    `).join('');
  }

  if (setSelect) {
    setSelect.innerHTML = scenes.map(s => `
      <option value="${s.id}" ${s.id === currentSceneId ? 'selected' : ''}>${s.title}</option>
    `).join('');
  }

  const activeScene = scenes.find(s => s.id === currentSceneId) || scenes[0];
  const nameInput = document.getElementById('settings-scene-name-input');
  if (nameInput) {
    nameInput.value = activeScene ? activeScene.title : '';
  }
}

function onSceneSelectChange(newId) {
  currentSceneId = newId;
  isSortModeScene = false;
  localStorage.setItem('ecard_last_scene_id', newId);

  const sortBtn = document.getElementById('btn-sort-scene');
  if (sortBtn) {
    sortBtn.innerHTML = "じゅんばん ⇅";
    sortBtn.className = "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap";
  }
  renderSceneDropdowns();
  renderSceneBoard();
}

function onSettingsSceneSelectChange(newId) {
  currentSceneId = newId;
  localStorage.setItem('ecard_last_scene_id', newId);
  renderSceneDropdowns();
  renderSettingsForms();
}

function renderSceneBoard() {
  const grid = document.getElementById('scene-grid');
  if (!grid) return;
  const activeScene = scenes.find(s => s.id === currentSceneId);
  if (!activeScene) return;

  const steps = activeScene.steps || [];
  const state = sceneCheckStates[activeScene.id] || [];

  const visibleSteps = steps.filter(step => step.enabled !== false);
  if (visibleSteps.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 bg-white rounded-3xl border-2 border-slate-100 text-slate-400 w-full"><p class="font-bold">カードがありません。</p><p class="text-xs mt-1">右上の「カードを追加」ボタンからカードを選んでください。</p></div>`;
    const progress = document.getElementById('scene-progress');
    const progText = document.getElementById('scene-progress-text');
    if (progress) progress.style.width = `0%`;
    if (progText) progText.innerText = `0 / 0 できた`;
    return;
  }

  let completedCount = 0;
  steps.forEach((step, idx) => {
    if (step.enabled !== false && state[idx] === true) completedCount++;
  });

  const percentage = Math.round((completedCount / visibleSteps.length) * 100);
  const progress = document.getElementById('scene-progress');
  const progText = document.getElementById('scene-progress-text');
  if (progress) progress.style.width = `${percentage}%`;
  if (progText) progText.innerText = `${completedCount} /${visibleSteps.length} できた`;

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

        <div class="aspect-square w-
