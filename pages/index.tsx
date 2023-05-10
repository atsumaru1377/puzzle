import Image from 'next/image'
import { Inter } from 'next/font/google'
import PuzzleVisualizer from '@/components/Canvas'
import { config1, config2, config3, config4, config5 } from '@/lib/testConfigs'
import { CompleteDisassembly, KernelDisassembly, OutputCompleteDisassemblePlan, OutputDisassemblePlan } from '@/lib/assemble'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const graph = KernelDisassembly(config4);
  const disassembleSteps = OutputCompleteDisassemblePlan(config4);
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
