// Definitions:
//
// - pos: A world position [x, y]
// - dat: Cell data, a map that contains at least a type field ("air", "sand", etc.)
// - cell: A position and its contents, as {pos, dat}

const playPause = document.getElementById("play-pause");

const canvas = document.getElementById("world");
const ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
const cols = 25;
const rows = 25;

// Size of cells, in pixels
const cellSize = 20;

// ============================================================ //

// Loaded from config.js
var elements = {};

// ============================================================ //

// Column/x, then row/y
var world = []

function canvasToPos(evt) {
    var posX = Math.floor(evt.offsetX / cellSize);
    var posY = Math.floor(evt.offsetY / cellSize);
    return [posX, posY];
}

function doDraw(pos) {
    const [x, y] = pos
    const dat = world[x][y] = {type: 'rabbit'};
    redrawCell(dat, pos);
}

function doCanvasClick(evt) {
    if (evt.target != canvas) return;
    doDraw(canvasToPos(evt));
}

function doCanvasMousemove(evt) {
    if (evt.target != canvas) return;
    if ((evt.buttons & 1) == 0) return;
    doDraw(canvasToPos(evt));
}

function redrawCell(dat, pos) {
    const [x, y] = pos;
    elements[dat.type].draw(x * cellSize, y * cellSize);
}

function inWorld(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

var DOWN = [0, 1];

function follow(pos, dir) {
    let [x, y] = pos;
    x += dir[0];
    y += dir[1];
    return [x, y];
}

function get(pos) {
    const [x, y] = pos;
    if (inWorld(x, y)) {
        return {pos: [x, y], dat: world[x][y]};
    } else {
        return {pos: [x, y], dat: {type: 'edge'}};
    }
}

function look(pos, dir) {
    return get(follow(pos, dir));
}

function set(pos, dat) {
    const [x, y] = pos;
    world[x][y] = dat;
    redrawCell(dat, pos);
}

function swap(cell1, cell2) {
    if (cell1.pos[0] == cell2.pos[0] && cell1.pos[1] == cell2.pos[1])
        throw Error("Tried to swap cell into itself");
    var data1 = cell1.dat;
    var data2 = cell2.dat;
    set(cell1.pos, data2);
    set(cell2.pos, data1);
}

/** Return cell within 1 step, including starting position. */
function anyNeighborhood9(pos) {
    const [x, y] = pos;
    const hr = Math.floor(Math.random() * 3) - 1;
    const vr = Math.floor(Math.random() * 3) - 1;
    return get([
        Math.min(Math.max(x + hr, 0), cols),
        Math.min(Math.max(y + vr, 0), rows)
    ]);
}

function updateWorld() {
    for (var x = cols - 1; x >= 0; x--) {
        for (var y = rows - 1; y >= 0; y--) {
            const dat = world[x][y];
            const element = elements[dat.type];
            if (element) {
                const act = element['act'];
                if (act) {
                    act({pos: [x, y], dat: dat});
                }
            }
        }
    }
}

var runner = null;

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

function redrawWorld() {
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            redrawCell(world[x][y], [x, y]);
        }
    }
}

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

initialize();
