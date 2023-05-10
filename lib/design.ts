import {LIMIT, Direction, State, Voxel, Piece, VoxelShape, Subassembly, Operation, Configuration, GraphNode, Graph, PuzzleUnderDesign} from "./type";

const initialVoxelExample:Piece= {
    ID:0,
    Voxels:[
        [0,0,0],[1,0,0],                [4,0,0],[5,0,0],[6,0,0],
        [0,1,0],[1,1,0],                [4,1,0],[5,1,0],[6,1,0],
        [0,2,0],[1,2,0],        [3,2,0],[4,2,0],[5,2,0],[6,2,0],
        [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],[5,3,0],[6,3,0],
        [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],[5,4,0],[6,4,0],
        [0,5,0],[1,5,0],[2,5,0],[3,5,0],[4,5,0],[5,5,0],[6,5,0],
    ]
}

const config6:Configuration = [{
    piece:initialVoxelExample,
    state:[0,0,0]
}]

const pickMovingDirection = (configuration:Configuration):Direction => {
    const restVoxels = configuration[0].piece.Voxels;
    const allVoxels:Voxel[] = [];
    for (const {piece, state} of configuration) {
        allVoxels.push(...piece.Voxels);
    }
    const restVoxelSet = new Set(restVoxels.map(voxel => voxel.join(',')));
    const allVoxelSet = new Set(allVoxels.map(voxel => voxel.join(',')));
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (const voxel of restVoxels) {
        for (let axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], voxel[axis]);
            max[axis] = Math.max(max[axis], voxel[axis]);
        }
    }

    const isVoxelAt = (x: number, y: number, z: number): boolean => {
        return allVoxelSet.has([x, y, z].join(','));
    };

    const isAllocatedAt = (x: number, y: number, z: number): boolean => {
        return !restVoxelSet.has([x, y, z].join(','));
    };

    for (let axis = 0; axis < 3; axis++) {
        let continuousRegions = 0;
        let inRegion = false;
        let isBeforeAllocated = false;
        let isAfterAllocated = false;
        for (let i = min[axis]; i <= max[axis]; i++) {
            const x = axis === 0 ? i : min[0];
            const y = axis === 1 ? i : min[1];
            const z = axis === 2 ? i : min[2];

            if (isVoxelAt(x, y, z)) {
                if (!inRegion) {
                    inRegion = true;
                    continuousRegions++;
                }
                if (continuousRegions === 1) {
                    isBeforeAllocated = isAllocatedAt(x, y, z);
                } else if (continuousRegions === 2) {
                    isAfterAllocated = isAllocatedAt(x, y, z);
                }
            } else {
                inRegion = false;
            }

            if (continuousRegions === 2) {
                if (isBeforeAllocated && !isAfterAllocated) {
                    return axis;
                } else if (!isBeforeAllocated && isAfterAllocated) {
                    return axis + 3;
                } else {
                    continuousRegions--;
                    isBeforeAllocated = isAfterAllocated;
                }
            }
        }
    }
    return 5;
};

const pickSeedVoxel = (voxels:Voxel[], direction:Direction) => {

}

const ConstructFirstPiece = (initialConfiguration:Configuration):Configuration => {
    const piece_1:Piece = {
        ID      : 1,
        Voxels  :[]
    }
    const movingDirection = pickMovingDirection(initialConfiguration);

    return initialConfiguration
}