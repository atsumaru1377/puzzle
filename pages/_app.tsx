import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import MoveButton from '../components/MoveButton';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <MoveButton />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
