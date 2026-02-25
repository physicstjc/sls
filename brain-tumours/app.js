const MODEL_BASE_URL = "https://teachablemachine.withgoogle.com/models/z0D_MSc4-/";

let model;
let maxPredictions = 0;

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const placeholderText = document.getElementById("placeholderText");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusText = document.getElementById("statusText");
const topPrediction = document.getElementById("topPrediction");
const caseWriteup = document.getElementById("caseWriteup");
const labelContainer = document.getElementById("label-container");

function normalizeClassName(name) {
  return String(name).toLowerCase().replace(/[^a-z]/g, "");
}

function isNoTumourClass(name) {
  const normalized = normalizeClassName(name);
  return normalized === "notumour" || normalized === "notumor";
}

function getCaseWriteup(className) {
  const normalized = normalizeClassName(className);

  if (normalized.includes("pituitary")) {
    return "Most likely case suggests a pituitary tumour pattern. Pituitary tumours arise near the pituitary gland and may be associated with headaches, visual disturbance, or hormonal changes. Correlate this screening output with formal radiology review and endocrinology/neurology assessment.";
  }

  if (normalized.includes("glioma")) {
    return "Most likely case suggests a glioma pattern. Gliomas are tumours that develop from glial cells and can vary from low to high grade. Clinical confirmation typically requires specialist imaging interpretation and, when indicated, histopathology.";
  }

  if (normalized.includes("meningioma")) {
    return "Most likely case suggests a meningioma pattern. Meningiomas arise from the meninges and are often slow-growing, though behavior differs between cases. Neurosurgical or neuro-oncology review is needed to confirm diagnosis and guide management.";
  }

  if (isNoTumourClass(className)) {
    return "Most likely case suggests no tumour pattern on this image. This tool is a screening aid only, so medical follow-up is still important if symptoms or clinician concern persist.";
  }

  return "Most likely case has been identified by the model. Please treat this as AI-assisted screening output and confirm with specialist clinical evaluation.";
}

async function init() {
  try {
    const modelURL = `${MODEL_BASE_URL}model.json`;
    const metadataURL = `${MODEL_BASE_URL}metadata.json`;

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    statusText.textContent = "Model loaded. Upload an image to begin.";
    updateAnalyzeButtonState();
  } catch (error) {
    statusText.textContent = "Failed to load model. Please refresh and try again.";
    console.error(error);
  }
}

function updateAnalyzeButtonState() {
  analyzeBtn.disabled = !(model && previewImage.src);
}

function clearPredictions() {
  labelContainer.innerHTML = "";
  topPrediction.textContent = "No prediction yet";
  caseWriteup.textContent = "A short case write-up will appear after analysis.";
}

function handleImageSelection(event) {
  const file = event.target.files?.[0];

  clearPredictions();

  if (!file) {
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    placeholderText.hidden = false;
    statusText.textContent = model
      ? "Model ready. Upload an image to analyze."
      : "Loading model...";
    updateAnalyzeButtonState();
    return;
  }

  const imageURL = URL.createObjectURL(file);
  previewImage.src = imageURL;
  previewImage.hidden = false;
  placeholderText.hidden = true;
  statusText.textContent = "Image ready. Click Analyze Image.";
  updateAnalyzeButtonState();
}

async function predict() {
  if (!model || !previewImage.src) return;

  statusText.textContent = "Analyzing image...";
  analyzeBtn.disabled = true;

  try {
    const prediction = await model.predict(previewImage);
    const sortedByProbability = [...prediction].sort((a, b) => b.probability - a.probability);
    const sortedPrediction = [...sortedByProbability].sort((a, b) => {
      if (isNoTumourClass(a.className) && !isNoTumourClass(b.className)) return 1;
      if (!isNoTumourClass(a.className) && isNoTumourClass(b.className)) return -1;
      return b.probability - a.probability;
    });

    labelContainer.innerHTML = "";

    for (let i = 0; i < Math.min(maxPredictions, sortedPrediction.length); i += 1) {
      const item = sortedPrediction[i];
      const probabilityPercent = (item.probability * 100).toFixed(2);
      const row = document.createElement("div");
      row.className = "prediction-item";
      row.innerHTML = `
        <div class="prediction-head">
          <span class="prediction-name">${item.className}</span>
          <strong>${probabilityPercent}%</strong>
        </div>
        <div class="confidence-bar-track" role="presentation">
          <div class="confidence-bar-fill" style="width:${probabilityPercent}%"></div>
        </div>
      `;
      labelContainer.appendChild(row);
    }

    const bestPrediction = sortedByProbability[0];
    topPrediction.textContent = `Most likely: ${bestPrediction.className} (${(bestPrediction.probability * 100).toFixed(2)}%)`;
    caseWriteup.textContent = getCaseWriteup(bestPrediction.className);
    statusText.textContent = "Prediction complete.";
  } catch (error) {
    statusText.textContent = "Prediction failed. Try a different image.";
    console.error(error);
  } finally {
    updateAnalyzeButtonState();
  }
}

imageInput.addEventListener("change", handleImageSelection);
analyzeBtn.addEventListener("click", predict);

init();
