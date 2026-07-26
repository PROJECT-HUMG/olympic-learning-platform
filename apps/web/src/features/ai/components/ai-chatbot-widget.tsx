import { useState } from "react";
import { MessageSquare, X, Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/use-ui-store";

export function AiChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { showAiWidget } = useUiStore();

  if (!showAiWidget) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end max-lg:bottom-24">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="size-5" />
              <div>
                <h4 className="font-semibold text-sm">Trợ lý Olympic AI</h4>
                <p className="text-[10px] opacity-80">RAG Powered (Đang phát triển...)</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Chat Body (Dummy) */}
          <div className="h-72 bg-muted/30 p-4 overflow-y-auto space-y-4">
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-background p-3 text-sm shadow-xs border border-border/50">
                Chào bạn! Mình là Trợ lý AI của nền tảng. Hiện tại tính năng này đang được xây dựng (Backend RAG).
                <br /><br />
                Sau khi hoàn thiện, bạn có thể hỏi mình về:
                <ul className="list-disc pl-4 mt-2 space-y-1 text-muted-foreground text-xs">
                  <li>Lịch thi, quy chế thi</li>
                  <li>Hướng dẫn giải bài tập</li>
                  <li>Tư vấn lộ trình học tập</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-background flex gap-2">
            <Input 
              placeholder="Nhập câu hỏi của bạn..." 
              className="rounded-full bg-muted/50 focus-visible:ring-1"
              disabled
            />
            <Button size="icon" className="rounded-full shrink-0" disabled>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <Button
        size="icon"
        className={`size-14 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-primary text-primary-foreground"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      </Button>
    </div>
  );
}
