"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigDrawer } from "@/template/components/config-drawer";
import { Header } from "@/template/components/layout/header";
import { Main } from "@/template/components/layout/main";
import { ProfileDropdown } from "@/template/components/profile-dropdown";
import { Search } from "@/template/components/search";
import { ThemeSwitch } from "@/template/components/theme-switch";
import { Button } from "@/template/components/ui/button";
import { useI18n } from "@/template/i18n/provider";
import { ChatConversation } from "./components/chat-conversation";
import { ChatList } from "./components/chat-list";
import { NewChat } from "./components/new-chat";
import type { ChatUser } from "./data/chat-types";
import { conversations } from "./data/convo.json";

const users = conversations.map(
  ({ id, profile, fullName, username, title }) => ({
    id,
    profile,
    fullName,
    username,
    title,
  }),
);

export function Chats() {
  const { t } = useI18n();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  function selectUser(user: ChatUser) {
    setSelectedUser(user);
    setMobileOpen(true);
  }

  return (
    <>
      <Header>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <section className="flex h-full gap-6">
          <ChatList
            conversations={conversations}
            activeId={selectedUser?.id}
            onSelect={selectUser}
            onNewChat={() => setNewChatOpen(true)}
          />

          {selectedUser ? (
            <ChatConversation
              user={selectedUser}
              mobileOpen={mobileOpen}
              onBack={() => setMobileOpen(false)}
            />
          ) : (
            <div
              className={cn(
                "absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex",
              )}
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="flex size-16 items-center justify-center rounded-full border-2 border-border">
                  <MessagesSquare className="size-8" />
                </div>
                <div className="space-y-2 text-center">
                  <h1 className="text-xl font-semibold">
                    {t("Your messages")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("Send a message to start a chat.")}{" "}
                  </p>
                </div>
                <Button onClick={() => setNewChatOpen(true)}>
                  {t("Send message")}{" "}
                </Button>
              </div>
            </div>
          )}
        </section>
        <NewChat
          users={users}
          onOpenChange={setNewChatOpen}
          open={newChatOpen}
        />
      </Main>
    </>
  );
}
