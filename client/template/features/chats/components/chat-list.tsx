import { Fragment, useState } from "react";
import { Edit, MessagesSquare, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/template/components/ui/avatar";
import { Button } from "@/template/components/ui/button";
import { ScrollArea } from "@/template/components/ui/scroll-area";
import { Separator } from "@/template/components/ui/separator";
import { useI18n } from "@/template/i18n/provider";
import { getDisplayNameInitials } from "@/template/lib/utils";
import type { ChatUser } from "../data/chat-types";

export function ChatList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: {
  conversations: ChatUser[];
  activeId?: ChatUser["id"];
  onSelect: (user: ChatUser) => void;
  onNewChat: () => void;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const filteredChatList = conversations.filter(({ fullName }) =>
    fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
        <div className="flex items-center justify-between py-2">
          <div className="flex gap-2">
            <h1 className="text-2xl font-bold">{t("Inbox")}</h1>
            <MessagesSquare size={20} />
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onNewChat}
            className="rounded-lg"
          >
            <Edit size={24} className="stroke-muted-foreground" />
          </Button>
        </div>

        <label
          className={cn(
            "focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden",
            "flex h-10 w-full items-center space-x-0 rounded-md border border-border ps-2",
          )}
        >
          <SearchIcon size={15} className="me-2 stroke-slate-500" />
          <span className="sr-only">{t("Search")}</span>
          <input
            type="text"
            className="w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden"
            placeholder={t("Search chat...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <ScrollArea className="-mx-3 h-full overflow-scroll p-3">
        {filteredChatList.map((chatUsr) => {
          const { id, profile, username, messages, fullName } = chatUsr;
          const lastConvo = messages[0];
          const lastMsg =
            lastConvo.sender === "You"
              ? `You: ${lastConvo.message}`
              : lastConvo.message;

          return (
            <Fragment key={id}>
              <button
                type="button"
                className={cn(
                  "group hover:bg-accent hover:text-accent-foreground",
                  `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                  activeId === id && "sm:bg-muted",
                )}
                onClick={() => onSelect(chatUsr)}
              >
                <div className="flex gap-2">
                  <Avatar>
                    <AvatarImage src={profile} alt={username} />
                    <AvatarFallback>
                      {getDisplayNameInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="col-start-2 row-span-2 font-medium">
                      {fullName}
                    </span>
                    <span className="col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90">
                      {lastMsg}
                    </span>
                  </div>
                </div>
              </button>
              <Separator className="my-1" />
            </Fragment>
          );
        })}
      </ScrollArea>
    </div>
  );
}
