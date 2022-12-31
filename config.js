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

    // Makes thick walls even if you draw a gappy line (nice for making mazes)
    'spread': {
        textFgColor: 'white',
        textBgColor: 'black',
        initialize: function(data) {
            data.remaining = 4;
        },
        draw: function(data, px, py) {
            drawSolid('black', px, py);
        },
        act: function(me) {
            for (const r of randomRotateQuarterAll()) {
                if (me.data.remaining <= 0) return;

                const edge = look(me.pos, r(south));
                if (edge.data.type == 'air') {
                    set(edge.pos, {type: 'spread', remaining: me.data.remaining - 1});
                }
            }
            me.data.remaining = 0;
        },
    },

    'huegene': {
        textFgColor: 'white',
        textBgColor: 'purple',
        initialize: function(data) {
            data.h = Math.random();
            data.s = Math.random() * 0.8 + 0.2;
            data.v = Math.random() * 0.7 + 0.2;
            data.mut = Math.random()/30;
        },
        draw: function(data, px, py) {
            drawSolid(hsv2rgb(data.h, data.s, data.v), px, py);
        },
        act: function(me) {
            // Uncomment and reload to erase huegene
            //set(me.pos, make('air')); return;

            // Get a "mutated" version of the property. (Not actually
            // mutating the data structure.)
            function mutatedProperty(data, prop) {
                // Add or subtract, within a range of size data.mut
                const factor = Math.random() * data.mut - data.mut/2;
                const modified = data[prop] + factor;

                if (prop == 'h') {
                    // Allow hue to wrap around
                    return (modified + 2) % 1;
                } else {
                    // Clamp other values to [0, 1]
                    return Math.min(1, Math.max(0, modified));
                }
            }

            // Fields that can be "mutated"
            const mutables = ["h", "s", "v", "mut"];

            // Make a shallow copy of data with some attributes "mutated".
            function makeChild(data) {
                const child = {};
                for (const [k, v] of Object.entries(data)) {
                    if (mutables.indexOf(k) > -1) {
                        child[k] = mutatedProperty(data, k);
                    } else {
                        child[k] = v;
                    }
                }
                child.mut = Math.max(0.01, child.mut);
                return child;
            }

            // Expand into air, "mutating" slightly.
            var r = randomRotateQuarter();
            const edge = look(me.pos, r(south));
            // Can't grow if too mutated
            if (me.data.mut < 0.15) {
                if (edge.data.type == 'air') {
                    set(edge.pos, makeChild(me.data));
                    return;
                }
            }
        },
    },
};

// This is the element to use when clearing the world (or initializing it).
clearElement = 'air';
// This is the element to have selected for drawing, by default.
defaultSelection = 'huegene';
