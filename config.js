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

    'wall': {
        textFgColor: 'white',
        textBgColor: '#333',
        draw: function(data, px, py) {
            drawSolid('#333', px, py);
        },
    },

    'gloop': {
        textFgColor: 'white',
        textBgColor: '#080',
        initialize: function(data) {
            data.migratory = true;
            data.carrying = 0;
        },
        draw: function(data, px, py) {
            const brightness = 0.8 - Math.log(data.carrying + 1)/6;
            drawSolid(hsv2rgb(0.4, 0.9, Math.min(1, brightness)), px, py);
        },
        act: function(me) {
            // If touching *any* wall, stop moving.
            let touchingWall = false;
            for (const r of randomRotateQuarterAll()) {
                const edge = look(me.pos, r(south));
                const corner = look(me.pos, r(southeast));
                if (edge.data.type == 'wall' || corner.data.type == 'wall') {
                    touchingWall = true;
                    break;
                }
            }
            me.data.migratory = !touchingWall;
            redrawCell(me.data, me.pos);

            // Non-migratory gloop can spread along the wall if it has absorbed
            // another gloop.
            if (touchingWall) {
                // If touching other stationary gloop, average the carried gloop.
                const r = randomRotateQuarter();
                const neighbor = look(me.pos, r(south));
                if (neighbor.data.type == 'gloop' && !neighbor.data.migratory) {
                    const total = me.data.carrying + neighbor.data.carrying;
                    const mine = Math.floor(total / 2);
                    me.data.carrying = mine;
                    neighbor.data.carrying = total - mine;
                    redrawCell(me.data, me.pos);
                    redrawCell(neighbor.data, neighbor.pos);
                }

                if (me.data.carrying > 0) {
                    // Check if there is any pair of two neighbors that are adjacent
                    // to each other, with one wall and one air. If so, turn air
                    // into gloop.
                    for (const r of randomRotateQuarterAll()) {
                        const s = look(me.pos, r(south));
                        const se = look(me.pos, r(southeast));
                        if (s.data.type == 'wall') {
                            for (const d of [east, west, southeast, southwest]) {
                                const cotouch = look(me.pos, r(d));
                                if (cotouch.data.type == 'air') {
                                    set(cotouch.pos, make('gloop'));
                                    me.data.carrying--;
                                    redrawCell(me.data, me.pos);
                                    return;
                                }
                            }
                        } else if (se.data.type == 'wall') {
                            for (const d of [east, south]) {
                                const cotouch = look(me.pos, r(d));
                                if (cotouch.data.type == 'air') {
                                    set(cotouch.pos, make('gloop'));
                                    me.data.carrying--;
                                    redrawCell(me.data, me.pos);
                                    return;
                                }
                            }
                        }
                    }
                }
            } else {
                // If migratory and touching a non-migratory gloop on-edge,
                // get absorbed into it.
                for (const r of randomRotateQuarterAll()) {
                    const neighbor = look(me.pos, r(south));
                    if (neighbor.data.type == 'gloop' && !neighbor.data.migratory) {
                        set(me.pos, make('air'));
                        neighbor.data.carrying++;
                        redrawCell(neighbor.data, neighbor.pos);
                        return;
                    }
                }

                // Otherwise, wander through air.
                const r = randomRotateQuarter();
                const neighbor = look(me.pos, r(south));
                if (neighbor.data.type == 'air') {
                    swap(me.pos, neighbor.pos);
                    return;
                }
            }
        },
    },
};

// This is the element to use when clearing the world (or initializing it).
clearElement = 'air';
// This is the element to have selected for drawing, by default.
defaultSelection = 'wall';
