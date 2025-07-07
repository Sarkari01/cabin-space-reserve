import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login - replace with actual authentication
    try {
      // Mock authentication
      if (email && password) {
        localStorage.setItem("user", JSON.stringify({
          email,
          role: email.includes("admin") ? "admin" : email.includes("merchant") ? "merchant" : "student",
          name: email.split("@")[0]
        }));
        
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        
        const userRole = email.includes("admin") ? "admin" : email.includes("merchant") ? "merchant" : "student";
        navigate(`/${userRole}/dashboard`);
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <h1 className="text-2xl font-bold text-foreground">CabinSpace</h1>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Demo Accounts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>Use these credentials to explore different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Student:</span>
              <span>student@demo.com / password</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Merchant:</span>
              <span>merchant@demo.com / password</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Admin:</span>
              <span>admin@demo.com / password</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;