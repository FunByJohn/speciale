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
        this.point = point;
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

    insert(point) {
        let _this = this;
        let updatedTree = false;
        let prevNode = null;
        let node = this.root;
        let isLeft;

        function setNode(newNode) {
            if (prevNode == null) {
                _this.root = newNode;
            } else {
                if (isLeft) {
                    prevNode.left = newNode;
                } else {
                    prevNode.right = newNode;
                }
            }

            updatedTree = true;
        }

        while (!updatedTree) {
            if (node == null) {
                /*
                  0 -> a
                */
                var arc = new BeachLineArc(point);
                setNode(arc);
            } else if (node.type == BeachLineNodeType.Arc) {
                /*
                         x
                        / \
                  a -> a1  y
                          / \
                         b  a2
                */
                var oldPoint = node.point;
                var x = new BeachLineBreakpoint(oldPoint, point);
                var y = new BeachLineBreakpoint(point, oldPoint);

                x.left = new BeachLineArc(oldPoint);
                x.right = y;

                y.left = new BeachLineArc(point);
                y.right = new BeachLineArc(oldPoint);

                setNode(x);
            } else if (node.type == BeachLineNodeType.Breakpoint) {
                prevNode = node;
                if (point.x < node.key(point.y)) {
                    node = node.left;
                    isLeft = true;
                } else {
                    node = node.right;
                    isLeft = false;
                }
            }
        }
    }

    debugFindPoints(node, sweepLineY, points) {
        if (node === undefined)
            node = this.root;

        if (node != null) {
            if (node.type == BeachLineNodeType.Arc) {
                // do nothing
            } else if (node.type == BeachLineNodeType.Breakpoint) {
                this.debugFindPoints(node.left, sweepLineY, points);
                points.push(node.location(sweepLineY));
                this.debugFindPoints(node.right, sweepLineY, points);
            }
        }
    }
}

class BeachLineArc {
    constructor(point) {
        this.type = BeachLineNodeType.Arc;
        this.point = point;
        this.circleEvent = null;
    }

    toString() {
        return 'Arc ' + this.point;
    }
}

class BeachLineBreakpoint {
    constructor(leftPoint, rightPoint) {
        this.type = BeachLineNodeType.Breakpoint;
        this.pair = [leftPoint, rightPoint];
        this.halfEdge = null; // TODO
        this.left = null;
        this.right = null;
        this.treapPriority = Math.random();
    }

    location(sweepLineY) {
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

        return new Point(r, y);
    }

    key(sweepLineY) {
        return this.location(sweepLineY).x;
    }

    toString() {
        return 'Breakpoint for (' + this.pair[0] + ', ' + this.pair[1] + ')';
    }
}

/*
 *  Compute Voronoi diagram
 */

class VoronoiDiagram {
    constructor(points, sweepLineY) {
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
        this.compute(sweepLineY);
    }

    compute(sweepLineY) {
        if (sweepLineY === undefined) {
            sweepLineY = Number.NEGATIVE_INFINITY;
        }

        // console.log("Computing Voronoi diagram...");

        while (!this.queue.isEmpty()) {
            var event = this.queue.remove();

            if (event.point.y < sweepLineY) {
                break;
            }

            if (event.type == EventType.Site) {
                this.handleSiteEvent(event);
            } else if (event.type == EventType.Circle) {
                this.handleCircleEvent(event);
            }
        }
    }

    handleSiteEvent(event) {
        // console.log("Site event! " + event.point);

        this.beachLine.insert(event.point);
    }

    handleCircleEvent(event) {
        // console.log("Circle event!");
    }

    debugGetTreeState(sweepLineY) {
        let points = [];

        this.beachLine.debugFindPoints(undefined, sweepLineY, points);

        return points;
    }
}

function computeVoronoiDiagramStatic(points, width, height) {
    let diagramPoints = [];
    let diagramLines = [];
    let diagram = new VoronoiDiagram(points);

    return [diagramPoints, diagramLines];
}

function computeVoronoiDiagramEvents(points, sweepLineY, width, height) {
    let diagramPoints = [];
    let diagramLines = [];
    let diagram = new VoronoiDiagram(points, sweepLineY);

    diagramPoints = diagram.debugGetTreeState(sweepLineY);

    return [diagramPoints, diagramLines];
}