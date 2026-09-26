import React from "react";
import { LogOut, Database, User as UserIcon } from "lucide-react";
import type { User } from "../types";

interface HeaderProps {
  itemCount: number;
  onLogout?: () => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({ itemCount, onLogout, user }) => {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      alert("Logged out successfully.");
    }
  };

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-10 shadow-xs">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Brand & App Info */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 leading-tight">
              DynamoDB Items
            </h1>
            <p className="text-xs text-zinc-500">
              Serverless Resource & Task Manager
            </p>
          </div>
        </div>

        {/* Right Section: Badge, User Info & Logout Button */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1">
              <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-900">{user.name || user.email}</span>
            </div>
          )}

          <div className="text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-full px-3 py-1 font-medium">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </div>

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

