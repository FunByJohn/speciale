const Config = {
    epsilon                    : 10e-7, /* in computations with floats we will say that x = y if abs(x - y) < epsilon */
    pointFocusRadius           : 5.0,
    pointBlurRadius            : 2.0,
    beachLineStepSize          : 1,
    deleteRadius               : 20.0,
    sloMoFactor                : 0.05,
    debugShowTree              : false,
    debugShowBreakpointNames   : false,
    debugShowCircleEvents      : true,
    debugDCELShowOrientedEdges : false,
    debugDCELShowFacePointers  : false, /* requires debugDCELShowOrientedEdge to be true */
    debugDCELShowNextPointers  : false, /* requires debugDCELShowOrientedEdge to be true */
    debugShowBoundingBox       : true,
    debugBoundingBoxPadding    : 100,
    ipeScale                   : 0.5
};