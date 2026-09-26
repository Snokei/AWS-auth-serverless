import React from "react";
import { LogOut, Database, User as UserIcon, MessageSquare, ListTodo } from "lucide-react";
import type { User } from "../types";

interface HeaderProps {
  itemCount: number;
  activeTab: "items" | "chat";
  onTabChange: (tab: "items" | "chat") => void;
  onLogout?: () => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  itemCount,
  activeTab,
  onTabChange,
  onLogout,
  user,
}) => {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      alert("Logged out successfully.");
    }
  };

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-10 shadow-xs">
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & App Info */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 leading-tight">
              AWS Auth & Serverless
            </h1>
            <p className="text-xs text-zinc-500">
              Resource Manager & Real-Time Chat
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs">
          <button
            type="button"
            onClick={() => onTabChange("items")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === "items"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Items ({itemCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Chat</span>
          </button>
        </div>

        {/* Right Section: User Info & Logout Button */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1">
              <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-900">{user.name || user.email}</span>
            </div>
          )}

          <button
            onClick={handleLogoutClick}
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-red-600 bg-zinc-100 hover:bg-red-50 border border-zinc-200 hover:border-red-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
