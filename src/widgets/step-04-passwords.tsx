import React from 'react';
import { TPasswords } from './../types';
import { useFormField } from './../hooks/use-form-field';
import { useClient } from './../hooks/use-client';

function Passwords({passwords, onDelete}: { passwords: TPasswords | void; onDelete: (serviceName: string) => void }): React.ReactElement | null {
  if (!passwords) {
    return <span>No session</span>;
  }

  if (Object.keys(passwords).length === 0) {
    return <span>No passwords</span>;
  }

  return <ul>
    {
      Object.keys(passwords).map((serviceName: string) => {
        return <li>
          <h3>{serviceName}</h3>
          <p>Login: {passwords[serviceName].login}</p>
          <p>Password: {passwords[serviceName].password}</p>
          <button onClick={() => { onDelete(serviceName) }}>Delete</button>
        </li>;
      })
    }
  </ul>;
}

export function Step04Passwords(): React.ReactElement {
  const masterPasswordInput = useFormField();
  const serviceNameInput = useFormField();
  const loginInput = useFormField();
  const passwordInput = useFormField();

  const clientController = useClient();
  const passwords = clientController.passwords;

  function handleAddPassword(): void {
    if (!passwords) {
      return;
    }

    clientController.updatePasswords({
      ...passwords,
      [serviceNameInput.getValue()]: {
        login: loginInput.getValue(),
        password: passwordInput.getValue()
      }
    });
  }

  function handleDeletePassword(serviceName: string): void {
    if (!passwords) {
      return;
    }

    delete passwords[serviceName];
    clientController.updatePasswords({ ...passwords });
  }

  return <>
    <input placeholder="master password" type="text" {...masterPasswordInput.inputProps}/>
    <button onClick={() => { clientController.setMasterPassword(masterPasswordInput.getValue()) }}>Enter</button>
    <hr/>
    <p><input placeholder="service name" type="text" {...serviceNameInput.inputProps}/></p>
    <p><input placeholder="login" type="text" {...loginInput.inputProps}/></p>
    <p><input placeholder="password" type="text" {...passwordInput.inputProps}/></p>
    <button onClick={handleAddPassword}>Add password</button>
    <hr/>
    <p>Passwords: <Passwords passwords={passwords} onDelete={handleDeletePassword}/></p>
  </>;
}
