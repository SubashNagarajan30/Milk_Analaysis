export enum Role {
  ADMIN = 'Admin',
  HUB_INCHARGE = 'Hub Incharge',
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  hubId: string;
}

export interface Hub {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Collection {
  quantity: number;
  fat: number;
  snf: number;
}

export interface DailyRecord {
  id: string;
  hubId: string;
  date: string; // YYYY-MM-DD
  morning: Collection;
  evening: Collection;
  morningReTest?: Collection;
  eveningReTest?: Collection;
}

export interface TankerRetest {
  id: string;
  hubId: string;
  date: string;
  quantity: number;
  fat: number;
  snf: number;
}