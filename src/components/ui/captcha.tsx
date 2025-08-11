
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface CaptchaProps {
  onVerify: (isVerified: boolean) => void;
  className?: string;
}

const Captcha = ({ onVerify, className }: CaptchaProps) => {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput("");
    setIsVerified(false);
    onVerify(false);
    return result;
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(30 + i * 25, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 30%)`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Add noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  useEffect(() => {
    const text = generateCaptcha();
    drawCaptcha(text);
  }, []);

  const handleVerify = () => {
    const verified = userInput.toLowerCase() === captchaText.toLowerCase();
    setIsVerified(verified);
    onVerify(verified);
    
    if (!verified) {
      const newText = generateCaptcha();
      drawCaptcha(newText);
    }
  };

  const handleRefresh = () => {
    const newText = generateCaptcha();
    drawCaptcha(newText);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <canvas
            ref={canvasRef}
            width={150}
            height={50}
            className="border rounded"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter captcha"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            maxLength={5}
          />
          <Button
            type="button"
            onClick={handleVerify}
            size="sm"
            variant={isVerified ? "default" : "outline"}
          >
            Verify
          </Button>
        </div>
        {isVerified && (
          <p className="text-sm text-green-600">✓ Verification successful</p>
        )}
        {userInput && !isVerified && userInput.length === 5 && (
          <p className="text-sm text-red-600">✗ Verification failed</p>
        )}
      </CardContent>
    </Card>
  );
};

export default Captcha;
