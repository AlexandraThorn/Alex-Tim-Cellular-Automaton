// Manually run.

function assertEqual(a, b) {
    const ja = JSON.stringify(a);
    const jb = JSON.stringify(b);
    if (ja != jb)
        throw Error(`Unequal:\n  ${ja}\n  ${jb}`);
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

assertEqual(
    _mirrorRotate8.map(r => [r(south), r(southeast)]),
    [
        [south, southeast],
        [south, southwest],
        [east, northeast],
        [west, northwest],
        [north, northwest],
        [north, northeast],
        [west, southwest],
        [east, southeast],
    ]
)
