import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ChatRoom } from "@/components/chat/ChatRoom";
import type { ChatMessage, User } from "@/types/database";

export default async function TrainerChatPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*, user:users(id, full_name, avatar_url)")
    .eq("company_id", user!.company_id!)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <>
      <Header title="Chat" userId={user!.id} />
      <ChatRoom
        initialMessages={(messages ?? []) as (ChatMessage & { user: User })[]}
        userId={user!.id}
        companyId={user!.company_id!}
        userName={user!.full_name}
        avatarUrl={user!.avatar_url}
      />
    </>
  );
}
