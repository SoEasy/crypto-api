import React from 'react';
import { server } from './../server';
import { useFormField } from './../hooks/use-form-field';

export function Step02ServerRegisterClient(): React.ReactElement {
  const emailInput = useFormField();
  const restoreCodeInput = useFormField();
  const clientPublicECDHInput = useFormField();
  const clientPrivateECDHInput = useFormField();

  async function handleRegisterClient(): Promise<void> {
    await server.registerUser({
      email: emailInput.getValue(),
      restoreCode: restoreCodeInput.getValue(),
      clientPublicECDH: clientPublicECDHInput.getValue(),
      clientPrivateECDH: clientPrivateECDHInput.getValue()
    })
  }

  return <>
    <p>Client email <input type="text" {...emailInput.inputProps}/></p>
    <p>Restore Code <input type="text" {...restoreCodeInput.inputProps}/></p>
    <p>Client ECHD_public <input type="text" {...clientPublicECDHInput.inputProps}/></p>
    <p>Client ECHD_private_encr <input type="text" {...clientPrivateECDHInput.inputProps}/></p>
    <button onClick={handleRegisterClient}>Register client</button>
  </>;
}
