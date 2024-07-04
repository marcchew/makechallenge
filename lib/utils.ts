import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const baseApiUrl = "http://localhost:8080";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ReturnJwt() {
  return localStorage.getItem("accessToken");
}
