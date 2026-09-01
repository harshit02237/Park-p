"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "customer" | "admin" | "vendor";
}

interface DecodedToken extends User, JwtPayload {}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loginWithToken: (token: string, redirectPath?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  setUser: () => {},
  loginWithToken: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const decodeAndSetUser = useCallback((token: string | null) => {
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const isExpired = decoded.exp ? decoded.exp * 1000 < Date.now() : false;

      if (isExpired) {
        localStorage.removeItem("zaika_token");
        setUser(null);
        return null;
      } else {
        const userData: User = {
          _id: decoded._id,
          name: decoded.name,
          email: decoded.email,
          avatar: decoded.avatar,
          role: decoded.role,
        };
        setUser(userData);
        return userData;
      }
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("zaika_token");
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let token: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");

      if (urlToken) {
        token = urlToken;
        localStorage.setItem("zaika_token", urlToken);
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        token = localStorage.getItem("zaika_token");
      }

      decodeAndSetUser(token);
    }
    setLoading(false);
  }, [decodeAndSetUser]);

  const loginWithToken = (token: string, redirectPath?: string) => {
    localStorage.setItem("zaika_token", token);
    const loggedUser = decodeAndSetUser(token);
    if (redirectPath) {
      router.push(redirectPath);
    } else if (loggedUser?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  const logout = () => {
    localStorage.removeItem("zaika_token");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

