"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { apiJson, queryKeys } from "@/app/api";

interface AdminSession {
  role: "admin" | "player";
  playerId?: string | null;
}

export default function AdminLoginForm() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: (adminPassword: string) =>
      apiJson<AdminSession>(
        "/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword }),
        },
        "Could not sign in",
      ),
    onSuccess: (session) => {
      setPassword("");
      queryClient.setQueryData(queryKeys.admin.session, session);
    },
  });

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate(password);
  }

  return (
    <form
      onSubmit={submitPassword}
      className="rounded-xl bg-gray-800 p-5 shadow"
    >
      <label>
        <span className="mb-1 block">Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
        />
      </label>
      <button
        type="submit"
        disabled={login.isPending || password.length === 0}
        className="mt-4 w-full rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {login.isPending ? "Signing in…" : "Sign in"}
      </button>
      {login.error && (
        <p className="mt-3 text-red-300">{login.error.message}</p>
      )}
    </form>
  );
}

export type { AdminSession };
