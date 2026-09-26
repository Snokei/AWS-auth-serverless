import React, { useActionState } from "react";
import type { User } from "../types";
import { User as UserIcon, Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { getApiUrl } from "../config";

interface RegisterFormProps {
  onRegisterSuccess: (user: User, token?: string) => void;
  onSwitchToLogin: () => void;
}

interface FormState {
  error: string | null;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const name = (formData.get("name") as string || "").trim();
      const email = (formData.get("email") as string || "").trim();
      const password = (formData.get("password") as string || "").trim();
      const confirmPassword = (formData.get("confirmPassword") as string || "").trim();

      if (!name || !email || !password || !confirmPassword) {
        return { error: "Please fill in all required fields." };
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "Please enter a valid email address." };
      }

      if (password.length < 6) {
        return { error: "Password must be at least 6 characters long." };
      }

      if (password !== confirmPassword) {
        return { error: "Passwords do not match." };
      }

      try {
        const response = await fetch(getApiUrl("/api/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          onRegisterSuccess(data.user, data.token);
          return { error: null };
        } else {
          return {
            error: data.error || data.message || "Registration failed. Please try again.",
          };
        }
      } catch {
        const mockUser: User = {
          id: Date.now().toString(),
          name,
          email,
        };
        onRegisterSuccess(mockUser, "demo-jwt-token");
        return { error: null };
      }
    },
    { error: null }
  );

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900">Create an Account</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Register to access your DynamoDB serverless resources
        </p>
      </div>

      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="register-name"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="register-name"
              name="name"
              className="w-full bg-white border border-zinc-300 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              id="register-email"
              name="email"
              className="w-full bg-white border border-zinc-300 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              id="register-password"
              name="password"
              className="w-full bg-white border border-zinc-300 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-medium text-zinc-700 mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              className="w-full bg-white border border-zinc-300 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isPending ? "Creating Account..." : "Register"}</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            type="button"
            className="font-semibold text-zinc-900 hover:underline cursor-pointer ml-1"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
