import { useState } from "react";
import Header from "./components/Header";
import ItemForm from "./components/ItemForm";
import ItemList from "./components/ItemList";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import type { Item, FormData, AppState, User, AuthMode } from "./types";
import "./App.css";

const INITIAL_FORM: FormData = {
  name: "",
  description: "",
};

const INITIAL_ITEMS: Item[] = [
  {
    id: "1",
    name: "Serverless Auth Module",
    description: "Lambda function for JWT authentication & DynamoDB",
  },
  {
    id: "2",
    name: "DynamoDB Table Sync",
    description: "Event-driven sync between user tables",
  },
];

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [appState, setAppState] = useState<AppState>({
    items: INITIAL_ITEMS,
    editingId: null,
  });

  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const handleAuthSuccess = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("token", token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

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
        items: [newItem, ...prev.items],
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

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md mb-4 text-center">
          <span className="inline-block text-xs font-semibold px-3 py-1 bg-zinc-200 text-zinc-700 rounded-full mb-2">
            Question 1: AWS Serverless Auth
          </span>
          <h1 className="text-2xl font-bold text-zinc-900">Authentication Portal</h1>
          <p className="text-xs text-zinc-500 mt-1">
            JWT-based registration & login powered by AWS Lambda & DynamoDB
          </p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="w-full max-w-md bg-zinc-200 p-1 rounded-lg flex mb-4">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer ${
              authMode === "login"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer ${
              authMode === "register"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Render Active Form */}
        {authMode === "login" ? (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setAuthMode("register")}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode("login")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Component 1: Header */}
      <Header
        itemCount={appState.items.length}
        onLogout={handleLogout}
        user={user}
      />

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

