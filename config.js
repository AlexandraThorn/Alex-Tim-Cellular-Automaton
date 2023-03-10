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
// Functions:
//
// - initialize: Optional initializer, called when a cell is created.
//   Given cell data with type already filled in; expected to mutate
//   the dictionary.
// - draw: Given upper-left pixel coordinates of the cell; expected to
//   completely redraw this cell.
// - act: Given a cell dict representing the current cell, take whatever
//   actions this element will take on a time step. The dictionary
//   contains an [x, y] pair under 'pos' and a data dict under 'data',
//   which should always contain a 'type' string matching the element.
//   If mutating a neighbor's data directly, must request a redraw of
//   that neighbor.
//   This function is optional.
//
// Properties:
//
// - hidden: True if this element should not be displayed in the element
//   selector.
// - textFgColor, textBgColor: Text and background color for the label in
//   the element selector.
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
            var r = randomHorizontal();
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
            var r = randomHorizontal();
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
            // Rabbits fall down in air
            const down = look(me.pos, south);
            if (down.data.type == 'air') {
                swap(me.pos, down.pos);
                return;
            }

            function consume(cell) {
                set(cell.pos, {type: 'air'});
                swap(me.pos, cell.pos);
            }

            // Check left and right for carrots first
            for (const r of randomHorizontalAll()) {
                const side = look(me.pos, r(east));
                if (side.data.type == 'carrot') {
                    return consume(side);
                }
            }

            // Check above and below for carrots
            if (down.data.type == 'carrot') {
                return consume(down);
            }
            const up = look(me.pos, north);
            if (up.data.type == 'carrot') {
                return consume(up);
            }

            // Still no carrots? Maybe walk around.
            const lr = randomHorizontal();
            const side = look(me.pos, lr(east));
            if (side.data.type == 'air') {
                swap(me.pos, side.pos);
                return;
            }
            // Can hop up a little too.
            const upside = look(me.pos, lr(northeast));
            if (upside.data.type == 'air') {
                swap(me.pos, upside.pos);
                return;
            }

            // Trapped under sand? Can dig out, slowly.
            if (up.data.type == 'sand' && Math.random() < 0.4) {
                swap(me.pos, up.pos);
                return;
            }
            if (upside.data.type == 'sand' && Math.random() < 0.2) {
                swap(me.pos, upside.pos);
                return;
            }
        },
    },
};

// This is the element to use when clearing the world (or initializing it).
clearElement = 'air';
// This is the element to have selected for drawing, by default.
defaultSelection = 'sand';
