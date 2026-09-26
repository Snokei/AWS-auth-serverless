export interface Item {
  id: string;
  name: string;
  description: string;
  completed?: boolean;
}

export interface FormData {
  name: string;
  description: string;
}

export interface AppState {
  items: Item[];
  editingId: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type AuthMode = "login" | "register";
