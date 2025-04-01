"use client";

import * as React from "react";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// API call to check employee ID via backend.
async function checkEmployeeId(employeeId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/user/check/${employeeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Error checking employee ID:", error);
    throw error;
  }
}

export default function AuthModal() {
  const { signIn, signUp, signInWithGoogle,signInWithTwitter, fetchEmployeeProfile , setIsLogged,setSignInModalVisible,signInModalVisible} = useAuth();
  const router = useRouter();

  // Modal open state.
  // const [open, setSignInModalVisible] = React.useState(false);
  // Mode can be "login" or "register".
  const [mode, setMode] = React.useState<"login" | "register">("login");
  // Registration step: "checkId" or "registerForm"
  const [registerStep, setRegisterStep] = React.useState<
    "checkId" | "registerForm"
  >("checkId");

  // Login form states.
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Employee ID check state for registration.
  const [regEmployeeId, setRegEmployeeId] = React.useState("");

  // Registration form states.
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regConfirmPassword, setRegConfirmPassword] = React.useState("");

  // Loading and error states.
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reset states when modal closes.
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLoginEmail("");
      setLoginPassword("");
      setRegEmployeeId("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
      setError("");
      setMode("login");
      setRegisterStep("checkId");
    }
    setSignInModalVisible(isOpen);
  };

  // After successful login or registration, fetch the employee profile
  // and route the user based on whether they are flagged.
  const handlePostAuth = async () => {
    try {
      const profile = await fetchEmployeeProfile();
      if (profile.isFlagged) {
        router.push("/conversation");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle login submission using Firebase.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(loginEmail, loginPassword);
      const res=await axios.post("http://127.0.0.1:8000/api/user/login",{
        email:loginEmail,
      }
      )
      const token=res.data.token
      localStorage.setItem("access_token",token)
      setIsLogged(true)
      await handlePostAuth();
      setSignInModalVisible(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle employee ID verification for registration.
  const handleVerifyEmployeeId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const exists = await checkEmployeeId(regEmployeeId);
      if (!exists) {
        setError("Employee ID not found.");
      } else {
        setRegisterStep("registerForm");
      }
    } catch (err) {
      setError("Error checking employee ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration submission using Firebase.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUp(regEmail, regPassword, regName);
      const res=await axios.post("http://127.0.0.1:8000/api/user/register",{
        email:regEmail,
        emp_id:regEmployeeId,
        name:regName
      }
      )
      const token=res.data.token
      localStorage.setItem("access_token",token)
      setIsLogged(true)
      await handlePostAuth();
      setSignInModalVisible(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in handler using Firebase.
  const handleGoogleSignIn = async (isRegistration = false) => {
    try {
      const user=await signInWithGoogle();
      const email=user.email;
      const name=user.displayName;
      const res=await axios.post("http://127.0.0.1:8000/api/user/oauth",{
        email:email,
        emp_id:regEmployeeId,
        name:name,
        isRegistration:isRegistration
      }
      )
      const token=res.data.token
      localStorage.setItem("access_token",token)
      setIsLogged(true)
      await handlePostAuth();
      setSignInModalVisible(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTwitterSignIn = async (isRegistration = false) => {
    try {
      const user=await signInWithTwitter();
      const email=user.email;
      const name=user.displayName;
      const res=await axios.post("http://127.0.0.1:8000/api/user/oauth",{
        email:email,
        emp_id:regEmployeeId,
        name:name,
        isRegistration:isRegistration
      }
      )
      const token=res.data.token
      localStorage.setItem("access_token",token)
      setIsLogged(true)
      await handlePostAuth();
      setSignInModalVisible(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={signInModalVisible} onOpenChange={handleOpenChange}>
      {/* Trigger button */}
      <DialogTrigger asChild>
        <Button>Get Started</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === "login" ? "Login" : "Register"}
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <form className="grid gap-4 py-4" onSubmit={handleLoginSubmit}>
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                onClick={() => handleGoogleSignIn()}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
              >
                Sign in with Google{" "}
                <FcGoogle className="inline ml-2" size={20} />
              </Button>
              <Button
                type="button"
                onClick={() => handleTwitterSignIn()}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
              >
                Sign in with Twitter{" "}
                <FcGoogle className="inline ml-2" size={20} />
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="loginEmail">Email</Label>
                <Input
                  id="loginEmail"
                  name="loginEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="loginPassword">Password</Label>
                <Input
                  id="loginPassword"
                  name="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <DialogFooter className="mt-4">
              <Button type="submit" className="w-full cursor-pointer">
                Login
              </Button>
            </DialogFooter>

            <p className="text-center text-sm mt-4">
              Don&apos;t have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={() => {
                  setError("");
                  setMode("register");
                  setRegisterStep("checkId");
                }}
              >
                Register
              </span>
            </p>
          </form>
        ) : registerStep === "checkId" ? (
          <form className="grid gap-4 py-4" onSubmit={handleVerifyEmployeeId}>
            <div className="grid gap-2">
              <Label htmlFor="regEmployeeId">Employee ID</Label>
              <Input
                id="regEmployeeId"
                name="regEmployeeId"
                type="text"
                placeholder="Enter Employee ID"
                value={regEmployeeId}
                onChange={(e) => setRegEmployeeId(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Please enter your employee ID to verify your eligibility.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <DialogFooter className="mt-4">
              <Button type="submit" disabled={loading} className="w-full  cursor-pointer">
                {loading ? "Verifying..." : "Verify Employee ID"}
              </Button>
            </DialogFooter>

            <p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
              >
                Login
              </span>
            </p>
          </form>
        ) : (
          <div className="grid gap-4 py-4">
            <p className="text-sm text-green-600 text-center">
              Employee ID verified successfully!
            </p>

            <div className="flex flex-col gap-4">
              <Button
                type="button"
                onClick={() => handleGoogleSignIn(true)}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300  cursor-pointer"
              >
                Register with Google{" "}
                <FcGoogle className="inline ml-2" size={20} />
              </Button>
              <Button
                type="button"
                onClick={() => handleTwitterSignIn(true)}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300  cursor-pointer"
              >
                Register with Twitter{" "}
                <FcGoogle className="inline ml-2" size={20} />
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            <form className="grid gap-4" onSubmit={handleRegisterSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="regName">Name</Label>
                <Input
                  id="regName"
                  name="regName"
                  type="text"
                  placeholder="Your Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="regEmail">Email</Label>
                <Input
                  id="regEmail"
                  name="regEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="regPassword">Password</Label>
                <Input
                  id="regPassword"
                  name="regPassword"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="regConfirmPassword">Confirm Password</Label>
                <Input
                  id="regConfirmPassword"
                  name="regConfirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <DialogFooter className="mt-4">
                <Button type="submit" disabled={loading} className="w-full  cursor-pointer">
                  {loading ? "Registering..." : "Complete Registration"}
                </Button>
              </DialogFooter>
            </form>

            <p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
              >
                Login
              </span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
