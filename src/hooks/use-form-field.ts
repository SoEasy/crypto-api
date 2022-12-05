import { ChangeEvent, useState } from 'react';

export type TFormFieldProps = {
  inputProps: {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };
  setValue: (v: string) => void;
  getValue: () => string;
}

export function useFormField(): TFormFieldProps {
  const [value, setValue] = useState('');

  function onChange(e: ChangeEvent<HTMLInputElement>): void {
    setValue(e.target.value);
  }

  return {
    inputProps: {
      value,
      onChange
    },
    getValue() { return value; },
    setValue(v: string) { setValue(v) }
  };
}
