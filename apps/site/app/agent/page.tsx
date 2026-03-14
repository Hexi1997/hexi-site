"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, RotateCcw } from "lucide-react";
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

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!response.ok) throw new Error("请求失败，请稍后重试。");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("无法读取响应流。");

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
        const msg = err instanceof Error ? err.message : "请求失败，请稍后重试。";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: msg };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const reset = () => {
    setMessages([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">与 Hexi 对话</h1>
          <p className="text-sm text-muted-foreground mt-1">
            你可以向 Hexi Agent 提问，了解关于 Hexi 的一切
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
          >
            <RotateCcw size={13} />
            重置对话
          </button>
        )}
      </div>

      {/* FAQ chips */}
      {isEmpty && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            常见问题
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FAQ_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-foreground/20 transition-all duration-150 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div className="flex flex-col gap-4 min-h-[300px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 items-start",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-7 h-7 mt-0.5 rounded-full flex items-center justify-center",
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted border border-border"
                )}
              >
                {msg.role === "user" ? (
                  <User size={13} />
                ) : (
                  <Bot size={13} className="text-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-foreground text-background rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                )}
              >
                {msg.content ||
                  (isLoading && i === messages.length - 1 ? (
                    <span className="flex gap-1 items-center h-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : (
                    ""
                  ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end sticky bottom-4 bg-background/80 backdrop-blur-sm pt-2">
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
          placeholder="发送消息… (Enter 发送，Shift+Enter 换行)"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground disabled:opacity-50 transition-all"
          style={{ minHeight: "42px" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-30 hover:opacity-80 transition-opacity"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
