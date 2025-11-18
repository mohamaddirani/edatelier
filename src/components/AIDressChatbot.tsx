import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIDressChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your personal dress consultant at ED ATELIER. I'd love to help you find the perfect dress for your special occasion. What event are you shopping for?"
        }
      ]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const assistantMessage: Message = { role: "assistant", content: "" };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-dress-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (response.status === 429) {
        toast({
          title: "Rate Limit",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (response.status === 402) {
        toast({
          title: "Service Unavailable",
          description: "AI service requires payment. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      // Add assistant message placeholder
      setMessages(prev => [...prev, assistantMessage]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-50 bg-gradient-to-br from-primary via-primary to-accent hover:shadow-accent/50 transition-all duration-300 hover:scale-105 group"
        size="icon"
      >
        <Sparkles className="h-7 w-7 text-primary-foreground group-hover:rotate-12 transition-transform" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full h-full md:w-[420px] md:h-[650px] md:rounded-2xl rounded-none flex flex-col shadow-2xl z-50 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
      {/* Elegant Header with Gradient */}
      <div className="relative flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary via-primary to-accent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-foreground text-lg">AI Dress Consultant</h3>
            <p className="text-xs text-primary-foreground/70">by ED ATELIER</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-foreground/10 text-primary-foreground h-9 w-9"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area with Custom Scrollbar */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((msg, idx) => {
            // Check if message contains WhatsApp link
            const whatsappMatch = msg.content.match(/(https:\/\/api\.whatsapp\.com\/send\?phone=\d+)/);
            const hasWhatsApp = whatsappMatch !== null;
            
            return (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                      : "bg-muted/80 text-foreground rounded-bl-sm border border-border/50"
                  }`}
                >
                  {hasWhatsApp && msg.role === "assistant" ? (
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content.split(whatsappMatch[0])[0]}
                      </p>
                      <Button
                        onClick={() => window.open(whatsappMatch[0], '_blank')}
                        className="w-full bg-gradient-to-br from-primary via-primary to-accent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                        size="sm"
                      >
                        Contact Designer on WhatsApp
                      </Button>
                      {msg.content.split(whatsappMatch[0])[1] && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content.split(whatsappMatch[0])[1]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-muted/80 rounded-2xl rounded-bl-sm px-5 py-3 border border-border/50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area with Enhanced Styling */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about dresses, styling, occasions..."
            disabled={isLoading}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
