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

export default function HRLoginModal() {
  const { signInHR } = useAuth();
  const router = useRouter();

  // Modal state
  const [open, setOpen] = useState(false);

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the HR login function
      const response = await signInHR(email, password);
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
      <DialogContent className="sm:max-w-[425px]">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="HR@example.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error message */}
          {error && <p className="text-red-500">{error}</p>}

          {/* Submit button */}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Logging In..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
