// Definitions:
//
// - pos: A world position [x, y] -- cell coordinates, rather than pixel coordinates
// - dat: Cell data, a map that contains at least a 'type' field ("air", "sand", etc.)
// - cell: A position and its contents, as {pos, dat}

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

// ==== DOM references ==== //

const playPause = document.getElementById("play-pause");

const canvas = document.getElementById("world");
const ctx = canvas.getContext('2d'); // drawing context


// ==== World settings ==== //

// Size of world, in cells
const cols = 25;
const rows = 25;

// Size of cells, in pixels
const cellSize = 20;


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

// These will actually be overwritten by config.js; they're just declared here to
// have there be something for a search to find.
// See config.js for the actual value and documention.

// Definitions of all elements.
var elements = undefined;

// Element we're currently drawing. UI pending.
var currentlyDrawing = undefined;


// ==== Interactively drawing on the canvas ==== //

// Draw on the indicated cell.
function doDraw(pos) {
    const [x, y] = pos
    const dat = world[x][y] = {type: currentlyDrawing};
    redrawCell(dat, pos);
}

// Draw on the canvas due to a click.
function doCanvasClick(evt) {
    if (evt.target != canvas) return;
    doDraw(canvasToPos(evt));
}

// Draw on the canvas due to a mouse drag.
function doCanvasMousemove(evt) {
    if (evt.target != canvas) return;
    if ((evt.buttons & 1) == 0) return; // only left/main button
    doDraw(canvasToPos(evt));
}


// ==== Direction logic ==== //

// Relative directions.
var DOWN = [0, 1];

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
function redrawCell(dat, pos) {
    const [x, y] = pos;
    elements[dat.type].draw(x * cellSize, y * cellSize);
}

// Is this a legal position in the world?
function inWorld(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

// Get a cell {pos, dat} from a position.
function get(pos) {
    const [x, y] = pos;
    if (inWorld(x, y)) {
        return {pos, dat: world[x][y]};
    } else {
        // Synthetic return value representing off-world coordinates.
        return {pos, dat: {type: 'edge'}};
    }
}

// Retrieve a cell in the given direction from this position.
function look(pos, dir) {
    return get(follow(pos, dir));
}

// Set a position to this cell data, and redraw it.
function set(pos, dat) {
    const [x, y] = pos;
    world[x][y] = dat;
    redrawCell(dat, pos);
}

// Swap these two cells.
function swap(cell1, cell2) {
    if (cell1.pos[0] == cell2.pos[0] && cell1.pos[1] == cell2.pos[1])
        throw Error("Tried to swap cell into itself");
    var data1 = cell1.dat;
    var data2 = cell2.dat;
    set(cell1.pos, data2);
    set(cell2.pos, data1);
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

// Get a random visit order.
function getVisitOrder() {
    return visitOrders[Math.floor(visitOrders.length * Math.random())];
}


// ==== Core loop ==== //

// Walk over all positions in the world and update them, in some order.
function updateWorld() {
    getVisitOrder().forEach(pos => {
        const [x, y] = pos;
        const dat = world[x][y];
        const element = elements[dat.type];
        if (element) {
            const act = element['act'];
            if (act) {
                act({pos, dat});
            }
        }
    })
}

// Handle on the world-updating loop. (setInterval/clearInterval).
var runner = null;

// Button handler: Toggle between running/paused.
function doPlayPause() {
    if (runner) {
        // Pause
        clearInterval(runner);
        runner = null;
        playPause.textContent = "Play [p]";
    } else {
        // Play
        runner = setInterval(updateWorld, 200);
        playPause.textContent = "Pause [p]";
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

// Reload config.js to get newly written element behavior.
function doReloadConfig() {
    const s = document.createElement('script');
    s.id = "config-loader";
    s.src = "config.js?cache-bust=" + Math.random();
    s.addEventListener('load', function(evt) {
        redrawWorld();
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

    document.addEventListener('keydown', evt => {
        if (evt.altKey || evt.ctrlKey || evt.metaKey) return;

        if (evt.key == 'p') {
            doPlayPause();
        } else if (evt.key == 'r') {
            doReloadConfig();
        }
    });

    doReloadConfig();
}

// This forces us to wait for all images to load, not just all HTML.
window.addEventListener('load', initialize);
