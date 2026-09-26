import React from "react";
import type { FormData } from "../types";
import { Plus, Pencil, Check, X } from "lucide-react";

interface ItemFormProps {
  form: FormData;
  editingId: string | null;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  form,
  editingId,
  onInputChange,
  onSubmit,
  onCancelEdit,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          {editingId ? (
            <Pencil className="w-4 h-4 text-amber-600" />
          ) : (
            <Plus className="w-4 h-4 text-zinc-700" />
          )}
          {editingId ? "Edit Item" : "Add New Item"}
        </h2>
        {editingId && (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Editing Mode
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Item Name
          </label>
          <input
            type="text"
            id="name"
            value={form.name}
            onChange={onInputChange}
            className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
            placeholder="e.g. Serverless Auth Module"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={onInputChange}
            rows={2}
            className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors resize-none"
            placeholder="Describe the resource or task details..."
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {editingId ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{editingId ? "Save Changes" : "Add Item"}</span>
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium py-2 px-4 rounded-md transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
