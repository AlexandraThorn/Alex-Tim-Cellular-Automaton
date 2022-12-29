var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
var cols = 30;
var rows = 30;

// Size of cells, in pixels
var cellSize = 8;


var EMPTY = 0;
var SAND = 1;


// Column, then row
var world = []
for (var x = 0; x < cols; x++) {
    world[x] = Array(rows).fill(EMPTY)
}

function doClick(evt) {
    if (evt.target != canvas) return;
    var cellX = Math.floor(evt.offsetX / cellSize);
    var cellY = Math.floor(evt.offsetY / cellSize);
    world[cellX][cellY] = SAND;
    redrawCell(cellX, cellY);
}

function redrawCell(x, y) {
    if (world[x][y] == SAND) {
        ctx.fillStyle = '#cc0';
    } else {
        ctx.fillStyle = 'white';
    }
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

function updateWorld() {
    for (var x = cols - 1; x >= 0; x--) {
        for (var y = rows - 1; y >= 0; y--) {
            var cur = world[x][y];

            if (cur == SAND) {
                if (y + 1 < rows && world[x][y+1] == EMPTY) {
                    world[x][y+1] = SAND;
                    world[x][y] = EMPTY;
                    redrawCell(x, y);
                    redrawCell(x, y+1);
                }
            }
        }
    }
}

function initialize() {
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            redrawCell(x, y);
        }
    }

    canvas.addEventListener('click', doClick);

    setInterval(updateWorld, 100);
}

initialize();
