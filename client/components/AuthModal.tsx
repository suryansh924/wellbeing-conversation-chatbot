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
async function checkEmployeeId(employeeId: string): Promise<boolean> {
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
  const [mode, setMode] = React.useState<"login" | "register">("login");

  // Login form states.
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Registration form states.
  const [regEmployeeId, setRegEmployeeId] = React.useState("");
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
    }
    setOpen(isOpen);
  };

  // Handle login submission.
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Replace with your login logic.
    console.log("Logging in with:", { loginEmail, loginPassword });
  };

  // Handle registration submission.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const exists = await checkEmployeeId(regEmployeeId);
      if (!exists) {
        setError("Employee ID not found.");
        return;
      }
      // Replace with your registration logic.
      console.log("Registering with:", {
        regEmployeeId,
        regName,
        regEmail,
        regPassword,
      });
    } catch (err) {
      setError("Error during registration. Please try again.");
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in handler.
  const handleGoogleSignIn = () => {
    // Replace with your Google sign-in logic.
    console.log("Google sign in clicked");
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loginEmail" className="text-right">
                Email
              </Label>
              <Input
                id="loginEmail"
                name="loginEmail"
                type="email"
                placeholder="you@example.com"
                className="col-span-3"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loginPassword" className="text-right">
                Password
              </Label>
              <Input
                id="loginPassword"
                name="loginPassword"
                type="password"
                placeholder="••••••••"
                className="col-span-3"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="submit">Login</Button>
            </DialogFooter>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full bg-gray-200 text-black hover:bg-gray-300"
              >
                Sign in with Google{" "}
                <FcGoogle className="inline ml-2" size={20} />
              </Button>
              <p className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <span
                  className="text-blue-500 cursor-pointer"
                  onClick={() => {
                    setError("");
                    setMode("register");
                  }}
                >
                  Register
                </span>
              </p>
            </div>
          </form>
        ) : (
          <form className="grid gap-4 py-4" onSubmit={handleRegisterSubmit}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regEmployeeId" className="text-right">
                Employee ID
              </Label>
              <Input
                id="regEmployeeId"
                name="regEmployeeId"
                type="text"
                placeholder="Enter Employee ID"
                className="col-span-3"
                value={regEmployeeId}
                onChange={(e) => setRegEmployeeId(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regName" className="text-right">
                Name
              </Label>
              <Input
                id="regName"
                name="regName"
                type="text"
                placeholder="Your Name"
                className="col-span-3"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regEmail" className="text-right">
                Email
              </Label>
              <Input
                id="regEmail"
                name="regEmail"
                type="email"
                placeholder="you@example.com"
                className="col-span-3"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regPassword" className="text-right">
                Password
              </Label>
              <Input
                id="regPassword"
                name="regPassword"
                type="password"
                placeholder="••••••••"
                className="col-span-3"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regConfirmPassword" className="text-right">
                Confirm
              </Label>
              <Input
                id="regConfirmPassword"
                name="regConfirmPassword"
                type="password"
                placeholder="••••••••"
                className="col-span-3"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Register"}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
