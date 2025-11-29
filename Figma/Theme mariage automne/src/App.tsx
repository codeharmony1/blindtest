import { Music2, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#d9794d]"></div>
        <div className="absolute top-32 right-8 w-16 h-16 rounded-full bg-[#d4a574]"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full bg-[#c87250]"></div>
        <div className="absolute bottom-40 right-5 w-12 h-12 rounded-full bg-[#b87333]"></div>
      </div>

      {/* Decorative Leaves */}
      <div className="absolute top-8 left-4 opacity-40">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 5C20 5 10 10 8 20C6 30 12 35 20 35C20 35 20 20 20 5Z" fill="#c87250"/>
          <path d="M20 5C20 5 30 10 32 20C34 30 28 35 20 35C20 35 20 20 20 5Z" fill="#d9794d"/>
        </svg>
      </div>
      
      <div className="absolute bottom-16 right-6 opacity-40">
        <svg width="35" height="35" viewBox="0 0 40 40" fill="none">
          <path d="M20 5C20 5 10 10 8 20C6 30 12 35 20 35C20 35 20 20 20 5Z" fill="#d4a574"/>
          <path d="M20 5C20 5 30 10 32 20C34 30 28 35 20 35C20 35 20 20 20 5Z" fill="#c9a87f"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen p-5 pb-8">
        
        {/* Header Card */}
        <div className="mb-6 mt-8">
          <div className="bg-gradient-to-r from-[#a65845] via-[#c87250] via-45% to-[#ddb685] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Music2 className="w-7 h-7 text-[#fff9f0]" strokeWidth={2} />
              </div>
              <h1 className="text-[#fff9f0] text-center tracking-wide">
                Round Musical in Progress
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm text-[#fff9f0] px-4 py-1.5 rounded-full">
                Team #3
              </span>
              <span className="text-[#fff9f0]">—</span>
              <span className="text-[#fff9f0]">sdsd</span>
            </div>
          </div>
        </div>

        {/* Waiting Message Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border-2 border-[#e8dcc8]">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Sparkles className="w-6 h-6 text-[#d4a574]" />
            </div>
            <div>
              <p className="text-[#4a3828] mb-1">
                Waiting for the next song...
              </p>
              <p className="text-[#8b6f47]">
                The DJ is preparing the next track to guess!
              </p>
            </div>
          </div>
        </div>

        {/* Answer Input Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border-2 border-[#e8dcc8]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4a574] to-[#b87333] rounded-full flex items-center justify-center">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[#4a3828]">Your Answer</h2>
          </div>
          
          <label className="block text-[#8b6f47] mb-2">
            Song Title and/or Artist
          </label>
          
          <Input 
            type="text"
            placeholder="e.g. Billie Jean - Michael Jackson"
            className="w-full mb-4 bg-[#faf8f4] border-2 border-[#e8dcc8] focus:border-[#d4a574] rounded-xl px-4 py-3 text-[#4a3828] placeholder:text-[#c9a87f]"
            disabled
          />
          
          <Button 
            disabled
            className="w-full bg-gray-300 text-gray-500 rounded-xl py-6 cursor-not-allowed hover:bg-gray-300"
          >
            <Music2 className="w-5 h-5 mr-2" />
            Send Answer
          </Button>
        </div>

        {/* Hint Section */}
        <div className="bg-[#fff9f0] rounded-xl p-4 shadow-md border-2 border-[#d4a574]/30">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#d9794d] mt-0.5 flex-shrink-0" />
            <p className="text-[#8b6f47]">
              The last answer before time runs out will be counted!
            </p>
          </div>
        </div>

        {/* Decorative Bottom Element */}
        <div className="mt-auto pt-6 flex justify-center opacity-30">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#d4a574]"></div>
            <div className="w-2 h-2 rounded-full bg-[#d9794d]"></div>
            <div className="w-2 h-2 rounded-full bg-[#c87250]"></div>
          </div>
        </div>

      </div>
    </div>
  );
}