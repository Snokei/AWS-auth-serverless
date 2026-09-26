import { useState } from "react";
import Header from "./components/Header";
import ItemForm from "./components/ItemForm";
import ItemList from "./components/ItemList";
import type { Item, FormData, AppState } from "./types";
import "./App.css";

const INITIAL_FORM: FormData = {
  name: "",
  description: "",
};

const INITIAL_ITEMS: Item[] = [
  {
    id: "1",
    name: "Serverless Auth Module",
    description: "Lambda function for Cognito integration",
  },
  {
    id: "2",
    name: "DynamoDB Table Sync",
    description: "Event-driven sync between tables",
  },
];

function App() {
  const [appState, setAppState] = useState<AppState>({
    items: INITIAL_ITEMS,
    editingId: null,
  });

  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;

    if (appState.editingId) {
      setAppState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === prev.editingId
            ? {
                ...item,
                name: form.name.trim(),
                description: form.description.trim(),
              }
            : item
        ),
        editingId: null,
      }));
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        name: form.name.trim(),
        description: form.description.trim(),
      };
      setAppState((prev) => ({
        ...prev,
        items: [newItem, ...prev.items], // Add new item to the top of list
      }));
    }

    setForm(INITIAL_FORM);
  };

  const handleEdit = (item: Item) => {
    setAppState((prev) => ({ ...prev, editingId: item.id }));
    setForm({
      name: item.name,
      description: item.description,
    });
  };

  const handleDelete = (id: string) => {
    setAppState((prev) => {
      const isEditingDeleted = prev.editingId === id;
      if (isEditingDeleted) {
        setForm(INITIAL_FORM);
      }
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
        ...(isEditingDeleted ? { editingId: null } : {}),
      };
    });
  };

  const handleCancelEdit = () => {
    setAppState((prev) => ({ ...prev, editingId: null }));
    setForm(INITIAL_FORM);
  };

  const handleLogout = () => {
    alert("You have been logged out.");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Component 1: Header */}
      <Header itemCount={appState.items.length} onLogout={handleLogout} />

      {/* Main Container - Vertical Todo-List Layout */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Component 2: Form (Above) */}
        <ItemForm
          form={form}
          editingId={appState.editingId}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
        />

        {/* Component 3: List (Below) */}
        <ItemList
          items={appState.items}
          editingId={appState.editingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
