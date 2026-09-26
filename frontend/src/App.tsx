import { useState, useEffect } from "react";
import Header from "./components/Header";
import ItemForm from "./components/ItemForm";
import ItemList from "./components/ItemList";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import type { Item, FormData, AppState, User, AuthMode } from "./types";
import { getApiUrl } from "./config";
import "./App.css";

const INITIAL_FORM: FormData = {
  name: "",
  description: "",
};

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
    items: [],
    editingId: null,
  });

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items from backend API when logged in
  useEffect(() => {
    if (!user) return;
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("list"));
      const data = await res.json();
      if (res.ok && data.items) {
        setAppState((prev) => ({ ...prev, items: data.items }));
      } else {
        setError(data.error || "Failed to load items");
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError("Network error connecting to backend API.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;

    setError(null);
    try {
      if (appState.editingId) {
        // UPDATE Item
        const res = await fetch(getApiUrl(`list/${appState.editingId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.item) {
          setAppState((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === prev.editingId ? data.item : item
            ),
            editingId: null,
          }));
        } else {
          setError(data.error || "Failed to update item");
        }
      } else {
        // CREATE Item
        const res = await fetch(getApiUrl("list"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.item) {
          setAppState((prev) => ({
            ...prev,
            items: [data.item, ...prev.items],
          }));
        } else {
          setError(data.error || "Failed to create item");
        }
      }
      setForm(INITIAL_FORM);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError("Network error saving item.");
    }
  };

  const handleEdit = (item: Item) => {
    setAppState((prev) => ({ ...prev, editingId: item.id }));
    setForm({
      name: item.name,
      description: item.description,
    });
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(getApiUrl(`list/${id}`), {
        method: "DELETE",
      });
      if (res.ok) {
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
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete item");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setError("Network error deleting item.");
    }
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
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 font-bold hover:text-red-700 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-2 text-xs text-zinc-500 animate-pulse">
            Syncing with AWS Lambda & DynamoDB...
          </div>
        )}

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

