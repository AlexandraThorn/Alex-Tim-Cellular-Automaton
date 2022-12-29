var playPause = document.getElementById("play-pause");

var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
var cols = 25;
var rows = 25;

// Size of cells, in pixels
var cellSize = 20;

var EDGE = 0; // must be zero, for falseiness
var EMPTY = 1;
var SAND = 2;
var RABBIT = 3;

var rabbitImage = document.getElementById('icon-rabbit');

// Column, then row
var world = []
for (var x = 0; x < cols; x++) {
    world[x] = Array(rows).fill(EMPTY)
}

function canvasToCell(evt) {
    var cellX = Math.floor(evt.offsetX / cellSize);
    var cellY = Math.floor(evt.offsetY / cellSize);
    return [cellX, cellY];
}

function doClick(evt) {
    if (evt.target != canvas) return;
    const [cellX, cellY] = canvasToCell(evt);
    world[cellX][cellY] = RABBIT;
    redrawCell(cellX, cellY);
}

function redrawCell(x, y) {
    var cur = world[x][y]
    var ulx = x * cellSize;
    var uly = y * cellSize;
    if (cur == SAND) {
        ctx.fillStyle = '#cc0';
        ctx.fillRect(ulx, uly, cellSize, cellSize);
    } else if (cur == RABBIT) {
        ctx.drawImage(rabbitImage, ulx, uly);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(ulx, uly, cellSize, cellSize);
    }
}

function inWorld(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

var DOWN = [0, 1];

function follow(x, y, dir) {
    x += dir[0];
    y += dir[1];
    return [x, y];
}

function get(pos) {
    const [x, y] = pos;
    if (inWorld(x, y)) {
        return {pos: [x, y], what: world[x][y]};
    } else {
        return {pos: [x, y], what: EDGE};
    }
}

function look(x, y, dir) {
    return get(follow(x, y, dir));
}

function set(pos, what) {
    const [x, y] = pos;
    world[x][y] = what;
    redrawCell(x, y);
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
function anyNeighborhood9(x, y) {
    const hr = Math.floor(Math.random() * 3) - 1;
    const vr = Math.floor(Math.random() * 3) - 1;
    const pos = [
        Math.min(Math.max(x + hr, 0), cols),
        Math.min(Math.max(y + vr, 0), rows)
    ];
    return get(pos);
}

function updateWorld() {
    for (var x = cols - 1; x >= 0; x--) {
        for (var y = rows - 1; y >= 0; y--) {
            var curPos = [x, y];
            var curWhat = world[x][y];
            var curCell = {pos: curPos, what: curWhat};

            if (curWhat == SAND) {
                const below = look(x, y, DOWN);
                if (below.what == EMPTY) {
                    swap(curCell, below);
                }
            } else if (curWhat == RABBIT) {
                let nearby = anyNeighborhood9(x, y);
                if (nearby.what == EMPTY) {
                    swap(curCell, nearby);
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

    world[0][0] = RABBIT;
    world[5][5] = RABBIT;

    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            redrawCell(x, y);
        }
    }

    canvas.addEventListener('click', doClick);

    doPlayPause();
}

initialize();
