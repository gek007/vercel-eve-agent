import { NewConversationLink } from "@/components/new-conversation-link";
import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { requireProPage } from "@/lib/auth/page";
import { assertSessionOwner, listConversations } from "@/lib/data/client";
import { AgentChat } from "@/components/agent-chat";
import { AccessState } from "@/components/access-state";
export default async function Chat({
  params,
}: {
  params: Promise<{ sessionId?: string[] }>;
}) {
  const caller = await requireProPage();
  const { sessionId: segments } = await params;
  if (segments && segments.length !== 1) notFound();
  const sessionId = segments?.[0];
  if (sessionId) {
    try {
      await assertSessionOwner(caller, sessionId);
    } catch {
      notFound();
    }
  }
  let conversations;
  try {
    conversations = await listConversations(caller);
  } catch {
    return (
      <AccessState message="Your conversations could not be loaded. Please try again." />
    );
  }
  return (
    <div className="chat-layout">
      <aside className="conversation-list">
        <div className="conversation-heading">
          <h2>Conversations</h2>
          <NewConversationLink
            className="icon-button"
            ariaLabel="New conversation"
          >
            <Plus size={18} aria-hidden="true" />
          </NewConversationLink>
        </div>
        <NewConversationLink className="button secondary new-conversation">
          <Plus size={16} aria-hidden="true" />
          New conversation
        </NewConversationLink>
        <nav aria-label="Conversations">
          {conversations.map((c) => (
            <Link
              key={c.sessionId}
              href={`/chat/${encodeURIComponent(c.sessionId)}`}
              className={
                c.sessionId === sessionId
                  ? "conversation active"
                  : "conversation"
              }
            >
              <MessageSquare size={15} aria-hidden="true" />
              <span>{c.title}</span>
            </Link>
          ))}
        </nav>
        {!conversations.length && (
          <p className="muted conversation-hint">
            Your conversations will appear here after your first question.
          </p>
        )}
      </aside>
      <AgentChat key={sessionId ?? "new"} sessionId={sessionId} />
    </div>
  );
}
