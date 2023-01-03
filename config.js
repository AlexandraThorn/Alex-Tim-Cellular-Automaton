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

	//resources on soil hydraulics:
	//  - https://en.wikipedia.org/wiki/Hydraulic_conductivity
	//  - https://wwwrcamnl.wr.usgs.gov/uzf/unsatflow/unsatflow.html
	//  - https://en.wikipedia.org/wiki/Water_retention_curve
    'sand': {
        textFgColor: '#cc0',
        textBgColor: 'black',
        initialize: function(data) {
            data.moisture = 0;
            data.maxCap=100;
            data.waterHoldingCap=60;
            data.wiltPoint=5
        },
        draw: function(data, px, py) {
            //drawSolid('#cc0', px, py);
		//NEED DOCUMENTATION FOR hsv2rgb
            data.colorValue=0.8-0.3*data.moisture/data.maxCap
            drawSolid(hsv2rgb(60/360,1,data.colorValue), px, py);
            //drawSolid("rgb(0,81,20)", px, py);
        },
        act: function(me) {
            // Just fall straight down if possible (above air or water).
            const below = look(me.pos, south);
            if (below.data.type == 'air') {
                swap(me.pos, below.pos);
                return;
            }
            if (below.data.type == 'water') {
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
		
            function absorbWater(cell) {
                set(cell.pos, {type: 'air'});
                me.data.moisture += 30;
                redrawCell(me.data,me.pos)
            }
            
            //soaking up water nearby
            if (me.data.moisture < (me.data.maxCap - 30)) {
                // Check above for water first
                const above = look(me.pos, north);
                if (above.data.type == 'water') {
                    return absorbWater(above);
                }
                // Check left and right for water next 
		if (me.data.moisture <= (me.data.waterHoldingCap - 30)) {
                   for (const r of randomHorizontalAll()) {
                       const side = look(me.pos, r(east));
                       if (side.data.type == 'water') {
                           return absorbWater(side);
                       }
                   }
                }
            }

            function drainWaterTo(cell) {
                set(cell.pos, {type: 'water'});
                me.data.moisture -= 30;
                redrawCell(me.data,me.pos)
            }

            //drainage of water above holding capacity
            var r = randomHorizontal();
            const side = look(me.pos, r(east));
            if (me.data.moisture > me.data.waterHoldingCap) {
                let excessWater = me.data.moisture - me.data.waterHoldingCap
		if((below.data.type == 'sand') &&
		    (below.data.moisture < me.data.moisture)){
                    //physics assumes sand is on solid surface, not falling
                    let spaceBelow = below.data.maxCap - below.data.moisture;
		    let drainage=Math.min(excessWater,spaceBelow);
                    me.data.moisture -= drainage;
                    redrawCell(me.data,me.pos)
                    below.data.moisture += drainage;
                    redrawCell(below.data,below.pos)
                } else if ((se.data.type == 'sand') &&
		    (se.data.moisture < me.data.moisture)) {
                    let spaceBelow = se.data.maxCap - se.data.moisture;
		    let drainage = Math.min(excessWater,spaceBelow);
                    me.data.moisture -= drainage;
                    redrawCell(me.data,me.pos)
                    se.data.moisture += drainage;
                    redrawCell(se.data,se.pos)
                } else if (se.data.type == 'air') {
                    return drainWaterTo(se);
                } else if ((side.data.type == 'air') && ((me.data.moisture - me.data.waterHoldingCap) >=30)) {
                    return drainWaterTo(side);
                } else if (side.data.type == 'sand') {
                    // not sure whether this should be changed to only
                    // allow positive outflow
                    let diffWater = me.data.moisture - side.data.moisture
                    let sidewaysFlow = Math.min(excessWater, (diffWater/2))
                    me.data.moisture -= sidewaysFlow
                    redrawCell(me.data,me.pos)
                    side.data.moisture += sidewaysFlow
                    redrawCell(side.data,side.pos)
                }

            }
            return;
        },
    },

    'water': {
        textFgColor: 'white',
        textBgColor: 'blue',
        draw: function(data, px, py) {
            drawSolid('blue', px, py);
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
		
            // Otherwise, see if it can slide sideways.
            var r = randomHorizontal();
            const side = look(me.pos, r(east));
            if (side.data.type == 'air') {
                swap(me.pos, side.pos);
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
