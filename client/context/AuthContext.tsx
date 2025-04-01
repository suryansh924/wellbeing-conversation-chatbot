"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  TwitterAuthProvider,
} from "firebase/auth";
import { app } from "@/firebase/config";

const auth = getAuth(app);

export interface Employee {
  id: string;
  name: string;
  email: string;
  isFlagged: boolean;
}

interface AuthContextType {
  user: any;
  employeeData: Employee | null;
  isLogged: boolean;
  setIsLogged: (isLogged: boolean) => void;
  setEmployeeData: (employee: Employee) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  signInWithTwitter: () => Promise<any>;
  fetchEmployeeProfile: () => Promise<Employee>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token =
          typeof window !== "undefined" && localStorage.getItem("access_token");
        if (token) {
          setIsLogged(true);
          await fetchEmployeeProfile();
        }
      } catch (error) {
        console.error("Error fetching employee profile:", error);
      } finally {
        setLoading(false); // ✅ Ensure loading state is updated
      }
    };
    fetchData();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    return userCredential;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    return userCredential;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    return res.user;
  };

  const signInWithTwitter = async () => {
    const provider = new TwitterAuthProvider();
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsLogged(false);
  };

  const fetchEmployeeProfile = async (): Promise<Employee> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/employee", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employee profile");
      }

      const data = await response.json();
      setEmployeeData(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch employee data:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employeeData,
        isLogged,
        setIsLogged,
        setEmployeeData,
        signInWithTwitter,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        fetchEmployeeProfile,
      }}
    >
      {!loading ? children : <p>Loading...</p>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
