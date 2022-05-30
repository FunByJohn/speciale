class DCEL {
    constructor() {
        this.vertices = [];
        this.faces = [];
        this.halfEdges = [];
    }

    createVertex() {

    }

    createHalfEdge(leftBreakpoint, rightBreakpoint) {
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

    joinVerticesAndStartNewEdge(sweepLineY, vertex1, vertex2, newBreakpoint) {
        vertex1.detachBreakpoint(sweepLineY);
        vertex2.detachBreakpoint(sweepLineY);

        let edge1 = vertex1.edge;
        let edge2 = vertex2.edge;

        edge2.origin = edge1.origin;

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

        this.vertices.push(toVertex);
        this.halfEdges.push(halfEdge);
        this.halfEdges.push(oppositeHalfEdge);

        // TODO: Refactor the last part by making a general function that both createHalfEdge and joinVerticesAndStartNewEdge calls
    }

    getDisplayLists(sweepLineY) {
        let vertices = [];
        let lines = [];

        for (let halfEdge of this.halfEdges) {
            var from = halfEdge.origin.getPosition(sweepLineY);
            var to = halfEdge.twin.origin.getPosition(sweepLineY);

            lines.push([from, to]);
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