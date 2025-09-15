
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, BarChart2, Calendar, MessageSquare } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-border/50 py-6">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">SweatSmart</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-professional-gray hover:text-foreground">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 shadow-sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-24 bg-gradient-to-b from-clean-white via-background to-muted/30 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute top-20 left-10 w-4 h-4 bg-droplet-blue rounded-full"></div>
            <div className="absolute top-40 right-20 w-3 h-3 bg-droplet-blue rounded-full opacity-60"></div>
            <div className="absolute top-60 left-1/4 w-2 h-2 bg-droplet-blue rounded-full opacity-40"></div>
            <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-droplet-blue rounded-full opacity-30"></div>
          </div>
          
          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl text-foreground leading-tight">
                  Take Control of Your{" "}
                  <span className="text-primary bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    Hyperhidrosis
                  </span>
                </h1>
                <p className="text-xl text-professional-gray max-w-2xl mx-auto leading-relaxed">
                  Track, analyze, and manage excessive sweating with personalized insights and a supportive community.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/20 border-0">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-border bg-clean-white hover:bg-muted/50 text-foreground">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-20 bg-clean-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Understanding Your Triggers
              </h2>
              <p className="text-professional-gray text-lg max-w-2xl mx-auto">
                Professional-grade tracking tools designed to help you identify patterns and take control
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-clean-white">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-droplet-light rounded-2xl">
                      <Thermometer className="h-8 w-8 text-droplet-blue" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Track Symptoms</h3>
                    <p className="text-professional-gray leading-relaxed">
                      Log episodes with details on severity, body areas, and potential triggers.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-clean-white">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-droplet-light rounded-2xl">
                      <BarChart2 className="h-8 w-8 text-droplet-blue" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Identify Patterns</h3>
                    <p className="text-professional-gray leading-relaxed">
                      Visualize your data to recognize patterns and common triggers.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-clean-white">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-droplet-light rounded-2xl">
                      <Calendar className="h-8 w-8 text-droplet-blue" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Get Insights</h3>
                    <p className="text-professional-gray leading-relaxed">
                      Receive personalized recommendations based on your unique patterns.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-clean-white">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 bg-droplet-light rounded-2xl">
                      <MessageSquare className="h-8 w-8 text-droplet-blue" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Join Community</h3>
                    <p className="text-professional-gray leading-relaxed">
                      Connect with others who understand what you're going through.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100/50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-6 h-6 bg-droplet-blue rounded-full"></div>
            <div className="absolute top-20 right-20 w-4 h-4 bg-droplet-blue rounded-full"></div>
            <div className="absolute bottom-20 left-20 w-5 h-5 bg-droplet-blue rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-3 h-3 bg-droplet-blue rounded-full"></div>
          </div>
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold text-foreground">Ready to take control?</h2>
              <p className="text-xl text-professional-gray leading-relaxed">
                Join thousands of users who trust SweatSmart to manage their hyperhidrosis with professional-grade tracking and insights.
              </p>
              <Link to="/register">
                <Button size="lg" className="mt-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/20 px-8">
                  Start Your Journey Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border/50 py-12 bg-clean-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="font-semibold text-foreground">SweatSmart</span>
            </div>
            
            <div className="text-sm text-professional-gray">
              &copy; {new Date().getFullYear()} SweatSmart. All rights reserved.
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-professional-gray hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-professional-gray hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-professional-gray hover:text-primary transition-colors">
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
