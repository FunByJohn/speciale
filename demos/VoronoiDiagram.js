'use strict';

function circleThroughThreePoints(x1, y1, x2, y2, x3, y3) {
    let det = 4 * (-x2 * y1 + x3 * y1 + x1 * y2 - x3 * y2 - x1 * y3 + x2 * y3);
    let squareSum1 = (x1 ** 2 - x2 ** 2 + y1 ** 2 - y2 ** 2);
    let squareSum2 = (x1 ** 2 - x3 ** 2 + y1 ** 2 - y3 ** 2);
    let centerX = (2 * squareSum1 * (y1 - y3) - 2 * squareSum2 * (y1 - y2)) / det;
    let centerY = (2 * squareSum2 * (x1 - x2) - 2 * squareSum1 * (x1 - x3)) / det;
    let radius = Math.sqrt((centerX - x1) ** 2 + (centerY - y1) ** 2);

    return [centerX, centerY, radius];
}

/*
 *  Miscellaneous types
 */

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return `Point(${this.x}, ${this.y})`;
    }
}

class EventType {
    static Site = new EventType('Site');
    static Circle = new EventType('Circle');

    constructor(name) {
        this.name = name;
    }

    toString() {
        return `EventType.${this.name}`;
    }
}

class SiteEvent {
    constructor(point) {
        this.type = EventType.Site;
        this.point = point;
    }

    queuePriority() {
        return this.point.y;
    }

    toString() {
        return `SiteEvent@${this.point}`;
    }
}

class CircleEvent {
    constructor(point, arc) {
        this.type = EventType.Circle;
        this.lowestPoint = point;
        this.arc = arc;
    }

    queuePriority() {
        return this.lowestPoint.y;
    }

    toString() {
        return `CircleEvent`;
    }
}

/*
 *  Event queue
 */

class EventQueue {
    constructor() {
        this.array = [];
    }

    add(element) {
        // assumption: `element` has a member function called queuePriority

        this.array.push(element);
    }

    remove() {
        // assumption: queue is not empty
        
        let bestIndex = -1;
        let bestPriority = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < this.array.length; i++) {
            let element = this.array[i];
            let priority = element.queuePriority();

            if (priority > bestPriority) {
                bestPriority = priority;
                bestIndex = i;
            }
        }

        let bestElement = this.array[bestIndex];
        this.array.splice(bestIndex, 1);

        return bestElement;
    }

    isEmpty() {
        return this.array.length == 0;
    }
}

/*
 *  Beach line binary search tree
 */

class BeachLineNodeType {
    static Arc = new BeachLineNodeType('Arc');
    static Breakpoint = new BeachLineNodeType('Breakpoint');

    constructor(name) {
        this.name = name;
    }

    toString() {
        return `BeachLineNodeType.${this.name}`;
    }
}

class BeachLine {
    constructor() {
        this.root = null;
    }

    insert(element) {
        // Assumption: `element` is either of type BeachLineArc or BeachLineBreakpoint

        if (this.root == null) {
            if (element.type == BeachLineNodeType.Arc) {
                this.root = element;
            } else {
                console.log("Warning! Called BeachLine.insert with a breakpoint when tree is empty!");
            }
        } else {

        }
    }
}

class BeachLineArc {
    constructor(point) {
        this.type = BeachLineNodeType.Arc;
        this.point = point;
        this.circleEvent = null;
    }

    key(sweepLineY) {
        return point.x;
    }
}

class BeachLineBreakpoint {
    constructor(left, right) {
        this.type = BeachLineNodeType.Breakpoint;
        this.pair = [left, right];
        this.halfEdge = null; // TODO
    }

    key(sweepLineY) {
        // Compute intersection between (pair.0, pair.1) in that order
        let px = this.pair[0].x;
        let py = this.pair[0].y;
        let qx = this.pair[1].x;
        let qy = this.pair[1].y;
        let ly = sweepLineY;
        let hp = py - ly;
        let hq = qy - ly;
        let a = 0.5 * (1 / hp - 1 / hq);
        let b = qx / hq - px / hp;
        let d = Math.sqrt(((px - qx) ** 2 + (py - qy) ** 2) / (hp * hq));
        let r1 = (-b - d) / (2 * a);
        let r2 = (-b + d) / (2 * a);
        let r;
        let y;

        if ((r1 - px) * (qy - ly) > (r1 - qx) * (py - ly)) {
            r = r1;
            y = (r ** 2 - 2 * px * r + px ** 2 + py ** 2 - ly ** 2) / (2 * (py - ly));
        } else {
            r = r2;
            y = (r ** 2 - 2 * qx * r + qx ** 2 + qy ** 2 - ly ** 2) / (2 * (qy - ly));
        }

        return [r, y];
    }
}

/*
 *  Compute Voronoi diagram
 */

class VoronoiDiagram {
    constructor(points) {
        this.points = [];

        for (let [x, y] of points) {
            this.points.push(new Point(x, y));
        }

        this.queue = new EventQueue();
        this.beachLine = new BeachLine();
        /* this.dcel = new DCEL(); */

        // Setup site events
        for (var point of this.points) {
            this.queue.add(new SiteEvent(point));
        }

        // Compute diagram
        this.compute();
    }

    compute() {
        console.log("Computing Voronoi diagram...");

        while (!this.queue.isEmpty()) {
            var event = this.queue.remove();

            if (event.type == EventType.Site) {
                this.handleSiteEvent(event);
            } else if (event.type == EventType.Circle) {
                this.handleCircleEvent(event);
            }
        }
    }

    handleSiteEvent(event) {
        console.log("Site event! " + event.point);
    }

    handleCircleEvent(event) {
        console.log("Circle event!");
    }
}

function computeVoronoiDiagramStatic(points, width, height) {
    let lines = [];

    /*let diagram = new VoronoiDiagram(points);*/  

    return lines;
}

function computeVoronoiDiagramEvents(points, sweepLineY, width, height) {
    var newPoints = [];

    for (let [x, y] of points) {
        newPoints.push([x, Math.max(y, sweepLineY)]);
    }

    return computeVoronoiDiagramStatic(newPoints, width, height);
}