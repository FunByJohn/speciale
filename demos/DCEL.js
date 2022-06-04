function pair(fromEdge, toEdge) {
    fromEdge.next = toEdge;
    toEdge.prev = fromEdge;
}

class DCEL {
    constructor(numFaces) {
        this.vertices = [];
        this.halfEdges = [];
        this.faces = [];
        this.hasSetFirstSite = false;
        this.firstSite = null;
        this.boundingBox = null;
        this.debugIntersectionPoints = [];

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

        this.vertices.push(fromVertex);
        this.vertices.push(toVertex);
        this.halfEdges.push(halfEdge);
        this.halfEdges.push(oppositeHalfEdge);
        this.faces[site.index] = face;
    }

    circleEvent(sweepLineY, vertex1, vertex2, newBreakpoint) {
        vertex1.detachBreakpoint(sweepLineY);
        vertex2.detachBreakpoint(sweepLineY);

        let edge1 = vertex1.edge;
        let edge2 = vertex2.edge;

        edge2.origin.kill();
        edge2.origin = edge1.origin;

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

            if (Config.debugDCELShowOrientedEdges) {
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
            } else {
                lines.push([from, to]);
            }

            if (Config.debugDCELShowFacePointers && halfEdge.face != null)
                lines.push([Point.add(mid, offset), halfEdge.face.site.position]);

            if (Config.debugDCELShowNextPointers) {
                let nextEdge = halfEdge.next;
                if (nextEdge != null) {
                    let nextFrom = nextEdge.origin.getPosition(sweepLineY);
                    let nextTo = nextEdge.twin.origin.getPosition(sweepLineY);
                    let nextOffset = Point.sub(nextTo, nextFrom).hat();
                    let nextMid = Point.add(nextFrom, nextTo).scale(0.5);

                    nextOffset = nextOffset.scale(1 / nextOffset.norm()).scale(5.0);

                    let conFrom = Point.add(mid, offset);
                    let conTo = Point.add(nextOffset, nextMid);
                    let conOffset = Point.sub(conTo, conFrom).hat();

                    conOffset = conOffset.scale(1 / conOffset.norm());

                    let conControlPoint = Point.add(conOffset.scale(20.0), Point.add(conFrom, conTo).scale(0.5));

                    //lines.push([conFrom, conTo]);
                    lines.push([conFrom, conControlPoint]);
                    lines.push([conControlPoint, conTo]);
                }
            }
        }

        /*let [minX, maxX, minY, maxY] = this.computeBoundingBox({x: 200, y: 200, width: window.innerWidth - 400, height: window.innerHeight - 400}, 25);
        let b1 = new Point(minX, minY);
        let b2 = new Point(maxX, minY);
        let b3 = new Point(maxX, maxY);
        let b4 = new Point(minX, maxY);

        lines.push([b1, b2]);
        lines.push([b2, b3]);
        lines.push([b3, b4]);
        lines.push([b4, b1]);*/

        if (this.boundingBox != null) {
            let [minX, maxX, minY, maxY] = this.boundingBox;
            let b1 = new Point(minX, minY);
            let b2 = new Point(maxX, minY);
            let b3 = new Point(maxX, maxY);
            let b4 = new Point(minX, maxY);

            lines.push([b1, b2]);
            lines.push([b2, b3]);
            lines.push([b3, b4]);
            lines.push([b4, b1]);
        }

        /*for (let point of this.debugIntersectionPoints) {
            let r = 8;
            let n = 12;

            for (let i = 0; i < n; i++) {
                let a = 2 * Math.PI / n * i;
                let b = 2 * Math.PI / n * (i + 1);
                let from = new Point(point.x + r * Math.cos(a), point.y + r * Math.sin(a));
                let to = new Point(point.x + r * Math.cos(b), point.y + r * Math.sin(b));

                lines.push([from, to]);
            }
        }*/

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
            if (!vertex.dead && vertex.breakpoint == null) {
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

    constrainToBoundingBox(viewport, lastSweepLineY) {
        this.cleanUpDeadVertices();

        let _this = this;
        let [minX, maxX, minY, maxY] = this.computeBoundingBox(viewport, 25);
        let b1 = new Point(minX, minY);
        let b2 = new Point(maxX, minY);
        let b3 = new Point(maxX, maxY);
        let b4 = new Point(minX, maxY);
        let intersectionLists = [[], [], [], []];
        let sides = [
            [b1, b2],
            [b2, b3],
            [b3, b4],
            [b4, b1]
        ];
        let breakpointVertices = new Map();

        this.boundingBox = [minX, maxX, minY, maxY];

        for (let vertex of this.vertices) {
            if (vertex.breakpoint != null) {
                let breakpoint = vertex.breakpoint;
                
                for (let i = 0; i < sides.length; i++) {
                    let [fromPos, toPos] = sides[i];
                    let result = intersectLines(fromPos, Point.sub(toPos, fromPos), breakpoint.start, breakpoint.direction);

                    if (result != null) {
                        let [s, t, intersection] = result;

                        if (0.0 <= s && s <= 1.0) {
                            if (!breakpointVertices.has(vertex) || breakpointVertices.get(vertex).time < t) {
                                breakpointVertices.set(vertex, {
                                    side: i,
                                    priority: s,
                                    time: t,
                                    intersection: intersection
                                });
                            }
                        }
                    }
                }
            }
        }

        for (let [vertex, info] of breakpointVertices) {
            this.debugIntersectionPoints.push(info.intersection);
            intersectionLists[info.side].push({vertex: vertex, info: info});
        }

        for (let i = 0; i < intersectionLists.length; i++) {
            intersectionLists[i].sort(function(lhs, rhs) {
                return lhs.info.priority - rhs.info.priority;
            });
        }

        function handleSide(intersectionList, fromPos, toPos, prevEdge, nextEdge) {
            let fromVert, toVert;

            if (prevEdge == null) {
                fromVert = new DCEL_Vertex();
                fromVert.position = fromPos.copy();

                _this.vertices.push(fromVert);
            } else {
                fromVert = prevEdge.twin.origin;
            }

            if (nextEdge == null) {
                toVert = new DCEL_Vertex();
                toVert.position = toPos.copy();

                _this.vertices.push(toVert);
            } else {
                toVert = nextEdge.origin;
            }

            if (intersectionList.length == 0) {
                let edge = new DCEL_HalfEdge();
                let oppEdge = new DCEL_HalfEdge();
                
                edge.origin = fromVert;
                edge.twin = oppEdge;
                oppEdge.origin = toVert;
                oppEdge.twin = edge;

                if (prevEdge != null) {
                    pair(prevEdge, edge);
                    pair(oppEdge, prevEdge.twin);

                    /*if (prevEdge.face != null)
                        edge.face = prevEdge.face;*/
                }

                if (nextEdge != null) {
                    pair(edge, nextEdge);
                    pair(nextEdge.twin, oppEdge);

                    /*if (nextEdge.face != null)
                        edge.face = nextEdge.face;*/
                }

                _this.halfEdges.push(edge);
                _this.halfEdges.push(oppEdge);

                return [edge, edge];
            } else {
                let lastVert = fromVert;
                let lastBoundaryEdge = prevEdge;
                let firstEdge = null;

                for (let element of intersectionList) {
                    let vertex = element.vertex;
                    let info = element.info;
                    let intersectionPoint = info.intersection;
                    let edge = new DCEL_HalfEdge();
                    let oppEdge = new DCEL_HalfEdge();

                    vertex.position = intersectionPoint;
                    vertex.breakpoint = null;

                    edge.origin = lastVert;
                    edge.twin = oppEdge;
                    edge.face = vertex.edge.face;
                    oppEdge.origin = vertex;
                    oppEdge.twin = edge;

                    pair(edge, vertex.edge);

                    if (lastVert.edge != null) {
                        pair(lastVert.edge.twin, edge);

                        if (lastVert.edge.twin.face == null) {
                            lastVert.edge.twin.face = vertex.edge.face;
                        }
                    }

                    if (lastBoundaryEdge != null)
                        pair(oppEdge, lastBoundaryEdge.twin);
                    
                    //pair(vertex.edge.twin, oppEdge);

                    _this.halfEdges.push(edge);
                    _this.halfEdges.push(oppEdge);

                    lastVert = vertex;
                    lastBoundaryEdge = edge;

                    if (firstEdge == null) {
                        if (prevEdge != null) {
                            pair(prevEdge, edge);
                            pair(oppEdge, prevEdge.twin);
                        }

                        firstEdge = edge;
                    }
                }

                let edge = new DCEL_HalfEdge();
                let oppEdge = new DCEL_HalfEdge();

                edge.origin = lastVert;
                edge.twin = oppEdge;
                edge.face = lastVert.edge.twin.face;
                oppEdge.origin = toVert;
                oppEdge.twin = edge;

                pair(lastVert.edge.twin, edge);

                if (lastBoundaryEdge != null)
                    pair(edge.twin, lastBoundaryEdge.twin);

                _this.halfEdges.push(edge);
                _this.halfEdges.push(oppEdge);

                if (nextEdge != null) {
                    pair(edge, nextEdge);
                    pair(nextEdge.twin, edge.twin);
                }

                return [firstEdge, edge];
            }
        }

        /*
                   3
            b4 --------- b3
             |          |
           4 |          | 2
             |          |
            b1 --------- b2
                   1    
        */

        console.log("Ready!");

        let firstEdge = null;
        let prevEdge = null;
        let _;

        [firstEdge, prevEdge] = handleSide(intersectionLists[0], b1, b2, null,     null);      // 1
        [_,         prevEdge] = handleSide(intersectionLists[1], b2, b3, prevEdge, null);      // 2
        [_,         prevEdge] = handleSide(intersectionLists[2], b3, b4, prevEdge, null);      // 3
                                handleSide(intersectionLists[3], b4, b1, prevEdge, firstEdge); // 4

        // Set face pointer where it is missing
        let firstOppEdge = firstEdge.twin;
        let edge = firstOppEdge;

        do {
            let twin = edge.twin;
            let nextTwin = edge.prev.twin;
            let prevTwin = edge.next.twin;

            if (twin.face == null) {
                if (nextTwin.face != null) {
                    twin.face = nextTwin.face;
                } else if (prevTwin.face != null) {
                    twin.face = prevTwin.face;
                }
            }

            edge = edge.next;
        } while (edge !== firstOppEdge);

        console.log(firstEdge);
    }

    cleanUpDeadVertices() {
        let newVertices = [];

        for (let vertex of this.vertices) {
            if (!vertex.dead) {
                newVertices.push(vertex);
            }
        }

        this.vertices = newVertices;
    }
}

class DCEL_Vertex {
    constructor() {
        this.position = null;
        this.edge = null;
        this.breakpoint = null;
        this.dead = false;
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

    kill() {
        this.dead = true;
        this.breakpoint = null;
        this.edge = null;
        this.position = null;
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