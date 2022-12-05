import React, { useEffect, useState } from 'react';
import './App.css';
import { Step05ClientRestore } from './widgets/step-05-client-restore';
import { Step06ServerRestore } from './widgets/step-06-server-restore';
import { Step04Passwords } from './widgets/step-04-passwords';
import { ClientContextProvider } from './context';
import { Step03Login } from './widgets/step-03-login';
import { server } from './server';
import { Step02ServerRegisterClient } from './widgets/step-02-server-register-client';
import { Step01ClientGenerateKeys } from './widgets/step-01-client-generate-keys';
import { Accordion } from './components/accordion';
import { Sequence } from './components/sequence';
import { Tile } from './components/tile';

function ServerState(): React.ReactElement {
  const [state, setState] = useState(server.data);

  useEffect(() => {
    server.listen(() => {
      setState(server.data);
    });
  }, []);

  return <pre>
    {JSON.stringify(state, null, 2)}
  </pre>;
}

function App() {
  return (
    <ClientContextProvider>
      <div className="app">
        <div className="left-panel">
          <Accordion title="Register">
            <Sequence>
              <Tile>
                <Step01ClientGenerateKeys/>
              </Tile>
              <Tile>
                <Step02ServerRegisterClient/>
              </Tile>
            </Sequence>
          </Accordion>

          <Accordion title="Login">
            <Sequence>
              <Tile><Step03Login/></Tile>
            </Sequence>
          </Accordion>

          <Accordion title="Passwords">
            <Sequence>
              <Tile><Step04Passwords /></Tile>
            </Sequence>
          </Accordion>

          <Accordion title="Reset">
            <Sequence>
              <Tile><Step05ClientRestore /></Tile>
              <Tile><Step06ServerRestore /></Tile>
            </Sequence>
          </Accordion>
        </div>

        <div className="right-panel">
          <h1>Server state</h1>
          <ServerState/>
        </div>

      </div>
    </ClientContextProvider>
  );
}

export default App;
