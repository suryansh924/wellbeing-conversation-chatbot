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
  employee_id: string;
  employee_name: string;
  employee_email: string;
  role: string;
  is_selected: boolean;
  sentimental_score: number;
  shap_values: string[];
}

export interface HRUser {
  hr_id: string;
  hr_email: string;
  role: string;
}

interface AuthContextType {
  user: any;
  employeeData: Employee | null;
  hrData: HRUser | null;
  isLogged: boolean;
  signInModalVisible: boolean;
  setIsLogged: (isLogged: boolean) => void;
  setEmployeeData: (employee: Employee) => void;
  setHRData: (hrData: HRUser) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  signInHR: (email: string, password: string) => Promise<any>;
  signInWithTwitter: () => Promise<any>;
  setSignInModalVisible: (visible: boolean) => void;
  fetchEmployeeProfile: () => Promise<Employee>;
  fetchHRProfile: () => Promise<HRUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [hrData, setHRData] = useState<HRUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [signInModalVisible, setSignInModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token =
          typeof window !== "undefined" && localStorage.getItem("access_token");
        if (token) {
          setIsLogged(true);
          const userRole = localStorage.getItem("user_role");
          if (userRole === "admin") {
            await fetchHRProfile();
          } else if (userRole === "employee") {
            await fetchEmployeeProfile();
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false); // Ensure loading state is updated
      }
    };
    fetchData();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    setUser(userCredential.user);
    return userCredential;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
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

  const signInHR = async (email: string, password: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/hr-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("user_role", data.role);
      setIsLogged(true);
      // await fetchHRProfile();
      return data;
    } catch (error) {
      console.error("HR login failed:", error);
      throw error;
    }
  };

  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/api/user/employee", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employee profile");
      }

      const data = await response.json();
      setEmployeeData(data);
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      throw error;
    }
  };

  const fetchHRProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/api/user/hr", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch HR profile");
      }

      const data = await response.json();
      console.log(data);
      setHRData(data);
      return data;
    } catch (error) {
      console.error("Error fetching HR profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsLogged(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employeeData,
        hrData,
        isLogged,
        signInModalVisible,
        setIsLogged,
        setEmployeeData,
        signInWithTwitter,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        setSignInModalVisible,
        signInHR,
        fetchEmployeeProfile,
        fetchHRProfile,
        setHRData,
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
