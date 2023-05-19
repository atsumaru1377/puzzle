import Image from 'next/image'
import { Inter } from 'next/font/google'
import PuzzleVisualizer from '@/components/Canvas'
import { config1, config2, config3, config4, config5, config6 } from '@/lib/testConfigs'
import { kernelDisassemblable, outputCompleteDisassemblePlan } from '@/lib/assemble'
import { constructPiece } from '@/lib/design'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const graph = kernelDisassemblable(config4);
  const disassembleSteps = outputCompleteDisassemblePlan(config4);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between ${inter.className}`}
    >
      <div className='w-full h-full p-0'>
        <PuzzleVisualizer />
      </div>
    </main>
  )
}
