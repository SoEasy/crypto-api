import { TClientData } from './types';
import {
  base64ToString,
  bytesToString, decryptByAES, deriveAESKeyFromECDH, encryptByAES,
  exportECDHPublicKey,
  exportECHDPrivateKey,
  generateECHDKey, importECDHPrivateKey, importECHDPublicKey,
  makeAESKeyFromPassword,
  stringToBase64, stringToBytes
} from './crypto.utils';

type TServerState = {
  clients: Record<string, TClientData>;
}

const LOCAL_STORAGE_KEY = 'podlodka_crypto_server';

export class Server {
  private listeners: Array<() => void> = [];
  data: TServerState = {
    clients: {}
  };

  constructor() {
    const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedState) {
      this.data = JSON.parse(storedState);
    } else {
      this.persist();
    }
  }

  private persist(): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.data));
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  listen(cb: () => void): void {
    this.listeners.push(cb);
  }

  async registerUser(request: {
    email: string,
    restoreCode: string,
    clientPublicECDH: string,
    clientPrivateECDH: string
  }): Promise<void> {
    // Сгенерируем ключи сервера
    const serverECDH = await generateECHDKey();
    const restoreAES = await makeAESKeyFromPassword(request.restoreCode);

    // Превратим их в строки для хранения
    // Публичный - как есть
    const serverPublicECDH = stringToBase64(bytesToString(await exportECDHPublicKey(serverECDH.publicKey)));
    // Приватный в строку и зашфруем кодом восстановления
    const serverECDHPrivateBytes = await exportECHDPrivateKey(serverECDH.privateKey);
    const serverPrivateECDH = stringToBase64(
      bytesToString(
        await encryptByAES({ data: serverECDHPrivateBytes, aes: restoreAES })
      )
    );

    // Достанем клиентский публичный ключ
    const clientPublicECDHKey = await importECHDPublicKey(stringToBytes(base64ToString(request.clientPublicECDH)));
    // и сделаем общий AES ключ
    const clientServerAES = await deriveAESKeyFromECDH({
      ownPrivateKey: serverECDH.privateKey,
      anotherPublicKey: clientPublicECDHKey
    });

    // Зашифруем данные и код восстановления общим AES ключом
    const store = stringToBase64(
      bytesToString(
        await encryptByAES({
          data: stringToBytes(JSON.stringify({})),
          aes: clientServerAES
        })
      )
    );
    const restoreCodeEncryptedByAES = stringToBase64(
      bytesToString(
        await encryptByAES({
          data: stringToBytes(request.restoreCode),
          aes: clientServerAES
        })
      )
    );

    const newData = { ...this.data };
    newData.clients[request.email] = {
      email: request.email,
      clientPublicECDH: request.clientPublicECDH,
      clientPrivateECDH: request.clientPrivateECDH,
      serverPublicECDH,
      serverPrivateECDH,
      restoreCodeEncryptedByAES,
      store,
    };
    this.data = newData;
    this.persist();
    this.notify();
  }

  async restoreUser(request: {
    email: string;
    restoreCode: string;
    clientPublicECDH: string;
    clientPrivateECDH: string;
  }): Promise<void> {
    const client = this.data.clients[request.email];
    if (!client) {
      throw new Error('Неверный емейл');
    }

    // Из кода восстановления делаем AES ключ
    const restoreAES = await makeAESKeyFromPassword(request.restoreCode);
    // Расшифровываем приватный ECDH ключ сервера
    const serverPrivateECDHKeyBytes = await decryptByAES(
      { data: stringToBytes(base64ToString(client.serverPrivateECDH)), aes: restoreAES }
    );
    const serverPrivateECHD = await importECDHPrivateKey(serverPrivateECDHKeyBytes);

    // Берем старый публичный ключ клиента
    const oldClientPublicECDH = await importECHDPublicKey(
      stringToBytes(base64ToString(client.clientPublicECDH))
    );

    // Из приватного ключа сервера и старого публичного ключа юзера получаем ключ для расшифровки данных
    const oldClientServerAES = await deriveAESKeyFromECDH({
      ownPrivateKey: serverPrivateECHD,
      anotherPublicKey: oldClientPublicECDH
    });

    // Достаем данные
    const clientData = await decryptByAES({
      data: stringToBytes(base64ToString(client.store)),
      aes: oldClientServerAES
    });

    // Достаем restoreCode
    const restoreCode = await decryptByAES({
      data: stringToBytes(base64ToString(client.restoreCodeEncryptedByAES)),
      aes: oldClientServerAES
    });

    // Генерируем новый согласованный AES ключ

    // Берем новый публичный ключ клиента
    const newClientPublicECDH = await importECHDPublicKey(
      stringToBytes(base64ToString(request.clientPublicECDH))
    );

    // Делаем ключ
    const newClientServerAES = await deriveAESKeyFromECDH({
      ownPrivateKey: serverPrivateECHD,
      anotherPublicKey: newClientPublicECDH
    });

    // Шифруем данные
    const encryptedData = stringToBase64(
      bytesToString(
        await encryptByAES({
          data: clientData,
          aes: newClientServerAES
        })
      )
    );

    const encryptedRestoreCode = stringToBase64(
      bytesToString(
        await encryptByAES({
          data: restoreCode,
          aes: newClientServerAES
        })
      )
    );

    // Перешифруем restoreCode

    // Сохраняем все
    const newData = { ...this.data };
    newData.clients[request.email] = {
      ...newData.clients[request.email],
      store: encryptedData,
      restoreCodeEncryptedByAES: encryptedRestoreCode,
      clientPublicECDH: request.clientPublicECDH,
      clientPrivateECDH: request.clientPrivateECDH
    }
    this.data = newData;
    this.persist();
    this.notify();
  }

  async login(request: { email: string }): Promise<TClientData> {
    return {...this.data.clients[request.email]};
  }

  async updateData(request: { email: string, data: string }): Promise<void> {
    this.data = {
      ...this.data,
      clients: {
        ...this.data.clients,
        [request.email]: {
          ...this.data.clients[request.email],
          store: request.data
        }
      }
    }
    this.persist();
    this.notify();
  }
}

export const server = new Server();
