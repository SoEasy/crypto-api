import { useContext, useEffect, useState } from 'react';
import { server } from './../server';
import { TClientData, TPasswords } from './../types';
import {
  base64ToString, bytesToString,
  decryptByAES, deriveAESKeyFromECDH, encryptByAES,
  importECDHPrivateKey, importECHDPublicKey,
  makeAESKeyFromPassword, stringToBase64,
  stringToBytes
} from './../crypto.utils';
import { ClientContext } from './../context';

/**
 * Из клиентского приватного ключа(зашифрованного паролем AES) и серверного публичного получить согласованный AES
 */
async function getClientServerAES(clientData: TClientData, password: string): Promise<CryptoKey> {
  const clientAES = await makeAESKeyFromPassword(password);

  const clientPrivateECDH = await importECDHPrivateKey(
    await decryptByAES({
      data: stringToBytes(
        base64ToString(clientData.clientPrivateECDH)
      ),
      aes: clientAES
    })
  );

  const serverPublicECDH = await importECHDPublicKey(
    stringToBytes(
      base64ToString(clientData.serverPublicECDH)
    )
  );

  const clientServerAES = await deriveAESKeyFromECDH({
    ownPrivateKey: clientPrivateECDH,
    anotherPublicKey: serverPublicECDH
  });

  return clientServerAES;
}

/**
 * Получить согласованный AES ключ клиента-сервер и расшифровать им пароль
 */
async function getPasswords(clientData: TClientData, masterPassword: string): Promise<TPasswords> {
  const clientServerAES = await getClientServerAES(clientData, masterPassword);

  const data = JSON.parse(
    bytesToString(
      await decryptByAES({
        data: stringToBytes(base64ToString(clientData.store)),
        aes: clientServerAES
      })
    )
  );
  return data;
}

/**
 * Принимает новый объект с паролями, шифрует его и отдает
 */
async function updatePasswordsInStore({ clientData, masterPassword, passwords }: { clientData: TClientData, passwords: TPasswords, masterPassword: string }): Promise<string> {
  const clientServerAES = await getClientServerAES(clientData, masterPassword);
  const passwordsEncrypted = stringToBase64(
    bytesToString(
      await encryptByAES(
        {
          data: stringToBytes(JSON.stringify(passwords)),
          aes: clientServerAES
        }
      )
    )
  );
  return passwordsEncrypted;
}

/**
 * Получить согласованный AES ключ клиента-сервер и расшифровать им код восстановления
 */
async function getRestoreCode(clientData: TClientData, masterPassword: string): Promise<string> {
  const clientServerAES = await getClientServerAES(clientData, masterPassword);

  const restoreCode = bytesToString(
    await decryptByAES({
      data: stringToBytes(base64ToString(clientData.restoreCodeEncryptedByAES)),
      aes: clientServerAES
    })
  );
  return restoreCode;
}

export function useClient() {
  const { clientData, setClientData } = useContext(ClientContext);
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [passwords, setPasswords] = useState<TPasswords | void>(void 0);
  const [restoreCode, setRestoreCode] = useState<string | void>(void 0);

  useEffect(function() {
    if (!clientData || !masterPassword) {
      console.log('No client data or password');
      setPasswords(void 0);
      setRestoreCode(void 0);
      return;
    }

    Promise.all([
      getPasswords(clientData, masterPassword),
      getRestoreCode(clientData, masterPassword)
    ]).then(([passwords, restoreCode]) => {
      console.log('success');
      setPasswords(passwords);
      setRestoreCode(restoreCode);
    }).catch(() => {
      console.log('error');
      setPasswords(void 0);
      setRestoreCode(void 0);
    });
  }, [clientData, masterPassword]);

  async function updatePasswords(passwords: TPasswords): Promise<void> {
    if (!clientData) {
      return;
    }

    const encryptedPasswords = await updatePasswordsInStore({
      clientData,
      masterPassword,
      passwords
    });
    await server.updateData({ email: clientData.email, data: encryptedPasswords });
    setClientData({
      ...clientData,
      store: encryptedPasswords
    });
    setPasswords(passwords);
  }

  return {
    /**
     * Сеттер объекта клиентских данных, которые хранятся на сервере
     */
    setClientData,
    /**
     * После ввода пароля - положить в память
     */
    setMasterPassword,
    /**
     * Объект с расшифрованными паролями
     */
    passwords,
    /**
     * Расшифрованный код восстановления
     */
    restoreCode,
    /**
     * Метод обновления паролей
     */
    updatePasswords
  }
}
