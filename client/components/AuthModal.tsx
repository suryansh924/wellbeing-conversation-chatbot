"use client";

import * as React from "react";
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

// Fake API call to check employee ID; replace with your real API call.
async function checkEmployeeId(employeeId) {
    response = await fetch('/api/user/employee/check')
  return new Promise((resolve) => {
    setTimeout(() => {
      // For this example, only employee ID "1234" exists.
      resolve(employeeId === "1234");
    }, 1000);
  });
}

export default function AuthModal() {
  // Modal open state.
  const [open, setOpen] = React.useState(false);
  // Mode can be "login" or "register".
  const [mode, setMode] = React.useState("login");
  // Registration step: "checkId" or "registerForm"
  const [registerStep, setRegisterStep] = React.useState("checkId");

  // Employee ID validation state
  const [employeeIdValid, setEmployeeIdValid] = React.useState(false);

  // Login form states.
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Employee ID check state
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
  const handleOpenChange = (isOpen) => {
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
      setEmployeeIdValid(false);
    }
    setOpen(isOpen);
  };

  // Handle login submission.
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError("");
    // Replace with your login logic.
    console.log("Logging in with:", { loginEmail, loginPassword });
  };

  // Handle employee ID verification
  const handleVerifyEmployeeId = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const exists = await checkEmployeeId(regEmployeeId);
      if (!exists) {
        setError("Employee ID not found.");
        setEmployeeIdValid(false);
      } else {
        setEmployeeIdValid(true);
        setRegisterStep("registerForm");
      }
    } catch (err) {
      setError("Error checking employee ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration submission.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Replace with your registration logic.
      console.log("Registering with:", {
        regEmployeeId,
        regName,
        regEmail,
        regPassword,
      });
      // Here you would typically make an API call to register the user
    } catch (err) {
      setError("Error during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in handler.
  const handleGoogleSignIn = (isRegistration = false) => {
    // Replace with your Google sign-in logic.
    if (isRegistration) {
      console.log(
        "Google registration clicked with employee ID:",
        regEmployeeId
      );
    } else {
      console.log("Google sign in clicked");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300"
              >
                Sign in with Google{" "}
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
              <Button type="submit" className="w-full">
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
              <Button type="submit" disabled={loading} className="w-full">
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
                className="w-full bg-gray-200 text-black hover:bg-gray-300"
              >
                Register with Google{" "}
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
                <Button type="submit" disabled={loading} className="w-full">
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
