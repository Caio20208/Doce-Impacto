const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const statusBox = document.getElementById("status");
const detailsBox = document.getElementById("details");
const openCameraBtn = document.getElementById("openCamera");
const analyzeBtn = document.getElementById("analyze");

let model;
let isAnalyzing = false;
const MODEL_URL = "./model/";

async function loadModel() {
  try {
    statusBox.textContent = "Carregando IA...";

    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    console.log("Carregando:", modelURL, metadataURL);
    console.log("tmImage:", typeof tmImage);
    console.log("tf:", typeof tf);

    model = await tmImage.load(modelURL, metadataURL);

    console.log("Modelo carregado:", model);
    statusBox.textContent = "IA carregada com sucesso.";
    detailsBox.textContent = "Pronta para análise em tempo real.";
  } catch (error) {
    console.error("Erro ao carregar modelo:", error);
    statusBox.textContent = "Erro ao carregar modelo.";
    detailsBox.textContent = "Verifique os arquivos da pasta model.";
  }
}

async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    statusBox.textContent = "Câmera aberta.";
    detailsBox.textContent = "Posicione o doce na frente da câmera.";
  } catch (error) {
    console.error("Erro ao acessar câmera:", error);
    statusBox.textContent = "Erro ao acessar câmera.";
    detailsBox.textContent = "Verifique a permissão de acesso.";
  }
}

function updateStatusStyle(className) {
  const name = className.toLowerCase();

  if (name.includes("boa") || name.includes("bom")) {
    statusBox.style.background = "#d4edda";
    statusBox.style.color = "#155724";
    statusBox.style.border = "1px solid #b7dfc6";
  } else if (
    name.includes("estragada") ||
    name.includes("estragado") ||
    name.includes("ruim")
  ) {
    statusBox.style.background = "#f8d7da";
    statusBox.style.color = "#721c24";
    statusBox.style.border = "1px solid #efb8bf";
  } else {
    statusBox.style.background = "#fff3cd";
    statusBox.style.color = "#856404";
    statusBox.style.border = "1px solid #f1df9b";
  }
}

async function loopAnalyze() {
  if (!isAnalyzing) return;

  if (!model) {
    statusBox.textContent = "A IA não foi carregada.";
    detailsBox.textContent = "O modelo precisa carregar antes da análise.";
    isAnalyzing = false;
    analyzeBtn.textContent = "Analisar";
    return;
  }

  if (!video.videoWidth || !video.videoHeight) {
    statusBox.textContent = "Abra a câmera primeiro.";
    detailsBox.textContent = "Sem imagem disponível para análise.";
    isAnalyzing = false;
    analyzeBtn.textContent = "Analisar";
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const predictions = await model.predict(canvas);
    predictions.sort((a, b) => b.probability - a.probability);

    const best = predictions[0];
    const confidence = (best.probability * 100).toFixed(1);

    statusBox.textContent = `Resultado: ${best.className}`;
    detailsBox.textContent = `Confiança: ${confidence}% | Atualização em tempo real`;
    updateStatusStyle(best.className);
  } catch (error) {
    console.error("Erro na análise:", error);
    statusBox.textContent = "Erro na análise.";
    detailsBox.textContent = "Ocorreu uma falha ao processar a imagem.";
  }

  setTimeout(loopAnalyze, 500);
}

function toggleAnalysis() {
  if (isAnalyzing) {
    isAnalyzing = false;
    analyzeBtn.textContent = "Analisar";
    statusBox.textContent = "Análise pausada.";
    detailsBox.textContent = "Clique em analisar para retomar.";
    statusBox.style.background = "linear-gradient(135deg, #f8fafc, #eef2ff)";
    statusBox.style.color = "#111827";
    statusBox.style.border = "1px solid rgba(99, 102, 241, 0.12)";
    return;
  }

  if (!model) {
    statusBox.textContent = "A IA não foi carregada.";
    detailsBox.textContent = "Aguarde o carregamento do modelo.";
    return;
  }

  if (!video.videoWidth || !video.videoHeight) {
    statusBox.textContent = "Abra a câmera primeiro.";
    detailsBox.textContent = "Sem câmera, sem análise. Triste, mas previsível.";
    return;
  }

  isAnalyzing = true;
  analyzeBtn.textContent = "Parar análise";
  statusBox.textContent = "Analisando em tempo real...";
  detailsBox.textContent = "Processando imagem continuamente...";
  loopAnalyze();
}

openCameraBtn.addEventListener("click", openCamera);
analyzeBtn.addEventListener("click", toggleAnalysis);

loadModel();