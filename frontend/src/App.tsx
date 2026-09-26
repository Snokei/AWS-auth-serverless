import { useState } from "react";
import "./App.css";

interface Item {
  id: string;
  name: string;
  description: string;
}

interface AppState {
  items: Item[];
  form: {
    name: string;
    description: string;
  };
  editingId: string | null;
}

const INITIAL_STATE: AppState = {
  items: [
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
  ],
  form: {
    name: "",
    description: "",
  },
  editingId: null,
};

function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setState((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [id]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, description } = state.form;
    if (!name.trim() || !description.trim()) return;

    setState((prev) => {
      if (prev.editingId) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === prev.editingId
              ? { ...item, name, description }
              : item
          ),
          form: { name: "", description: "" },
          editingId: null,
        };
      }

      const newItem: Item = {
        id: Date.now().toString(),
        name,
        description,
      };

      return {
        ...prev,
        items: [...prev.items, newItem],
        form: { name: "", description: "" },
      };
    });
  };

  const handleEdit = (item: Item) => {
    setState((prev) => ({
      ...prev,
      editingId: item.id,
      form: {
        name: item.name,
        description: item.description,
      },
    }));
  };

  const handleDelete = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      ...(prev.editingId === id
        ? { editingId: null, form: { name: "", description: "" } }
        : {}),
    }));
  };

  const handleCancelEdit = () => {
    setState((prev) => ({
      ...prev,
      editingId: null,
      form: { name: "", description: "" },
    }));
  };

  return (
    <div className="min-h-screen p-8 text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 pb-2">
            DynamoDB Items
          </h1>
          <p className="text-slate-400 mt-2">
            Manage your serverless application resources
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="md:col-span-1">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-indigo-300">
                {state.editingId ? "Update Item" : "Create New Item"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-400 mb-1"
                  >
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={state.form.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g. Lambda Function"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-400 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={state.form.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe the resource..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
                >
                  {state.editingId ? "Save Changes" : "Add Item"}
                </button>
                {state.editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="md:col-span-2 space-y-4">
            {state.items.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl p-12 text-center">
                <p className="text-slate-500">
                  No items found. Create one to get started.
                </p>
              </div>
            ) : (
              state.items.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-900/40 backdrop-blur-sm border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-xs text-slate-600 mt-3 font-mono">
                      ID: {item.id}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 rounded-lg text-sm font-medium transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg text-sm font-medium transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

