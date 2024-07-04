"use client";
import { useState } from "react";
import { useUserStore } from "@/context/AuthContext";

export default function Swap() {
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [message, setMessage] = useState("");
  const user = useUserStore((state: any) => state.user);

  const handleSwap = async () => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch("http://localhost:8080/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ coins, diamonds }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage("Payment successful");
    } else {
      setMessage(data.error || "Error occurred during the swap");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Swap</h1>
      <input
        type="number"
        placeholder="Coins"
        value={coins}
        onChange={(e) => setCoins(parseInt(e.target.value))}
        className="mb-2 p-2 border border-gray-300 rounded"
      />
      <input
        type="number"
        placeholder="Diamonds"
        value={diamonds}
        onChange={(e) => setDiamonds(parseInt(e.target.value))}
        className="mb-2 p-2 border border-gray-300 rounded"
      />
      <button
        onClick={handleSwap}
        className="p-2 bg-blue-500 text-white rounded"
      >
        Swap
      </button>
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  );
}
