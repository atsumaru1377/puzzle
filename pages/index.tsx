import { Inter } from 'next/font/google'
import PuzzleVisualizer from '@/components/Canvas'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
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
