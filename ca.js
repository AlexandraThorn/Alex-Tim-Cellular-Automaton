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

// Definitions of all elements.
var elements = undefined;


// ==== Interactively drawing on the canvas ==== //

// Draw on the indicated cell.
function doDraw(pos) {
    const [x, y] = pos
    const data = world[x][y] = {type: selectedElementType};
    redrawCell(data, pos);
}

// Draw on the canvas, or step, due to a click.
function doCanvasClick(evt) {
    if (evt.target != canvas) return;
    if (isStepping) {
        stepCell(canvasToPos(evt));
    } else {
        doDraw(canvasToPos(evt));
    }
}

// Draw on the canvas due to a mouse drag.
function doCanvasMousemove(evt) {
    if (evt.target != canvas) return;

    const pos = canvasToPos(evt)
    inspectorNode.textContent = JSON.stringify(get(pos).data);

    if (isStepping) return;
    if ((evt.buttons & 1) == 0) return; // only left/main button
    doDraw(pos);
}


// ==== Direction logic ==== //

// Relative directions.
var east =      [+1,  0];
var northeast = [+1, -1];
var north =     [ 0, -1];
var northwest = [-1, -1];
var west =      [-1,  0];
var southwest = [-1, +1];
var south =     [ 0, +1];
var southeast = [+1, +1];

// Horizontal reflections across the y-axis. Randomly select from this
// list and apply it to directions in your act() function.
const reflectY = [
    function pass(dir) {
        return dir;
    },
    function flip([x, y]) {
        return [-x, y];
    },
];

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
        runner = setInterval(updateWorld, 75);
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
function refreshElementSelectors() {
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
        // "defaultElement" attribute, but fall back to the first
        // visible element otherwise.
        if (!defaultButton || elAttrs.defaultElement)
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

// Reload config.js to get newly written element behavior.
function doReloadConfig() {
    const s = document.createElement('script');
    s.id = "config-loader";
    s.src = "config.js?cache-bust=" + Math.random();
    s.addEventListener('load', function(evt) {
        redrawWorld();
        refreshElementSelectors();
    });
    document.body.append(s);
    document.body.removeChild(s);
}


// ==== Initialization ==== //

// Initial page setup
function initialize() {
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    for (var x = 0; x < cols; x++) {
        const row = world[x] = Array(rows);
        for (var y = 0; y < rows; y++) {
            // Not using set(), since that requests redrawing, and
            // elements aren't loaded yet.
            world[x][y] = {type: 'air'};
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
    doReloadConfig();
}

// This forces us to wait for all images to load, not just all HTML.
window.addEventListener('load', initialize);
