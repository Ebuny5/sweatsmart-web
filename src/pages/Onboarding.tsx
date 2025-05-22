
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardTitle className="text-2xl font-bold">Welcome to SweatSense</CardTitle>
            <CardDescription className="mt-2">
              Your personalized hyperhidrosis tracking app
            </CardDescription>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Thermometer className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Track Symptoms</h3>
                  <p className="text-sm text-muted-foreground">
                    Log your sweating episodes with details on severity, body areas affected, and potential triggers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Identify Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize your data to recognize patterns and common triggers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Connect with Others</h3>
                  <p className="text-sm text-muted-foreground">
                    Join a supportive community of people with similar experiences.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <CardTitle className="text-2xl font-bold">Privacy & Data</CardTitle>
            <CardDescription className="mt-2">
              How we handle your information
            </CardDescription>
            <div className="mt-6 space-y-4">
              <p className="text-sm">
                Your privacy is our priority. Here's how we handle your data:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Your health data is encrypted and stored securely</li>
                <li>We never share your personal information with third parties without your consent</li>
                <li>You can export or delete your data at any time</li>
                <li>Community interactions can be anonymous if you prefer</li>
              </ul>
              <p className="text-sm">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <CardTitle className="text-2xl font-bold">Tracking Your Episodes</CardTitle>
            <CardDescription className="mt-2">
              Learn how to log sweating episodes effectively
            </CardDescription>
            <div className="mt-6 space-y-4">
              <p className="text-sm">
                When logging an episode, you'll be able to record:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Date and time (can be now or a past episode)</li>
                <li>Severity level on a scale of 1-5</li>
                <li>Body areas affected</li>
                <li>Potential triggers (environmental, emotional, dietary, activity)</li>
                <li>Notes about the specific circumstances</li>
              </ul>
              <p className="text-sm">
                Consistent tracking helps identify patterns and triggers that may be affecting your condition.
              </p>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <CardTitle className="text-2xl font-bold">You're All Set!</CardTitle>
            <CardDescription className="mt-2">
              Start your journey to better understanding and managing your hyperhidrosis
            </CardDescription>
            <div className="mt-6 space-y-4">
              <p className="text-sm">
                Here are some tips to get the most out of SweatSense:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Log episodes consistently for more accurate insights</li>
                <li>Check your dashboard regularly to spot patterns</li>
                <li>Explore the community section for support and advice</li>
                <li>Update your triggers list with personalized items</li>
              </ul>
              <p className="text-sm font-medium mt-4">
                Ready to take control of your hyperhidrosis?
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout isAuthenticated={false}>
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-medium">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </CardHeader>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button onClick={handleNextStep}>
              {currentStep === totalSteps ? "Get Started" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Onboarding;

// Import icons
import { Thermometer, BarChart2, MessageSquare } from "lucide-react";
