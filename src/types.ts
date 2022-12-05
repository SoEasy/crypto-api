export type TClientData = {
  email: string;
  clientPublicECDH: string;
  clientPrivateECDH: string;
  serverPublicECDH: string;
  serverPrivateECDH: string;
  restoreCodeEncryptedByAES: string;
  store: string;
}

export type TPassword = {
  login: string;
  password: string;
}

export type TPasswords = Record<string, TPassword>;
