const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const statusBox = document.getElementById("status");
const detailsBox = document.getElementById("details");

const openCameraBtn = document.getElementById("openCamera");
const closeCameraBtn = document.getElementById("closeCamera");
const analyzeBtn = document.getElementById("analyze");
const autoBtn = document.getElementById("autoAnalyze");
const themeBtn = document.getElementById("toggleTheme");
const clearBtn = document.getElementById("clearHistory");

const cameraBox = document.querySelector(".camera-box");

let model;
let stream = null;
let isAnalyzing = false;
let autoMode = false;

let ultimaClasse = null;

const MODEL_URL = "./model/";


// ==================== LOAD MODEL ====================
async function loadModel() {
  try {
    statusBox.textContent = "Carregando IA...";
    detailsBox.textContent = "Inicializando modelo...";

    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    if (!window.tmImage) {
      throw new Error("tmImage não carregado.");
    }

    model = await window.tmImage.load(modelURL, metadataURL);

    statusBox.textContent = "IA pronta";
    detailsBox.textContent = "Abra a câmera para começar.";
  } catch (error) {
    console.error(error);
    statusBox.textContent = "Erro ao carregar IA";
    detailsBox.textContent = error.message;
  }
}


// ==================== CAMERA ====================
async function openCamera() {
  try {
    if (stream) return;

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    statusBox.textContent = "Câmera ativa";
    detailsBox.textContent = "Posicione o doce.";
  } catch (error) {
    console.error(error);
    statusBox.textContent = "Erro na câmera";
    detailsBox.textContent = "Permissão negada ou indisponível.";
  }
}

function closeCamera() {
  if (!stream) return;

  stream.getTracks().forEach(track => track.stop());
  video.srcObject = null;
  stream = null;

  stopAnalysis();

  statusBox.textContent = "Câmera desligada";
  detailsBox.textContent = "Abra novamente para usar.";
}


// ==================== ANALYSIS ====================
function updateStatusStyle(className) {
  const name = className.toLowerCase();

  if (name.includes("bom") || name.includes("limpo")) {
    statusBox.style.background = "#d4edda";
    statusBox.style.color = "#155724";
  } else if (name.includes("ruim") || name.includes("contaminado")) {
    statusBox.style.background = "#f8d7da";
    statusBox.style.color = "#721c24";
  } else {
    statusBox.style.background = "#fff3cd";
    statusBox.style.color = "#856404";
  }
}

function resetStatusStyle() {
  statusBox.style.background = "";
  statusBox.style.color = "";
}

async function loopAnalyze() {
  if (!isAnalyzing) {
    cameraBox.classList.remove("scanning");
    return;
  }

  if (!model || !video.videoWidth) {
    stopAnalysis();
    return;
  }

  cameraBox.classList.add("scanning");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  try {
    const predictions = await model.predict(canvas);
    predictions.sort((a, b) => b.probability - a.probability);

    const best = predictions[0];
    const confidence = (best.probability * 100).toFixed(1);

    statusBox.textContent = `Resultado: ${best.className}`;

    updateStatusStyle(best.className);

    salvarHistorico(best.className, confidence);

  } catch (error) {
    console.error(error);
    statusBox.textContent = "Erro na análise";
  }

  if (isAnalyzing) {
    setTimeout(loopAnalyze, autoMode ? 1500 : 500);
  }
}

function toggleAnalysis() {
  if (isAnalyzing) {
    stopAnalysis();
    return;
  }

  if (!model || !stream) {
    statusBox.textContent = "Abra câmera e carregue IA";
    return;
  }

  isAnalyzing = true;
  analyzeBtn.textContent = "Parar";
  loopAnalyze();
}

function stopAnalysis() {
  isAnalyzing = false;
  analyzeBtn.textContent = "Analisar";
  cameraBox.classList.remove("scanning");
  resetStatusStyle();

  ultimaClasse = null;
}


// ==================== AUTO MODE ====================
if (autoBtn) {
  autoBtn.addEventListener("click", () => {
    autoMode = !autoMode;
    autoBtn.textContent = autoMode ? "Auto: ON" : "Auto: OFF";

    if (autoMode && !isAnalyzing) {
      toggleAnalysis();
    }

    if (!autoMode && isAnalyzing) {
      stopAnalysis();
    }
  });
}


// ==================== HISTORY ====================
function salvarHistorico(classe) {

  // só salva se mudar de classe
  if (classe === ultimaClasse) return;

  ultimaClasse = classe;

  const historico = JSON.parse(localStorage.getItem("historico")) || [];

  historico.unshift({
    classe,
    data: new Date().toLocaleString("pt-BR")
  });

  if (historico.length > 20) historico.pop();

  localStorage.setItem("historico", JSON.stringify(historico));
  renderHistorico();
}

function renderHistorico() {
  const lista = document.getElementById("historyList");
  const historico = JSON.parse(localStorage.getItem("historico")) || [];

  if (!lista) return;

  if (!historico.length) {
    lista.innerHTML = "<p>Nenhuma análise ainda</p>";
    return;
  }

  lista.innerHTML = historico.map(item => {

  let classeCor = "";

  const nome = item.classe.toLowerCase();

  if (nome.includes("bom") || nome.includes("limpo")) {
    classeCor = "good";
  } else if (nome.includes("ruim") || nome.includes("contaminado")) {
    classeCor = "bad";
  } else {
    classeCor = "neutral";
  }

  return `
    <div class="history-item ${classeCor}">
      <strong>${item.classe}</strong><br>

      <small>${item.data}</small>
    </div>
  `;
}).join("");}


// BOTÃO LIMPAR
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    localStorage.removeItem("historico");
    renderHistorico();
  });
}


// ==================== THEME ====================
function loadTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (themeBtn) themeBtn.textContent = "☀️";
  }
}

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.textContent = isDark ? "☀️" : "🌙";
  });
}


// ==================== EVENTS ====================
if (openCameraBtn) openCameraBtn.addEventListener("click", openCamera);
if (closeCameraBtn) closeCameraBtn.addEventListener("click", closeCamera);
if (analyzeBtn) analyzeBtn.addEventListener("click", toggleAnalysis);


// ==================== INIT ====================
loadModel();
loadTheme();
renderHistorico();
