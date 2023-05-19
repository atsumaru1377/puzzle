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

type VoxelProps = {
    voxel: Voxel,
    color: string
};
type PieceProps = {
    piece: Piece
};

type PuzzleProps = {
    disassembleSteps: Configuration[]
};


const VoxelComponent = ({ voxel, color }: VoxelProps) => {
    const position = voxel;
    const size = 1;

    return (
        <Box position={position} args={[size, size, size]}>
            <meshStandardMaterial color={color} />
        </Box>
    );
};

const PieceComponent = ({ piece }: PieceProps) => {
    const voxels = piece.Voxels;
    const color = getSeededRandomColor(piece.ID);
    return (
        <>
            {voxels.map((voxel, index_voxel) => (
                <VoxelComponent key={index_voxel} voxel={voxel} color={color} />
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

const exampleConfigs:{[key:string]:Configuration} = {
    "config1":config1,
    "config2":config2,
    "config3":config3,
    "config4":config4,
    "config5":config5,
    "config6":config6,
    "config7":config7
}

const labels = Object.keys(exampleConfigs);

const PuzzleVisualizer = () => {
    const [move, setMove] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selectConfig, setSelectConfig] = useState(labels[0]);

    const onResetButtonClick = () => {
        setCurrentStepIndex(0);
    }

    const onDropdownSelect = (item:string) => {
        setCurrentStepIndex(0);
        setSelectConfig(item)
    }

    const onStopButtonClick = () => {
        setMove(!move);
    }

    //const config = constructPiece(exampleConfigs[selectConfig], 1, 3, exampleConfigs[selectConfig][0].piece.Voxels.length).configuration;
    const config = exampleConfigs[selectConfig];
    const steps = (config.length > 1 && completeDisassemblable(config)) ? outputCompleteDisassemblePlan(config) : [config];
    console.log(config, steps)
    const puzzleLevel = computeLevel(config);
    const isPuzzleDisassemblable = (completeDisassemblable(config))? "True": "False";
    const numPiece = config.length;

    const moveState = move ? "stop" : "start";

    useEffect(() => {
        const interval = setInterval(() => {
            if (move) setCurrentStepIndex((prevStepIndex) => Math.min((prevStepIndex + 1), steps.length - 1));
        }, 500);

        return () => clearInterval(interval);
    }, [steps]);

    return (
        <div className='w-full h-full'>
            <div style={{ width: '100vw', height: '20vh' }} className='flex flex-row py-4 px-10 items-center space-x-4 z-10'>
                <Button label={moveState} onClick={onStopButtonClick}/>
                <Button label="reset" onClick={onResetButtonClick}/>
                <DropdownList labels={labels} selectedItem={selectConfig} onSelect={onDropdownSelect}/>
                <span>Level:{puzzleLevel}</span>
                <span>Piece:{numPiece}</span>
                <span>Disassemblable:{isPuzzleDisassemblable}</span>
            </div>
            <Canvas style={{ width: '100vw', height: '80vh' }} className='z-0'>
                <CameraSetup />
                <ambientLight />
                <OrbitControls target={new THREE.Vector3(3, 2, 0)}/>
                <pointLight position={[10, 10, 10]} />
                {steps[currentStepIndex].map(({piece, state}, index) => (
                    <PieceComponent piece={piece} key={index}/>
                ))}
            </Canvas>
        </div>
    );
};

export default PuzzleVisualizer
