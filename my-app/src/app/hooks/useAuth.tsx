"use client";
import { useAuthContext } from "../lib/auth";
export default function useAuth() {
  return useAuthContext();
}
