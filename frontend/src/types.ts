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
