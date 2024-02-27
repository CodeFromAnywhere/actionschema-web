import "@/styles/globals.css";
import "actionschema-react/css.css";

import type { AppProps } from "next/app";
import { actionSchemaWebStore } from "@/lib/store";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <actionSchemaWebStore.StoreProvider>
      <Component {...pageProps} />
    </actionSchemaWebStore.StoreProvider>
  );
}
