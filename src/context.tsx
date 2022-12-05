import React, { useState } from 'react';
import { TClientData } from './types';

type TClientContext = {
  clientData: TClientData | void;
  setClientData: (data: TClientContext['clientData']) => void;
}

// @ts-ignore
export const ClientContext = React.createContext<TClientContext>();

export function ClientContextProvider(props: { children: React.ReactElement }) {
  const [clientData, setClientData] = useState<TClientContext['clientData']>();

  return <ClientContext.Provider value={{ clientData, setClientData }}>
    {props.children}
  </ClientContext.Provider>
}
