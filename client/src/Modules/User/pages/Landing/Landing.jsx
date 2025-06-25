import { LogIn, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl p-6 sm:p-8 shadow-xl rounded-2xl">
        {/* Card Header with Title */}
        <CardHeader className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#07014A]">
            Welcome to Pegasus
          </h1>cd 
          <p className="mt-2 text-[#413C85] text-sm sm:text-base lg:text-lg font-medium">
            Celebrating 125 years of CMC Vellore
          </p>
          <div className="mt-2 w-10 h-[2px] bg-[#07014A] mx-auto rounded-full" />
        </CardHeader>

        {/* Card Content with Buttons */}
        <CardContent className="space-y-4 sm:space-y-5">
          <Button className="w-full whitespace-normal break-words" size="lg">
            <PlusCircle className="mr-2 w-5 h-5" />
            New Here? Join now to get started
          </Button>
          <Button variant="outline" className="w-full whitespace-normal break-words" size="lg">
            <LogIn className="mr-2 w-5 h-5" />
            Returning user? Welcome back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Landing;
