import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackButton({ className = "" }) {
  const navigate = useNavigate();
  return (
    <Button 
      variant="ghost" 
      onClick={() => navigate(-1)} 
      className={`absolute top-6 left-6 sm:top-8 sm:left-8 z-40 flex items-center gap-2 text-slate-800 hover:bg-transparent hover:underline px-0 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
