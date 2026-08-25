// === 設定・カード作成・バックアップ管理 ===

// AIひらがな変換
async function convertToHiragana(wordText) {
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_API_KEY") {
    const textPrompt = `日本語「${wordText}」をすべて「ひらがな」に変換してください。漢字・カタカナ・アルファベットは子供向けひらがなにし、余計な説明や記号を含めず変換後の文字列のみを1行で出力してください。`;
    try {
      const apiResponse = await callGeminiText(textPrompt, GEMINI_API_KEY);
      return apiResponse.replace(/[\r\n\s\.\,\、\.「」\、\。"'`]/g, "");
    } catch (e) {}
  }
  return wordText.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

// Procedural Card Generator (デモ・オフライン用)
function generateProceduralCard(word) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradients = [
      ['#ffeef2', '#ffd1dc'], ['#eef2ff', '#c7d2fe'],
      ['#ecfdf5', '#a7f3d0'], ['#fffbeb', '#fde68a'], ['#faf5ff', '#e9d5ff']
    ];
    const chosenGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, chosenGrad[0]);
    grad.addColorStop(1, chosenGrad);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.strokeRect(24, 24, 464, 464);

    const childEmojis = {
      'ねこ': '🐱', 'いぬ': '🐶', 'うさぎ': '🐰', 'ぱんだ': '🐼', 'くま': '🐻', 'とり': '🐦', 'さかな': '🐟', 'かえる': '🐸', 'ぞう': '🐘', 'らいおん': '🦁', 'きりん': '🦒', 'ひつじ': '🐑', 'きつね': '🦊',
      'くるま': '🚗', 'でんしゃ': '🚃', 'しんかんせん': '🚄', 'ひこうき': '✈️', 'ふね': '🚢', 'じてんしゃ': '🚲', 'ぱとかー': '🚓', 'きゅうきゅうしゃ': '🚑', 'しょうぼうしゃ': '🚒',
      'りんご': '🍎', 'ばなな': '🍌', 'バナナ': '🍌', 'いちご': '🍓', 'すいか': '🍉', 'めろん': '🍈', 'ぶどう': '🍇', 'みかん': '🍊', 'ぱん': '🍞', 'けーき': '🍰', 'おにぎり': '🍙', 'すし': '🍣',
      'はな': '🌸', 'たいよう': '☀️', 'つき': '🌙', 'ほし': '⭐', 'にじ': '🌈', 'ぼーる': '⚽', 'ほん': '📖', 'かばん': '🎒', 'とけい': '⏰', 'おもちゃ': '🧸', 'うた': '🎵', 'てれび': '📺'
    };

    let targetEmoji = '🎁';
    for (let key in childEmojis) {
      if (word.includes(key)) {
        targetEmoji = childEmojis[key];
        break;
      }
    }

    ctx.font = '36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✨', 80, 120);
    ctx.fillText('⭐', 400, 110);
    ctx.fillText('✨', 410, 410);
    ctx.fillText('⭐', 90, 420);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '220px Arial';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 10;
    ctx.fillText(targetEmoji, 256, 256);

    resolve(canvas.toDataURL('image/png'));
  });
}

// Plan A: AIカード生成
async function generateCard() {
  const wordInput = document.getElementById('card-input-word');
  const word = wordInput.value.trim();
  if (!word) {
    showCustomAlert("warning", "入力エラー", "絵カードにしたい言葉を入力してね！");
    return;
  }

  toggleLoading(true);
  updateLoadingStatus("AIがお言葉をチェックしています...");
  const hiraganaWord = await convertToHiragana(word);

  const existing = library.find(item => item.word === hiraganaWord);
  if (existing) {
    showCustomAlert("info", "すでにあります！", `「${hiraganaWord}」のカードはすでに作ってあるため、再利用します。`, () => {
      wordInput.value = '';
    });
    toggleLoading(false);
    return;
  }

  updateLoadingStatus("AIがかわいいイラストを描いています...");

  try {
    let imageUrl = '';
    let isFallbackToDemo = false;

    if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_API_KEY") {
      try {
        const stylizedPrompt = `flat vector icon of a cute sweet ${word}, high quality design, minimal detail, colorful children cartoon illustration style, solid clean white background, single isolated object, bright colors, friendly, no text, no characters, no words`;
        const base64Encoded = await callImagen(stylizedPrompt, GEMINI_API_KEY);
        imageUrl = `data:image/png;base64,${base64Encoded}`;
      } catch (imagenErr) {
        isFallbackToDemo = true;
        imageUrl = await generateProceduralCard(hiraganaWord);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 600));
      imageUrl = await generateProceduralCard(hiraganaWord);
    }

    if (imageUrl) {
      const newCard = {
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        word: hiraganaWord,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      };
      await saveCardToDatabase(newCard);
      await loadLibrary();

      if (isFallbackToDemo) {
        showCustomAlert("warning", "デモ画像で作りました 💡", `画像生成（有料プラン）制限のため、アプリ内のかわいいイラスト（<strong>${hiraganaWord}</strong>）でカードを完成させました！`);
      } else {
        showCustomAlert("success", "できたよ！", `「${hiraganaWord}」のえカードができました！`);
      }
      wordInput.value = '';
    }
  } catch (error) {
    showCustomAlert("error", "エラーが発生しました", "作成できませんでした。もう一度お試しください。");
  } finally {
    toggleLoading(false);
  }
}

// Plan B: 画像ファイル登録
function triggerUploadFileInput() {
  const fileInput = document.getElementById('upload-card-file');
  fileInput.value = "";
  fileInput.click();
}

async function previewUploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    toggleLoading(true);
    updateLoadingStatus("画像を読み込んでいます...");
    const optimizedBase64 = await processImageFile(file, 512, 512);
    uploadedImageBase64 = optimizedBase64;
    
    document.getElementById('upload-preview-img').src = uploadedImageBase64;
    document.getElementById('upload-preview-container').classList.remove('hidden');
    document.getElementById('upload-file-label-text').innerText = file.name.length > 12 ? file.name.substr(0,10) + "..." : file.name;
    document.getElementById('upload-status-subtext').innerText = "画像を選択中";
    document.getElementById('upload-status-subtext').className = "text-[10px] text-teal-600 font-black";
    document.getElementById('btn-reselect-upload').classList.remove('hidden');
    playSound('complete');
  } catch (err) {
    showCustomAlert("error", "画像エラー", "画像の読み込みに失敗しました。");
  } finally {
    toggleLoading(false);
  }
}

async function createUploadedCard() {
  const wordInput = document.getElementById('upload-card-word');
  const word = wordInput.value.trim();
  if (!word || !uploadedImageBase64) {
    showCustomAlert("warning", "入力エラー", "言葉と画像ファイルの両方を指定してね！");
    return;
  }

  toggleLoading(true);
  const hiraganaWord = await convertToHiragana(word);

  try {
    const newCard = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      word: hiraganaWord,
      imageUrl: uploadedImageBase64,
      createdAt: new Date().toISOString()
    };
    await saveCardToDatabase(newCard);
    await loadLibrary();
    showCustomAlert("success", "できたよ！ ✨", `「<strong>${hiraganaWord}</strong>」のカードを登録しました！`);
    resetUploadForm();
  } catch (err) {
    showCustomAlert("error", "エラー", "カードの登録中にエラーが発生しました。");
  } finally {
    toggleLoading(false);
  }
}

function resetUploadForm() {
  document.getElementById('upload-card-word').value = "";
  document.getElementById('upload-card-file').value = "";
  document.getElementById('upload-preview-img').src = "";
  document.getElementById('upload-preview-container').classList.add('hidden');
  document.getElementById('upload-file-label-text').innerText = "画像ファイルを選択";
  document.getElementById('upload-status-subtext').innerText = "画像未選択";
  document.getElementById('upload-status-subtext').className = "text-[10px] text-slate-400 font-bold";
  document.getElementById('btn-reselect-upload').classList.add('hidden');
  uploadedImageBase64 = "";
}

// ライブラリ管理
function updateLibraryCount() {
  const el = document.getElementById('library-count');
  if (el) el.innerText = `${library.length}枚`;
}

function renderLibraryGrid() {
  const grid = document.getElementById('library-grid');
  const emptyState = document.getElementById('library-empty');
  if (!grid || !emptyState) return;

  if (library.length === 0) {
    grid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  emptyState.classList.add('hidden');

  grid.innerHTML = library.map(card => `
    <div class="bg-white p-3 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 card-shadow relative group flex flex-col items-center transition-all duration-200">
      <div class="absolute -top-1.5 -right-1.5 flex items-center gap-1 z-10">
        <button onclick="openEditCardModal('${card.id}')" title="修正・編集" class="bg-indigo-500 hover:bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
          <i class="fa-solid fa-pen text-[10px]"></i>
        </button>
        <button onclick="confirmDeleteCard('${card.id}', '${card.word}')" title="削除" class="bg-rose-500 hover:bg-rose-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div class="aspect-square w-full bg-slate-50 rounded-xl mb-2 flex items-center justify-center p-1 overflow-hidden">
        <img class="w-full h-full object-contain pointer-events-none" src="${card.imageUrl}" alt="${card.word}">
      </div>
      <span class="font-bold text-slate-700 text-sm tracking-wide text-center truncate w-full px-1">${card.word}</span>
    </div>
  `).join('');
}

function confirmDeleteCard(id, word) {
  showCustomConfirm("warning", "カードの削除", `「${word}」のカードをけしてもいいですか？`, async (isConfirmed) => {
    if (isConfirmed) {
      const transaction = db.transaction(['cards'], 'readwrite');
      const store = transaction.objectStore(['cards']);
      await store.delete(id);
      
      choiceScenes.forEach(s => {
        if (s.cards) {
          s.cards.forEach((c, idx) => {
            if (c && c.id === id) s.cards[idx] = null;
          });
        }
      });
      saveChoiceScenesToStorage();
      await loadLibrary();
      renderChoiceBoard();
    }
  });
}

function confirmResetLibrary() {
  showCustomConfirm("danger", "すべて削除", "つくった絵カードをすべて削除します。よろしいですか？", async (isConfirmed) => {
    if (isConfirmed) {
      await clearDatabase();
      choiceScenes.forEach(s => {
        s.cards = [null, null, null, null, null];
      });
      saveChoiceScenesToStorage();
      await loadLibrary();
      renderChoiceBoard();
      showCustomAlert("success", "削除完了", "すべての絵カードを削除しました。");
    }
  });
}

// カード修正・選び直し
function openEditCardModal(cardId) {
  const card = library.find(c => c.id === cardId);
  if (!card) return;

  document.getElementById('edit-card-id').value = card.id;
  document.getElementById('edit-word-input').value = card.word;
  document.getElementById('edit-preview-img').src = card.imageUrl;
  document.getElementById('edit-file-input').value = "";
  
  editingCardOriginalImage = card.imageUrl;
  editingCardImageBase64 = card.imageUrl;

  document.getElementById('edit-card-modal').classList.remove('hidden');
}

function closeEditCardModal() {
  document.getElementById('edit-card-modal').classList.add('hidden');
  editingCardImageBase64 = "";
  editingCardOriginalImage = "";
}

function triggerEditFileInput() {
  const fileInput = document.getElementById('edit-file-input');
  fileInput.value = "";
  fileInput.click();
}

async function previewEditImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    toggleLoading(true);
    updateLoadingStatus("画像を読み込んでいます...");
    const optimizedBase64 = await processImageFile(file, 512, 512);
    editingCardImageBase64 = optimizedBase64;
    document.getElementById('edit-preview-img').src = optimizedBase64;
    playSound('complete');
  } catch (err) {
    showCustomAlert("error", "画像エラー", "画像の読み込みに失敗しました。別の画像をお試しください。");
  } finally {
    toggleLoading(false);
  }
}

function openPresetSelectForEdit() {
  const container = document.getElementById('edit-presets-container');
  const allPresets = { ...fallbackSVGs, ...routineSVGs };

  container.innerHTML = Object.entries(allPresets).map(([key, svg]) => `
    <div onclick="selectPresetForCardEdit('${key}')" class="bg-slate-50 border-2 border-slate-100 hover:border-amber-400 p-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all aspect-square active:scale-95 shadow-sm">
      <img class="w-12 h-12 object-contain pointer-events-none" src="${svg}" alt="">
      <span class="text-[10px] font-black text-slate-500 mt-1 truncate w-full text-center">${key}</span>
    </div>
  `).join('');

  document.getElementById('edit-preset-modal').classList.remove('hidden');
}

function closeEditPresetModal() {
  document.getElementById('edit-preset-modal').classList.add('hidden');
}

function selectPresetForCardEdit(key) {
  const allPresets = { ...fallbackSVGs, ...routineSVGs };
  const selectedSvg = allPresets[key];
  if (selectedSvg) {
    editingCardImageBase64 = selectedSvg;
    document.getElementById('edit-preview-img').src = selectedSvg;
    playSound('complete');
  }
  closeEditPresetModal();
}

function resetEditImageToOriginal() {
  if (editingCardOriginalImage) {
    editingCardImageBase64 = editingCardOriginalImage;
    document.getElementById('edit-preview-img').src = editingCardOriginalImage;
    playSound('complete');
  }
}

async function saveCardEdits() {
  const cardId = document.getElementById('edit-card-id').value;
  const newWordRaw = document.getElementById('edit-word-input').value.trim();

  if (!newWordRaw) {
    showCustomAlert("warning", "入力エラー", "カードの名前を入力してね！");
    return;
  }

  const card = library.find(c => c.id === cardId);
  if (!card) return;

  toggleLoading(true);
  const newWordHiragana = await convertToHiragana(newWordRaw);

  card.word = newWordHiragana;
  if (editingCardImageBase64) {
    card.imageUrl = editingCardImageBase64;
  }

  await saveCardToDatabase(card);
  await loadLibrary();

  choiceScenes.forEach(s => {
    if (s.cards) {
      s.cards.forEach((c, idx) => {
        if (c && c.id === cardId) {
          s.cards[idx] = card;
        }
      });
    }
  });
  saveChoiceScenesToStorage();
  renderChoiceBoard();

  toggleLoading(false);
  closeEditCardModal();
  showCustomAlert("success", "更新完了！", `カード「<strong>${newWordHiragana}</strong>」を更新しました！`);
}

// === バックアップデータ生成ヘルパー ===
async function buildBackupDataObject() {
  await loadLibrary();
  return {
    version: "5.5",
    exportDate: new Date().toISOString(),
    library: library,
    scenes: scenes,
    choiceScenes: choiceScenes,
    geminiApiKey: GEMINI_API_KEY || ""
  };
}

// ローカルファイル エクスポート・インポート
async function exportBackupData() {
  try {
    const backupData = await buildBackupDataObject();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    a.href = url;
    a.download = `ecard_backup_${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showCustomAlert("success", "保存完了 📥", `絵カード、チョイスの全場面、手順表シーンをバックアップ保存しました！`);
  } catch (err) {
    showCustomAlert("error", "エラー", "バックアップファイルの作成に失敗しました。");
  }
}

async function restoreFromBackupObject(imported) {
  if (!imported.library || !Array.isArray(imported.library)) {
    throw new Error("正しい形式のバックアップデータではありません。");
  }

  toggleLoading(true);
  updateLoadingStatus("データを復元しています...");

  await clearDatabase();
  for (const card of imported.library) {
    await saveCardToDatabase(card);
  }

  if (imported.scenes && Array.isArray(imported.scenes)) {
    scenes = imported.scenes;
  }

  if (imported.choiceScenes && Array.isArray(imported.choiceScenes)) {
    choiceScenes = imported.choiceScenes;
  }

  currentSceneId = (scenes && scenes.length > 0) ? scenes[0].id : "";
  currentChoiceSceneId = (choiceScenes && choiceScenes.length > 0) ? choiceScenes[0].id : "";
  selectedChoiceCardIndex = null;

  initSceneCheckStates();
  saveScenesToStorage();
  saveChoiceScenesToStorage();

  if (imported.geminiApiKey) {
    processAndSetApiKey(imported.geminiApiKey);
  }

  await loadLibrary();
  renderSceneDropdowns();
  renderChoiceSceneDropdown();
  renderSettingsForms();
  renderLibraryGrid();
  renderSceneBoard();
  renderChoiceBoard();

  toggleLoading(false);
}

async function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      showCustomConfirm("warning", "バックアップの復元", `絵カード（${imported.library.length}枚）と全設定を復元します。現在のデータは上書きされますがよろしいですか？`, async (isConfirmed) => {
        if (isConfirmed) {
          try {
            await restoreFromBackupObject(imported);
            showCustomAlert("success", "復元完了 📤", `絵カードと全シーン、チョイスの設定を復元しました！`);
          } catch (err) {
            showCustomAlert("error", "復元エラー", "バックアップの復元中にエラーが発生しました。");
          }
        }
        if (document.getElementById('backup-file-input')) document.getElementById('backup-file-input').value = "";
      });

    } catch (err) {
      showCustomAlert("error", "復元エラー", "バックアップファイルの読み込みに失敗しました。");
    }
  };
  reader.readAsText(file);
}

// === GitHub クラウド同期・バックアップ管理 ===

function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode('0x' + p1);
  }));
}

function base64ToUtf8(base64Str) {
  const cleaned = base64Str.replace(/\s/g, '');
  return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function initGitHubConfig() {
  const token = localStorage.getItem('github_pat') || "";
  const repo = localStorage.getItem('github_repo') || "";
  const branch = localStorage.getItem('github_branch') || "main";
  const path = localStorage.getItem('github_path') || "data/ecard_backup.json";

  GITHUB_TOKEN = token;
  GITHUB_REPO = repo;
  GITHUB_BRANCH = branch;
  GITHUB_PATH = path;

  const elToken = document.getElementById('github-token-input');
  const elRepo = document.getElementById('github-repo-input');
  const elBranch = document.getElementById('github-branch-input');
  const elPath = document.getElementById('github-path-input');

  if (elToken) elToken.value = token;
  if (elRepo) elRepo.value = repo;
  if (elBranch) elBranch.value = branch;
  if (elPath) elPath.value = path;

  updateGitHubStatusBadge(!!(token && repo));
}

function saveGitHubConfig() {
  const token = document.getElementById('github-token-input').value.trim();
  const repo = document.getElementById('github-repo-input').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const branch = document.getElementById('github-branch-input').value.trim() || "main";
  const path = document.getElementById('github-path-input').value.trim() || "data/ecard_backup.json";

  if (repo && !repo.includes('/')) {
    showCustomAlert("warning", "リポジトリ指定エラー", "リポジトリ名は「ユーザー名/リポジトリ名」（例: username/ecard-app）の形式で入力してください。");
    return;
  }

  GITHUB_TOKEN = token;
  GITHUB_REPO = repo;
  GITHUB_BRANCH = branch;
  GITHUB_PATH = path;

  localStorage.setItem('github_pat', token);
  localStorage.setItem('github_repo', repo);
  localStorage.setItem('github_branch', branch);
  localStorage.setItem('github_path', path);

  updateGitHubStatusBadge(!!(token && repo));
  showCustomAlert("success", "設定保存完了 💾", "GitHub連携設定を保存しました！");
}

function updateGitHubStatusBadge(isConnected) {
  const badge = document.getElementById('github-status-badge');
  if (!badge) return;
  if (isConnected) {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200";
    badge.innerHTML = '<i class="fa-solid fa-cloud-arrow-up text-emerald-600"></i> GitHub連携中';
  } else {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200";
    badge.innerHTML = '<i class="fa-solid fa-circle-minus text-slate-400"></i> 未連携';
  }
}

async function testGitHubConnection() {
  const token = document.getElementById('github-token-input').value.trim();
  const repo = document.getElementById('github-repo-input').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const spinner = document.getElementById('github-test-spinner');

  if (!token || !repo) {
    showCustomAlert("warning", "入力エラー", "Personal Access Token (PAT) と リポジトリ名 を入力してください。");
    return;
  }

  spinner.classList.remove('hidden');
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const permissions = data.permissions || {};
      const canPush = permissions.push !== false;
      showCustomAlert("success", "接続成功 ⚡", `リポジトリ「<strong>${data.full_name}</strong>」への接続に成功しました！<br><span class="text-xs text-slate-500">書き込み権限: ${canPush ? 'あり (OK)' : 'なし (読み取り専用)'}</span>`);
    } else if (res.status === 401) {
      throw new Error("Personal Access Tokenが無効か、期限切れです。");
    } else if (res.status === 404) {
      throw new Error(`リポジトリ「${repo}」が見つからないか、トークンにアクセス権がありません。`);
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `ステータスコード: ${res.status}`);
    }
  } catch (err) {
    showCustomAlert("error", "GitHub接続エラー", `接続に失敗しました：<br>${err.message}`);
  } finally {
    spinner.classList.add('hidden');
  }
}

async function saveBackupToGitHub() {
  const token = document.getElementById('github-token-input').value.trim() || GITHUB_TOKEN;
  const repo = document.getElementById('github-repo-input').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '') || GITHUB_REPO;
  const branch = document.getElementById('github-branch-input').value.trim() || GITHUB_BRANCH || "main";
  const path = document.getElementById('github-path-input').value.trim() || GITHUB_PATH || "data/ecard_backup.json";

  if (!token || !repo) {
    showCustomAlert("warning", "GitHub設定が必要です", "GitHubへのバックアップには、Personal Access Token (PAT) と リポジトリ名 の設定が必要です。");
    return;
  }

  toggleLoading(true);
  updateLoadingStatus("GitHubにバックアップデータを送信しています...");

  try {
    // 既存ファイルのSHAを取得
    let existingSha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      existingSha = getData.sha;
    }

    const backupData = await buildBackupDataObject();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const base64Content = utf8ToBase64(jsonStr);

    const now = new Date();
    const timeStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const commitMessage = `Update ecard backup data (${timeStr}) [cards: ${backupData.library.length}]`;

    const putBody = {
      message: commitMessage,
      content: base64Content,
      branch: branch
    };
    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      throw new Error(errJson.message || `ステータス: ${putRes.status}`);
    }

    const resultData = await putRes.json();
    const commitUrl = resultData.commit?.html_url || `https://github.com/${repo}/blob/${branch}/${path}`;
    
    showCustomAlert("success", "GitHub保存完了 🚀", `
      GitHubリポジトリ（<strong>${repo}</strong>）の <code>${path}</code> にバックアップを保存・コミットしました！<br>
      <a href="${commitUrl}" target="_blank" class="text-xs text-indigo-600 font-black underline mt-2 inline-block">
        GitHubで確認する <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
      </a>
    `);
  } catch (err) {
    showCustomAlert("error", "GitHub保存失敗", `GitHubへのバックアップ保存に失敗しました：<br>${err.message}`);
  } finally {
    toggleLoading(false);
  }
}

async function loadBackupFromGitHub() {
  const token = document.getElementById('github-token-input').value.trim() || GITHUB_TOKEN;
  const repo = document.getElementById('github-repo-input').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '') || GITHUB_REPO;
  const branch = document.getElementById('github-branch-input').value.trim() || GITHUB_BRANCH || "main";
  const path = document.getElementById('github-path-input').value.trim() || GITHUB_PATH || "data/ecard_backup.json";

  if (!repo) {
    showCustomAlert("warning", "設定が必要です", "リポジトリ名を入力してください。");
    return;
  }

  showCustomConfirm("warning", "GitHubから復元", `GitHub（${repo}/${path}）から最新データを読み込み、現在のデータを上書き復元します。よろしいですか？`, async (isConfirmed) => {
    if (!isConfirmed) return;

    toggleLoading(true);
    updateLoadingStatus("GitHubからバックアップを取得しています...");

    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&_t=${Date.now()}`, {
        headers: headers
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`ファイル「${path}」がブランチ「${branch}」に見つかりませんでした。まだ保存されていない可能性があります。`);
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `ステータスコード: ${res.status}`);
      }

      const data = await res.json();
      if (!data.content) {
        throw new Error("ファイルの内容が空です。");
      }

      const jsonStr = base64ToUtf8(data.content);
      const imported = JSON.parse(jsonStr);

      await restoreFromBackupObject(imported);
      showCustomAlert("success", "GitHub復元完了 📥", `GitHubから絵カード（${imported.library.length}枚）と全設定を復元しました！`);
    } catch (err) {
      showCustomAlert("error", "復元失敗", `GitHubからの復元に失敗しました：<br>${err.message}`);
    } finally {
      toggleLoading(false);
    }
  });
}

// APIキー管理
function saveApiKey() {
  const keyVal = document.getElementById('settings-api-key-input').value.trim();
  processAndSetApiKey(keyVal);
  showCustomAlert("success", "APIキー保存完了", "新しいAPIキーを設定しました！");
}

function processAndSetApiKey(key) {
  GEMINI_API_KEY = key;
  if (key) {
    localStorage.setItem('gemini_api_key', key);
    document.getElementById('settings-api-key-input').value = key;
    updateApiStatusBadge(true);
  } else {
    localStorage.removeItem('gemini_api_key');
    document.getElementById('settings-api-key-input').value = "";
    updateApiStatusBadge(false);
  }
}

function updateApiStatusBadge(isActive) {
  const badge = document.getElementById('api-status-badge');
  if (!badge) return;
  if (isActive) {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200";
    badge.innerHTML = 'Gemini AI連携中';
  } else {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200";
    badge.innerHTML = 'デモモード稼働中';
  }
}

async function testGeneralApiKey() {
  const input = document.getElementById('settings-api-key-input').value.trim();
  const spinner = document.getElementById('general-test-spinner');
  if (!input) {
    showCustomAlert("warning", "テスト失敗", "確認したいAPIキーを入力してください。");
    return;
  }
  spinner.classList.remove('hidden');
  try {
    const testRes = await callGeminiText("Say 'OK' in 1 word.", input);
    if (testRes) {
      showCustomAlert("success", "接続テスト成功！ ⚡", "Google Gemini APIへの接続に成功しました！");
    }
  } catch (err) {
    showCustomAlert("error", "接続テスト失敗", `キーが無効、または通信エラーです。<br>${err.message}`);
  } finally {
    spinner.classList.add('hidden');
  }
}

async function callGeminiText(prompt, key) {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text.trim();
        }
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Gemini APIと通信できませんでした。");
}

async function callImagen(prompt, key) {
  const models = ["imagen-3.0-generate-002", "imagen-4.0-generate-001"];
  let lastError = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${key}`;
    const payload = { instances: [{ prompt: prompt }], parameters: { sampleCount: 1 } };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.predictions?.[0]?.bytesBase64Encoded) {
          return data.predictions[0].bytesBase64Encoded;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("画像生成モデルが利用できませんでした。");
}

function clearInput() {
  document.getElementById('card-input-word').value = '';
}
