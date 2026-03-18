"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { code } from "@streamdown/code";
// import { mermaid } from "@streamdown/mermaid";
// import { math } from "@streamdown/math";
// import { cjk } from "@streamdown/cjk";
// import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const FAQ_QUESTIONS = [
  "你是谁？能简单介绍一下自己吗？",
  "你主要从事什么方向的技术工作？",
  "你有哪些擅长的技术栈？",
  "你有哪些开源项目或作品？",
  "你目前在哪里工作或学习？",
  "如何联系你或与你合作？",
];

const AGENT_API_URL = "/api/agent/chat";
const STORAGE_KEY = "agent-messages";

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored) as Message[]);
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, isHydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content };
      const newMessages = [...messages, userMessage];
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      try {
        const response = await fetch(AGENT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [userMessage],
          }),
        });

        if (!response.ok) throw new Error("Request failed. Please try again later.");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("Unable to read the response stream.");

        let assistantContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Request failed. Please try again later.";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: msg };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const reset = () => {
    setMessages([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col gap-6 pb-0 pt-8">
      {/* Messages */}
      <div
        className={cn(
          "flex flex-col gap-4",
          isEmpty ? "min-h-[120px]" : "min-h-[300px]",
        )}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 items-start",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            {/* <div
                className={cn(
                  "shrink-0 w-7 h-7 mt-0.5 rounded-full flex items-center justify-center",
                  msg.role === "user"
                    ? "bg-muted"
                    : "bg-muted border border-border"
                )}
              >
                {msg.role === "user" ? (
                  <User size={13} />
                ) : (
                  <Bot size={13} className="text-foreground" />
                )}
              </div> */}
            <div
              className={cn(
                "max-w-full px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-muted rounded-2xl whitespace-pre-wrap"
                  : "px-0",
              )}
            >
              {msg.role === "user" ? (
                msg.content
              ) : msg.content ? (
                <Streamdown
                  animated
                  key={`${i}-${isLoading && i === messages.length - 1}`}
                  plugins={{ code }}
                  isAnimating={isLoading && i === messages.length - 1}
                  linkSafety={{ enabled: false }}
                  rehypePlugins={[
                    defaultRehypePlugins.raw,
                    defaultRehypePlugins.sanitize,
                  ]}
                  className="streamdown-container [&_pre_code]:text-xs"
                >
                  {msg.content}
                </Streamdown>
              ) : isLoading && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                </span>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2 sticky bottom-0 pb-4 bg-background pt-2">
        {messages.length === 0 && (
          <h2 className="text-xl uppercase sm:text-2xl font-geist-mono mb-4 text-center">
            Attention Is All You Need.
          </h2>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Enter your question..."
            rows={4}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-border bg-card pl-4 pr-24 py-2.5 pb-11 text-sm focus:outline-none focus:ring-0 focus:ring-ring/50 placeholder:text-muted-foreground disabled:opacity-50 transition-all"
            style={{ minHeight: "42px" }}
          />
          <div className="absolute right-2 bottom-4 flex gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={reset}
                disabled={isLoading}
                title="Reset conversation"
                className="w-9 h-9 rounded-lg border border-border bg-card text-muted-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-80 transition-opacity"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {/* <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-lg bg-secondary text-background flex items-center justify-center disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              <Send size={14} />
            </button> */}
          </div>
        </div>

        {/* FAQ chips */}
        <div className="flex flex-no-wrap gap-1.5 scrollbar-none overflow-x-auto">
          {FAQ_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="text-xs px-3 shrink-0 py-1.5 rounded-full border border-border bg-card hover:bg-accent hover:border-foreground/20 transition-all duration-150 disabled:opacity-50 text-muted-foreground hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
