// Live editor for the example section. Edits to the .hvis source redraw the
// diagram in the browser, and boxes can be dragged. Everything runs on the
// HyperVisual engine compiled to WebAssembly in engine/; nothing is sent
// anywhere. Without JavaScript the section keeps the pre-rendered diagram.
import initEngine, {
  analyze_hvis as analyzeHvis,
  render_svg_scene as renderSvgScene,
  update_scene_interaction as updateSceneInteraction,
} from './engine/hvis_core.js';

const REDRAW_DELAY_MS = 150;

// The example that is already in the editor's HTML.
const PAGE_EXAMPLE_FILE = 'assets/checkout-sequence.hvis';

const liveEditor = document.querySelector('[data-live-editor]');
if (liveEditor) {
  startLiveEditor(liveEditor);
}

async function startLiveEditor(root) {
  const input = root.querySelector('[data-editor-input]');
  const highlight = root.querySelector('[data-editor-highlight]');
  const status = root.querySelector('[data-editor-status]');
  const resetButton = root.querySelector('[data-editor-reset]');
  const diagram = root.querySelector('[data-diagram]');
  const diagramNote = root.querySelector('[data-diagram-note]');
  const fileName = root.querySelector('[data-editor-filename]');
  // The diagram type cards further down the page, each naming its example file.
  const typeCards = [...document.querySelectorAll('[data-example-file]')];
  const typesHint = document.querySelector('[data-types-hint]');
  const darkColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Example sources already fetched, by file. defaultValue is the textarea's
  // original text, even if the browser restored an edited one.
  const exampleSources = new Map([[PAGE_EXAMPLE_FILE, input.defaultValue]]);
  // The example in the editor; Reset goes back to it.
  let currentExampleSource = input.defaultValue;

  // The scene is the engine's description of the drawn diagram: every box
  // with its position and size, and every arrow with its points.
  let drawnScene = null;
  let redrawTimer = null;
  let activeDrag = null;

  setStatus('Loading the diagram engine…');
  try {
    await initEngine({ module_or_path: new URL('./engine/hvis_core_bg.wasm', import.meta.url) });
  } catch (error) {
    setStatus('The live editor could not load, so the diagram above is pre-rendered.');
    console.error(error);
    return;
  }

  root.classList.add('is-live');
  resetButton.hidden = false;
  for (const card of typeCards) {
    card.disabled = false;
    card.setAttribute('aria-pressed', String(card.dataset.exampleFile === PAGE_EXAMPLE_FILE));
    card.addEventListener('click', () => openExampleFromCard(card));
  }
  if (typesHint) {
    typesHint.hidden = false;
  }
  fitEditorToSource();
  redrawFromSource();

  input.addEventListener('input', () => {
    // Keep the colours and height in step with every keystroke; redraw after a pause.
    highlight.innerHTML = highlightSource(input.value, new Set());
    fitEditorToSource();
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(redrawFromSource, REDRAW_DELAY_MS);
  });
  input.addEventListener('scroll', () => {
    highlight.parentElement.scrollTop = input.scrollTop;
    highlight.parentElement.scrollLeft = input.scrollLeft;
  });
  resetButton.addEventListener('click', () => showSource(currentExampleSource));
  root.addEventListener('animationend', () => root.classList.remove('is-switching'));
  darkColorScheme.addEventListener('change', redrawFromSource);

  diagram.addEventListener('pointerdown', startDrag);
  diagram.addEventListener('pointermove', (event) => {
    if (activeDrag) {
      continueDrag(event);
    } else {
      showGrabCursorOverNodes(event);
    }
  });
  diagram.addEventListener('pointerup', finishDrag);
  diagram.addEventListener('pointercancel', finishDrag);

  async function openExampleFromCard(card) {
    const file = card.dataset.exampleFile;
    for (const otherCard of typeCards) {
      otherCard.setAttribute('aria-pressed', String(otherCard === card));
    }

    let source = exampleSources.get(file);
    if (source === undefined) {
      setStatus('Loading the example…');
      try {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        source = await response.text();
      } catch (error) {
        setStatus('That example could not be loaded.');
        console.error(error);
        return;
      }
      exampleSources.set(file, source);
    }
    // If another card was clicked while this example was loading, that later
    // click wins.
    if (card.getAttribute('aria-pressed') !== 'true') {
      return;
    }
    currentExampleSource = source;
    fileName.textContent = file.split('/').pop();
    showSource(source);
    // Scroll only after the new diagram is drawn: it changes the window's
    // height, and scrolling first would aim at the old layout.
    root.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    pulseEditorWindow();
  }

  function showSource(source) {
    clearTimeout(redrawTimer);
    input.value = source;
    input.scrollTop = 0;
    input.scrollLeft = 0;
    fitEditorToSource();
    redrawFromSource();
  }

  function pulseEditorWindow() {
    root.classList.remove('is-switching');
    // Reading the width restarts the animation when the class is re-added.
    void root.offsetWidth;
    root.classList.add('is-switching');
  }

  function redrawFromSource() {
    const source = input.value;
    let analysis;
    try {
      analysis = analyzeHvis(source, { theme: currentTheme() });
    } catch (error) {
      analysis = { ok: false, diagnostics: [{ severity: 'Error', message: String(error) }] };
    }

    const errors = analysis.diagnostics.filter((diagnostic) => isError(diagnostic.severity));
    const errorLines = new Set(errors.map(diagnosticLine).filter((line) => line !== null));
    highlight.innerHTML = highlightSource(source, errorLines);

    if (errors.length > 0) {
      setErrorStatus(errors[0]);
    } else {
      setOkStatus('No syntax errors. Drag the boxes to move them.');
    }

    if (analysis.ok && analysis.scene) {
      drawnScene = analysis.scene;
      drawScene(drawnScene);
      diagramNote.hidden = true;
    } else {
      // Keep the last diagram that worked instead of blanking it mid-typing.
      diagramNote.hidden = drawnScene === null;
    }
  }

  function drawScene(scene, fixedViewBox = null) {
    diagram.innerHTML = renderSvgScene(scene, { theme: currentTheme() });
    const svg = diagram.querySelector('svg');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${scene.name} diagram`);
    if (fixedViewBox) {
      svg.setAttribute('viewBox', fixedViewBox);
    }
    // The engine paints a full-size background rectangle. Giving the panel
    // the same colour hides the edges of the drawing inside the panel.
    const background = svg.querySelector(':scope > rect');
    diagram.style.background = background ? background.getAttribute('fill') : '';
  }

  function fitEditorToSource() {
    input.parentElement.style.setProperty('--editor-lines', input.value.split('\n').length);
  }

  function startDrag(event) {
    if (!drawnScene || event.button !== 0) {
      return;
    }
    const svg = diagram.querySelector('svg');
    // Pointer positions are converted with the drag-start transform, so the
    // box follows the pointer even if the redrawn diagram changes size.
    const screenToDiagram = svg.getScreenCTM().inverse();
    const pointerStart = toDiagramPoint(event, screenToDiagram);
    const node = draggableNodeAt(drawnScene, pointerStart);
    if (!node) {
      return;
    }
    event.preventDefault();
    diagram.setPointerCapture(event.pointerId);
    diagram.classList.add('is-dragging');
    activeDrag = {
      nodeId: node.id,
      nodeStartX: node.x,
      nodeStartY: node.y,
      pointerStart,
      screenToDiagram,
      sceneAtStart: drawnScene,
      viewBoxAtStart: svg.getAttribute('viewBox'),
      latestScene: drawnScene,
      redrawQueued: false,
      latestPointer: pointerStart,
    };
  }

  function continueDrag(event) {
    activeDrag.latestPointer = toDiagramPoint(event, activeDrag.screenToDiagram);
    if (activeDrag.redrawQueued) {
      return;
    }
    // One engine update per frame, however fast the pointer moves.
    activeDrag.redrawQueued = true;
    requestAnimationFrame(() => {
      if (!activeDrag) {
        return;
      }
      activeDrag.redrawQueued = false;
      activeDrag.latestScene = moveNode(activeDrag, 'move');
      drawScene(activeDrag.latestScene, activeDrag.viewBoxAtStart);
    });
  }

  function finishDrag(event) {
    if (!activeDrag) {
      return;
    }
    if (event.type === 'pointerup') {
      activeDrag.latestPointer = toDiagramPoint(event, activeDrag.screenToDiagram);
      const movedDistance = Math.hypot(
        activeDrag.latestPointer.x - activeDrag.pointerStart.x,
        activeDrag.latestPointer.y - activeDrag.pointerStart.y,
      );
      // A plain click leaves the diagram exactly as it was.
      const boxWasMoved = movedDistance >= 1;
      drawnScene = boxWasMoved ? moveNode(activeDrag, 'end') : activeDrag.sceneAtStart;
    } else {
      drawnScene = activeDrag.latestScene;
    }
    activeDrag = null;
    diagram.classList.remove('is-dragging');
    drawScene(drawnScene);
  }

  function moveNode(drag, phase) {
    // Always move from the drag-start scene, so each update is "this box,
    // this far from where it started" rather than an accumulation of steps.
    return updateSceneInteraction(drag.sceneAtStart, {
      type: 'dragNode',
      nodeId: drag.nodeId,
      x: drag.nodeStartX + (drag.latestPointer.x - drag.pointerStart.x),
      y: drag.nodeStartY + (drag.latestPointer.y - drag.pointerStart.y),
      phase,
    });
  }

  function showGrabCursorOverNodes(event) {
    const svg = diagram.querySelector('svg');
    if (!drawnScene || !svg) {
      return;
    }
    const point = toDiagramPoint(event, svg.getScreenCTM().inverse());
    diagram.classList.toggle('is-over-node', draggableNodeAt(drawnScene, point) !== null);
  }

  // The status bar's dot is grey for plain messages, green for setOkStatus
  // and red for setErrorStatus (see .editor-status in styles.css).
  function setStatus(message) {
    status.classList.remove('is-error', 'is-ok');
    status.textContent = message;
  }

  function setOkStatus(message) {
    setStatus(message);
    status.classList.add('is-ok');
  }

  function setErrorStatus(diagnostic) {
    status.classList.remove('is-ok');
    status.classList.add('is-error');
    const line = diagnosticLine(diagnostic);
    const column = diagnostic.range?.start_column ?? diagnostic.column ?? null;
    const position = line === null ? '' : column === null ? `Line ${line}: ` : `Line ${line}, column ${column}: `;
    status.textContent = position + diagnostic.message;
    if (diagnostic.hint) {
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = diagnostic.hint;
      status.append(hint);
    }
  }

  function currentTheme() {
    return darkColorScheme.matches ? 'dark' : 'light';
  }
}

function toDiagramPoint(event, screenToDiagram) {
  return new DOMPoint(event.clientX, event.clientY).matrixTransform(screenToDiagram);
}

// The smallest draggable box under the point, so a box inside a group is
// picked rather than the group around it.
function draggableNodeAt(scene, point) {
  let best = null;
  for (const node of scene.nodes) {
    const containsPoint = point.x >= node.x && point.x <= node.x + node.width
      && point.y >= node.y && point.y <= node.y + node.height;
    if (node.draggable && containsPoint && (!best || node.width * node.height < best.width * best.height)) {
      best = node;
    }
  }
  return best;
}

function isError(severity) {
  const normalized = String(severity).toLowerCase();
  return normalized === 'error' || normalized === 'critical';
}

function diagnosticLine(diagnostic) {
  return diagnostic.range?.start_line ?? diagnostic.line ?? null;
}

// Colours for .hvis source. A rough line-by-line highlighter, not a parser:
// it only has to make the structure easy to read.
const TOKEN_PATTERN = new RegExp([
  String.raw`(?<comment>(?:^|(?<=\s))#.*$)`,
  String.raw`(?<string>"(?:[^"\\]|\\.)*"?)`,
  String.raw`(?<name>[A-Za-z_][\w.-]*)(?<type>\[[^\]\n]*\]?)`,
  String.raw`(?<arrow>(?<=\s)(?:<-->|<->|<--|-->|<-|->|\.\.>|<\.\.)(?=\s|:|$))`,
  String.raw`(?<keyword>(?<=^\s*-\s+)[a-z][a-z-]*(?=\s))`,
  String.raw`(?<key>[A-Za-z_][\w-]*)(?=:(?:\s|$))`,
  String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
].join('|'), 'g');

function highlightSource(source, errorLines) {
  const lines = source.split('\n').map((line, index) => {
    const highlighted = highlightLine(line);
    return errorLines.has(index + 1) ? `<span class="line-error">${highlighted}</span>` : highlighted;
  });
  // A trailing newline in a textarea still shows an empty last line; the
  // extra space keeps the highlighted copy the same height.
  return lines.join('\n') + '\n ';
}

function highlightLine(line) {
  let html = '';
  let position = 0;
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    html += escapeHtml(line.slice(position, match.index));
    html += tokenHtml(match.groups);
    position = match.index + match[0].length;
  }
  return html + escapeHtml(line.slice(position));
}

function tokenHtml(groups) {
  if (groups.name !== undefined) {
    return span('name', groups.name) + span('type', groups.type);
  }
  for (const kind of ['comment', 'string', 'arrow', 'keyword', 'key', 'number']) {
    if (groups[kind] !== undefined) {
      return span(kind, groups[kind]);
    }
  }
  return '';
}

function span(kind, text) {
  return `<span class="token-${kind}">${escapeHtml(text)}</span>`;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
