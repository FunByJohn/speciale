function computeVoronoiDiagramStatic(points, width, height) {
    let lines = [];
    
    for (let i = 0; i < points.length; i++) {
        let minDist = Number.POSITIVE_INFINITY;
        let minIndex = -1;
        let [x1, y1] = points[i];

        for (let j = 0; j < points.length; j++) {
            if (i == j)
                continue;

            let [x2, y2] = points[j];
            let dx = x1 - x2;
            let dy = y1 - y2;
            let d = dx * dx + dy * dy;

            if (d < minDist) {
                minDist = d;
                minIndex = j;
            }
        }

        if (minIndex != -1) {
            let [x2, y2] = points[minIndex];
            lines.push([x1, y1, x2, y2]);
        }
    }

    return lines;
}

function computeVoronoiDiagramEvents(points, sweepLineY, width, height) {
    var newPoints = [];

    for (let [x, y] of points) {
        newPoints.push([x, Math.max(y, sweepLineY)]);
    }

    return computeVoronoiDiagramStatic(newPoints, width, height);
}