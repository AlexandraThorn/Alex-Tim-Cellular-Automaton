var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
var cols = 8;
var rows = 8;

// Size of cells, in pixels
var cellSize = 30;

// Column, then row
var world = []
for (var x = 0; x < cols; x++) {
    world[x] = Array(rows).fill('white')
}

function doClick(evt) {
    if (evt.target != canvas) return;
    var cellX = Math.floor(evt.clientX / cellSize);
    var cellY = Math.floor(evt.clientY / cellSize);
    world[cellX][cellY] = document.getElementById('color').value;
    redrawCell(cellX, cellY);
}

function redrawCell(x, y) {
    ctx.fillStyle = world[x][y];
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
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
}

initialize();

