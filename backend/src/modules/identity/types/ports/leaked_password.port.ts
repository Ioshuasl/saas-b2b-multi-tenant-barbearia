export type LeakedPasswordPort = {
  isLeaked(password: string): Promise<boolean>;
};
