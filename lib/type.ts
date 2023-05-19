export const LIMIT = 20;

export enum Direction {
    Xminus,
    Yminus,
    Zminus,
    Xplus,
    Yplus,
    Zplus
};

export type State = [number, number, number];
export type Voxel = [number, number, number];

export type Piece = {
    ID : number,
    Voxels : Voxel[]
};

export type VoxelShape = Voxel[];

export type Subassembly = Piece[];

export type Operation = {
    pieces : Piece[],
    direction : Direction,      // direction of move
    steps : number              // size of step
}

export type Configuration = Array<{ piece: Piece; state: State }>;

export interface GraphNode {
    configuration: Configuration,
    target: boolean,
    edges: Array<{operation:Operation,destination:string}>
}

export type Graph = Map<string, GraphNode>;

export type PuzzleUnderDesign = {
    pieces: Piece[],
    rest: Voxel[]
}

export type DirectionAndSeedVoxel = {
    direction: Direction,
    seed: Voxel
}