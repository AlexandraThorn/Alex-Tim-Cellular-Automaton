var playPause = document.getElementById("play-pause");

var canvas = document.getElementById("world");
var ctx = canvas.getContext('2d'); // drawing context

// Size of world, in cells
var cols = 25;
var rows = 25;

// Size of cells, in pixels
var cellSize = 20;


var EMPTY = 0;
var SAND = 1;
var RABBIT = 2;

var rabbitImage = document.getElementById('icon-rabbit');

// Column, then row
var world = []
for (var x = 0; x < cols; x++) {
    world[x] = Array(rows).fill(EMPTY)
}

function doClick(evt) {
    if (evt.target != canvas) return;
    var cellX = Math.floor(evt.offsetX / cellSize);
    var cellY = Math.floor(evt.offsetY / cellSize);
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
            } else if (cur == RABBIT) {
                var hr = Math.floor(Math.random() * 3) - 1;
                var vr = Math.floor(Math.random() * 3) - 1;
                var nextX = x + hr;
                var nextY = y + vr;
                if (
                    !(hr == 0 && vr == 0)
                    && nextX >= 0 && nextX < cols && nextY >= 0 && nextY < rows
                    && world[nextX][nextY] == EMPTY
                ) {
                    world[nextX][nextY] = RABBIT;
                    world[x][y] = EMPTY;
                    redrawCell(nextX, nextY);
                    redrawCell(x, y);
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
