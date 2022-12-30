// This file is a hot-swappable definition of how all the elements
// work. It is re-run when the user requests it.

"use strict";

// Fill a cell with a solid color, with upper left (px, py).
function drawSolid(color, px, py) {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, cellSize, cellSize);
}

// All known element types.
//
// - draw: Given upper-left pixel coordinates of the cell; expected to
//   completely redraw this cell.
// - act: Given a cell dict representing the current cell, take whatever
//   actions this element will take on a time step. The dictionary
//   contains an [x, y] pair under 'pos' and a data dict under 'data',
//   which should always contain a 'type' string matching the element.
elements = {
    // The "edge" element is a synthetic element that is "just beyond" the
    // edge of the world.
    'edge': {
        draw: function(data, px, py) {
            throw Error("'edge' element should not be shown.");
        },
        act: function(me) {
            throw Error("'edge' element should not be run.");
        },
        hidden: true,
    },

    'air': {
        textFgColor: 'black',
        textBgColor: 'white',
        draw: function(data, px, py) {
            drawSolid('white', px, py);
        },
    },

    'sand': {
        defaultElement: true,
        textFgColor: '#cc0',
        textBgColor: 'black',
        draw: function(data, px, py) {
            drawSolid('#cc0', px, py);
        },
        act: function(me) {
            // Just fall straight down if possible.
            const below = look(me.pos, south);
            if (below.data.type == 'air') {
                swap(me.pos, below.pos);
                return;
            }

            // Otherwise, see if it can slide diagonally.
            var r = pickRandom(reflectY);
            const se = look(me.pos, r(southeast));
            if (se.data.type == 'air') {
                swap(me.pos, se.pos);
                return;
            }
        },
    },

    'carrot': {
        textFgColor: '#fa0',
        textBgColor: 'black',
        draw: function(data, px, py) {
            drawSolid('#fa0', px, py);
        },
        act: function(me) {
            // Just fall straight down if possible.
            const below = look(me.pos, south);
            if (below.data.type == 'air') {
                swap(me.pos, below.pos);
                return;
            }

            // Otherwise, see if it can slide diagonally.
            var r = pickRandom(reflectY);
            const se = look(me.pos, r(southeast));
            if (se.data.type == 'air') {
                swap(me.pos, se.pos);
                return;
            }
        },
    },

    'rabbit': {
        textFgColor: 'black',
        textBgColor: 'pink',
        draw: function(data, px, py) {
            drawSolid('pink', px, py);
        },
        act: function(me) {
            for (const r of shuffled(reflectY)) {
                const side = look(me.pos, r(east));
                if (side.data.type == 'carrot') {
                    set(side.pos, {type: 'air'});
                    swap(me.pos, side.pos);
                    return;
                }
            }

            let nearby = anyNeighborhood9(me.pos);
            if (nearby.data.type == 'air') {
                swap(me.pos, nearby.pos);
                return;
            }
        },
    },
};
