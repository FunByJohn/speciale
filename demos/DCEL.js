class DCEL {
    constructor() {
        this.vertices = [];
        this.faces = [];
        this.halfEdges = [];
    }

    siteEvent(leftBreakpoint, rightBreakpoint) {
        let halfEdge = new DCEL_HalfEdge();
        let oppositeHalfEdge = new DCEL_HalfEdge();
        let fromVertex = new DCEL_Vertex();
        let toVertex = new DCEL_Vertex();

        fromVertex.attachBreakpoint(rightBreakpoint);
        fromVertex.edge = halfEdge;

        toVertex.attachBreakpoint(leftBreakpoint);
        toVertex.edge = oppositeHalfEdge;

        halfEdge.origin = fromVertex;
        halfEdge.twin = oppositeHalfEdge;

        oppositeHalfEdge.origin = toVertex;
        oppositeHalfEdge.twin = halfEdge;

        this.vertices.push(fromVertex);
        this.vertices.push(toVertex);
        this.halfEdges.push(halfEdge);
        this.halfEdges.push(oppositeHalfEdge);

        // TODO: maybe we can set .face based on info in left- and rightBreakpoint!
    }

    circleEvent(sweepLineY, vertex1, vertex2, newBreakpoint) {
        vertex1.detachBreakpoint(sweepLineY);
        vertex2.detachBreakpoint(sweepLineY);

        let edge1 = vertex1.edge;
        let edge2 = vertex2.edge;

        edge2.origin = edge1.origin;
        // TODO: Delete edge2.origin vertex so we don't have two vertices at the same spot

        let halfEdge = new DCEL_HalfEdge();
        let oppositeHalfEdge = new DCEL_HalfEdge();
        let fromVertex = vertex1;
        let toVertex = new DCEL_Vertex();

        toVertex.attachBreakpoint(newBreakpoint);
        toVertex.edge = oppositeHalfEdge;

        halfEdge.origin = fromVertex;
        halfEdge.twin = oppositeHalfEdge;

        oppositeHalfEdge.origin = toVertex;
        oppositeHalfEdge.twin = halfEdge;

        function pair(fromEdge, toEdge) {
            fromEdge.next = toEdge;
            toEdge.prev = fromEdge;
        }

        pair(edge1.twin, edge2);
        pair(oppositeHalfEdge, edge1);
        pair(edge2.twin, halfEdge);

        this.vertices.push(toVertex);
        this.halfEdges.push(halfEdge);
        this.halfEdges.push(oppositeHalfEdge);

        // TODO: Refactor the last part by making a general function that both createHalfEdge and joinVerticesAndStartNewEdge calls
    }

    getDisplayLists(sweepLineY) {
        let vertices = [];
        let lines = [];

        for (let halfEdge of this.halfEdges) {
            let from = halfEdge.origin.getPosition(sweepLineY);
            let to = halfEdge.twin.origin.getPosition(sweepLineY);
            let dir = Point.sub(to, from);
            let len = dir.norm();
            let unitDir = dir.scale(1 / len);
            let offset = unitDir.hat().scale(5.0);
            let arrowStart = 10.0;
            let mid = Point.add(from, to).scale(0.5);

            from = Point.add(from, offset);
            to = Point.add(to, offset);

            lines.push([
                Point.add(offset.scale(-0.5), Point.add(from, unitDir.scale(0.5 * len - arrowStart))),
                Point.add(from, unitDir.scale(0.5 * len))
            ]);
            
            lines.push([
                Point.add(offset.scale(0.5), Point.add(from, unitDir.scale(0.5 * len - arrowStart))),
                Point.add(from, unitDir.scale(0.5 * len))
            ]);

            lines.push([from, to]);

            let nextEdge = halfEdge.next;
            if (nextEdge != null) {
                let nextFrom = nextEdge.origin.getPosition(sweepLineY);
                let nextTo = nextEdge.twin.origin.getPosition(sweepLineY);
                let nextOffset = Point.sub(nextTo, nextFrom).hat();
                let nextMid = Point.add(nextFrom, nextTo).scale(0.5);

                nextOffset = nextOffset.scale(1 / nextOffset.norm()).scale(5.0);

                lines.push([Point.add(mid, offset), Point.add(nextOffset, nextMid)]);
            }
        }

        return [vertices, lines];
    }
}

class DCEL_Vertex {
    constructor() {
        this.position = null;
        this.edge = null;
        this.breakpoint = null;
    }

    attachBreakpoint(breakpoint) {
        this.breakpoint = breakpoint;
        breakpoint.dcelVertex = this;
    }

    detachBreakpoint(sweepLineY) {
        this.getPosition(sweepLineY);
        this.breakpoint = null;
    }

    getPosition(sweepLineY) {
        if (this.breakpoint != null) {
            this.position = this.breakpoint.location(sweepLineY);
        }

        return this.position;
    }
}

class DCEL_Face {
    constructor() {
        this.edge = null;
    }
}

class DCEL_HalfEdge {
    constructor() {
        this.origin = null;
        this.twin = null;
        this.face = null;
        this.next = null;
        this.prev = null;
    }
}