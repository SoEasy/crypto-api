import React from 'react';
import { useClient } from './../hooks/use-client';
import { server } from './../server';
import { useFormField } from './../hooks/use-form-field';

export function Step03Login(): React.ReactElement {
  const emailInput = useFormField();
  const passwordInput = useFormField();
  const clientController = useClient();

  async function handleLogin(): Promise<void> {
    const clientData = await server.login({ email: emailInput.getValue() });
    clientController.setMasterPassword(passwordInput.getValue());
    clientController.setClientData(clientData);
  }

  return <>
    <p>Client email <input type="text" {...emailInput.inputProps}/></p>
    <p>Password <input type="text" {...passwordInput.inputProps}/></p>
    <button onClick={handleLogin}>Login</button>
    <hr/>
    <p>Restore code: {clientController.restoreCode || 'None'}</p>
    <p>Passwords: <pre>{clientController.passwords ? JSON.stringify(clientController.passwords, null, 2) : 'None'}</pre></p>
  </>
}
