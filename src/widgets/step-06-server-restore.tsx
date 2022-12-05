import React from 'react';
import { server } from './../server';
import { useFormField } from './../hooks/use-form-field';

export function Step06ServerRestore(): React.ReactElement {
  const emailInput = useFormField();
  const restoreCodeInput = useFormField();
  const newClientPublicECDH = useFormField();
  const newClientPrivateECDH = useFormField();

  async function handleRestore(): Promise<void> {
    await server.restoreUser({
      email: emailInput.getValue(),
      restoreCode: restoreCodeInput.getValue(),
      clientPublicECDH: newClientPublicECDH.getValue(),
      clientPrivateECDH: newClientPrivateECDH.getValue()
    });
  }

  return <>
    <p>email: <input type="text" {...emailInput.inputProps}/></p>
    <p>restore code: <input type="text" {...restoreCodeInput.inputProps}/></p>
    <p>new client public ECDH: <input type="text" {...newClientPublicECDH.inputProps}/></p>
    <p>new client private ECDH: <input type="text" {...newClientPrivateECDH.inputProps}/></p>
    <button onClick={handleRestore}>Restore</button>
  </>;
}
