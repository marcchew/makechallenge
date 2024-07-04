"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/context/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const updateLogin = useUserStore((state: any) => state.updateLogin);
  const updateUser = useUserStore((state: any) => state.updateUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous error message

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid username or password.");
        } else {
          setError("An error occurred. Please try again later.");
        }
        return;
      }

      const data = await res.json();
      updateLogin(true);
      updateUser({
        username: data.username,
        id: data.user_id,
        admin: data.isAdmin,
        accessToken: data.token,
      });
      localStorage.setItem("accessToken", data.token);
      router.push("/");
    } catch (err) {
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[400px] shadow-lg border-2 rounded-lg">
      <div className="text-center px-2 py-1">
        <p className="text-xl font-semibold">Login</p>
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <div>
            <input type="submit" value="Login" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
