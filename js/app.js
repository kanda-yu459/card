// === グローバル共通変数 ===
let GEMINI_API_KEY = "";
let db;
let library = [];
let currentTab = 'practice';

let alertPromiseResolve = null;
let audioCtx = null;
let uploadedImageBase64 = "";

let editingCardOriginalImage = "";
let editingCardImageBase64 = "";
let activeEditStepIdx = -1;
let iconPickerMode = 'change';

// プリセットSVGアイコン
const fallbackSVGs = {
  apple: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="53" r="35" fill="%23f43f5e"/><path d="M50,18 C52,25 45,30 40,30 C38,22 45,18 50,18 Z" fill="%2322c55e"/><path d="M50,22 L50,10" stroke="%2378350f" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="45" r="4" fill="%23fff" opacity="0.8"/><circle cx="62" cy="45" r="4" fill="%23fff" opacity="0.8"/><path d="M42,62 Q50,68 58,62" stroke="%23fff" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`,
  banana: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20,25 Q40,20 65,40 Q85,60 80,80 Q65,80 45,60 Q25,40 20,25 Z" fill="%23eab308"/><path d="M18,22 L24,28" stroke="%23713f12" stroke-width="6" stroke-linecap="round"/><path d="M78,78 L84,84" stroke="%23451a03" stroke-width="6" stroke-linecap="round"/><path d="M35,35 Q50,32 68,48" stroke="%23ca8a04" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
  dog: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="%23fdba74"/><ellipse cx="25" cy="45" rx="8" ry="20" fill="%23ea580c" transform="rotate(15 25 45)"/><ellipse cx="75" cy="45" rx="8" ry="20" fill="%23ea580c" transform="rotate(-15 75 45)"/><circle cx="38" cy="45" r="5" fill="%231e293b"/><circle cx="62" cy="45" r="5" fill="%231e293b"/><ellipse cx="50" cy="56" rx="7" ry="5" fill="%230f172a"/><path d="M44,64 Q50,68 56,64" stroke="%230f172a" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M48,58 L48,64" stroke="%230f172a" stroke-width="2"/><path d="M52,58 L52,64" stroke="%230f172a" stroke-width="2"/></svg>`,
  car: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M15,60 L20,42 Q25,30 45,30 L65,30 Q80,30 85,45 L90,60 Z" fill="%233b82f6"/><rect x="10" y="55" width="80" height="15" rx="5" fill="%231d4ed8"/><circle cx="30" cy="72" r="12" fill="%231e293b"/><circle cx="30" cy="72" r="5" fill="%23cbd5e1"/><circle cx="70" cy="72" r="12" fill="%231e293b"/><circle cx="70" cy="72" r="5" fill="%23cbd5e1"/><rect x="25" y="38" width="18" height="12" rx="2" fill="%23e2e8f0"/><rect x="48" y="38" width="22" height="12" rx="2" fill="%23e2e8f0"/></svg>`
};

const routineSVGs = {
  okiru: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="26" fill="%23f97316"/><circle cx="50" cy="50" r="18" fill="%23facc15"/><path d="M50,10 L50,22 M50,78 L50,90 M10,50 L22,50 M78,50 L90,50 M22,22 L30,30 M70,70 L78,78 M22,78 L30,70 M70,22 L78,30" stroke="%23eab308" stroke-width="5" stroke-linecap="round"/><path d="M38,48 Q50,40 62,48" stroke="%237c2d12" stroke-width="3" fill="none"/><circle cx="42" cy="54" r="3" fill="%237c2d12"/><circle cx="58" cy="54" r="3" fill="%237c2d12"/><path d="M46,62 Q50,66 54,62" stroke="%237c2d12" stroke-width="2.5" fill="none"/></svg>`,
  toilet: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="15" width="40" height="20" rx="6" fill="%23cbd5e1"/><rect x="35" y="35" width="30" height="35" rx="8" fill="%23e2e8f0"/><ellipse cx="50" cy="35" rx="18" ry="4" fill="%2394a3b8"/><rect x="25" y="65" width="50" height="15" rx="5" fill="%2364748b"/><path d="M62,25 L62,20" stroke="%231e293b" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="48" r="8" fill="%2338bdf8" opacity="0.6"/></svg>`,
  kigaeru: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20,38 L38,22 L50,30 L62,22 L80,38 L72,55 L62,50 L62,80 L38,80 L38,50 L28,55 Z" fill="%23ec4899"/><path d="M42,22 Q50,15 58,22" stroke="%23f472b6" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="4" fill="%23fff"/><circle cx="50" cy="65" r="4" fill="%23fff"/></svg>`,
  gohan: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="%23fef08a"/><path d="M15,50 Q15,85 50,85 Q85,85 85,50 Z" fill="%2338bdf8"/><rect x="40" y="25" width="20" height="25" rx="4" fill="%23fff"/><rect x="18" y="55" width="64" height="6" fill="%230284c7"/><path d="M22,35 L22,65" stroke="%23cbd5e1" stroke-width="5" stroke-linecap="round"/><path d="M78,35 L78,65" stroke="%23cbd5e1" stroke-width="5" stroke-linecap="round"/></svg>`,
  hamigaki: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M15,80 L75,20 L85,30 L25,90 Z" fill="%2310b981"/><path d="M70,15 L90,35" stroke="%2322c55e" stroke-width="4"/><rect x="68" y="10" width="12" height="15" rx="3" fill="%23fff" transform="rotate(-45 68 10)"/><path d="M15,80 L25,90" stroke="%23047857" stroke-width="6"/></svg>`,
  bag: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="25" y="30" width="50" height="50" rx="12" fill="%23a855f7"/><rect x="30" y="45" width="40" height="30" rx="8" fill="%23c084fc"/><path d="M35,30 Q50,15 65,30" stroke="%23a855f7" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="50" cy="38" r="5" fill="%23facc15"/></svg>`,
  go_out: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="28" y="15" width="44" height="70" rx="6" fill="%23b45309" stroke="%2378350f" stroke-width="4"/><circle cx="38" cy="50" r="4.5" fill="%23facc15"/><rect x="15" y="80" width="70" height="10" fill="%2394a3b8" rx="2"/><path d="M18,52 L26,45 L26,59 Z" fill="%2338bdf8" stroke="%230284c7" stroke-width="2"/></svg>`,
  tearai: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,15 L50,30" stroke="%2394a3b8" stroke-width="8" stroke-linecap="round"/><path d="M40,30 L60,30" fill="none" stroke="%2364748b" stroke-width="8" stroke-linecap="round"/><path d="M50,30 Q50,55 35,60" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round"/><path d="M50,30 Q50,55 65,60" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round"/><circle cx="35" cy="72" r="10" fill="%2338bdf8" opacity="0.6"/><circle cx="65" cy="72" r="10" fill="%2338bdf8" opacity="0.6"/><circle cx="50" cy="78" r="12" fill="%2338bdf8" opacity="0.4"/></svg>`,
  backpack_away: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="10" fill="%23f59e0b" stroke="%23b45309" stroke-width="4"/><line x1="15" y1="50" x2="85" y2="50" stroke="%23b45309" stroke-width="4"/><rect x="25" y="58" width="18" height="18" rx="4" fill="%23a855f7"/><rect x="57" y="58" width="18" height="18" rx="4" fill="%233b82f6"/></svg>`,
  syukudai: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="15" width="60" height="70" rx="6" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4"/><line x1="30" y1="30" x2="70" y2="30" stroke="%2394a3b8" stroke-width="4" stroke-linecap="round"/><line x1="30" y1="45" x2="70" y2="45" stroke="%2394a3b8" stroke-width="4" stroke-linecap="round"/><line x1="30" y1="60" x2="55" y2="60" stroke="%2394a3b8" stroke-width="4" stroke-linecap="round"/><path d="M70,60 L85,80 L75,85 L60,65 Z" fill="%23f43f5e"/></svg>`,
  tomorrow_prep: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="64" rx="8" fill="%23ec4899"/><rect x="26" y="26" width="48" height="52" rx="4" fill="%23fff"/><path d="M35,45 L45,55 L65,35" stroke="%2310b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  kataduke: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="45" width="30" height="30" rx="4" fill="%23ef4444"/><rect x="55" y="45" width="30" height="30" rx="4" fill="%233b82f6"/><polygon points="50,15 30,45 70,45" fill="%23eab308"/></svg>`,
  oyasumi: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="45" width="70" height="38" rx="6" fill="%233b82f6" stroke="%231d4ed8" stroke-width="4"/><rect x="20" y="28" width="30" height="18" rx="4" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><path d="M15,45 Q50,48 85,45" stroke="%231d4ed8" stroke-width="4"/><circle cx="68" cy="22" r="10" fill="%23facc15"/><path d="M72,22 A10,10 0 0,1 62,12" stroke="%23eab308" stroke-width="2" fill="none"/></svg>`
};

// === IndexedDB 設定 ===
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EcardAppDB', 1);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('cards')) {
        database.createObjectStore('cards', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = (event) => reject(event);
  });
}

async function loadLibrary() {
  if (!db) return [];
  return new Promise((resolve) => {
    const transaction = db.transaction(['cards'], 'readonly');
    const store = transaction.objectStore('cards');
    const request = store.getAll();
    request.onsuccess = () => {
      library = request.result || [];
      updateLibraryCount();
      renderLibraryGrid();
      resolve(library);
    };
  });
}

async function saveCardToDatabase(card) {
  if (!db) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    const request = store.put(card);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e);
  });
}

async function clearDatabase() {
  if (!db) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e);
  });
}

// === 画像最適化ヘルパー ===
function processImageFile(file, maxWidth = 512, maxHeight = 512) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error("画像ファイルではありません"));
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("ファイルの読み取りに失敗しました"));
    reader.readAsDataURL(file);
  });
}

// === タブ切り替え ===
function switchTab(tabId) {
  currentTab = tabId;
  const tabs = ['practice', 'scenes', 'settings'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    const isActive = t === tabId;
    if (t === 'scenes') {
      btn.className = isActive ? "px-6 py-2.5 rounded-xl text-sm font-black bg-white text-amber-700 shadow-sm flex items-center gap-1.5" : "px-6 py-2.5 rounded-xl text-sm font-black text-amber-700 hover:bg-white/50 flex items-center gap-1.5";
    } else if (t === 'settings') {
      btn.className = isActive ? "px-6 py-2.5 rounded-xl text-sm font-black bg-white text-teal-700 shadow-sm flex items-center gap-1.5" : "px-6 py-2.5 rounded-xl text-sm font-black text-teal-700 hover:bg-white/50 flex items-center gap-1.5";
    } else {
      btn.className = isActive ? "px-6 py-2.5 rounded-xl text-sm font-black bg-white text-indigo-700 shadow-sm flex items-center gap-1.5" : "px-6 py-2.5 rounded-xl text-sm font-black text-indigo-600 hover:bg-white/50 flex items-center gap-1.5";
    }
    document.getElementById(`page-${t}`).classList.toggle('hidden', !isActive);
  });

  if (tabId === 'practice') renderChoiceBoard();
  if (tabId === 'scenes') renderSceneBoard();
  if (tabId === 'settings') {
    renderLibraryGrid();
    renderSettingsForms();
  }
}

// === サウンド再生 ===
function playSound(type) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  try {
    const now = audioCtx.currentTime;
    if (type === 'correct' || type === 'complete') {
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'fanfare') {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }
  } catch (err) {}
}

function enableAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume().then(() => {
    document.getElementById('audio-banner').classList.add('hidden');
    showCustomAlert("info", "準備完了！", "音が出るようになりました。さあ遊ぼう！");
  });
}

// === ダイアログ・ローディング ===
function showCustomAlert(type, title, msg, callback = null) {
  const modal = document.getElementById('custom-alert');
  const iconBox = document.getElementById('alert-icon-container');
  const titleBox = document.getElementById('alert-title');
  const msgBox = document.getElementById('alert-message');
  const btnCancel = document.getElementById('alert-btn-cancel');

  iconBox.className = "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ";
  btnCancel.classList.add('hidden');
  
  if (type === 'success') {
    iconBox.classList.add('bg-emerald-100', 'text-emerald-600');
    iconBox.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  } else if (type === 'error') {
    iconBox.classList.add('bg-rose-100', 'text-rose-600');
    iconBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
  } else if (type === 'warning') {
    iconBox.classList.add('bg-amber-100', 'text-amber-600');
    iconBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
  } else {
    iconBox.classList.add('bg-indigo-100', 'text-indigo-600');
    iconBox.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
  }

  titleBox.innerText = title;
  msgBox.innerHTML = msg;
  modal.classList.remove('hidden');
  
  alertPromiseResolve = () => {
    modal.classList.add('hidden');
    if (callback) callback();
  };
}

function showCustomConfirm(type, title, msg, callback) {
  const modal = document.getElementById('custom-alert');
  const iconBox = document.getElementById('alert-icon-container');
  const titleBox = document.getElementById('alert-title');
  const msgBox = document.getElementById('alert-message');
  const btnCancel = document.getElementById('alert-btn-cancel');
  const btnOk = document.getElementById('alert-btn-ok');

  iconBox.className = "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ";
  btnCancel.classList.remove('hidden');

  if (type === 'danger') {
    iconBox.classList.add('bg-rose-100', 'text-rose-600');
    iconBox.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    btnOk.className = "bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all";
  } else {
    iconBox.classList.add('bg-amber-100', 'text-amber-600');
    iconBox.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
    btnOk.className = "bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all";
  }

  titleBox.innerText = title;
  msgBox.innerText = msg;
  modal.classList.remove('hidden');

  alertPromiseResolve = (confirmed) => {
    modal.classList.add('hidden');
    callback(confirmed);
  };
}

function closeAlert(isOk) {
  if (alertPromiseResolve) {
    alertPromiseResolve(isOk);
    alertPromiseResolve = null;
  }
}

function toggleLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function updateLoadingStatus(text) {
  document.getElementById('loading-status-text').innerHTML = `${text}<br>ちょっと待ってね！`;
}

function closeCelebration() {
  document.getElementById('celebration-overlay').classList.add('hidden');
}

// === アプリ起動初期化 ===
window.onload = async () => {
  try {
    initScenes();
    initChoiceScenes();
    await initDatabase();
    await loadLibrary();
    
    if (library.length === 0) {
      const sampleCards = [
        { id: 's_apple', word: 'りんご', imageUrl: fallbackSVGs.apple },
        { id: 's_banana', word: 'バナナ', imageUrl: fallbackSVGs.banana },
        { id: 's_dog', word: 'いぬ', imageUrl: fallbackSVGs.dog },
        { id: 's_car', word: 'くるま', imageUrl: fallbackSVGs.car }
      ];
      for (let sample of sampleCards) {
        await saveCardToDatabase(sample);
      }
      await loadLibrary();
    }

    renderChoiceBoard();

    document.body.addEventListener('click', () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });
  } catch (err) {}
};
