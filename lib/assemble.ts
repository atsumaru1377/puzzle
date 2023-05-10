import Queue from "./queue";
import clone from "clone";

import {LIMIT, Direction, State, Voxel, Piece, Subassembly, Operation, Configuration, GraphNode, Graph} from "./type";

const configurationToString = (configuration: Configuration): string => {
  return configuration
    .map(({ piece, state }) => `${piece.ID}:${state.join(',')}`)
    .join('_');
}

const movePiece = (piece:Piece, direction:Direction, steps:number):Piece => {
    const newPiece:Piece = {ID:piece.ID, Voxels:[]};
    for (const voxel of piece.Voxels) {
        const newX:number = (direction%3 == 0) ? voxel[0] + steps*(Math.floor(direction/3)*2-1) : voxel[0];
        const newY:number = (direction%3 == 1) ? voxel[1] + steps*(Math.floor(direction/3)*2-1) : voxel[1];
        const newZ:number = (direction%3 == 2) ? voxel[2] + steps*(Math.floor(direction/3)*2-1) : voxel[2];
        const newVoxel:Voxel = [newX, newY, newZ];
        newPiece.Voxels.push(newVoxel);
    }
    return newPiece;
}

const renewState = (state:State, direction:Direction, steps:number):State => {
    const newStateX:number = (direction%3 == 0) ? state[0] + steps*(Math.floor(direction/3)*2-1) : state[0];
    const newStateY:number = (direction%3 == 1) ? state[1] + steps*(Math.floor(direction/3)*2-1) : state[1];
    const newStateZ:number = (direction%3 == 2) ? state[2] + steps*(Math.floor(direction/3)*2-1) : state[2];
    return [newStateX, newStateY, newStateZ];
}

const moveSubassembly = (subassembly:Subassembly, direction:Direction, steps:number):Subassembly => {
    const newSubassembly:Subassembly = [];
    for (const piece of subassembly) {
        newSubassembly.push(movePiece(piece, direction, steps));
    }
    return newSubassembly;
}

const getVoxels = (subassembly:Subassembly):Array<Voxel> => {
    const voxels:Array<Voxel> = [];
    for (const piece of subassembly) {
        for (const voxel of piece.Voxels) {
            voxels.push(voxel);
        }
    }
    return voxels;
}

const voxelToString = (voxel: Voxel): string => {
    return voxel.join(',');
};

const isMovable = (configuration:Configuration, subassembly:Subassembly, direction:Direction, steps:number) : boolean => {
    const excludePieceIDs = new Set<number>(subassembly.map(piece => piece.ID));
    const occupiedVoxels = new Set<string>();

    // 2D
    if (direction%3 == 2) return false;

    if (excludePieceIDs.has(0)) return false;

    for (const pieceState of configuration) {
        const piece:Piece = pieceState.piece;
        if (excludePieceIDs.has(piece.ID)) continue;
        for (const voxel of piece.Voxels) {
            occupiedVoxels.add(voxelToString(voxel))
        }
    }

    const voxelsOfMovedSubassembly:Array<Voxel> = getVoxels(moveSubassembly(subassembly,direction,steps));
    for (const voxel of voxelsOfMovedSubassembly) {
        if (occupiedVoxels.has(voxelToString(voxel))) return false;
    }

    return true;
}

function getCombinations<T>(array: T[], num: number): T[][] {
    if (num === 0) return [[]];
    if (array.length === 0) return [];

    const result: T[][] = [];
    const restOfArray = array.slice(1);

    const withoutFirst = getCombinations(restOfArray, num);
    const withFirst = getCombinations(restOfArray, num - 1).map(combination => [array[0], ...combination]);

    return [...withoutFirst, ...withFirst];
}

function arePiecesAdjacent(piece1: Piece, piece2: Piece): boolean {
    for (const voxel1 of piece1.Voxels) {
        for (const voxel2 of piece2.Voxels) {
            if (Math.abs(voxel1[0] - voxel2[0]) + Math.abs(voxel1[1] - voxel2[1]) + Math.abs(voxel1[2] - voxel2[2]) === 1) {
                return true;
            }
        }
    }
    return false;
}

  function hasAdjacentPieces(subassembly: Subassembly): boolean {
    for (let i = 0; i < subassembly.length; i++) {
        for (let j = i + 1; j < subassembly.length; j++) {
            if (arePiecesAdjacent(subassembly[i], subassembly[j])) {
                return true;
            }
        }
    }
    return false;
}

const getSubassemblies = (configuration: Configuration, maxPieces: number): Subassembly[] => {
    const pieces = configuration.map(config => config.piece);
    let subassemblies: Subassembly[] = [];

    subassemblies = [...subassemblies, ...pieces.map(piece => [piece])];

    for (let i = 1; i <= maxPieces; i++) {
        const combinations = getCombinations(pieces, i).filter(hasAdjacentPieces);
        subassemblies = [...subassemblies, ...combinations];
    }
    return subassemblies;
};



const removeSubassembly = (configuration:Configuration, subassembly:Subassembly):Configuration => {
    const removePieceIDs = new Set<number>(subassembly.map(piece => piece.ID));
    const newConfiguration:Configuration = [];
    for (const pieceState of configuration) {
        const piece:Piece = clone(pieceState.piece);
        const state:State = clone(pieceState.state);
        if (removePieceIDs.has(piece.ID)) continue;
        newConfiguration.push({piece:piece, state:state});
    }
    return newConfiguration;
}

const getRemovedSubassembly = (configuration:Configuration, subassembly:Subassembly):Configuration => {
    const removePieceIDs = new Set<number>(subassembly.map(piece => piece.ID));
    const newConfiguration:Configuration = [];
    for (const pieceState of configuration) {
        const piece:Piece = clone(pieceState.piece);
        const state:State = clone(pieceState.state);
        if (!removePieceIDs.has(piece.ID)) continue;
        newConfiguration.push({piece:piece, state:state});
    }
    return newConfiguration;
}

const renewConfiguration = (configuration:Configuration, subassembly:Subassembly, direction:Direction, steps:number) => {
    const movePieceIDs = new Set<number>(subassembly.map(piece => piece.ID));
    const newConfiguration:Configuration = [];
    for (const pieceState of configuration) {
        const piece:Piece = clone(pieceState.piece);
        const state:State = clone(pieceState.state);
        if (movePieceIDs.has(piece.ID)) {
            newConfiguration.push({
                piece:movePiece(piece,direction,steps),
                state:renewState(state,direction,steps)
            });
        } else {
            newConfiguration.push({
                piece:piece,
                state:state
            });
        }
    }
    return newConfiguration;
}

const computeNeighbor = (currentConfiguration:Configuration):Array<{ newConfiguration:Configuration, operation:Operation}> => {
    const neighborConfigurations: Array<{ newConfiguration: Configuration, operation: Operation }> = [];
    const numPieces = currentConfiguration.length;
    const subassemblies = getSubassemblies(currentConfiguration, numPieces/2);

    for (const subassembly of subassemblies) {
        for (let direction = 0; direction < 6; direction++) {
            if (isMovable(currentConfiguration, subassembly, direction, 1)) {
                let maxSteps = 0
                while (isMovable(currentConfiguration, subassembly, direction, maxSteps+1)) {
                    maxSteps += 1;
                    if (maxSteps >= LIMIT) break;
                }
                if (maxSteps == LIMIT) {
                    neighborConfigurations.push({
                        newConfiguration:removeSubassembly(currentConfiguration,subassembly),
                        operation:{
                            pieces:subassembly,
                            direction:direction,
                            steps:LIMIT
                        }
                    });
                } else {
                    for (let steps = 1; steps <= maxSteps; steps++) {
                        neighborConfigurations.push({
                            newConfiguration:renewConfiguration(currentConfiguration,subassembly,direction,steps),
                            operation:{
                                pieces:subassembly,
                                direction:direction,
                                steps:steps
                            }
                        });
                    }
                }
            }
        }
    }
    return neighborConfigurations;
}

const KernelDisassembly = (initialConfiguration:Configuration):Graph => {
    const graph:Graph = new Map();
    const visited:Set<string> = new Set();
    const queue = new Queue<Configuration>();
    const numPieces = initialConfiguration.length;
    queue.enqueue(initialConfiguration);

    while (!queue.isEmpty()) {
        const currentConfiguration = queue.dequeue()!;
        const currentConfigurationID = configurationToString(currentConfiguration);

        if (visited.has(currentConfigurationID)) {
            continue;
        } else {
            visited.add(currentConfigurationID);
        }
        if (currentConfiguration.length != numPieces) {
            graph.set(
                currentConfigurationID,
                { configuration:currentConfiguration, target: true, edges: []}
            )
            continue;
        }

        const newConfigurations = computeNeighbor(currentConfiguration);

        const graphNode:GraphNode = {
            configuration: currentConfiguration,
            target: false,
            edges: []
        };

        let kernelDisassembled = false;

        for (const {newConfiguration, operation} of newConfigurations) {
            if (newConfiguration.length != numPieces) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges = [{operation:operation,destination:newConfigurationID}];
                graph.set(currentConfigurationID,graphNode);
                kernelDisassembled = true;
                break
            }
        }

        if (!kernelDisassembled) {
            for (const {newConfiguration, operation} of newConfigurations) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges.push({operation:operation,destination:newConfigurationID});
            }
            graph.set(currentConfigurationID,graphNode);
        }
    }
    return graph;
}

const computeLevel = (initialConfiguration:Configuration):number => {
    const graph = KernelDisassembly(initialConfiguration);

    const depths:Map<string, number> = new Map();
    const unvisited: Set<string> = new Set(graph.keys());

    for (const nodeID of unvisited) {
        depths.set(nodeID, Infinity);
    }

    const initialConfigurationID = configurationToString(initialConfiguration);
    depths.set(initialConfigurationID,0);

    while (unvisited.size > 0) {
        let currentNodeID:string | null = null;
        let minDepth = Infinity;

        // pick shallowest
        if (unvisited.has(initialConfigurationID)) {
            currentNodeID = initialConfigurationID;
            minDepth = 0;
        } else {
            for (const nodeID of unvisited) {
                const depth = depths.get(nodeID) || Infinity;
                if (depth < minDepth) {
                    currentNodeID = nodeID;
                    minDepth = depth;
                }
            }
        }

        if (currentNodeID == null) {
            break;
        }

        const currentNode = graph.get(currentNodeID);
        if (currentNode) {
            if (currentNode.target) {
                return depths.get(currentNodeID) || Infinity;
            }
            unvisited.delete(currentNodeID);

            for (const edge of currentNode.edges) {
                const neighborID = edge.destination;
                const altDepth = minDepth + 1;
                const neighborDepth = depths.get(neighborID) || Infinity;
                if (altDepth < neighborDepth) {
                    depths.set(neighborID, altDepth);
                }
            }
        }
    }
    return -1;
}

const OutputDisassemblePlan = (graph: Graph, initialConfiguration: Configuration): Configuration[] => {
    if (initialConfiguration.length < 2) return [];
    const depths: Map<string, number> = new Map();
    const before: Map<string, string> = new Map();
    const unvisited: Set<string> = new Set(graph.keys());

    for (const nodeID of unvisited) {
        depths.set(nodeID, Infinity);
        before.set(nodeID, "unreached");
    }

    const initialConfigurationID = configurationToString(initialConfiguration);
    depths.set(initialConfigurationID, 0);
    before.set(initialConfigurationID, "root");

    let reachTarget = false;
    let targetNodeID = "";

    while (unvisited.size > 0) {
        let currentNodeID: string | null = null;
        let minDepth = Infinity;

        if (unvisited.has(initialConfigurationID)) {
            currentNodeID = initialConfigurationID;
            minDepth = 0;
        } else {
            for (const nodeID of unvisited) {
                const depth = depths.get(nodeID) ?? Infinity;
                if (depth < minDepth) {
                    currentNodeID = nodeID;
                    minDepth = depth;
                }
            }
        }

        if (currentNodeID == null) {
            break;
        }

        const currentNode = graph.get(currentNodeID);
        if (currentNode) {
            unvisited.delete(currentNodeID);

            for (const edge of currentNode.edges) {
                const neighborID = edge.destination;
                const altDepth = minDepth + 1;
                const neighborDepth = depths.get(neighborID) ?? Infinity;
                if (altDepth < neighborDepth) {
                    depths.set(neighborID, altDepth);
                    before.set(neighborID, currentNodeID);
                }
            }

            if (currentNode.target) {
                reachTarget = true;
                targetNodeID = currentNodeID;
                break
            }
        }
    }

    if (reachTarget) {
        let configs: Configuration[] = [];
        let beforeNode = before.get(targetNodeID);
        while (beforeNode && beforeNode !== "root" && beforeNode !== "unreached") {
            const beforeNodeConfig = graph.get(beforeNode)?.configuration
            if (beforeNodeConfig) {
                configs.unshift(beforeNodeConfig);
            }
            beforeNode = before.get(beforeNode);
        }
        return configs;
    }

    return [];
};

const OutputCompleteDisassemblePlan = (configuration:Configuration):Configuration[] => {
    const graph:Graph = new Map();
    const visited:Set<string> = new Set();
    const queue = new Queue<Configuration>();
    const numPieces = configuration.length;
    queue.enqueue(configuration);

    if (configuration.length <= 1) {
        return [];
    }

    while (!queue.isEmpty()) {
        const currentConfiguration = queue.dequeue()!;
        const currentConfigurationID = configurationToString(currentConfiguration);

        if (visited.has(currentConfigurationID)) {
            continue;
        } else {
            visited.add(currentConfigurationID);
        }
        if (currentConfiguration.length != numPieces) {
            graph.set(
                currentConfigurationID,
                { configuration:currentConfiguration, target: true, edges: []}
            )
            continue;
        }

        const newConfigurations = computeNeighbor(currentConfiguration);

        const graphNode:GraphNode = {
            configuration: currentConfiguration,
            target: false,
            edges: []
        };

        let kernelDisassembled = false;

        for (const {newConfiguration, operation} of newConfigurations) {
            if (newConfiguration.length != numPieces) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges = [{operation:operation,destination:newConfigurationID}];
                graph.set(currentConfigurationID,graphNode);
                kernelDisassembled = true;

                const removedSubassemblyConfiguration:Configuration = getRemovedSubassembly(currentConfiguration,operation.pieces);

                const removedSubassemblyDisassemble = CompleteDisassembly(removedSubassemblyConfiguration);
                const restSubassemblyDisassemble = CompleteDisassembly(newConfiguration);
                if (removedSubassemblyDisassemble && restSubassemblyDisassemble) {
                    const removedSubassemblyPlan = OutputCompleteDisassemblePlan(removedSubassemblyConfiguration);
                    const restSubassemblyPlan = OutputCompleteDisassemblePlan(newConfiguration);
                    const newGraphNode:GraphNode = {
                        configuration: newConfiguration,
                        target: true,
                        edges: []
                    }
                    graph.set(newConfigurationID,newGraphNode);
                    const currentSubassemblyPlan = OutputDisassemblePlan(graph, configuration);
                    return [
                        ...currentSubassemblyPlan,
                        ...[newConfiguration],
                        ...removedSubassemblyPlan,
                        ...restSubassemblyPlan,
                    ];
                };
            }
        }

        if (!kernelDisassembled) {
            for (const {newConfiguration, operation} of newConfigurations) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges.push({operation:operation,destination:newConfigurationID});
            }
            graph.set(currentConfigurationID,graphNode);
        }
    }
    return [configuration]
}

const CompleteDisassembly = (configuration:Configuration): boolean => {
    const graph:Graph = new Map();
    const visited:Set<string> = new Set();
    const queue = new Queue<Configuration>();
    const numPieces = configuration.length;
    queue.enqueue(configuration);

    if (configuration.length <= 1) {
        return true;
    }

    while (!queue.isEmpty()) {
        const currentConfiguration = queue.dequeue()!;
        const currentConfigurationID = configurationToString(currentConfiguration);

        if (visited.has(currentConfigurationID)) {
            continue;
        } else {
            visited.add(currentConfigurationID);
        }
        if (currentConfiguration.length != numPieces) {
            graph.set(
                currentConfigurationID,
                { configuration:currentConfiguration, target: true, edges: []}
            )
            continue;
        }

        const newConfigurations = computeNeighbor(currentConfiguration);

        const graphNode:GraphNode = {
            configuration: currentConfiguration,
            target: false,
            edges: []
        };

        let kernelDisassembled = false;

        for (const {newConfiguration, operation} of newConfigurations) {
            if (newConfiguration.length != numPieces) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges = [{operation:operation,destination:newConfigurationID}];
                graph.set(currentConfigurationID,graphNode);
                kernelDisassembled = true;

                const removedSubassemblyConfiguration:Configuration = getRemovedSubassembly(currentConfiguration,operation.pieces);

                const removedSubassemblyDisassemble = CompleteDisassembly(removedSubassemblyConfiguration);
                const restSubassemblyDisassemble = CompleteDisassembly(newConfiguration);
                if (removedSubassemblyDisassemble && restSubassemblyDisassemble) return true;
            }
        }

        if (!kernelDisassembled) {
            for (const {newConfiguration, operation} of newConfigurations) {
                const newConfigurationID = configurationToString(newConfiguration);
                if (!visited.has(newConfigurationID)) queue.enqueue(newConfiguration);
                graphNode.edges.push({operation:operation,destination:newConfigurationID});
            }
            graph.set(currentConfigurationID,graphNode);
        }
    }
    return false
}
export {
    computeLevel,
    KernelDisassembly,
    CompleteDisassembly,
    OutputDisassemblePlan,
    OutputCompleteDisassemblePlan
}
