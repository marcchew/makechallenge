"use client";
import { useUserStore } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { Coins, Diamond } from 'lucide-react'; // Importing icons
import { baseApiUrl } from "@/lib/utils";
import axios from "axios"; 

export default function Profile() {
  const updateUser = useUserStore((state: any) => state.updateUser);
  const user = useUserStore((state: any) => state.user);
  const connection = new Connection("https://api.testnet.solana.com");
  const { publicKey, disconnect, connected } = useWallet();

  const [balance, setBalance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);  // Initialize coins state
  const [diamonds, setDiamonds] = useState<number>(0);  // Initialize diamonds state
  const [isSwapModalOpen, setSwapModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then(setBalance);
    }
  }, [connection, publicKey]);
  const handleWalletSwitch = async () => {
    await disconnect();
    // Add any additional logic here if needed
    window.location.reload(); // Reload the page to reset the wallet connection
  };

  const getAirdropOnClick = async () => {
    try {
      if (!publicKey) {
        throw new Error("Wallet is not connected");
      }
      const airdropSignature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);

      await connection.confirmTransaction(airdropSignature, "confirmed");

      const newBalance = await connection.getBalance(publicKey);
      setBalance(newBalance);

      alert("Airdrop was successful!");
    } catch (err) {
      console.error(err);
      alert("Airdrop failed. See console for details.");
    }
  };
  const updateWalletAddress = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
      }

      const response = await axios.post(`${baseApiUrl}/update/wallet_address`, {
        value: publicKey.toBase58()  // Assuming publicKey is a PublicKey object
      }, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        withCredentials: true
      });

      console.log(response.data);
      alert("Wallet address updated successfully!");
    } catch (error) {
      console.error("Error updating wallet address:", error);
      alert("Failed to update wallet address. See console for details.");
    }
  };
  useEffect(() => {
    async function GetCoinsnDims() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
      }
      try {
        const res = await fetch(`${baseApiUrl}/getuserfield/coins`, {
          headers: {
            Authorization: "Bearer " + token,
          },
          credentials: "include",
          method: "GET",
        });
        const data = await res.json();
        setCoins(data.coins);  // Update coins state
        const res2 = await fetch(`${baseApiUrl}/getuserfield/diamonds`, {
          headers: {
            Authorization: "Bearer " + token,
          },
          credentials: "include",
          method: "GET",
        });
        const data2 = await res2.json();
        setDiamonds(data2.diamonds);  // Update diamonds state
        console.log(data, data2);
        console.log(data.coins, data2.diamonds);  // Logging correct values here
      } catch (error) {
        console.log(error);
        alert("Error fetching coins and diamonds");
      }
    }
    GetCoinsnDims();
  }, []);

  return (
    <div className="w-full h-[500px]">
      <div className="w-full px-5 py-2">
        <h1 className="font-semibold text-xl">Profile</h1>
        <p>
          Username: <span className="font-semibold">{user.username}</span>
        </p>
        <div className="flex items-center">
          <Coins className="mr-2" /> Coins: {coins}
        </div>
        <div className="flex items-center">
          <Diamond className="mr-2" /> Diamonds: {diamonds}
        </div>
        <div className="mt-4">
          <WalletMultiButton />
        </div>
        {connected ? (
          <>
            <button onClick={getAirdropOnClick} className="bg-blue-500 text-white px-4 py-2 rounded-xl mt-4">
              Get Airdrop
            </button>
            <button onClick={handleWalletSwitch} className="bg-red-500 text-white px-4 py-2 rounded-xl mt-4">
              Disconnect wallets
            </button>
            {connected && (
              <button onClick={updateWalletAddress} className="bg-blue-500 text-white px-4 py-2 rounded-xl mt-4">
                Update Wallet Address
              </button>
            )}
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </>
        ) : (
          <p className="text-red-500 mt-2">Please connect your wallet to proceed.</p>
        )}
      </div>
    </div>
  );
}
