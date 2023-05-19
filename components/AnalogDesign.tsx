import { useEffect, useState } from 'react';
import { Canvas, useThree} from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Configuration, Voxel, Piece} from '../lib/type';
import getSeededRandomColor from '@/lib/getColor';
import * as THREE from 'three';

import Button from './Button';
import { config1, config2, config3, config4, config5, config6, config7 } from '@/lib/testConfigs';
import { completeDisassemblable, outputCompleteDisassemblePlan, computeLevel } from '@/lib/assemble';
import DropdownList from './DropdownList';
import { start } from 'repl';
import { constructPiece } from '@/lib/design';
import Input from './Input';
import clone from 'clone';

type VoxelProps = {
    voxel: Voxel,
    color: string,
    onVoxelClick:(voxel:Voxel)=>void
};
type PieceProps = {
    piece: Piece,
    onVoxelClick:(voxel:Voxel)=>void
};

const VoxelComponent = ({ voxel, color, onVoxelClick }: VoxelProps) => {
    const position = voxel;
    const size = 1;

    const handleClick = () => {
        onVoxelClick(voxel);
    };

    return (
        <Box position={position} args={[size, size, size]} onClick={handleClick}>
            <meshStandardMaterial color={color} />
        </Box>
    );
};

const PieceComponent = ({ piece, onVoxelClick }: PieceProps) => {
    const voxels = piece.Voxels;
    const color = getSeededRandomColor(piece.ID);
    return (
        <>
            {voxels.map((voxel, index_voxel) => (
                <VoxelComponent key={index_voxel} voxel={voxel} color={color} onVoxelClick={onVoxelClick} />
            ))}
        </>
    );
};

const CameraSetup = () => {
    const { camera } = useThree();

    useEffect(() => {
      camera.position.set(3, 3, 8);
      camera.lookAt(3, 3, 3);
    }, [camera]);

    return null;
};

const makeInitialConfiguration = (x:number, y:number, z:number):Configuration => {
    const voxels:Voxel[] = [];
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            for (let k = 0; k < z; k++) {
                voxels.push([i,j,k] as Voxel)
            }
        }
    }
    return [
        {
            piece:{
                ID:0,
                Voxels:voxels
            },
            state:[0,0,0]
        }
    ]
}

const updateConfig = (configuration:Configuration, targetVoxel:Voxel, pieceID:number):Configuration => {
    const newConfiguration = clone(configuration);
    const voxelToIdMap = new Map<string, number>();
    configuration.forEach(({ piece }) => {
        piece.Voxels.forEach(voxel => {
            voxelToIdMap.set(voxel.join(","), piece.ID);
        });
    });

    if (pieceID == -1) {
        newConfiguration[voxelToIdMap.get(targetVoxel.join(",")) ?? 0].piece.Voxels = newConfiguration[voxelToIdMap.get(targetVoxel.join(",")) ?? 0].piece.Voxels.filter(voxel => !(voxel[0] == targetVoxel[0] && voxel[1] == targetVoxel[1] && voxel[2] == targetVoxel[2]));
        return newConfiguration;
    }
    if (newConfiguration.length - 1 < pieceID) {
        for (let i = newConfiguration.length; i <= pieceID; i++) {
            newConfiguration.push({
                piece: {
                    ID:i,
                    Voxels:[]
                },
                state:[0,0,0]
            })
        }
    }
    newConfiguration[voxelToIdMap.get(targetVoxel.join(",")) ?? 0].piece.Voxels = newConfiguration[voxelToIdMap.get(targetVoxel.join(",")) ?? 0].piece.Voxels.filter(voxel => !(voxel[0] == targetVoxel[0] && voxel[1] == targetVoxel[1] && voxel[2] == targetVoxel[2]));
    newConfiguration[pieceID].piece.Voxels.push(targetVoxel);
    newConfiguration[pieceID].piece.Voxels = Array.from(new Set(newConfiguration[pieceID].piece.Voxels.map(voxel => voxel.join(","))), voxel => voxel.split(",").map(Number) as Voxel);
    return newConfiguration;
}

const PuzzleVisualizer = () => {
    const [move, setMove] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [config, setConfig] = useState(makeInitialConfiguration(5,5,1));
    const [pieceID, setPieceID] = useState(0);
    const [steps, setSteps] = useState((config.length > 1 && completeDisassemblable(config)) ? outputCompleteDisassemblePlan(config) : [config])
    const [puzzleLevel, setPuzzleLevel] = useState(computeLevel(config))
    const [isPuzzleDisassemblable, setIsPuzzleDisassemblable] = useState((completeDisassemblable(config))? "True": "False");
    const [numPiece, setNumPiece] =useState(config.length);

    const onResetButtonClick = () => {
        setCurrentStepIndex(0);
    }

    const onStopButtonClick = () => {
        setMove(!move);
    }

    const onPieceIDChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const {value} = e.target;
        setPieceID(Number(value))
    }

    const onVoxelClick = (voxel:Voxel) => {
        setConfig(updateConfig(config,voxel,pieceID));
        setSteps((config.length > 1 && completeDisassemblable(config)) ? outputCompleteDisassemblePlan(config) : [config]);
        setPuzzleLevel(computeLevel(config));
        setIsPuzzleDisassemblable((completeDisassemblable(config))? "True": "False");
        setNumPiece(config.length);
        console.log(config);
    }
    const moveState = move ? "stop" : "start";

    const plus = () => {
        setPieceID(pieceID + 1);
    }

    const minus = () => {
        setPieceID((pieceID == -1) ? -1 : pieceID - 1)
    }

    useEffect(() => {
        const interval = setInterval(() => {
            if (move) setCurrentStepIndex((prevStepIndex) => Math.min((prevStepIndex + 1), steps.length - 1));
        }, 500);

        return () => clearInterval(interval);
    }, [steps]);

    return (
        <div className='w-full h-full'>
            <div style={{ width: '100vw', height: '10vh' }} className='flex flex-row py-4 px-10 items-center space-x-4 z-10'>
                <Button label={moveState} onClick={onStopButtonClick}/>
                <Button label="reset" onClick={onResetButtonClick}/>
                <span>Level:{puzzleLevel}</span>
                <span>Piece:{numPiece}</span>
                <span>Disassemblable:{isPuzzleDisassemblable}</span>
            </div>
            <div style={{ width: '100vw', height: '10vh' }} className='flex flex-row py-4 px-10 items-center z-10'>
                <span className='pr-0'>ID of changing piece:</span>
                <Input value={pieceID} onChange={onPieceIDChange} onIncrement={plus} onDecrement={minus}/>
                <span className='pr-0'>(-1 is delete mode)</span>
            </div>
            <Canvas style={{ width: '100vw', height: '80vh' }} className='z-0'>
                <CameraSetup />
                <ambientLight />
                <OrbitControls target={new THREE.Vector3(3, 2, 0)}/>
                <pointLight position={[10, 10, 10]} />
                {steps[currentStepIndex].map(({piece, state}, index) => (
                    <PieceComponent piece={piece} key={index} onVoxelClick={onVoxelClick}/>
                ))}
            </Canvas>
        </div>
    );
};

export default PuzzleVisualizer
