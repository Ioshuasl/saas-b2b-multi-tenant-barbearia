import type { FormEvent } from 'react';
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form';

export function onFormSubmit<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
  onSave: (values: T) => Promise<void>,
) {
  return (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSave)(event);
  };
}
