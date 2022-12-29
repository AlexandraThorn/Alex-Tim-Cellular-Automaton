// This file is a hot-swappable definition of how all the elements
// work. It is re-run when the user requests it.

"use strict";

// This image needs to be loaded on the page somewhere in order to be able to
// copy it onto the canvas.
var rabbitImage = document.getElementById('icon-rabbit');
if (rabbitImage.width != cellSize || rabbitImage.height != cellSize)
    throw Error("Rabbit image does not match cell size");

// All known element types.
//
// - draw: Given upper-left pixel coordinates of the cell; expected to
//   completely redraw this cell.
// - act: Given a cell dict representing the current cell, take whatever
//   actions this element will take on a time step. The dictionary
//   contains an [x, y] pair under 'pos' and a data dict under 'dat',
//   which should always contain a 'type' string matching the element.
elements = {
    // The "edge" element is a synthetic element that is "just beyond" the
    // edge of the world.
    'edge': {
        draw: function(px, py) {
            throw Error("'edge' element should not be shown.");
        },
        act: function(me) {
            throw Error("'edge' element should not be run.");
        },
    },

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
};

currentlyDrawing = 'rabbit';