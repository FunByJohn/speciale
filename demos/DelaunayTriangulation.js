function computeDelaunayTriangulation(points, width, height) {
    let diagram = new VoronoiDiagram(points);
    let dcel = diagram.dcel;

    return [[], [], [], []];
}