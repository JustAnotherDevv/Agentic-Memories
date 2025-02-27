import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bot } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <a href="/" className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-bold">Agentic Memories</span>
            </a>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
