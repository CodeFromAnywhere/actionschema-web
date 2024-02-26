import "@/styles/globals.css";
import "actionschema2/css.css";
import "react-with-native-select/css.css";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
