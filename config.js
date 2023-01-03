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

    'black': { 
        textFgColor: 'white',
        textBgColor: 'black',
        drawColor: 'black',
        draw: function(data, px, py) {
            drawSolid('black', px, py);
        },
    },

    'red': { 
        textFgColor: 'white',
        textBgColor: 'red',
        drawColor: 'red',
        draw: function(data, px, py) {
            drawSolid('red', px, py);
        },
    },

    'orange': { 
        textFgColor: 'white',
        textBgColor: 'orange',
        drawColor: 'orange',
        draw: function(data, px, py) {
            drawSolid('orange', px, py);
        },
    },

    'yellow': { 
        textFgColor: 'black',
        textBgColor: 'yellow',
        drawColor: 'yellow',
        draw: function(data, px, py) {
            drawSolid('yellow', px, py);
        },
    },

    'green': { 
        textFgColor: 'white',
        textBgColor: 'green',
        drawColor: 'green',
        draw: function(data, px, py) {
            drawSolid('green', px, py);
        },
    },

    'blue': { 
        textFgColor: 'white',
        textBgColor: 'blue',
        drawColor: 'blue',
        draw: function(data, px, py) {
            drawSolid('blue', px, py);
        },
    },

    'purple': { 
        textFgColor: 'white',
        textBgColor: 'purple',
        drawColor: 'purple',
        draw: function(data, px, py) {
            drawSolid('purple', px, py);
        },
    },

    'magenta': { 
        textFgColor: 'white',
        textBgColor: 'magenta',
        drawColor: 'magenta',
        draw: function(data, px, py) {
            drawSolid('magenta', px, py);
        },
    },

    'white': {
        textFgColor: 'black',
        textBgColor: 'white',
        drawColor: 'white',
        draw: function(data, px, py) {
            drawSolid('white', px, py);
        },
    },

    'rainbow': {
        textFgColor: 'purple',
        textBgColor: 'white',
        drawColor: 'white',
        draw: function(data, px, py) {
            drawSolid('red', px, py);
            drawSolid('orange', px, py+1*cellSize);
            drawSolid('yellow', px, py+2*cellSize);
            drawSolid('green', px, py+3*cellSize);
            drawSolid('blue', px, py+4*cellSize);
            drawSolid('purple', px, py+5*cellSize);
        },
    },

//    'invert - DOES NOTE WORK': {
//        textFgColor: 'black',
//        textBgColor: 'gray',
//        drawColor: 'white',
//        draw: function(data, px, py) {
//            startElt=look([px,py],[0,0])
//            oldColor=startElt.data.drawColor
//            drawSolid(drawColor, px, py);
//        },
//    },

};

// This is the element to use when clearing the world (or initializing it).
clearElement = 'white';
// This is the element to have selected for drawing, by default.
defaultSelection = 'black';
