class DCEL {
    constructor(numFaces) {
        this.vertices = [];
        this.halfEdges = [];
        this.faces = [];
        this.hasSetFirstSite = false;
        this.firstSite = null;

        for (var i = 0; i < numFaces; i++) {
            this.faces.push(null);
        }
    }

    setFirstSite(site) {
        if (!this.hasSetFirstSite) {
            this.firstSite = site;
            this.hasSetFirstSite = true;
        }
    }

    siteEvent(site, leftBreakpoint, rightBreakpoint) {
        let halfEdge = new DCEL_HalfEdge();
        let oppositeHalfEdge = new DCEL_HalfEdge();
        let fromVertex = new DCEL_Vertex();
        let toVertex = new DCEL_Vertex();
        let face = new DCEL_Face();

        fromVertex.attachBreakpoint(rightBreakpoint);
        fromVertex.edge = halfEdge;

        toVertex.attachBreakpoint(leftBreakpoint);
        toVertex.edge = oppositeHalfEdge;

        halfEdge.origin = fromVertex;
        halfEdge.twin = oppositeHalfEdge;
        halfEdge.face = face;

        oppositeHalfEdge.origin = toVertex;
        oppositeHalfEdge.twin = halfEdge;

        face.edge = halfEdge;
        face.site = site;

        if (this.firstSite != null) {
            let oppositeFace = new DCEL_Face();

            oppositeFace.edge = oppositeHalfEdge;
            oppositeFace.site = this.firstSite;

            oppositeHalfEdge.face = oppositeFace;

            this.faces[this.firstSite.index] = oppositeFace;
            this.firstSite = null;
        }

        /*if (this.previousSite == null) {
            if (this.faces[this.previousSite.index] == null) {
                let oppositeFace = new DCEL_Face();

                oppositeFace.edge = oppositeHalfEdge;
                oppositeFace.site = this.previousSite;
                oppositeHalfEdge.face = oppositeFace;
            }
        }*/

        this.vertices.push(fromVertex);
        this.vertices.push(toVertex);
        this.halfEdges.push(halfEdge);
        this.halfEdges.push(oppositeHalfEdge);
        this.faces[site.index] = face;

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
        halfEdge.face = edge2.twin.face;

        if (edge1.twin.face != null && edge2.face == null)
            edge2.face = edge1.twin.face;

        if (edge2.face != null && edge1.twin.face == null)
            edge1.twin.face = edge2.face;

        oppositeHalfEdge.origin = toVertex;
        oppositeHalfEdge.twin = halfEdge;
        oppositeHalfEdge.face = edge1.face;

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

            if (halfEdge.face != null)
                lines.push([Point.add(mid, offset), halfEdge.face.site.position]);

            /*let nextEdge = halfEdge.next;
            if (nextEdge != null) {
                let nextFrom = nextEdge.origin.getPosition(sweepLineY);
                let nextTo = nextEdge.twin.origin.getPosition(sweepLineY);
                let nextOffset = Point.sub(nextTo, nextFrom).hat();
                let nextMid = Point.add(nextFrom, nextTo).scale(0.5);

                nextOffset = nextOffset.scale(1 / nextOffset.norm()).scale(5.0);

                lines.push([Point.add(mid, offset), Point.add(nextOffset, nextMid)]);
            }*/
        }

        let [minX, maxX, minY, maxY] = this.computeBoundingBox({x: 200, y: 200, width: window.innerWidth - 400, height: window.innerHeight - 400}, 25);
        let b1 = new Point(minX, minY);
        let b2 = new Point(maxX, minY);
        let b3 = new Point(maxX, maxY);
        let b4 = new Point(minX, maxY);

        lines.push([b1, b2]);
        lines.push([b2, b3]);
        lines.push([b3, b4]);
        lines.push([b4, b1]);

        return [vertices, lines];
    }

    computeBoundingBox(viewport, padding) {
        function findBoundary(list) {
            let min = list[0];
            let max = list[0];

            for (let element of list) {
                if (element < min) {
                    min = element;
                }

                if (element > max) {
                    max = element;
                }
            }

            return [min, max];
        }

        let xs = [];
        let ys = [];

        for (let face of this.faces) {
            if (face != null && face.site != null) {
                xs.push(face.site.position.x);
                ys.push(face.site.position.y);
            }
        }

        for (let vertex of this.vertices) {
            if (vertex.breakpoint == null) {
                xs.push(vertex.position.x);
                ys.push(vertex.position.y);
            }
        }

        xs.push(viewport.x);
        xs.push(viewport.x + viewport.width);
        ys.push(viewport.y);
        ys.push(viewport.y + viewport.height);

        let [minX, maxX] = findBoundary(xs);
        let [minY, maxY] = findBoundary(ys);

        if (padding != 0) {
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
        }

        return [minX, maxX, minY, maxY];
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
        this.site = null;
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