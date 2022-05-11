'use strict';

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
    constructor() {
        this.type = EventType.Circle;
    }

    queuePriority() {
        return 0;
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
 *  Tree 
 */

class BeachLineTree {
    constructor() {

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
        this.beachLine = new BeachLineTree();
        /* this.dcel = new DCEL(); */

        this.setupSiteEvents();
    }

    setupSiteEvents() {
        for (var point of this.points) {
            this.queue.add(new SiteEvent(point));
        }
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

    /*let diagram = new VoronoiDiagram(points);
    diagram.compute();*/  

    return lines;
}

function computeVoronoiDiagramEvents(points, sweepLineY, width, height) {
    var newPoints = [];

    for (let [x, y] of points) {
        newPoints.push([x, Math.max(y, sweepLineY)]);
    }

    return computeVoronoiDiagramStatic(newPoints, width, height);
}