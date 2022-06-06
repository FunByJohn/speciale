function computeDelaunayTriangulation(points, width, height) {
    let diagram = new VoronoiDiagram(points);
    let dcel = diagram.dcel;
    let lines = [];

    for (let face of dcel.faces) {
        let fromPosition = face.site.position;
        let firstEdge = face.edge;
        let lastEdge = firstEdge.prev;

        for (let edge = firstEdge; edge != lastEdge; edge = edge.next) {
            if (edge.twin.face != null) {
                let toPosition = edge.twin.face.site.position;
                lines.push([fromPosition, toPosition]);
            }
        }
    }

    return lines;
}