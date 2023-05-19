import clone from "clone";
import { completeDisassemblable, computeNeighbor, configurationToString, isMovable, kernelDisassemblable } from "./assemble";
import Queue from "./queue";
import {LIMIT, Direction, State, Voxel, Piece, VoxelShape, Subassembly, Operation, Configuration, GraphNode, Graph, PuzzleUnderDesign, DirectionAndSeedVoxel} from "./type";
import { BLOCKED_PAGES } from "next/dist/shared/lib/constants";

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

type BlockingAndBlockee = {
    blocking: Voxel,
    blockee : Voxel
}

const distanceVoxels = (from:Voxel, to:Voxel):number => {
    return Math.sqrt((from[0]-to[0])^2 + (from[1]-to[1])^2 + (from[2]-to[2])^2)
}

const pickMovingDirectionAndSeedVoxel = (configuration:Configuration):DirectionAndSeedVoxel[] => {
    const returnSet:DirectionAndSeedVoxel[] = [];
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
    
    for (let primeAxis = 0; primeAxis < 3; primeAxis++) {
        let secondAxis = (primeAxis + 1) % 3;
        let thirdAxis = (primeAxis + 2) % 3;
        for (let i = min[secondAxis]; i <= max[secondAxis]; i++) {
            for (let j = min[thirdAxis]; j <= max[thirdAxis]; j++) {
                let continuousRegions = 0;
                let inRegion = false;
                let isBeforeAllocated = false;
                let beforeVoxel:Voxel = [0,0,0];
                let isAfterAllocated = false;
                let afterVoxel:Voxel = [0,0,0];
                for (let k = min[primeAxis]; k <= max[primeAxis]; k++) {
                    let x:number, y:number, z:number;
                    if (primeAxis == 0) {
                        x = k; y = i; z = j;
                    } else if (primeAxis == 1) {
                        x = j; y = k; z = i;
                    } else {
                        x = i; y = j; z = k;
                    }

                    if (isVoxelAt(x, y, z)) {
                        if (!inRegion) {
                            inRegion = true;
                            continuousRegions++;
                        }
                        if (continuousRegions === 1) {
                            isBeforeAllocated = isAllocatedAt(x, y, z);
                            beforeVoxel = [x,y,z];
                        } else if (continuousRegions === 2) {
                            isAfterAllocated = isAllocatedAt(x, y, z);
                            afterVoxel = [x,y,z];
                        }
                    } else {
                        inRegion = false;
                    }

                    if (continuousRegions === 2) {
                        if (!isAfterAllocated) {
                            returnSet.push({direction:primeAxis, seed:afterVoxel});
                        }
                        if (!isBeforeAllocated) {
                            returnSet.push({direction:primeAxis + 3, seed:beforeVoxel});
                        }
                        continuousRegions--;
                        isBeforeAllocated = isAfterAllocated;
                        beforeVoxel = afterVoxel;
                    }
                }
            }
        }
    }
    return returnSet;
};

type BlockedSets = {
    parts:Voxel[],
    notAvailable:Voxel
}

const isBlocking = (configuration:Configuration, movingDirection:Direction, seedVoxel:Voxel):BlockingAndBlockee[][] => {
    const allVoxels:Voxel[] = [];
    for (const {piece} of configuration) {
        allVoxels.push(...piece.Voxels);
    }
    const allVoxelSet = new Set(allVoxels.map(voxel => voxel.join(',')));
    const isVoxelAt = (x: number, y: number, z: number): boolean => {
        return allVoxelSet.has([x, y, z].join(','));
    };

    const axesBlockingAndBlockee:BlockingAndBlockee[][] = [];

    for (let direction = 0; direction < 6; direction++) {
        if (direction == movingDirection) {
            axesBlockingAndBlockee.push([]);
            continue;
        }
        if (direction % 3 == 2) {
            axesBlockingAndBlockee.push([]);
            continue; // 2D
        }

        const neighborVoxelX = (direction%3 == 0) ? seedVoxel[0] + 2*(Math.floor(direction/3)) - 1: seedVoxel[0];
        const neighborVoxelY = (direction%3 == 1) ? seedVoxel[1] + 2*(Math.floor(direction/3)) - 1: seedVoxel[1];
        const neighborVoxelZ = (direction%3 == 2) ? seedVoxel[2] + 2*(Math.floor(direction/3)) - 1: seedVoxel[2];

        if (!isVoxelAt(neighborVoxelX, neighborVoxelY, neighborVoxelZ)) {
            const candidates:BlockingAndBlockee[] = [];
            for (const voxel of configuration[0].piece.Voxels) {
                const nextX = (direction%3 == 0) ? voxel[0] + 2*(Math.floor(direction/3)) - 1: voxel[0];
                const nextY = (direction%3 == 1) ? voxel[1] + 2*(Math.floor(direction/3)) - 1: voxel[1];
                const nextZ = (direction%3 == 2) ? voxel[2] + 2*(Math.floor(direction/3)) - 1: voxel[2];
                if (isVoxelAt(nextX, nextY, nextZ)) {
                    if (nextX == seedVoxel[0] && nextY == seedVoxel[1] && nextZ == seedVoxel[2]) {
                        continue
                    } else {
                        candidates.push({blockee:voxel,blocking:[nextX,nextY,nextZ]})
                    }
                }
            }
            axesBlockingAndBlockee.push([...candidates].sort((a, b) => distanceVoxels(a.blockee, seedVoxel) - distanceVoxels(b.blockee, seedVoxel)).slice(0, 10));
        } else {
            axesBlockingAndBlockee.push([]);
        }
    }
    return axesBlockingAndBlockee ;
}

const getNeighbors = (voxel:Voxel):Voxel[] => {
    const [x, y, z] = voxel;
    return [
        [x - 1, y, z],
        [x + 1, y, z],
        [x, y - 1, z],
        [x, y + 1, z],
        [x, y, z - 1],
        [x, y, z + 1]
    ].map(neighbor => neighbor as Voxel)
}

const isInDirection = (selectedVoxel:Voxel, targetVoxel:Voxel, movingDirection:Direction):boolean => {
    const axis = movingDirection % 3;
    const sign = (movingDirection / 3 < 1) ? -1 : 1;
    let movedVoxel = clone(selectedVoxel);
    while ((targetVoxel[axis] - movedVoxel[axis])*sign >= 0) {
        if (targetVoxel.join(",") === movedVoxel.join(",")) {
            return true;
        }
        movedVoxel[axis] += sign;
    }
    return false;
}

type Restriction = {
    allocated:Voxel[],
    blockings:Voxel[]
}

const connnectBlockee = (configuration:Configuration, movingDirection:Direction, seedVoxel:Voxel, axesBlockingAndBlockee:BlockingAndBlockee[][]):Restriction => {
    const restrictedVoxels = [seedVoxel];
    const usedBlockingVoxels:Voxel[] = [];
    if (axesBlockingAndBlockee.every(subArr => Array.isArray(subArr) && subArr.length === 0)) {
        return {
            allocated:[seedVoxel],
            blockings:[]
        }
    }
    for (let direction = 0; direction < 6; direction++) {
        const blockeeDistance = new Map([...axesBlockingAndBlockee[direction]].map(({blockee}) => [blockee.join(","), {distance:Infinity, root:[seedVoxel]}]))
        if (axesBlockingAndBlockee[direction].length == 0) {
            continue;
        }
        for (const {blocking, blockee} of axesBlockingAndBlockee[direction]) {
            const freeVoxelSet = new Set(configuration[0].piece.Voxels.map(voxel => voxel.join(',')));
            freeVoxelSet.delete(blocking.join(','));
            const unvisited = new Set([...freeVoxelSet]);
            const distance = new Map([...freeVoxelSet].map(key => [key, Infinity]));
            const previous = new Map([...freeVoxelSet].map(key => [key, ""]));
            restrictedVoxels.map(voxel => {distance.set(voxel.join(","), 0); previous.set(voxel.join(","), "root");return;})
            while (unvisited.size > 0) {
                let minDistance = Infinity;
                let currentVoxel = "";
                for (const voxel of unvisited) {
                    const dist = distance.get(voxel) ?? Infinity;
                    if (minDistance > dist) {
                        minDistance = dist;
                        currentVoxel = voxel;
                    }
                }
                if (currentVoxel === "") {
                    break;
                }
                if (currentVoxel === blockee.join(",")) {
                    const root = [currentVoxel.split(",").map(Number) as Voxel];
                    let previousVoxel = previous.get(currentVoxel);
                    while (previousVoxel && previousVoxel !== "root") {
                        root.push(previousVoxel.split(",").map(Number) as Voxel)
                        previousVoxel = previous.get(previousVoxel);
                    }
                    blockeeDistance.set(blockee.join(","), {distance:minDistance, root:root});
                    break;
                }
                unvisited.delete(currentVoxel);
                for (const neighbor of getNeighbors(currentVoxel.split(",").map(Number) as Voxel).filter(neighbor => freeVoxelSet.has(neighbor.join(",")))) {
                    const altDistance = minDistance + 1;
                    const currentDistance = distance.get(neighbor.join(","))?? 0;
                    if (altDistance < currentDistance) {
                        distance.set(neighbor.join(","), altDistance);
                        previous.set(neighbor.join(","), currentVoxel);
                    }
                }
            }
        }

        const selectedEntry = Array.from(blockeeDistance.entries())
            .sort((a,b) => a[1].distance - b[1].distance)
            .filter(([key, {distance, root}]) => {
                const correspondingBlocking = axesBlockingAndBlockee[direction].find(({blockee}) => blockee.join(",") === key)?.blocking;
                if (!correspondingBlocking) return false;
                for (const selectedVoxel of restrictedVoxels) {
                    for (const blockingVoxel of [correspondingBlocking, ...usedBlockingVoxels])
                    if (isInDirection(selectedVoxel, blockingVoxel, movingDirection)) {
                        return false;
                    }
                }
                return true;
            })[0];

        restrictedVoxels.push(...selectedEntry[1].root);
        const correspondingBlockingObject = axesBlockingAndBlockee[direction].find(({blockee}) => blockee.join(",") === selectedEntry[0]);

        if (correspondingBlockingObject === undefined) {
            throw new Error('No corresponding blocking found');
        }
        usedBlockingVoxels.push(correspondingBlockingObject.blocking);

    }
    return {
        allocated:restrictedVoxels,
        blockings:usedBlockingVoxels
    };
}

const ensureMobility = (configuration:Configuration, currentVoxels:Voxel[], blockings:Voxel[], movingDirection:Direction):Voxel[] => {
    const freeVoxelSet = new Set(configuration[0].piece.Voxels.map(voxel => voxel.join(',')));
    const allVoxelSet = new Set(...configuration.map(item => item.piece.Voxels.map(voxel => voxel.join(','))));
    const allocatedVoxelSet = new Set(currentVoxels.map(voxel => voxel.join(",")));
    const checkList = new Set(currentVoxels.map(voxel => voxel.join(",")));
    const mobileVoxels = clone(currentVoxels);
    blockings.map(voxel => freeVoxelSet.delete(voxel.join(",")));
    while (checkList.size > 0) {
        const selectedVoxel = checkList.values().next().value;
        checkList.delete(selectedVoxel);
        const movedVoxel = moveVoxel(selectedVoxel.split(",").map(Number) as Voxel, movingDirection, 1).join(",");
        if (allocatedVoxelSet.has(movedVoxel)) {
            continue;
        }
        if (!allVoxelSet.has(movedVoxel)) {
            continue;
        } else {
            if (freeVoxelSet.has(movedVoxel)) {
                checkList.add(movedVoxel);
                mobileVoxels.push(movedVoxel.split(",").map(Number) as Voxel);
                continue;
            } else {
                return [];
            }
        }
    }
    return mobileVoxels;
}


const moveVoxel = (voxel:Voxel, direction:Direction, step:number):Voxel => {
    const nextX = (direction%3 == 0) ? voxel[0] + (2*(Math.floor(direction/3)) - 1)*step: voxel[0];
    const nextY = (direction%3 == 1) ? voxel[1] + (2*(Math.floor(direction/3)) - 1)*step: voxel[1];
    const nextZ = (direction%3 == 2) ? voxel[2] + (2*(Math.floor(direction/3)) - 1)*step: voxel[2];
    return [nextX, nextY, nextZ];
}
const expandPiece = (configuration:Configuration, parts:Voxel[], blockingVoxels:Voxel[], pieceSize:number, direction:Direction):Voxel[] => {
    const freeVoxelSet = new Set(configuration[0].piece.Voxels.map(voxel => voxel.join(',')));
    
    const notAvailableSet = new Set([...blockingVoxels].map(voxel => voxel.join(",")));
    for (const voxel of notAvailableSet.keys()) {
        freeVoxelSet.delete(voxel);
    }

    if (parts.length >= pieceSize - 1) return parts;
    else {
        const newParts = parts;
        while (newParts.length > pieceSize - 1) {
            for (const voxel of newParts) {
                const movedVoxel = moveVoxel(voxel, direction, -1);
                if (freeVoxelSet.has(movedVoxel.join(','))) {
                    newParts.push(movedVoxel);
                    break;
                }
            }
        }
        // expand
        return newParts;
    }
}

const revertConfiguration = (configuration:Configuration):Configuration => {
    const returnConfiguration:Configuration = [];
    for (const {piece, state} of configuration) {
        const {ID, Voxels} = piece;
        const newVoxels:Voxel[] = []
        for (const voxel of Voxels) {
            const newVoxel:Voxel = [voxel[0] - state[0], voxel[1] - state[1], voxel[2] - state[2]]
            newVoxels.push(newVoxel)
        }
        returnConfiguration.push({
            piece:{
                ID:ID,
                Voxels:newVoxels
            },
            state:[0,0,0]
        })
    }
    return returnConfiguration
}

const evalPrimaryConfiguration = (configuration: Configuration): Configuration => {
    if (configuration.length == 1) return configuration;
    const graph: Graph = new Map();
    const visited: Set<string> = new Set();
    const queue = new Queue<Configuration>();
    const numPieces = configuration.length;
    queue.enqueue(configuration);

    while (!queue.isEmpty()) {
        const currentConfiguration = queue.dequeue()!;
        const currentConfigurationID = configurationToString(currentConfiguration);

        if (visited.has(currentConfigurationID)) {
            continue;
        } else {
            visited.add(currentConfigurationID);
        }

        const newConfigurations = computeNeighbor(currentConfiguration);
        const graphNode: GraphNode = {
            configuration: currentConfiguration,
            target: currentConfiguration.length !== numPieces,
            edges: [],
        };

        let kernelDisassembled = false;

        for (const { newConfiguration, operation } of newConfigurations) {
            const newConfigurationID = configurationToString(newConfiguration);

            if (!visited.has(newConfigurationID)) {
                queue.enqueue(newConfiguration);
            }

            if (newConfiguration.length !== numPieces && !kernelDisassembled) {
                graphNode.edges = [{ operation: operation, destination: newConfigurationID }];
                kernelDisassembled = true;
            } else if (!kernelDisassembled) {
                graphNode.edges.push({ operation: operation, destination: newConfigurationID });
            }
        }

        graph.set(currentConfigurationID, graphNode);
    }

    const depths: Map<string, number> = new Map();
    const initialConfigurationID = configurationToString(configuration);
    depths.set(initialConfigurationID, 0);

    const nodesToVisit: Queue<string> = new Queue();
    nodesToVisit.enqueue(initialConfigurationID);

    let maxDepth = 0;
    let maxDepthConfiguration: Configuration = [];

    while (!nodesToVisit.isEmpty()) {
        const currentNodeID = nodesToVisit.dequeue()!;
        const currentNode = graph.get(currentNodeID);
        const currentDepth = depths.get(currentNodeID) || Infinity;

        if (currentNode) {
            for (const edge of currentNode.edges) {
            const neighborID = edge.destination;
            const altDepth = currentDepth + 1;
            const neighborDepth = depths.get(neighborID) || Infinity;

                if (altDepth < neighborDepth) {
                    depths.set(neighborID, altDepth);
                    nodesToVisit.enqueue(neighborID);

                    if (altDepth > maxDepth) {
                        maxDepth = altDepth;
                        maxDepthConfiguration = graph.get(neighborID)?.configuration || [];
                    }
                }
            }
        }
    }

    return maxDepthConfiguration;
};

const addNewPiece = (configuration:Configuration, newPiece:Piece):Configuration => {
    const newConfiguration:Configuration = [];
    const piece_0 = clone(configuration[0].piece);
    const newPieceVoxelSet:Set<string> = new Set(newPiece.Voxels.map(voxel => voxel.join(',')));
    piece_0.Voxels = piece_0.Voxels.filter(voxel => !newPieceVoxelSet.has(voxel.join(',')));
    newConfiguration.push({piece:piece_0, state:configuration[0].state});
    for (let i = 1; i < configuration.length; i++) {
        newConfiguration.push(clone(configuration[i]));
    }
    newConfiguration.push({piece:newPiece, state:[0,0,0]})
    return newConfiguration
}

type ConstructingPuzzle = {
    configurable:boolean,
    configuration:Configuration
}

const connectedGeometry = (voxels:Voxel[]):boolean => {
    if (voxels.length === 0) {
        return true;
    }

    const visitedVoxels = new Set();
    const stack = [voxels[0].join(",")];
    const voxelSet = new Set(voxels.map(voxel => voxel.join(',')));

    while (stack.length > 0) {
        const currentVoxel = stack.pop()!;
        visitedVoxels.add(currentVoxel);

        const [x, y, z] = currentVoxel.split(",").map(Number);
        const neighbors = [[x+1, y, z], [x-1, y, z], [x, y+1, z], [x, y-1, z], [x, y, z+1], [x, y, z-1]];

        for (const neighbor of neighbors) {
            const neighborKey = neighbor.join(",");
            if (voxelSet.has(neighborKey) && !visitedVoxels.has(neighborKey)) {
                stack.push(neighborKey);
            }
        }
    }

    return visitedVoxels.size === voxels.length;
}


const constructPiece = (configuration:Configuration, requireLevel:number, numPiece:number, numVoxel:number):ConstructingPuzzle => {
    const piece_i:Piece = {
        ID: configuration.length,
        Voxels: []
    }

    const setsDirectionAndSeed = pickMovingDirectionAndSeedVoxel(configuration);
    for (const {direction, seed} of setsDirectionAndSeed) {
        const axesBlockingAndBlockee = isBlocking(configuration, direction, seed);
        const {allocated, blockings} = connnectBlockee(configuration, direction, seed, axesBlockingAndBlockee);
        const mobileVoxels = ensureMobility(configuration, allocated, blockings, direction);
        if (mobileVoxels.length == 0) {
            continue;
        }
        const noDuplicatesVoxels = Array.from(new Set(mobileVoxels.map(voxel => voxel.join(","))), voxel => voxel.split(",").map(Number) as Voxel);
        piece_i.Voxels = noDuplicatesVoxels;
        console.log(clone(piece_i));
        const newConfiguration = addNewPiece(configuration, piece_i);
        if (!connectedGeometry(newConfiguration[0].piece.Voxels)) {
            continue;
        }
        console.log(clone(newConfiguration));
        const rootConfiguration = revertConfiguration(newConfiguration);
        if (rootConfiguration.length == numPiece) {
            // puzzle fulfill the restriction of the number of piece
            if (completeDisassemblable(rootConfiguration)) {
                return {configurable: true, configuration: rootConfiguration};
            } else {
                continue;
            }
        } else {
            // continue to make puzzle
            if (kernelDisassemblable(rootConfiguration)) {
                // puzzle does not fulfill the restiction that the puzzle is solvable before complete
            } else {
                // make next piece
                const nextPieceConstruction = constructPiece(evalPrimaryConfiguration(rootConfiguration), requireLevel, numPiece, numVoxel);
                if (nextPieceConstruction.configurable) {
                    return {configurable:nextPieceConstruction.configurable, configuration:nextPieceConstruction.configuration}
                } else {
                    continue
                }
            }
        }
    }
    return {configurable: false, configuration:configuration}
}

export {
    constructPiece
}