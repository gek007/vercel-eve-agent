"use client";
import { NewConversationLink } from "./new-conversation-link";
import { useEveAgent } from "eve/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Bot,
  Plus,
  ArrowUp,
  Square,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
const starters = [
  "Which headphones would you recommend under $100?",
  "Help me upgrade my desk for under $150.",
  "What is in my cart right now?",
  "Show me my recent orders.",
];
export function AgentChat({ sessionId }: { sessionId?: string }) {
  const { getToken } = useAuth();
  const agent = useEveAgent({
    initialSession: sessionId ? { sessionId, streamIndex: 0 } : undefined,
    resume: !!sessionId,
    headers: async () => ({ authorization: `Bearer ${await getToken()}` }),
    followIdle: false,
  });
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const busy = agent.status === "submitted" || agent.status === "streaming";
  useEffect(() => {
    if (agent.session?.sessionId)
      window.history.replaceState(
        null,
        "",
        `/agent/${encodeURIComponent(agent.session.sessionId)}`,
      );
  }, [agent.session?.sessionId]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [agent.data.messages.length, busy]);
  const send = (message: string) => {
    if (!message.trim() || busy || agent.status === "resuming") return;
    setDraft("");
    void agent.send(message.trim()).catch(() => {});
  };
  return (
    <div className="chat-workspace">
      <div className="chat-toolbar">
        <div className="chat-identity">
          <span className="chat-avatar">
            <Bot size={22} aria-hidden="true" />
          </span>
          <div>
            <div className="chat-title">
              <strong>Scout</strong>
              <span className="agent-state">
                <span className="status-dot" />
                {busy
                  ? "Working"
                  : agent.status === "resuming"
                    ? "Restoring"
                    : agent.error
                      ? "Needs attention"
                      : "Ready"}
              </span>
            </div>
            <small>Your personal shopping companion</small>
          </div>
        </div>
        <NewConversationLink className="button secondary small">
          <Plus size={16} aria-hidden="true" />
          New conversation
        </NewConversationLink>
      </div>
      <div className="chat-transcript" aria-live="polite" aria-busy={busy}>
        {agent.data.messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-orb">
              <Sparkles size={32} aria-hidden="true" />
            </div>
            <h1>What can I help you find?</h1>
            <p>
              Good products. Thoughtful recommendations.
              <br />A little help for your everyday.
            </p>
            <div className="starter-grid">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy || agent.status === "resuming"}
                >
                  <MessageSquare size={17} aria-hidden="true" />
                  <span>{s}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          agent.data.messages.map((message) => (
            <article
              className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"}`}
              key={message.id}
            >
              <div className="message-author">
                {message.role === "user" ? (
                  "You"
                ) : (
                  <>
                    <Sparkles size={15} aria-hidden="true" />
                    Scout
                  </>
                )}
              </div>
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <div className="message-text" key={part.id ?? i}>
                    {part.text}
                  </div>
                ) : part.type.includes("tool") ? (
                  <div className="tool-note" key={i}>
                    Shopping tool
                  </div>
                ) : null,
              )}
            </article>
          ))
        )}
        {busy && (
          <div className="thinking">
            <Sparkles size={15} aria-hidden="true" />
            Looking into that for you…
          </div>
        )}
        {agent.status === "resuming" && (
          <p role="status" className="thinking">
            Restoring your conversation…
          </p>
        )}
        {agent.error && (
          <p role="alert" className="error-notice">
            The assistant couldn’t complete this request. Check your
            subscription and try again. If the problem continues, contact your
            workspace administrator.
          </p>
        )}
        <div ref={end} />
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label htmlFor="message" className="sr-only">
          Ask Scout
        </label>
        <textarea
          id="message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={8000}
          placeholder="Ask Scout…"
          rows={2}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send(draft);
            }
          }}
        />
        <div className="composer-bottom">
          <span>
            <Sparkles size={13} aria-hidden="true" />
            Your personal shopping companion
          </span>
          {busy ? (
            <button
              className="send-button"
              type="button"
              aria-label="Stop response"
              onClick={() => void agent.cancel()}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="send-button"
              type="submit"
              disabled={!draft.trim() || agent.status === "resuming"}
              aria-label="Send message"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </form>
      <p className="chat-disclaimer">
        Demo shop. Review your cart before placing an order.
      </p>
    </div>
  );
}
