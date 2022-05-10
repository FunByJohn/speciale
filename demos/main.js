// TODO: Make current drawing easily exportable to TikZ

const ProgramType = {
    VoronoiInstant : 1,
    VoronoiEvents  : 2,
    Delaunay       : 3
};

const ShapeType = {
    Circle       : 1,
    LineSegment  : 2,
    LineSequence : 3
};

let currentProgram = ProgramType.VoronoiInstant;
let canvasElement;
let canvasContext;
let points = [];
let mouseY = 0;
let sweepLineY = 0;
let lockedSweepLine = false;
let showingTikZ = false;
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

function init(event) {
    canvasElement = document.getElementById('view');
    canvasContext = canvasElement.getContext('2d');

    resizeWindow();

    let selector = document.getElementById('programSelector');
    let tikzButton = document.getElementById('tikzButton');
    
    selector.addEventListener('change', programSelectorChanged);
    tikzButton.addEventListener('click', clickTikZButton);

    window.addEventListener('resize', resizeWindow);
    window.addEventListener('keydown', handleKey);
    
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

function handleKey(event) {
    if (event.keyCode == 32) {
        lockedSweepLine = !lockedSweepLine;

        if (!lockedSweepLine) {
            sweepLineY = mouseY;
            draw();
        }
    }
}

function mouseMove(event) {
    mouseY = window.innerHeight - event.clientY;

    if (!lockedSweepLine)
        sweepLineY = mouseY;

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

function clickTikZButton() {
    let tikzButton = document.getElementById('tikzButton');
    let tikzTextarea = document.getElementById('tikzCode');

    tikzButton.blur();

    if (showingTikZ) {
        tikzButton.value = "TikZ";
        tikzTextarea.style.display = 'none';
        showingTikZ = false;
    } else {
        tikzButton.value = "Hide TikZ";
        tikzTextarea.value = generateTikZCode();
        tikzTextarea.style.display = 'block';
        showingTikZ = true;
    }
}

function generateTikZCode() {
    var code = '';
    var indent = '  ';

    code += '\\begin{tikzpicture}[x=0.01cm,y=0.01cm]\n';

    for (var op of currentDrawing) {
        switch (op.type) {
            case ShapeType.Circle:
            {
                let fill = '';

                if (op.filled)
                    fill = '[black,fill=black]';

                code += `${indent}\\draw${fill} (${op.x},${op.y}) circle (${op.radius});\n`;
                
                break;
            };

            case ShapeType.LineSegment:
            {
                code += `${indent}\\draw (${op.x1},${op.y1}) -- (${op.x2},${op.y2});\n`;
                
                break;
            };

            case ShapeType.LineSequence:
            {
                let transformed = op.points.map(p => `(${p[0]},${p[1]})`);

                code += `${indent}\\draw ${transformed.join(' -- ')};\n`;
                
                break;
            };
        }
    }

    code += '\\end{tikzpicture}';

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
            let lines = computeVoronoiDiagramStatic(points, width, height);

            for (let [x1, y1, x2, y2] of lines) {
                currentDrawing.push(
                    lineSegmentShape(x1, y1, x2, y2)
                );
            }

            break;
        };

        case ProgramType.VoronoiEvents:
        {
            let lines = computeVoronoiDiagramEvents(points, sweepLineY, width, height);

            for (let [x1, y1, x2, y2] of lines) {
                currentDrawing.push(
                    lineSegmentShape(x1, y1, x2, y2)
                );
            }

            // Draw sweep line
            currentDrawing.push(
                lineSegmentShape(0, sweepLineY, width,  sweepLineY)
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

                return value;
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

            break;
        };

        case ProgramType.Delaunay:
        {
            let lines = computeDelaunayTriangulation(points, width, height);

            for (let [x1, y1, x2, y2] of lines) {
                currentDrawing.push(
                    lineSegmentShape(x1, y1, x2, y2)
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
        }
    }

    // Update TikZ if visible
    if (showingTikZ) {
        let tikzTextarea = document.getElementById('tikzCode');
        tikzTextarea.value = generateTikZCode();
    }
}

document.addEventListener('DOMContentLoaded', init);