"use client";

import React, { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { z } from 'zod';
export default function HRLoginModal() {
  const { signInHR } = useAuth();
  const router = useRouter();
  //zod validation
  const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).max(50),
    password: z.string().regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      "Password must contain at least 8 characters, including letters, numbers, and special characters"
    ).max(20),
  });

  const [LoginformData, setLoginFormData] = React.useState({
    email: '',
    password: ''
  });
  // Modal state
  const [open, setOpen] = useState(false);

  // Login form states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [Loginerrors, setLoginErrors] = React.useState({
    email: 0,
    password: 0
  });
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...LoginformData, [name]: value };
    setLoginFormData(updatedFormData);
    const fieldSchema = loginSchema.shape[name as keyof typeof loginSchema.shape];
    const result = fieldSchema.safeParse(value);

    setLoginErrors(prevErrors => ({
      ...prevErrors,
      [name]: result.success ? 0 : 1
    }));
  };
  // Handle form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the HR login function
      const response = await signInHR(LoginformData.email, LoginformData.password);
      if (response.token) {
        // Redirect to HR Dashboard on success
        router.push("/hr-dashboard");
        setOpen(false); // Close the modal after successful login
      }
    } catch (err: any) {
      setError("Invalid email or password, or you are not authorized as HR.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger button to open the modal */}
      <DialogTrigger asChild>
        <Button className="bg-black text-white cursor-pointer text-lg font-semibold px-10 py-4 h-auto rounded-full">
          Login as HR
        </Button>
      </DialogTrigger>

      {/* Modal content */}
      <DialogContent className="sm:max-w-[425px] dark bg-[#131313] text-white">
        <DialogHeader>
          <DialogTitle className="text-center">HR Login</DialogTitle>
        </DialogHeader>

        {/* Login form */}
        <form onSubmit={handleLoginSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              onChange={handleLoginChange}
              placeholder="HR@example.com"
              required={true}
            />
          </div>
          {Loginerrors.email ? <p className="text-red-500 text-xs">Enter valid email.</p> : <></>}

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              onChange={handleLoginChange}
              placeholder="••••••••"
              required={true}
            />
          </div>
          {Loginerrors.password ? <p className="text-red-500 text-xs">Password must contain at least 8 characters, including letters, numbers, and special characters</p> : <></>}

          {/* Error message */}
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Submit button */}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading} className="cursor-pointer font-medium text-base text-black w-full bg-[#26890d]  hover:bg-[#26890d]">
              {loading ? "Logging In..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
