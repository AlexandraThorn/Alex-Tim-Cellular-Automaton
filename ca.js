// Definitions:
//
// - pos: A world position [x, y] -- cell coordinates, rather than pixel coordinates
// - data: Cell data, a map that contains at least a 'type' field ("air", "sand", etc.)
// - cell: A position and its contents, as {pos, data}

"use strict";


// ==== General utilities ==== //

// Return a shuffled copy of an array.
function shuffled(array) {
    // Slower than Fisher-Yates, but good enough for precomputation.
    return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

// Make an array [0, len).
function range(len) {
    // stupid JS hacks
    return Array.from(new Array(len), (_, i) => i);
}

// Pick a random element from the array. Assumes non-empty.
function pickRandom(array) {
    return array[Math.floor(array.length * Math.random())];
}

// ==== DOM references ==== //

// Play/pause button
const ctrlPlayPause = document.getElementById("play-pause");
// Stepper-mode checkbox control
const cntrlStepToggle = document.getElementById('step-toggle');
const inspectorNode = document.getElementById('inspector');

// The canvas on which we project the world.
const canvas = document.getElementById("world");
// Interface for drawing on the canvas.
const ctx = canvas.getContext('2d');


// ==== World settings ==== //

// Size of world, in cells
const cols = 50;
const rows = 50;

// Size of cells, in pixels
const cellSize = 8;


// ==== World and accessors ==== //

// Column/x, then row/y. Initialized later.
var world = [];

// Coordinate transform from DOM event to cell position.
function canvasToPos(evt) {
    var posX = Math.floor(evt.offsetX / cellSize);
    var posY = Math.floor(evt.offsetY / cellSize);
    return [posX, posY];
}


// ==== Reloadable settings ==== //

// This will actually be overwritten by config.js; it's just declared here to
// have there be something for a search to find.
// See config.js for the actual value and documention.

let elements = undefined;
let clearElement = undefined;
let defaultSelection = undefined;


// ==== Interactively drawing on the canvas ==== //

// Draw this element type on the indicated position.
function drawElement(pos, type) {
    const data = {type};
    const initializer = elements[type].initialize;
    if (initializer)
        initializer(data);
    set(pos, data);
}

// Draw on the canvas, or step, due to a click.
function doCanvasClick(evt) {
    if (evt.target != canvas) return;
    if (isStepping) {
        stepCell(canvasToPos(evt));
    } else {
        drawElement(canvasToPos(evt), selectedElementType);
    }
}

// Draw on the canvas due to a mouse drag.
function doCanvasMousemove(evt) {
    if (evt.target != canvas) return;

    const pos = canvasToPos(evt)
    inspectorNode.textContent = `${pos[0]}, ${pos[1]}: ` + JSON.stringify(get(pos).data);

    if (isStepping) return;
    if ((evt.buttons & 1) == 0) return; // only left/main button
    drawElement(pos, selectedElementType);
}


// ==== Direction logic ==== //

// Relative directions. These can be passed to look() and swap()
// and to rotation and reflection functions.
var east =      [+1,  0];
var northeast = [+1, -1];
var north =     [ 0, -1];
var northwest = [-1, -1];
var west =      [-1,  0];
var southwest = [-1, +1];
var south =     [ 0, +1];
var southeast = [+1, +1];

// Rotations and reflections.
//
// In your updater, write `const r = randomHorizontal()` to get a random
// horizontal reflection. If you want to look either east or west, just
// use `r(east)`, and it will always return east *or* always return west
// for the duration of this iteration.
//
// If you instead want to check both east *and* west, loop over all horizontal
// reflections (in random order) by using `for (const r of randomHorizontalAll())`.

// Horizontal reflections across the y-axis.
const _reflectionsY = [
    function pass(dir) { return dir; },
    function flip([x, y]) { return [-x, y]; },
];
function randomHorizontal() { return pickRandom(_reflectionsY); }
function randomHorizontalAll() { return shuffled(_reflectionsY); }

// Vertical reflections across the x-axis.
const _reflectionsX = [
    function pass(dir) { return dir; },
    function flip([x, y]) { return [x, -y]; },
];
function randomVertical() { return pickRandom(_reflectionsX); }
function randomVerticalAll() { return shuffled(_reflectionsX); }

// All four rotations by a quarter-turn. Useful for when you're looking at
// all edge-neighbors or all corner-neighbors.
const _rotations4 = [
    function r40(dir) { return dir; },
    function r41([x, y]) { return [y, -x]; },
    function r42([x, y]) { return [-x, -y]; },
    function r43([x, y]) { return [-y, x]; },
];
function randomRotateQuarter() { return pickRandom(_rotations4); }
function randomRotateQuarterAll() { return shuffled(_rotations4); }

// All four rotations by a quarter-turn, mirrored (8 in total).
// Useful if you're looking at the three neightbors around some corner,
// in any orientation.
const _mirrorRotate8 = [
    function mr80a([x, y]) { return [ x,  y]; },
    function mr80b([x, y]) { return [-x,  y]; },
    function mr81a([x, y]) { return [ y, -x]; },
    function mr81b([x, y]) { return [-y, -x]; },
    function mr82a([x, y]) { return [-x, -y]; },
    function mr82b([x, y]) { return [ x, -y]; },
    function mr83a([x, y]) { return [-y,  x]; },
    function mr83b([x, y]) { return [ y,  x]; },
];
function randomMirrorRotate() { return pickRandom(_mirrorRotate8); }
function randomMirrorRotateAll() { return shuffled(_mirrorRotate8); }


// Move in the indicated direction from the position, returning the new position.
function follow(pos, dir) {
    let [x, y] = pos;
    x += dir[0];
    y += dir[1];
    return [x, y];
}


// ==== World accessors ==== //

// Ask a cell to redraw itself. Called when this position in the world
// has been changed and the canvas needs to be updated to reflect it.
function redrawCell(data, pos) {
    const [x, y] = pos;
    elements[data.type].draw(data, x * cellSize, y * cellSize);
}

// Is this a legal position in the world?
function inWorld(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

// Get a cell {pos, data} from a position.
function get(pos) {
    const [x, y] = pos;
    if (inWorld(x, y)) {
        return {pos, data: world[x][y]};
    } else {
        // Synthetic return value representing off-world coordinates.
        return {pos, data: {type: 'edge'}};
    }
}

// Retrieve a cell in the given direction from this position.
function look(pos, dir) {
    return get(follow(pos, dir));
}

// Set a position to this cell data, and redraw it.
function set(pos, data) {
    const [x, y] = pos;
    world[x][y] = data;
    redrawCell(data, pos);
}

// Swap these two positions.
function swap(pos1, pos2) {
    if (pos1[0] == pos2[0] && pos1[1] == pos2[1])
        throw Error("Tried to swap cell into itself");
    var cell1 = get(pos1);
    var cell2 = get(pos2);
    set(pos1, cell2.data);
    set(pos2, cell1.data);
}

// Return any cell within 1 step, including diagonals and current position.
function anyNeighborhood9(pos) {
    const [x, y] = pos;
    const hr = Math.floor(Math.random() * 3) - 1;
    const vr = Math.floor(Math.random() * 3) - 1;
    return get([
        Math.min(Math.max(x + hr, 0), cols),
        Math.min(Math.max(y + vr, 0), rows)
    ]);
}


// ==== Rendering helpers ==== //

// Convert color specified as hue, saturation, and luminance into an rgb
// string suitable for canvas. All inputs are in range [0, 1].
//
// Based on https://stackoverflow.com/questions/67220568/hsb-color-fill-in-javascript-canvas
function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    return `rgb(${r},${g},${b})`;
}


// ==== Cell-visiting ==== //

// Get an array of all [x, y] positions in the world.
function allPositions() {
    return range(cols).flatMap(x => range(rows).map(y => [x, y]));
}

// An array of visit-orders. Each visit-order is a pre-randomized array of all of the
// positions in the world. Following one of the visit-orders when updating the
// world ensures we visit every cell, but in a way that doesn't introduce global
// bias, and without having to randomize the ordering every single time. We
// probably want to pick a random visit-order for each iteration.
var visitOrders = precomputeVisitOrders();

// Precompute a handful of randomized orderings of all cell positions.
function precomputeVisitOrders() {
    const all = allPositions();
    return Array.from(new Array(10), _ => shuffled(all));
}


// ==== Core loop ==== //

// Let a single cell take its actions.
function stepCell(pos) {
    const [x, y] = pos;
    const data = world[x][y];
    const element = elements[data.type];
    if (element) {
        const act = element['act'];
        if (act) {
            act({pos, data});
        }
    }
}

// Walk over all positions in the world and update them, in some order.
function updateWorld() {
    // Pick a random visit order (list of positions) and walk it,
    // updating those positions.
    pickRandom(visitOrders).forEach(stepCell);
}

// Handle on the world-updating loop. (setInterval/clearInterval).
var runner = null;

// Button handler: Toggle between running/paused.
function doPlayPause() {
    if (runner) {
        // Pause
        clearInterval(runner);
        runner = null;
        ctrlPlayPause.textContent = "Play [p]";
    } else {
        // Play
        runner = setInterval(updateWorld, 100);
        ctrlPlayPause.textContent = "Pause [p]";
    }
}

// Whether stepper-mode is on.
let isStepping = false;

// Response to UI and toggle stepper-mode on and off.
function doStepperToggle() {
    if (cntrlStepToggle.checked) {
        if (runner) {
            // pause if playing
            doPlayPause();
        }
        ctrlPlayPause.disabled = true;
        isStepping = true;
        canvas.classList.add('stepping');
    } else {
        ctrlPlayPause.disabled = false;
        isStepping = false;
        canvas.classList.remove('stepping');
    }
}


// ==== Hot-reloadable config ==== //

// Redraw every cell in the world. Only used when reloading config, not
// during regular updating.
function redrawWorld() {
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            redrawCell(world[x][y], [x, y]);
        }
    }
}

// Keep track of whether element radio buttons were focused, so that we can
// preserve that focus when recreating the buttons.
let elementSelectorHadFocus = false;

// Which element is currently selected for drawing. Will default to first element
// that isn't hidden.
let selectedElementType = null;

// Update the list of element selectors with the current elements
function updateElementSelector() {
    const container = document.getElementById('elements');
    container.querySelectorAll('label.element-label')
        .forEach(el => container.removeChild(el));

    let defaultButton = null;
    let didPreserveSelection = false;
    let selected = null;
    for (const [elType, elAttrs] of Object.entries(elements)) {
        if (elAttrs.hidden) continue

        let elLabel = document.createElement('label');
        elLabel.classList.add('element-label');
        elLabel.style.color = elAttrs.textFgColor || 'black';
        elLabel.style.backgroundColor = elAttrs.textBgColor || 'white';
        let elButton = document.createElement('input');
        elButton.classList.add('element-button');
        elButton.setAttribute('type', 'radio');
        elButton.setAttribute('name', 'draw-element');
        elButton.setAttribute('value', elType);
        elButton.addEventListener('change', (evt) => selectedElementType = evt.target.value);
        elButton.addEventListener('blur', (evt) => elementSelectorHadFocus = false);
        elButton.addEventListener('focus', (evt) => elementSelectorHadFocus = true);
        elLabel.appendChild(elButton);
        elLabel.appendChild(document.createTextNode(elType));
        container.appendChild(elLabel);

        if (elType == selectedElementType) {
            elButton.checked = true;
            didPreserveSelection = true;
            selected = elButton;
        }

        // In case the element is no longer available, respect the
        // defaultSelection, but fall back to the first
        // visible element otherwise.
        if ((defaultSelection == elType) || !defaultButton)
            defaultButton = elButton;
    }

    if (!didPreserveSelection) {
        // The element we were drawing with previously no longer
        // exists (at least under that name), so just switch to the
        // first one that's visible.
        defaultButton.checked = true;
        selectedElementType = defaultButton.value;
        selected = defaultButton;
    }

    if (elementSelectorHadFocus)
        selected.focus();
}

// Called after config has been reloaded, to redraw world and update UI.
function onReloadConfig() {
    // This duplicates initializeStage1 due to a bootstrapping issue.
    updateElementSelector();
    redrawWorld();
}

// Run config.js and all the callback when that's done
function loadConfig(onLoad) {
    const s = document.createElement('script');
    s.id = "config-loader";
    s.src = "config.js?cache-bust=" + new Date().getTime();
    s.addEventListener('load', onLoad);
    document.body.append(s);
    document.body.removeChild(s);
}

// Reload config due to UI event
function doReloadConfig() {
    loadConfig(onReloadConfig);
}


// ==== Initialization ==== //

// Load configuration so we can finish doing UI setup, world creation, etc.
function initializeStage1() {
    loadConfig(() => {
        initializeStage2();
        onReloadConfig();
    });
}

// Set up UI, add listeners, create world, start event loop. Config is loaded
// by this point.
function initializeStage2() {
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    for (var x = 0; x < cols; x++) {
        const row = world[x] = Array(rows);
        for (var y = 0; y < rows; y++) {
            drawElement([x, y], clearElement);
        }
    }

    canvas.addEventListener('click', doCanvasClick);
    canvas.addEventListener('mousemove', doCanvasMousemove);
    canvas.addEventListener('mouseout', evt => inspectorNode.textContent = "");

    cntrlStepToggle.addEventListener('change', doStepperToggle);

    document.addEventListener('keydown', evt => {
        if (evt.altKey || evt.ctrlKey || evt.metaKey) return;

        if (evt.key == 'p' && ctrlPlayPause.disabled == false) {
            doPlayPause();
        } else if (evt.key == 'r') {
            doReloadConfig();
        } else if (evt.key == 's') {
            cntrlStepToggle.checked = !cntrlStepToggle.checked;
            doStepperToggle();
        }
    });

    doPlayPause();
}

// This forces us to wait for all images to load, not just all HTML.
window.addEventListener('load', initializeStage1);
