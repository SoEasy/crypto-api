import React, { useState } from 'react';
import {
  bytesToString, encryptByAES,
  exportECDHPublicKey, exportECHDPrivateKey,
  generateECHDKey,
  makeAESKeyFromPassword,
  stringToBase64
} from './../crypto.utils';
import { useFormField } from './../hooks/use-form-field';

export function Step05ClientRestore(): React.ReactElement {
  const newPasswordInput = useFormField();
  const [newPublicECDH, setNewPublicECDH] = useState('');
  const [newPrivateECDH, setNewPrivateECDH] = useState('');

  async function handleGenerateKeys(): Promise<void> {
    // Сгенерируем новый ключ из нового пароля
    const newAESKey = await makeAESKeyFromPassword(newPasswordInput.getValue());

    const newClientECDH = await generateECHDKey();
    const newClientPublicECDHStr = stringToBase64(bytesToString(await exportECDHPublicKey(newClientECDH.publicKey)));
    const newClientPrivateECDHBytes = await exportECHDPrivateKey(newClientECDH.privateKey);
    const newClientPrivateECDHEncryptedStr = stringToBase64(
      bytesToString(
        await encryptByAES({ data: newClientPrivateECDHBytes, aes: newAESKey })
      )
    );

    setNewPublicECDH(newClientPublicECDHStr);
    setNewPrivateECDH(newClientPrivateECDHEncryptedStr);
  }

  return <>
      <p>new password <input type="text" {...newPasswordInput.inputProps}/></p>
      <button onClick={handleGenerateKeys}>Generate new keys</button>
      <p>ECDH_public: <span style={{overflowWrap: 'anywhere'}}>{newPublicECDH}</span></p>
      <p>ECDH_private: <span style={{overflowWrap: 'anywhere'}}>{newPrivateECDH}</span></p>
    </>;
}
