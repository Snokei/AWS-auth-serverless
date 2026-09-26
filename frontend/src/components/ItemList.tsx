import React from "react";
import type { Item } from "../types";
import { ListTodo, Pencil, Trash2, Inbox } from "lucide-react";

interface ItemListProps {
  items: Item[];
  editingId: string | null;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  editingId,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-zinc-700" />
          <span>Items List</span>
          <span className="text-xs font-normal text-zinc-500">
            ({items.length})
          </span>
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-zinc-200 border-dashed rounded-lg p-8 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-sm text-zinc-500 font-medium">No items found</p>
          <p className="text-xs text-zinc-400 mt-1">
            Add a new item using the form above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isCurrentlyEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-lg p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                  isCurrentlyEditing
                    ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded shrink-0">
                      ID: {item.id}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onEdit(item)}
                    type="button"
                    className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                      isCurrentlyEditing
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border-zinc-200"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isCurrentlyEditing ? "Editing..." : "Edit"}</span>
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ItemList;
