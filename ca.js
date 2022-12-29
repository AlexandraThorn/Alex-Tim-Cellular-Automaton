var playPause = document.getElementById("play-pause");

var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
var cols = 25;
var rows = 25;

// Size of cells, in pixels
var cellSize = 20;

// ============================================================ //

const EDGE = 'edge';
const Edge = {
    type: EDGE,
    act: function(me) { },
    draw: function(px, py) { },
}
const edgeSingle = Object.create(Edge);

const AIR = 'air';
const Air = {
    type: AIR,
    act: function(me) { },
    draw: function(px, py) {
        ctx.fillStyle = 'white';
        ctx.fillRect(px, py, cellSize, cellSize);
    },
}

const SAND = 'sand';
const Sand = {
    type: SAND,
    act: function(me) {
        const below = look(me.pos, DOWN);
        if (below.what.type == 'air') {
            swap(me, below);
        }
    },
    draw: function(px, py) {
        ctx.fillStyle = '#cc0';
        ctx.fillRect(px, py, cellSize, cellSize);
    },
}

const RABBIT = 'rabbit';
var rabbitImage = document.getElementById('icon-rabbit');
const Rabbit = {
    type: RABBIT,
    act: function(me) {
        let nearby = anyNeighborhood9(me.pos);
        if (nearby.what.type == 'air') {
            swap(me, nearby);
        }
    },
    draw: function(px, py) {
        ctx.drawImage(rabbitImage, px, py);
    },
}

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
    const what = world[x][y] = Object.create(Rabbit);
    redrawCell(what, pos);
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

function redrawCell(what, pos) {
    const [x, y] = pos;
    what.draw(x * cellSize, y * cellSize);
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
        return {pos: [x, y], what: world[x][y]};
    } else {
        return {pos: [x, y], what: edgeSingle};
    }
}

function look(pos, dir) {
    return get(follow(pos, dir));
}

function set(pos, what) {
    const [x, y] = pos;
    world[x][y] = what;
    redrawCell(what, pos);
}

function swap(cell1, cell2) {
    if (cell1.pos[0] == cell2.pos[0] && cell1.pos[1] == cell2.pos[1])
        throw Error("Tried to swap cell into itself");
    var data1 = cell1.what;
    var data2 = cell2.what;
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
            const what = world[x][y];
            what.act({pos: [x, y], what: what});
        }
    }
}

var runner = null;

function doPlayPause() {
    if (runner) {
        // Pause
        clearInterval(runner);
        runner = null;
        playPause.textContent = "Play";
    } else {
        // Play
        runner = setInterval(updateWorld, 200);
        playPause.textContent = "Pause";
    }
}

function initialize() {
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    for (var x = 0; x < cols; x++) {
        const row = world[x] = Array(rows);
        for (var y = 0; y < rows; y++) {
            set([x, y], Object.create(Air));
        }
    }

    canvas.addEventListener('click', doCanvasClick);
    canvas.addEventListener('mousemove', doCanvasMousemove);

    doPlayPause();
}

initialize();
