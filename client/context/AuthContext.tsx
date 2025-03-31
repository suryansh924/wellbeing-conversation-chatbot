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
  updateProfile,
} from "firebase/auth";
import axios from "axios";
import { app } from "@/firebase/config";

const auth = getAuth(app);

export interface Employee {
  id: string;
  name: string;
  email: string;
  isFlagged: boolean;
  // add other properties as needed (e.g. shap values, etc.)
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
      const token = typeof window !== "undefined" && localStorage.getItem("access_token");
      if (token) {
        setIsLogged(true);
        await fetchEmployeeProfile();
      } 
    };
    fetchData();
  }, []);
  

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
    
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // Update the user's display name
    // await updateProfile(userCredential.user, { displayName: name });
    return userCredential;
  };

  const signInWithGoogle = async() => {
    const provider = new GoogleAuthProvider();
    const res=await signInWithPopup(auth, provider);
    const user=res.user;
    return user;
  };
  const signInWithTwitter = async() => {
    const provider = new TwitterAuthProvider();
    const res=await signInWithPopup(auth, provider);
    const user=res.user;
    return user;
  }

  const logout = () => {
    return signOut(auth);
  };

  // Fetch additional employee details from your backend.
  const fetchEmployeeProfile = async (): Promise<Employee> => {
    // You might need to send an auth token or user id to fetch the profile
    const response = await fetch("http://127.0.0.1:8000/api/user/employee", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        // You can include an authorization header if your backend requires it
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch employee profile");
    }
    const data = await response.json();
    setEmployeeData(data);
    console.log(data);
    return data;
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
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
