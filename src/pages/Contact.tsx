import { Mail, MessageSquare, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Contact Us</h1>
          <p className="text-xl text-professional-gray max-w-2xl mx-auto">
            Have questions about SweatSmart? We're here to help you on your hyperhidrosis management journey.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-professional-gray">
                Get in touch with our support team for any questions or assistance.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">General Support</p>
                <a 
                  href="mailto:sweatsmart@beyondsweat.life" 
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  sweatsmart@beyondsweat.life
                  <Mail className="h-4 w-4" />
                </a>
              </div>
              <Button 
                onClick={() => window.location.href = 'mailto:sweatsmart@beyondsweat.life'}
                className="w-full"
              >
                Send Email
              </Button>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-professional-gray mb-2">
                  We'd love to hear your feedback!
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSfHBkUOMxFhB03UyfpnrEQk5VlszVUFN2n-TqjRwJ1ehqSeTw/viewform?fbzx=7815900527824722421', '_blank')}
                  className="w-full"
                >
                  Share Feedback
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-professional-gray">
                We typically respond to all inquiries within 24-48 hours during business days.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">Business Hours</p>
                  <p className="text-sm text-professional-gray">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Weekend Support</p>
                  <p className="text-sm text-professional-gray">Limited support on weekends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">How do I track my hyperhidrosis episodes?</h3>
                <p className="text-professional-gray text-sm">
                  Simply log into your SweatSmart dashboard and click "Log Episode" to record details about your hyperhidrosis episodes, including triggers, severity, and affected areas.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Is my health data secure?</h3>
                <p className="text-professional-gray text-sm">
                  Yes, we take data security seriously. All your health information is encrypted and stored securely in compliance with healthcare privacy standards.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Can I export my data?</h3>
                <p className="text-professional-gray text-sm">
                  Yes, you can export your episode data and insights to share with your healthcare provider or for your personal records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center bg-clean-white rounded-lg p-8 border border-border/50">
          <h2 className="text-2xl font-bold text-foreground mb-4">Need Immediate Help?</h2>
          <p className="text-professional-gray mb-6">
            For urgent medical concerns, please consult with your healthcare provider or contact emergency services.
          </p>
          <p className="text-sm text-professional-gray">
            SweatSmart is a tracking and management tool and should not replace professional medical advice.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contact;