import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, mockUsers } from "@/lib/mockAuth";
import { LogIn, Factory } from "lucide-react";
import { SEO } from "@/components/SEO";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: authLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    const user = authLogin(email, password);
    if (user) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <>
      <SEO 
        title="Login - Josm Electrical Inventory System"
        description="Login to access the Josm Electrical inventory management system"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40">
              <Factory className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Josm Electrical</h1>
            <p className="text-blue-200">Inventory Management System</p>
          </div>

          {/* Login Card */}
          <Card className="border-slate-700 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your email to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@josm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Need an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Register here
                  </Link>
                </p>
              </div>

              {/* Demo Accounts */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-3">Demo accounts:</p>
                <div className="space-y-1 text-xs">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setEmail(user.email)}
                      className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <span className="font-medium">{user.name}</span>
                      <span className="text-slate-500 ml-2">({user.role.replace("_", " ")})</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-blue-200">
            © 2026 Josm Electrical PVT LTD. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}