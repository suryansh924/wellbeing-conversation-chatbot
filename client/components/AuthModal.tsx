"use client";
import { z } from 'zod';
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
import { FaTwitter } from "react-icons/fa";
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
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithTwitter,
    fetchEmployeeProfile,
    setIsLogged,setSignInModalVisible,signInModalVisible,
  } = useAuth();
  const router = useRouter();

  // Modal open state.
  const [open, setOpen] = React.useState(false);
  // Mode can be "login" or "register".
  const [mode, setMode] = React.useState<"login" | "register">("login");
  // Registration step: "checkId" or "registerForm"
  const [registerStep, setRegisterStep] = React.useState<
    "checkId" | "registerForm"
  >("checkId");

  // Employee ID check state for registration.
  const [regEmployeeId, setRegEmployeeId] = React.useState("");
  const [error, setError] = React.useState("");
  // Loading and error states.
  const [loading, setLoading] = React.useState(false);

  //Zod vaidation

  const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).max(50),
    password: z.string().regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      "Password must contain at least 8 characters, including letters, numbers, and special characters"
    ).max(20),
  });
  const registerSchema = z.object({
    name: z.string().max(50).min(1),
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).max(50),
    password: z.string().regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      "Password must contain at least 8 characters, including letters, numbers, and special characters"
    ).max(20),
    confirmPassword: z.string().max(20),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


  const [RegisterformData, setRegisterFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [LoginformData, setLoginFormData] = React.useState({
    email: '',
    password: ''
  });
  const [Loginerrors, setLoginErrors] = React.useState({
    email: 0,
    password: 0
  });
  const [Registererrors, setRegisterErrors] = React.useState({
    name: 0,
    email: 0,
    password: 0,
    confirmPassword: 0,
  });
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...LoginformData, [name]: value };
    setLoginFormData(updatedFormData);
    const result = loginSchema.safeParse(updatedFormData);
    const newError = { email: 0, password: 0 };
    if (!result.success) {
      result.error.errors.forEach(err => {
        if (err.path.includes("email")) newError.email = 1;
        if (err.path.includes("password")) newError.password = 1;
      });
    }
    setLoginErrors(newError);
  };
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...RegisterformData, [name]: value };
    setRegisterFormData(updatedFormData);
    console.log(updatedFormData);
    const result = registerSchema.safeParse(updatedFormData);
    console.log(result);
    const newError = {
      name: 0,
      email: 0,
      password: 0,
      confirmPassword: 0,
    };
    if (!result.success) {
      result.error.errors.forEach(err => {
        if (err.path.includes("name")) newError.name = 1;
        if (err.path.includes("email")) newError.email = 1;
        if (err.path.includes("password")) newError.password = 1;
        if (err.path.includes("confirmPassword")) newError.confirmPassword = 1;
      });
    }
    setRegisterErrors(newError);
  };

  // Reset states when modal closes.
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMode("login");
      setRegisterStep("checkId");
    }
    setSignInModalVisible(isOpen);
    setOpen(!open);
  };

  // After successful login or registration, fetch the employee profile
  // and route the user based on whether they are flagged.
  const handlePostAuth = async () => {
    try {
      const profile = await fetchEmployeeProfile();
      if (profile.is_selected) {
        router.push("/conversation");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Handle login submission using Firebase.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = loginSchema.safeParse(LoginformData);
    console.log(result);
    if (result.success) {
      try {
        await signIn(LoginformData.email, LoginformData.password);
        const res = await axios.post("http://127.0.0.1:8000/api/user/login", {
          email: LoginformData.email,
        }
        )
        const token = res.data.token
        localStorage.setItem("access_token", token)
        setIsLogged(true)
        await handlePostAuth();
        setOpen(false);
        setSignInModalVisible(false);
      } catch (err) {
        console.log(err);
      }
    } else {
      const newError = { email: 0, password: 0 };
      result.error.errors.forEach(err => {
        if (err.path.includes("email")) newError.email = 1;
        if (err.path.includes("password")) newError.password = 1;
      });
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
    } catch {
      setError("Error checking employee ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration submission using Firebase.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = registerSchema.safeParse(RegisterformData);
    console.log(result);
    if (result.success) {
      console.log("form submitted");
      try {
        await signUp(RegisterformData.email, RegisterformData.password, RegisterformData.name);
        const res = await axios.post("http://127.0.0.1:8000/api/user/register", {
          email: RegisterformData.email,
          emp_id: regEmployeeId,
          name: RegisterformData.name
        }
        )
        const token = res.data.token
        localStorage.setItem("access_token", token)
        setIsLogged(true)
        await handlePostAuth();
        setOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      const newError = {
        employeeId: 0,
        name: 0,
        email: 0,
        password: 0,
        confirmPassword: 0,
      };
      result.error.errors.forEach(err => {
        if (err.path.includes("employeeId")) newError.employeeId = 1;
        if (err.path.includes("name")) newError.name = 1;
        if (err.path.includes("email")) newError.email = 1;
        if (err.path.includes("password")) newError.password = 1;
        if (err.path.includes("confirmPassword")) newError.confirmPassword = 1;
      });
      setRegisterErrors(newError);
    }
  };
    // Google sign-in handler using Firebase.
    const handleGoogleSignIn = async (isRegistration = false) => {
      try {
        const user = await signInWithGoogle();
        const email = user.email;
        const name = user.displayName;
        const res = await axios.post("http://127.0.0.1:8000/api/user/oauth", {
          email: email,
          emp_id: regEmployeeId,
          name: name,
          isRegistration: isRegistration
        }
        )
        const token = res.data.token
        localStorage.setItem("access_token", token)
        setIsLogged(true)
        await handlePostAuth();
        setOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      }
    };

    const handleTwitterSignIn = async (isRegistration = false) => {
      try {
        const user = await signInWithTwitter();
        const email = user.email;
        const name = user.displayName;
        const res = await axios.post("http://127.0.0.1:8000/api/user/oauth", {
          email: email,
          emp_id: regEmployeeId,
          name: name,
          isRegistration: isRegistration
        }
        )
        const token = res.data.token
        localStorage.setItem("access_token", token)
        setIsLogged(true)
        await handlePostAuth();
        setOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
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
                  onClick={() => handleGoogleSignIn()}
                  variant="outline"
                  className="cursor-pointer transition-all duration-500 ease-in-out w-full bg-white text-black hover:bg-gray-100"
                >
                  Sign in with Google
                  <FcGoogle className="inline ml-2" size={20} />
                </Button>
                <Button
                  type="button"
                  onClick={() => handleTwitterSignIn()}
                  variant="outline"
                  className="cursor-pointer w-full transition-all duration-500 ease-in-out text-white  bg-[#1DA1F2] hover:bg-[#1d84f2]"
                >
                  Sign in with Twitter
                  <FaTwitter className="inline ml-2" size={20} />
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
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    onChange={handleLoginChange}
                    required={true}
                  />
                </div>
                {Loginerrors.email ? <p className="text-red-500 text-xs">Enter valid email.</p> : <></>}

                <div className="grid gap-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    onChange={handleLoginChange}
                    required={true}
                  />
                </div>
              </div>
              {Loginerrors.password ? <p className="text-red-500 text-xs">Password must contain at least 8 characters, including letters, numbers, and special characters</p> : <></>}

              {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}

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
                  required={true}
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
                  className="cursor-pointer transition-all duration-500 ease-in-out w-full bg-white text-black hover:bg-gray-100"
                >
                  Register with Google{" "}
                  <FcGoogle className="inline ml-2" size={20} />
                </Button>
                <Button
                  type="button"
                  onClick={() => handleTwitterSignIn(true)}
                  variant="outline"
                  className="cursor-pointer w-full transition-all duration-500 ease-in-out text-white  bg-[#1DA1F2] hover:bg-[#1d84f2]"
                >
                  Register with Twitter
                  <FaTwitter className="inline ml-2" size={20} />
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
                    name="name"
                    type="text"
                    placeholder="Your Name"
                    onChange={handleRegisterChange}
                    required={true}
                  />
                </div>
                {Registererrors.name ? <p className="text-red-500 text-xs">Enter valid Name.</p> : <></>}

                <div className="grid gap-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input
                    id="regEmail"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    onChange={handleRegisterChange}
                    required={true}
                  />
                </div>
                {Registererrors.email ? <p className="text-red-500 text-xs">Enter valid email.</p> : <></>}

                <div className="grid gap-2">
                  <Label htmlFor="regPassword">Password</Label>
                  <Input
                    id="regPassword"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    onChange={handleRegisterChange}
                    required={true}
                  />
                </div>
                {Registererrors.password ? <p className="text-red-500 text-xs">Password must contain at least 8 characters, including letters, numbers, and special characters</p> : <></>}

                <div className="grid gap-2">
                  <Label htmlFor="regConfirmPassword">Confirm Password</Label>
                  <Input
                    id="regConfirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    onChange={handleRegisterChange}
                    required={true}
                  />
                </div>
                {Registererrors.confirmPassword ? <p className="text-red-500 text-xs">Passwords Don&apos;t match </p> : <></>}

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

