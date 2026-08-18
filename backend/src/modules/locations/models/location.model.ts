import { DefaultLocationError } from './errors/default_location.error.js';

export function assertCanChangeDefault(input: {
  makingDefault: boolean;
  unsettingDefault: boolean;
  deactivatingDefault: boolean;
}): void {
  if (input.unsettingDefault) {
    throw new DefaultLocationError(
      'Defina outra unidade como padrão antes de remover o padrão atual.',
    );
  }
  if (input.deactivatingDefault) {
    throw new DefaultLocationError('A unidade padrão não pode ser desativada.');
  }
}
