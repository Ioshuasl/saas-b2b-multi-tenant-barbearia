import { v7 as uuidv7 } from 'uuid';

export class IdGenerator {
  next(): string {
    return uuidv7();
  }
}

export const idGenerator = new IdGenerator();
