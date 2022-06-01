'use strict';

class DeterministicUIDGenerator {
    static state = [];
    static index = 0;

    static reset() {
        DeterministicUIDGenerator.index = 0;
    }

    static generate() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        
        let uid;

        if (DeterministicUIDGenerator.state.length <= DeterministicUIDGenerator.index) {
            let index = DeterministicUIDGenerator.index;
            let digits = [];

            do {
                let ch = index % alphabet.length;
                digits.push(alphabet.charAt(ch));
                index = Math.floor(index / alphabet.length);
            } while (index > 0);

            uid = digits.reverse().join('');
            
            DeterministicUIDGenerator.state.push(uid);
        } else {
            uid = DeterministicUIDGenerator.state[DeterministicUIDGenerator.index];
        }

        DeterministicUIDGenerator.index++;

        return uid;
    }
}

function doRaysIntersect(ray1Start, ray1Dir, ray2Start, ray2Dir) {
    let matrix = Matrix.withColumns(ray1Dir, ray2Dir);

    if (matrix.determinant() == 0) {
        return false;
    }

    let solution = matrix.inverse().apply(Point.sub(ray2Start, ray1Start));
    let s = solution.x;
    let t = -solution.y;

    return (s >= 0 && t >= 0);
}

function intersectBisectors(p, q, r) {
    let m1 = Point.midpoint(p, q);
    let m2 = Point.midpoint(q, r);
    let d1 = Point.sub(q, p).hat();
    let d2 = Point.sub(r, q).hat();
    let solution = Matrix.withColumns(d1, d2).inverse().apply(Point.sub(m2, m1));
    let s = solution.x;

    return Point.add(m1, d1.scale(s));
}

function circleThroughThreePoints(p, q, r) {
    let center = intersectBisectors(p, q, r);
    let radius = Point.sub(center, p).norm();

    return [center, radius];
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

    scale(factor) {
        return new Point(factor * this.x, factor * this.y);
    }

    hat() {
        return new Point(-this.y, this.x);
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    copy() {
        return new Point(this.x, this.y);
    }

    // this is not an |p1 - p2| < epsilon check on purpose
    static equals(p1, p2) {
        return (p1.x == p2.x && p1.y == p2.y);
    }

    static add(p1, p2) {
        return new Point(p1.x + p2.x, p1.y + p2.y);
    }

    static sub(p1, p2) {
        return new Point(p1.x - p2.x, p1.y - p2.y);
    }

    static midpoint(p1, p2) {
        return Point.add(p1, p2).scale(0.5);
    }
}

class Matrix {
    constructor(a, b, c, d) {
        this.a = a; this.b = b;
        this.c = c; this.d = d;
    }

    static withColumns(v1, v2) {
        return new Matrix(
            v1.x, v2.x,
            v1.y, v2.y
        );
    }

    determinant() {
        return this.a * this.d - this.b * this.c;
    }

    inverse() {
        let det = this.determinant();

        if (det == 0) {
            throw new Error("Matrix was not invertible!");
        }

        let invDet = 1 / det;

        return new Matrix(
             invDet * this.d, -invDet * this.b,
            -invDet * this.c,  invDet * this.a
        );
    }

    apply(v) {
        return new Point(
            this.a * v.x + this.b * v.y,
            this.c * v.x + this.d * v.y
        );
    }
}

class Site {
    static indexCounter = 0;

    static resetCounter() {
        Site.indexCounter = 0;
    }

    constructor(position) {
        this.position = position;
        this.index = Site.indexCounter;
        Site.indexCounter++;
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
        this.site = new Site(point);
    }

    queuePriority() {
        return this.point.y;
    }

    toString() {
        return `SiteEvent@${this.point}`;
    }
}

class CircleEvent {
    constructor(point, vertexPoint, arc) {
        this.type = EventType.Circle;
        this.point = point;
        this.vertexPoint = vertexPoint;
        this.arc = arc;
        this.debugDesc = null;
    }

    queuePriority() {
        return this.point.y;
    }

    toString() {
        return `CircleEvent for ${this.arc.uid}`;
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

    cancel(event) {
        let index = this.array.indexOf(event);
        //console.log("Cancel index: " + index);
        this.array.splice(index, 1);
    }

    isEmpty() {
        return this.array.length == 0;
    }

    debugGetCircleEvents() {
        var list = [];
        
        for (var i = 0; i < this.array.length; i++) {
            var event = this.array[i];
            if (event.type == EventType.Circle) {
                list.push(event.debugDesc);
            }
        }

        return list;
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
    constructor(queue, dcel) {
        this.root = null;
        this.queue = queue;
        this.dcel = dcel;
    }

    insert(event) {
        let _this = this;
        let point = event.point;
        let updatedTree = false;
        let prevNode = null;
        let node = this.root;
        let isLeft;
        let newArc;

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
                let arc = new BeachLineArc(point);
                setNode(arc);
                newArc = arc;
            } else if (node.type == BeachLineNodeType.Arc) {
                /*
                         x
                        / \
                  a -> a1  y
                          / \
                         b  a2
                */
                let oldPoint = node.point;
                let a        = node;
                let x        = new BeachLineBreakpoint(oldPoint, point);
                let y        = new BeachLineBreakpoint(point, oldPoint);
                let a1       = new BeachLineArc(oldPoint);
                let b        = new BeachLineArc(point);
                let a2       = new BeachLineArc(oldPoint);

                x.uid = DeterministicUIDGenerator.generate();
                y.uid = DeterministicUIDGenerator.generate();

                x.left  = a1;
                x.right = y;
                y.left  = b;
                y.right = a2;

                newArc = b;

                // Setup arc pointers
                a1.leftArc  = a.leftArc;
                a1.rightArc = b;
                b.leftArc   = a1;
                b.rightArc  = a2;
                a2.leftArc  = b;
                a2.rightArc = a.rightArc;

                if (a.leftArc != null)
                    a.leftArc.rightArc = a1;

                if (a.rightArc != null)
                    a.rightArc.leftArc = a2;

                // Delete circle event
                if (a.circleEvent != null) {
                    this.queue.cancel(a.circleEvent);
                    a.circleEvent = null;
                }

                // Update DCEL
                this.dcel.siteEvent(event.site, x, y);

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

        return newArc;
    }

    findBreakpoint(leftPoint, rightPoint, sweepLineY) {
        // assumption: this is called on a tree which has a breakpoint as root

        let breakpointCopy = new BeachLineBreakpoint(leftPoint, rightPoint);
        let value = breakpointCopy.key(sweepLineY);
        let node = this.root;
        let parent = null;
        let backtrackNode = null;
        let backtrackParent = null;

        /*console.log("----------------");
        console.log("Left point:");
        console.log(leftPoint);
        console.log("Right point:");
        console.log(rightPoint);
        console.log("Value:");
        console.log(value);*/

        while (true) {
            /*console.log("Node:");
            console.log(node);*/

            /*if (parent != null && node != null) {
                console.log(parent.left === node || parent.right === node);
            }*/

            if (node == null || node.type == BeachLineNodeType.Arc) {
                if (backtrackNode != null) {
                    node = backtrackNode;
                    parent = backtrackParent;
                } else {
                    if (node == null) {
                        throw new Error("Could not find breakpoint which theoretically should exist!");
                    }

                    if (node.type == BeachLineNodeType.Arc) {
                        let points = [];
                        this.debugFindPoints(undefined, sweepLineY, points, []);
                        throw new Error("Found arc when looking for breakpoint! " + points);
                    }
                }
            }
            
            if (Point.equals(node.pair[0], leftPoint) && Point.equals(node.pair[1], rightPoint)) {
                break;
            } else {
                let oppositeChoice = false;

                if (Math.abs(node.key(sweepLineY) - value) < Config.epsilon) {
                    if (backtrackNode == null) {
                        backtrackNode = node;
                        backtrackParent = parent;
                    } else {
                        oppositeChoice = true;
                    }
                }

                let check = (value < node.key(sweepLineY)); /* && node != null && node.left.type != BeachLineNodeType.Arc */
                if (oppositeChoice) check = !check;

                if (check) {
                    parent = node;
                    node = node.left;
                } else {
                    parent = node;
                    node = node.right;
                }
            }
        }

        return [node, parent];
    }

    remove(arc, sweepLineY) {
        let leftArc = arc.leftArc;
        let rightArc = arc.rightArc;
        let [leftBreakpoint, leftParent] = this.findBreakpoint(leftArc.point, arc.point, sweepLineY);
        let [rightBreakpoint, rightParent] = this.findBreakpoint(arc.point, rightArc.point, sweepLineY);
        let newBreakpoint = new BeachLineBreakpoint(leftArc.point, rightArc.point);

        /*leftBreakpoint.dcelVertex.detachBreakpoint(sweepLineY);
        rightBreakpoint.dcelVertex.detachBreakpoint(sweepLineY);*/

        this.dcel.circleEvent(sweepLineY, leftBreakpoint.dcelVertex, rightBreakpoint.dcelVertex, newBreakpoint);

        newBreakpoint.uid = DeterministicUIDGenerator.generate();

        /*console.log("Left: " + leftBreakpoint.uid);
        console.log("Right: " + rightBreakpoint.uid);
        console.log("Left parent: " + leftParent.uid);
        console.log("Right parent: " + rightParent.uid);*/

        if (rightBreakpoint.left === arc) {
            // `leftBreakpoint` is an ancestor of `rightBreakpoint` in the tree
            newBreakpoint.left = leftBreakpoint.left;
            newBreakpoint.right = leftBreakpoint.right;

            //console.log([rightParent != null, rightParent.left === rightBreakpoint, rightParent.right === rightBreakpoint, rightBreakpoint.right]);

            if (leftParent == null) {
                this.root = newBreakpoint;
            } else {
                //console.log("left o ye")

                if (leftParent.left === leftBreakpoint) {
                    leftParent.left = newBreakpoint;
                } else if (leftParent.right === leftBreakpoint) {
                    leftParent.right = newBreakpoint;
                }
            }

            if (rightParent === leftBreakpoint) {
                newBreakpoint.right = rightBreakpoint.right;
            } else {
                if (rightParent.left === rightBreakpoint) {
                    rightParent.left = rightBreakpoint.right;
                } else if (rightParent.right === rightBreakpoint) {
                    rightParent.right = rightBreakpoint.right;
                }
            }
        } else if (leftBreakpoint.right === arc) {
            // `rightBreakpoint` is an ancestor of `leftBreakpoint` in the tree
            newBreakpoint.left = rightBreakpoint.left;
            newBreakpoint.right = rightBreakpoint.right;

            if (rightParent == null) {
                this.root = newBreakpoint;
            } else {
                //console.log("right o ye");

                if (rightParent.left === rightBreakpoint) {
                    rightParent.left = newBreakpoint;
                } else if (rightParent.right === rightBreakpoint) {
                    rightParent.right = newBreakpoint;
                }
            }

            if (leftParent === rightBreakpoint) {
                newBreakpoint.left = leftBreakpoint.left;
            } else {
                if (leftParent.left === leftBreakpoint) {
                    leftParent.left = leftBreakpoint.left;
                } else if (leftParent.right === leftBreakpoint) {
                    leftParent.right = leftBreakpoint.left;
                }
            }
        } else {
            console.log("oh no");
        }

        leftArc.rightArc = rightArc;
        rightArc.leftArc = leftArc;
    }

    debugFindPoints(node, sweepLineY, points, labels) {
        if (node === undefined)
            node = this.root;

        if (node != null) {
            if (node.type == BeachLineNodeType.Arc) {
                // do nothing
            } else if (node.type == BeachLineNodeType.Breakpoint) {
                this.debugFindPoints(node.left, sweepLineY, points, labels);
                points.push(node.location(sweepLineY));
                labels.push(node.uid);
                this.debugFindPoints(node.right, sweepLineY, points, labels);
            }
        }
    }
}

class BeachLineArc {
    constructor(point) {
        this.type = BeachLineNodeType.Arc;
        this.point = point;
        this.circleEvent = null;
        this.leftArc = null;
        this.rightArc = null;
        this.uid = DeterministicUIDGenerator.generate().toUpperCase();
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
        this.uid = '';
        this.dcelVertex = null;
    }

    location(sweepLineY) {
        let px = this.pair[0].x;
        let py = this.pair[0].y;
        let qx = this.pair[1].x;
        let qy = this.pair[1].y;
        let ly = sweepLineY;

        if (py == ly) {
            return new Point(px, (px ** 2 - 2 * qx * px + qx ** 2 + qy ** 2 - ly ** 2) / (2 * (qy - ly)));
        } else if (qy == ly) {
            return new Point(qx, (qx ** 2 - 2 * px * qx + px ** 2 + py ** 2 - ly ** 2) / (2 * (py - ly)));
        }

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
        this.dcel = new DCEL();
        this.beachLine = new BeachLine(this.queue, this.dcel);

        // Setup site events
        for (let point of this.points) {
            this.queue.add(new SiteEvent(point));
        }

        this.debugCircleEvents = [];

        // Compute diagram
        this.compute(sweepLineY);
    }

    compute(sweepLineY) {
        if (sweepLineY === undefined) {
            sweepLineY = Number.NEGATIVE_INFINITY;
        }

        // console.log("Computing Voronoi diagram...");

        while (!this.queue.isEmpty()) {
            let event = this.queue.remove();

            if (event.point.y < sweepLineY) {
                this.queue.add(event); // needs to be done in order to draw the last circle event during debugging
                break;
            }

            if (event.type == EventType.Site) {
                this.handleSiteEvent(event);
            } else if (event.type == EventType.Circle) {
                this.handleCircleEvent(event);
            }
        }
    }

    maybeAddCircleEvent(sweepLineY, arc1, arc2, arc3) {
        if (arc1 == null || arc2 == null || arc3 == null)
            return;

        let p1 = arc1.point;
        let p2 = arc2.point;
        let p3 = arc3.point;
        let leftBreakpoint = new BeachLineBreakpoint(p1, p2);
        let rightBreakpoint = new BeachLineBreakpoint(p2, p3);
        let ray1Start = leftBreakpoint.location(sweepLineY);
        let ray2Start = rightBreakpoint.location(sweepLineY);
        let ray1Dir = Point.sub(leftBreakpoint.location(sweepLineY - 1), ray1Start);
        let ray2Dir = Point.sub(rightBreakpoint.location(sweepLineY - 1), ray2Start);

        if (doRaysIntersect(ray1Start, ray1Dir, ray2Start, ray2Dir)) {
            // breakpoints are converging
            let [center, radius] = circleThroughThreePoints(p1, p2, p3);
            let lowestPoint = Point.sub(center, new Point(0, radius));
            let event = new CircleEvent(lowestPoint, center, arc2);

            event.debugDesc = [center.copy(), radius];

            arc2.circleEvent = event;

            this.queue.add(event);
        }
    }

    handleSiteEvent(event) {
        // console.log("Site event! " + event.point);

        this.dcel.setFirstSite(event.site);

        let arc = this.beachLine.insert(event);
        let sweepLineY = event.point.y;

        this.maybeAddCircleEvent(
            sweepLineY,
            (arc.leftArc != null) ? arc.leftArc.leftArc : null,
            arc.leftArc,
            arc
        );

        this.maybeAddCircleEvent(
            sweepLineY,
            arc,
            arc.rightArc,
            (arc.rightArc != null) ? arc.rightArc.rightArc : null
        );
    }

    handleCircleEvent(event) {
        // console.log("Circle event!");

        //console.log(event.involvesArc(event.arc));

        let arc = event.arc;
        let sweepLineY = event.point.y;
        let leftArc = arc.leftArc;
        let rightArc = arc.rightArc;
        let leftLeftArc = (leftArc != null) ? leftArc.leftArc : null;
        let rightRightArc = (rightArc != null) ? rightArc.rightArc : null;

        //console.log([leftArc.circleEvent, rightArc.circleEvent]);

        if (leftArc.circleEvent != null) {
            //console.log("Cancelled left");
            this.queue.cancel(leftArc.circleEvent);
            leftArc.circleEvent = null;
        }

        if (rightArc.circleEvent != null) {
            //console.log("Cancelled right");
            this.queue.cancel(rightArc.circleEvent);
            rightArc.circleEvent = null;
        }

        this.beachLine.remove(arc, sweepLineY);

        //console.log([leftLeftArc, leftArc, rightArc, rightRightArc]);

        this.maybeAddCircleEvent(
            sweepLineY,
            leftLeftArc,
            leftArc,
            rightArc
        );

        this.maybeAddCircleEvent(
            sweepLineY,
            leftArc,
            rightArc,
            rightRightArc
        );
    }

    debugGetTreeState(sweepLineY) {
        let points = [];
        let labels = [];

        this.beachLine.debugFindPoints(undefined, sweepLineY, points, labels);

        return [points, labels];
    }

    debugDrawTree(x, y, w, h) {
        let treePoints = [];
        let treeLines = [];
        let treeLabels = [];

        function transformPoint(p) {
            return new Point(p.x, window.innerHeight - p.y);
        }

        function rec(node, x, y, w) {
            let p = transformPoint(new Point(x + w/2, y));
            treePoints.push(p);

            if (node.type == BeachLineNodeType.Breakpoint) {
                treeLabels.push([Point.add(p, new Point(-5, 10)), node.uid]);
            }

            if (node.type == BeachLineNodeType.Arc) {
                treeLabels.push([Point.add(p, new Point(-5, 10)), node.uid]);

                let leftArc = (node.leftArc != null ? node.leftArc.uid : '--');
                let rightArc = (node.rightArc != null ? node.rightArc.uid : '--');
                
                treeLabels.push([Point.add(p, new Point(-17, -20)), '(' + leftArc + ', ' + rightArc + ')']);
            }

            if (node.left != null) {
                let l = rec(node.left, x, y + h, w/2);
                treeLines.push([p, l]);
            }

            if (node.right != null) {
                let r = rec(node.right, x + w/2, y + h, w/2);
                treeLines.push([p, r]);
            }

            return p;
        }

        if (this.beachLine.root != null)
            rec(this.beachLine.root, x, y, w, h);

        return [treePoints, treeLines, treeLabels];
    }
}

function computeVoronoiDiagramStatic(points, width, height) {
    let diagram = new VoronoiDiagram(points);

    return [[], [], [], []];
}

function computeVoronoiDiagramEvents(points, sweepLineY, width, height) {
    DeterministicUIDGenerator.reset();
    Site.resetCounter();

    let diagramBreakpoints = [];
    let diagramLines = [];
    let diagramCircles = [];
    let diagramTree = [[], [], []];
    let diagram = new VoronoiDiagram(points, sweepLineY);

    diagramBreakpoints = diagram.debugGetTreeState(sweepLineY);

    if (Config.debugShowCircleEvents)
        diagramCircles = diagram.queue.debugGetCircleEvents();

    if (Config.debugShowTree)
        diagramTree = diagram.debugDrawTree((2/3) * width - 50, 40, (1/3) * width, 50);

    let [dcelVerts, dcelLines] = diagram.dcel.getDisplayLists(sweepLineY);

    diagramLines = dcelLines;

    return [diagramBreakpoints, diagramLines, diagramCircles, diagramTree];
}