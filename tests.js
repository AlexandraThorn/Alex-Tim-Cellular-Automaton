// Manually run.

function assert(bool) {
    if (!bool) throw Error("Assertion failed");
}

function assertEqual(a, b) {
    assert(JSON.stringify(a) == JSON.stringify(b));
}


assertEqual(_reflectionsY.map(r => r(east)), [east, west])
assertEqual(_reflectionsY.map(r => r(northeast)), [northeast, northwest])
assertEqual(_reflectionsY.map(r => r(southwest)), [southwest, southeast])
assertEqual(_reflectionsY.map(r => r(north)), [north, north])

assertEqual(_reflectionsX.map(r => r(east)), [east, east])
assertEqual(_reflectionsX.map(r => r(northeast)), [northeast, southeast])
assertEqual(_reflectionsX.map(r => r(southwest)), [southwest, northwest])
assertEqual(_reflectionsX.map(r => r(north)), [north, south])

assertEqual(_rotations4.map(r => r(east)), [east, north, west, south])
assertEqual(_rotations4.map(r => r(northeast)), [northeast, northwest, southwest, southeast])
