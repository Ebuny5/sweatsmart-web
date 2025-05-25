
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, BarChart2, Calendar, MessageSquare } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">SweatSmart</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-20 bg-gradient-to-b from-background to-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
                Take Control of Your <span className="text-primary">Hyperhidrosis</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Track, analyze, and manage excessive sweating with personalized insights and a supportive community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16 bg-background">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              Understanding Your Triggers
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Thermometer className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium">Track Symptoms</h3>
                    <p className="text-muted-foreground">
                      Log episodes with details on severity, body areas, and potential triggers.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BarChart2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium">Identify Patterns</h3>
                    <p className="text-muted-foreground">
                      Visualize your data to recognize patterns and common triggers.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium">Get Insights</h3>
                    <p className="text-muted-foreground">
                      Receive personalized recommendations based on your unique patterns.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium">Join Community</h3>
                    <p className="text-muted-foreground">
                      Connect with others who understand what you're going through.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold">Ready to take control?</h2>
              <p className="text-xl opacity-90">
                Join thousands of users who are managing their hyperhidrosis with SweatSmart.
              </p>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="mt-4">
                  Sign Up for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-muted/50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-lg font-bold">S</span>
              </div>
              <span className="font-medium">SweatSmart</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SweatSmart. All rights reserved.
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
