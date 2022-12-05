import React, {useState} from 'react';
import {
  bytesToString, encryptByAES,
  exportAESKey, exportECDHPublicKey, exportECHDPrivateKey, generateECHDKey,
  makeAESKeyFromPassword,
  stringToBase64
} from './../crypto.utils';
import { useFormField } from './../hooks/use-form-field';

export function Step01ClientGenerateKeys(): React.ReactElement {
  const passwordInput = useFormField();

  const [aesPass, setAesPass] = useState('');
  const [ecdhPublic, setECDHPublic] = useState('');
  const [privateECDH, setPrivateECDH] = useState('');

  async function handleGenerateKeys(): Promise<void> {
    // Просто убедиться, что мы умеем делать ключ из пароля
    const aesKey = await makeAESKeyFromPassword(passwordInput.getValue());
    const aesKeyStr = stringToBase64(bytesToString(await exportAESKey(aesKey)));
    setAesPass(aesKeyStr);

    // Генерируем ECDH
    const clientECDH = await generateECHDKey();
    const clientPublicECDHStr = stringToBase64(bytesToString(await exportECDHPublicKey(clientECDH.publicKey)));
    const clientPrivateECDHBytes = await exportECHDPrivateKey(clientECDH.privateKey);
    const clientPrivateECDHEncryptedStr = stringToBase64(
      bytesToString(
        await encryptByAES({ data: clientPrivateECDHBytes, aes: aesKey })
      )
    );

    setECDHPublic(clientPublicECDHStr);
    setPrivateECDH(clientPrivateECDHEncryptedStr);
    console.log(clientPublicECDHStr.length);
  }

  return <>
    <p>Master password: <input type="text" placeholder="master password" {...passwordInput.inputProps}/></p>
    <button onClick={handleGenerateKeys}>Generate keys</button>
    <hr/>
    <p>AES_pass: <span style={{overflowWrap: 'anywhere'}}>{aesPass}</span></p>
    <p>ECDH_public: <span style={{overflowWrap: 'anywhere'}}>{ecdhPublic}</span></p>
    <p>ECDH_private_encr: <span style={{overflowWrap: 'anywhere'}}>{privateECDH}</span></p>
  </>;
}
