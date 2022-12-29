"use strict";

var rabbitImage = document.getElementById('icon-rabbit');
if (rabbitImage.width != cellSize || rabbitImage.height != cellSize)
    throw Error("Rabbit image does not match cell size");

// All known types.
//
// - draw: Given upper-left pixel coordinates of the cell; expected to
//   completely redraw this cell.
// - act: Given a cell dict representing the current cell, take whatever
//   actions this element will take on a time step.
var elements = {
    'air': {
        draw: function(px, py) {
            ctx.fillStyle = 'white';
            ctx.fillRect(px, py, cellSize, cellSize);
        },
    },
    'sand': {
        draw: function(px, py) {
            ctx.fillStyle = '#cc0';
            ctx.fillRect(px, py, cellSize, cellSize);
        },
        act: function(me) {
            const below = look(me.pos, DOWN);
            if (below.dat.type == 'air') {
                swap(me, below);
            }
        },
    },
    'rabbit': {
        draw: function(px, py) {
            ctx.drawImage(rabbitImage, px, py);
        },
        act: function(me) {
            let nearby = anyNeighborhood9(me.pos);
            if (nearby.dat.type == 'air') {
                swap(me, nearby);
            }
        },
    },
}
