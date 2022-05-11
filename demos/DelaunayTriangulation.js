function computeDelaunayTriangulation(points, width, height) {
    let lines = [];

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            let [x1, y1] = points[i];
            let [x2, y2] = points[j];

            lines.push([x1, y1, x2, y2]);
        }
    }

    return lines;
}