const QPATH = './questions.json';
const svgNS = 'http://www.w3.org/2000/svg';

let questions = [];
let idx = 0;
let score = 0;
let answered = false;

async function loadQuestions() {
  const res = await fetch(QPATH);
  questions = await res.json();
  renderQuestion(0);
}

function renderQuestion(i) {
  idx = i;
  answered = false;

  const q = questions[idx];
  document.getElementById('q-title').textContent = q.title;
  document.getElementById('q-intro').textContent = q.intro;
  document.getElementById('q-cause').textContent = q.cause;
  document.getElementById('q-affects').textContent = q.affects;

  document.getElementById('progress').textContent = `Question ${idx + 1} of ${questions.length}`;
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('feedback').textContent = '';
  document.getElementById('score').textContent = `Score: ${score}/${idx}`;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = idx === questions.length - 1 ? 'Finish' : 'Next';

  renderOptions(q);
  drawScenario(q);
}

function renderOptions(q) {
  const options = document.getElementById('options');
  options.innerHTML = '';

  q.options.forEach((opt, optionIndex) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = opt;
    button.addEventListener('click', () => onSelectOption(optionIndex));
    options.appendChild(button);
  });
}

function onSelectOption(optionIndex) {
  if (answered) return;
  answered = true;

  const q = questions[idx];
  const isCorrect = optionIndex === q.answerIndex;
  if (isCorrect) score += 1;

  const optionButtons = Array.from(document.querySelectorAll('.option-btn'));
  optionButtons.forEach((button, i) => {
    button.disabled = true;
    if (i === q.answerIndex) button.classList.add('correct');
    else if (i === optionIndex && !isCorrect) button.classList.add('wrong');
  });

  const feedback = document.getElementById('feedback');
  feedback.textContent = `${isCorrect ? 'Correct.' : 'Not quite.'} ${q.explanation}`;
  document.getElementById('score').textContent = `Score: ${score}/${idx + 1}`;
  document.getElementById('next-btn').disabled = false;
}

function drawScenario(q) {
  const svg = document.getElementById('fbd');
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const defs = document.createElementNS(svgNS, 'defs');
  const marker = document.createElementNS(svgNS, 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', 'M0,0 L6,3 L0,6 L2,3 z');
  path.setAttribute('fill', '#60a5fa');
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const cx = 400;
  const cy = 300;

  drawContextScene(svg, q.scenario);
  drawObject(svg, cx, cy);
  drawVectors(svg, cx, cy, q.vectors || []);
}

function drawContextScene(svg, scenario) {
  if (scenario === 'box_on_floor' || scenario === 'book_on_table') {
    const ground = document.createElementNS(svgNS, 'line');
    ground.setAttribute('x1', '100');
    ground.setAttribute('y1', '340');
    ground.setAttribute('x2', '700');
    ground.setAttribute('y2', '340');
    ground.setAttribute('stroke', '#64748b');
    ground.setAttribute('stroke-width', '4');
    svg.appendChild(ground);
  }

  if (scenario === 'hanging_mass') {
    const support = document.createElementNS(svgNS, 'line');
    support.setAttribute('x1', '400');
    support.setAttribute('y1', '80');
    support.setAttribute('x2', '400');
    support.setAttribute('y2', '255');
    support.setAttribute('stroke', '#94a3b8');
    support.setAttribute('stroke-width', '4');
    svg.appendChild(support);
  }

  if (scenario === 'falling_ball') {
    const hint = document.createElementNS(svgNS, 'text');
    hint.setAttribute('x', '120');
    hint.setAttribute('y', '80');
    hint.setAttribute('fill', '#9fb0c8');
    hint.setAttribute('font-size', '18');
    hint.textContent = 'Free fall (air resistance ignored)';
    svg.appendChild(hint);
  }
}

function drawObject(svg, cx, cy) {
  const box = document.createElementNS(svgNS, 'rect');
  box.setAttribute('x', String(cx - 35));
  box.setAttribute('y', String(cy - 28));
  box.setAttribute('width', '70');
  box.setAttribute('height', '56');
  box.setAttribute('class', 'object');
  svg.appendChild(box);
}

function drawVectors(svg, cx, cy, vectors) {
  vectors.forEach((v) => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', String(cx));
    line.setAttribute('y1', String(cy));
    line.setAttribute('x2', String(cx + v.x));
    line.setAttribute('y2', String(cy + v.y));
    line.setAttribute('class', 'arrow');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(cx + v.x + 8));
    label.setAttribute('y', String(cy + v.y + (v.y >= 0 ? 14 : -6)));
    label.setAttribute('fill', '#bfdbfe');
    label.setAttribute('font-size', '18');
    label.textContent = v.name;
    svg.appendChild(label);
  });
}

document.getElementById('next-btn').addEventListener('click', () => {
  if (!answered) return;

  if (idx < questions.length - 1) {
    renderQuestion(idx + 1);
    return;
  }

  const feedback = document.getElementById('feedback');
  feedback.textContent = `Quiz complete. Final score: ${score}/${questions.length}.`;
  document.getElementById('next-btn').disabled = true;
  document.getElementById('score').textContent = `Score: ${score}/${questions.length}`;
});

window.addEventListener('load', loadQuestions);
