const MODEL_BASE_URL = "https://teachablemachine.withgoogle.com/models/z0D_MSc4-/";

let model;
let selectedFiles = [];

const batchInput = document.getElementById("batchInput");
const dropZone = document.getElementById("dropZone");
const analyzeAllBtn = document.getElementById("analyzeAllBtn");
const batchStatus = document.getElementById("batchStatus");
const batchResults = document.getElementById("batchResults");

function normalizeClassName(name) {
  return String(name).toLowerCase().replace(/[^a-z]/g, "");
}

function isNoTumourClass(name) {
  const normalized = normalizeClassName(name);
  return normalized === "notumour" || normalized === "notumor";
}

function updateAnalyzeButtonState() {
  analyzeAllBtn.disabled = !(model && selectedFiles.length > 0);
}

async function init() {
  try {
    const modelURL = `${MODEL_BASE_URL}model.json`;
    const metadataURL = `${MODEL_BASE_URL}metadata.json`;
    model = await tmImage.load(modelURL, metadataURL);
    batchStatus.textContent = "Model loaded. Select MRI images to begin.";
    updateAnalyzeButtonState();
  } catch (error) {
    batchStatus.textContent = "Failed to load model. Please refresh and try again.";
    console.error(error);
  }
}

function onFilesSelected(event) {
  setSelectedFiles(event.target.files || []);
}

function setSelectedFiles(fileList) {
  selectedFiles = Array.from(fileList);

  if (selectedFiles.length === 0) {
    batchResults.innerHTML = '<p id="batchPlaceholder">No images selected yet.</p>';
    batchStatus.textContent = model
      ? "Model ready. Select MRI images to analyze."
      : "Loading model...";
    updateAnalyzeButtonState();
    return;
  }

  batchStatus.textContent = `${selectedFiles.length} image(s) selected. Click Analyze All Images.`;
  batchResults.innerHTML = "";
  updateAnalyzeButtonState();
}

function openFilePicker() {
  batchInput.click();
}

function onDropZoneKeyDown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openFilePicker();
  }
}

function preventDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}

function onDragEnter(event) {
  preventDefault(event);
  dropZone.classList.add("drag-active");
}

function onDragOver(event) {
  preventDefault(event);
  dropZone.classList.add("drag-active");
}

function onDragLeave(event) {
  preventDefault(event);
  dropZone.classList.remove("drag-active");
}

function onDrop(event) {
  preventDefault(event);
  dropZone.classList.remove("drag-active");

  const droppedFiles = event.dataTransfer?.files;
  if (!droppedFiles || droppedFiles.length === 0) return;

  const imageFiles = Array.from(droppedFiles).filter((file) => file.type.startsWith("image/"));
  setSelectedFiles(imageFiles);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    image.src = imageUrl;
  });
}

function classifyLabel(className) {
  return isNoTumourClass(className) ? "No Tumour Detected" : className;
}

function buildSortedDisplay(predictions) {
  const byProbability = [...predictions].sort((a, b) => b.probability - a.probability);
  const displayOrder = [...byProbability].sort((a, b) => {
    if (isNoTumourClass(a.className) && !isNoTumourClass(b.className)) return 1;
    if (!isNoTumourClass(a.className) && isNoTumourClass(b.className)) return -1;
    return b.probability - a.probability;
  });

  return { byProbability, displayOrder };
}

function createResultCard(file, imageUrl, topPrediction, displayOrder) {
  const card = document.createElement("article");
  card.className = "batch-card";

  const header = document.createElement("div");
  header.className = "batch-card-header";
  header.innerHTML = `
    <h3>${file.name}</h3>
    <p>Most likely: <strong>${classifyLabel(topPrediction.className)}</strong> (${(topPrediction.probability * 100).toFixed(2)}%)</p>
  `;

  const preview = document.createElement("img");
  preview.className = "batch-preview";
  preview.src = imageUrl;
  preview.alt = `MRI preview for ${file.name}`;

  const labels = document.createElement("div");
  labels.className = "labels";

  for (const item of displayOrder) {
    const probabilityPercent = (item.probability * 100).toFixed(2);
    const row = document.createElement("div");
    row.className = "prediction-item";
    row.innerHTML = `
      <div class="prediction-head">
        <span class="prediction-name">${classifyLabel(item.className)}</span>
        <strong>${probabilityPercent}%</strong>
      </div>
      <div class="confidence-bar-track" role="presentation">
        <div class="confidence-bar-fill" style="width:${probabilityPercent}%"></div>
      </div>
    `;
    labels.appendChild(row);
  }

  card.appendChild(header);
  card.appendChild(preview);
  card.appendChild(labels);

  return card;
}

async function analyzeAllImages() {
  if (!model || selectedFiles.length === 0) return;

  analyzeAllBtn.disabled = true;
  batchStatus.textContent = `Analyzing ${selectedFiles.length} image(s)...`;
  batchResults.innerHTML = "";

  try {
    const cards = await Promise.all(
      selectedFiles.map(async (file) => {
        const imageElement = await loadImageFromFile(file);
        const predictions = await model.predict(imageElement);
        const { byProbability, displayOrder } = buildSortedDisplay(predictions);

        const cardImageUrl = URL.createObjectURL(file);
        const card = createResultCard(file, cardImageUrl, byProbability[0], displayOrder);
        return card;
      })
    );

    for (const card of cards) {
      batchResults.appendChild(card);
    }

    batchStatus.textContent = `Analysis complete for ${selectedFiles.length} image(s).`;
  } catch (error) {
    batchStatus.textContent = "Batch analysis failed. Please try different images.";
    console.error(error);
  } finally {
    updateAnalyzeButtonState();
  }
}

batchInput.addEventListener("change", onFilesSelected);
analyzeAllBtn.addEventListener("click", analyzeAllImages);
dropZone.addEventListener("click", openFilePicker);
dropZone.addEventListener("keydown", onDropZoneKeyDown);
dropZone.addEventListener("dragenter", onDragEnter);
dropZone.addEventListener("dragover", onDragOver);
dropZone.addEventListener("dragleave", onDragLeave);
dropZone.addEventListener("drop", onDrop);

init();
