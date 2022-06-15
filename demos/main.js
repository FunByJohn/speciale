const ProgramType = {
    VoronoiInstant : 1,
    VoronoiEvents  : 2,
    Delaunay       : 3
};

const ShapeType = {
    Circle       : 1,
    LineSegment  : 2,
    LineSequence : 3,
    Text         : 4
};

let currentProgram = ProgramType.VoronoiInstant;
let canvasElement;
let canvasContext;
let points = [];
let mouseY = 0;
let sweepLineY = 0;
let lockedSweepLine = false;
let shiftDown = false;
let shiftDownY = 0;
let showingIpe = false;
let currentDrawing = [];

function circleShape(x, y, radius, filled) {
    return {
        type   : ShapeType.Circle,
        x      : x,
        y      : y,
        radius : radius,
        filled : filled
    };
}

function lineSegmentShape(x1, y1, x2, y2) {
    return {
        type : ShapeType.LineSegment,
        x1   : x1,
        y1   : y1,
        x2   : x2,
        y2   : y2
    };
}

function lineSequenceShape(points) {
    return {
        type   : ShapeType.LineSequence,
        points : points
    };
}

function textShape(position, str, size) {
    return {
        type : ShapeType.Text,
        x    : position.x,
        y    : position.y,
        str  : str,
        size : size
    }
}

function init(event) {
    canvasElement = document.getElementById('view');
    canvasContext = canvasElement.getContext('2d');

    resizeWindow();

    let selector = document.getElementById('programSelector');
    let ipeButton = document.getElementById('ipeButton');
    
    selector.addEventListener('change', programSelectorChanged);
    ipeButton.addEventListener('click', clickIpeButton);

    window.addEventListener('resize', resizeWindow);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    canvasElement.addEventListener('mousedown', handleClick);
    canvasElement.addEventListener('mousemove', mouseMove);

    draw();
}

function resizeWindow() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelSize = 1;

    if (window.devicePixelRatio) {
        pixelSize = window.devicePixelRatio;
    }

    canvasElement.width = width * pixelSize;
    canvasElement.height = height * pixelSize;
    canvasElement.style.width = width + 'px';
    canvasElement.style.height = height + 'px';

    canvasContext.resetTransform();
    canvasContext.scale(pixelSize, -pixelSize);
    canvasContext.translate(0, -height);

    draw();
}

function handleClick(event) {
    if (!event.shiftKey) {
        points.push([event.clientX, window.innerHeight - event.clientY]);
    } else {
        let x = event.clientX;
        let y = window.innerHeight - event.clientY;

        for (let i = 0; i < points.length; i++) {
            let [px, py] = points[i];
            let dx = x - px;
            let dy = y - py;

            if (dx * dx + dy * dy < Config.deleteRadius * Config.deleteRadius) {
                points.splice(i, 1);
                break;
            }
        }
    }

    draw();
}

function handleKeyDown(event) {
    if (event.keyCode == 32) {
        lockedSweepLine = !lockedSweepLine;

        if (!lockedSweepLine) {
            sweepLineY = mouseY;
            draw();
        }
    }

    if (event.keyCode == 16) {
        if (!shiftDown) {
            shiftDownY = sweepLineY;
        }

        shiftDown = true;
    }

    if (event.keyCode == 49) Config.debugShowTree = !Config.debugShowTree;
    if (event.keyCode == 50) Config.debugShowBreakpointNames = !Config.debugShowBreakpointNames;
    if (event.keyCode == 51) Config.debugDCELShowOrientedEdges = !Config.debugDCELShowOrientedEdges;
    if (event.keyCode == 52) Config.debugDCELShowFacePointers = !Config.debugDCELShowFacePointers;
    if (event.keyCode == 53) Config.debugDCELShowNextPointers = !Config.debugDCELShowNextPointers;
    if (event.keyCode == 54) Config.debugShowBoundingBox = !Config.debugShowBoundingBox;
    if (event.keyCode == 55) Config.debugBoundingBoxPadding = Math.max(0, Config.debugBoundingBoxPadding + 10);
    if (event.keyCode == 56) Config.debugBoundingBoxPadding = Math.max(0, Config.debugBoundingBoxPadding - 10);
    if (event.keyCode == 57) Config.debugShowCircleEvents = !Config.debugShowCircleEvents;

    if (49 <= event.keyCode && event.keyCode <= 56)
        draw();

    /*
    const Config = {
    epsilon                    : 10e-7, // in computations with floats we will say that x = y if abs(x - y) < epsilon 
    pointFocusRadius           : 5.0,
    pointBlurRadius            : 2.0,
    beachLineStepSize          : 1,
    deleteRadius               : 20.0,
    sloMoFactor                : 0.05,
    debugShowTree              : false,
    debugShowBreakpointNames   : false,
    debugShowCircleEvents      : false,
    debugDCELShowOrientedEdges : false,
    debugDCELShowFacePointers  : false, // requires debugDCELShowOrientedEdge to be true
    debugDCELShowNextPointers  : false, // requires debugDCELShowOrientedEdge to be true
    debugShowBoundingBox       : false,
    debugBoundingBoxPadding    : 0,
    ipeScale                   : 0.5
};
    */
}

function handleKeyUp(event) {
    if (event.keyCode == 16) {
        shiftDown = false;
    }
}

function mouseMove(event) {
    mouseY = window.innerHeight - event.clientY;

    if (!lockedSweepLine) {
        if (!shiftDown) {
            sweepLineY = mouseY;
        } else {
            sweepLineY = shiftDownY + Config.sloMoFactor * (mouseY - shiftDownY)
        }
    }

    if (currentProgram == ProgramType.VoronoiEvents)
        draw();
}

function programSelectorChanged(event) {
    let description = '';
        
    switch (event.target.value) {
        case "instant":
            currentProgram = ProgramType.VoronoiInstant;
            description = 'Click to add a point';
            break;
        
        case "events":
            currentProgram = ProgramType.VoronoiEvents;
            description = 'Your mouse controls the sweep line, press space to lock/unlock it';
            break;

        case "delaunay":
            currentProgram = ProgramType.Delaunay;
            description = 'Click to add a point';
            break;
    }

    let selector = document.getElementById('programSelector');
    selector.blur();

    document.getElementById('desc').innerHTML = description;
    draw();
}

function clickIpeButton() {
    let ipeButton = document.getElementById('ipeButton');
    let ipeTextarea = document.getElementById('ipeCode');

    ipeButton.blur();

    if (showingIpe) {
        ipeButton.value = "Ipe";
        ipeTextarea.style.display = 'none';
        showingIpe = false;
    } else {
        ipeButton.value = "Hide Ipe";
        ipeTextarea.value = generateIpeCode();
        ipeTextarea.style.display = 'block';
        showingIpe = true;
    }
}

function generateIpeCode() {
    let scale = Config.ipeScale
    let code = '';

    code += `<page>\n`;
    code += `<layer name="alpha"/>\n`;
    code += `<view layers="alpha" active="alpha"/>\n`;

    for (var op of currentDrawing) {
        switch (op.type) {
            case ShapeType.Circle:
            {
                let fill = ``;

                if (op.filled)
                    fill = ` fill="black"`;

                code += `<path layer="alpha" stroke="black"${fill}>\n`;
                code += `${scale * op.radius} 0 0 ${scale * op.radius} ${scale * op.x} ${scale * op.y} e\n`;
                code += `</path>\n`;
                
                break;
            };

            case ShapeType.LineSegment:
            {
                code += `<path layer="alpha" stroke="black">\n`;
                code += `${scale * op.x1} ${scale * op.y1} m\n`;
                code += `${scale * op.x2} ${scale * op.y2} l\n`;
                code += `</path>\n`;
                
                break;
            };

            case ShapeType.LineSequence:
            {
                code += `<path layer="alpha" stroke="black">\n`;

                for (var i = 0; i < op.points.length; i++) {
                    let point = op.points[i];
                    let ch = (i == 0) ? 'm' : 'l';
                    code += `${scale * point[0]} ${scale * point[1]} ${ch}\n`;
                }

                code += `</path>\n`;
                
                break;
            };
        }
    }

    code += `</page>`;

    return code;
}

function draw() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Clear drawing
    currentDrawing = [];

    switch(currentProgram) {
        case ProgramType.VoronoiInstant:
        {
            let [diagramPoints, diagramLines, diagramCircles, diagramTree] = computeVoronoiDiagramStatic(points, width, height);

            /*for (let point of diagramPoints) {
                currentDrawing.push(
                    circleShape(point.x, point.y, 3, true)
                );
            }*/

            for (let [from, to] of diagramLines) {
                currentDrawing.push(
                    lineSegmentShape(from.x, from.y, to.x, to.y)
                );
            }

            break;
        };

        case ProgramType.VoronoiEvents:
        {
            let [diagramBreakpoints, diagramLines, diagramCircles, diagramTree] = computeVoronoiDiagramEvents(points, sweepLineY, width, height);
            let pointCount = 0;
            let prevPoint = null;
            let prevShape = null;
            let [diagramBreakpointsPoints, diagramBreakpointsLabels] = diagramBreakpoints;

            for (let point of diagramBreakpointsPoints) {
                let label = diagramBreakpointsLabels[pointCount];

                currentDrawing.push(
                    circleShape(point.x, point.y, 3, true)
                );

                if (Config.debugShowBreakpointNames) {
                    if (prevPoint == null || Point.sub(point, prevPoint).norm() > 5.0) {
                        var shape = textShape(new Point(point.x + 10, point.y - 10), pointCount.toString() + ': ' + label, 15);
                        prevShape = shape;
                        currentDrawing.push(shape);
                    } else {
                        prevShape.str += ', ' + pointCount.toString() + ': ' + label;
                    }
                }

                pointCount++;
                prevPoint = point;
            }

            for (let [from, to] of diagramLines) {
                currentDrawing.push(
                    lineSegmentShape(from.x, from.y, to.x, to.y)
                );
            }

            for (let [center, radius] of diagramCircles) {
                if (sweepLineY >= center.y - radius) {
                    currentDrawing.push(
                        circleShape(center.x, center.y, radius, false)
                    );
                }
            }

            // Draw sweep line
            currentDrawing.push(
                lineSegmentShape(0, sweepLineY, width, sweepLineY)
            );

            // Draw beach line
            function poly(x, px, py) {
                if (py <= sweepLineY)
                    return Number.POSITIVE_INFINITY;

                return (x * x - 2 * px * x + px * px + py * py - sweepLineY * sweepLineY) / (2 * (py - sweepLineY));
            }

            function beachLinePolypart(x) {
                let value = Number.POSITIVE_INFINITY;

                for (let [px, py] of points) {
                    value = Math.min(value, poly(x, px, py));
                }

                if (value == Number.POSITIVE_INFINITY)
                    value = height;

                return Math.min(value, height);
            }

            var pointSequence = [];

            for (let i = 0; i < width; i += Config.beachLineStepSize) {
                pointSequence.push([i, beachLinePolypart(i)]);
            }

            currentDrawing.push(
                lineSequenceShape(pointSequence)
            );

            for (let [px, py] of points) {
                if (Math.abs(py - sweepLineY) < Config.epsilon && py >= sweepLineY) {
                    currentDrawing.push(
                        lineSegmentShape(px, py, px, beachLinePolypart(px))
                    );
                }
            }

            // Draw binary search tree
            let [treePoints, treeLines, treeLabels] = diagramTree;

            for (var point of treePoints) {
                currentDrawing.push(
                    circleShape(point.x, point.y, 4, true)
                );
            }

            for (var [lineFrom, lineTo] of treeLines) {
                currentDrawing.push(
                    lineSegmentShape(lineFrom.x, lineFrom.y, lineTo.x, lineTo.y)
                );
            }

            for (var [point, label] of treeLabels) {
                currentDrawing.push(
                    textShape(point, label, 12)
                );
            }

            break;
        };

        case ProgramType.Delaunay:
        {
            let diagramLines = computeDelaunayTriangulation(points, width, height);

            for (let [from, to] of diagramLines) {
                currentDrawing.push(
                    lineSegmentShape(from.x, from.y, to.x, to.y)
                );
            }

            break;
        };
    }

    // Draw points
    for (let [x, y] of points) {
        let radius = Config.pointFocusRadius;

        if (currentProgram == ProgramType.VoronoiEvents) {
            if (sweepLineY > y) {
                radius = Config.pointBlurRadius;
            }
        }

        currentDrawing.push(
            circleShape(x, y, radius, true)
        );
    }

    /* Remove this - just testing stuff ***********/
    /*for (var i = 2; i < points.length; i++) {
        var [x1, y1] = points[i - 2];
        var [x2, y2] = points[i - 1];
        var [x3, y3] = points[i];
        var p = new Point(x1, y1);
        var q = new Point(x2, y2);
        var r = new Point(x3, y3);
        var [center, radius] = circleThroughThreePoints(p, q, r);

        currentDrawing.push(circleShape(center.x, center.y, radius, false));
    }*/
    /*
    if (points.length > 1 && currentProgram == ProgramType.VoronoiEvents) {
        var [x1, y1] = points[points.length - 2];
        var [x2, y2] = points[points.length - 1];
        var bp = new BeachLineBreakpoint(new Point(x1, y1), new Point(x2, y2));

        var [x, y] = bp.key(sweepLineY);

        currentDrawing.push(circleShape(x, y, 4, true));
    }*/

    /*if (points.length >= 3) {
        var p = new Point(points[0][0], points[0][1]);
        var q = new Point(points[1][0], points[1][1]);
        var r = new Point(points[2][0], points[2][1]);

        var point = intersectBisectors(p, q, r);

        currentDrawing.push(circleShape(point.x, point.y, 4, false));
    }*/
    /************/

    // Perform drawing operations
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.lineStyle = '#000';
    canvasContext.fillStyle = '#000';
    canvasContext.lineWidth = 1;

    for (var op of currentDrawing) {
        switch (op.type) {
            case ShapeType.Circle:
            {
                canvasContext.beginPath();
                canvasContext.arc(op.x, op.y, op.radius, 0.0, 2.0 * Math.PI);
                canvasContext.closePath();

                if (op.filled)
                    canvasContext.fill();
                else
                    canvasContext.stroke();
                
                break;
            };

            case ShapeType.LineSegment:
            {
                canvasContext.beginPath();
                canvasContext.moveTo(op.x1, op.y1);
                canvasContext.lineTo(op.x2, op.y2);
                canvasContext.closePath();
                canvasContext.stroke();
                
                break;
            };

            case ShapeType.LineSequence:
            {
                canvasContext.beginPath();
            
                for (let [px, py] of op.points) {
                    canvasContext.lineTo(px, py);
                }
                
                canvasContext.stroke();
                
                break;
            };

            case ShapeType.Text:
                var transform = canvasContext.getTransform();
                
                canvasContext.font = op.size + 'px serif';
                canvasContext.translate(0, height);
                canvasContext.scale(1, -1);
                canvasContext.fillText(op.str, op.x, height - op.y);
                canvasContext.setTransform(transform);
                
                break;
        }
    }

    // Update Ipe if visible
    if (showingIpe) {
        let ipeTextarea = document.getElementById('ipeCode');
        ipeTextarea.value = generateIpeCode();
    }
}

document.addEventListener('DOMContentLoaded', init);