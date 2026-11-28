import { Fragment } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ImagePlus,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Send,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/template/components/ui/avatar";
import { Button } from "@/template/components/ui/button";
import { useI18n } from "@/template/i18n/provider";
import { getDisplayNameInitials } from "@/template/lib/utils";
import type { ChatUser, Convo } from "../data/chat-types";

export function ChatConversation({
  user,
  mobileOpen,
  onBack,
}: {
  user: ChatUser;
  mobileOpen: boolean;
  onBack: () => void;
}) {
  const { t, locale, dateLocale } = useI18n();
  const messagesByDate = user.messages.reduce<Record<string, Convo[]>>(
    (groups, message) => {
      const date = format(message.timestamp, "d MMM, yyyy", {
        locale: dateLocale,
      });
      const messages = groups[date] ?? [];
      messages.push(message);
      groups[date] = messages;

      return groups;
    },
    {},
  );

  return (
    <div
      className={cn(
        "absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md",
        mobileOpen && "inset-s-0 flex",
      )}
    >
      <div className="mb-1 flex flex-none justify-between bg-card p-4 shadow-lg sm:rounded-t-md">
        <div className="flex gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="-ms-2 h-full sm:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="rtl:rotate-180" />
          </Button>
          <div className="flex items-center gap-2 lg:gap-4">
            <Avatar className="size-9 lg:size-11">
              <AvatarImage src={user.profile} alt={user.username} />
              <AvatarFallback>
                {getDisplayNameInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="col-start-2 row-span-2 text-sm font-medium lg:text-base">
                {user.fullName}
              </span>
              <span className="col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-xs text-nowrap text-ellipsis text-muted-foreground lg:max-w-none lg:text-sm">
                {user.title}
              </span>
            </div>
          </div>
        </div>

        <div className="-me-1 flex items-center gap-1 lg:gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="hidden size-8 rounded-full sm:inline-flex lg:size-10"
          >
            <Video size={22} className="stroke-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="hidden size-8 rounded-full sm:inline-flex lg:size-10"
          >
            <Phone size={22} className="stroke-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6"
          >
            <MoreVertical className="stroke-muted-foreground sm:size-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4">
        <div className="flex size-full flex-1">
          <div className="chat-text-container relative -me-4 flex flex-1 flex-col overflow-y-hidden">
            <div className="chat-flex flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pe-4 pb-4">
              {Object.entries(messagesByDate).map(([date, messages]) => (
                <Fragment key={date}>
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.sender}-${msg.timestamp}-${index}`}
                      className={cn(
                        "chat-box max-w-72 px-3 py-2 wrap-break-word shadow-lg",
                        msg.sender === "You"
                          ? "self-end rounded-[16px_16px_0_16px] bg-primary/90 text-primary-foreground/75"
                          : "self-start rounded-[16px_16px_16px_0] bg-muted",
                      )}
                    >
                      {msg.message}{" "}
                      <span
                        className={cn(
                          "mt-1 block text-xs font-light text-foreground/75 italic",
                          msg.sender === "You" &&
                            "text-end text-primary-foreground/85",
                        )}
                      >
                        {format(
                          msg.timestamp,
                          locale === "vi" ? "HH:mm" : "h:mm a",
                          {
                            locale: dateLocale,
                          },
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="text-center text-xs">{date}</div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        <form className="flex w-full flex-none gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden lg:gap-4">
            <div className="space-x-1">
              <Button
                size="icon"
                type="button"
                variant="ghost"
                className="h-8 rounded-md"
              >
                <Plus size={20} className="stroke-muted-foreground" />
              </Button>
              <Button
                size="icon"
                type="button"
                variant="ghost"
                className="hidden h-8 rounded-md lg:inline-flex"
              >
                <ImagePlus size={20} className="stroke-muted-foreground" />
              </Button>
              <Button
                size="icon"
                type="button"
                variant="ghost"
                className="hidden h-8 rounded-md lg:inline-flex"
              >
                <Paperclip size={20} className="stroke-muted-foreground" />
              </Button>
            </div>
            <label className="flex-1">
              <span className="sr-only">{t("Chat Text Box")}</span>
              <input
                type="text"
                placeholder={t("Type your messages...")}
                className="h-8 w-full bg-inherit focus-visible:outline-hidden"
              />
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
            >
              <Send size={20} />
            </Button>
          </div>
          <Button className="h-full sm:hidden">
            <Send size={18} /> {t("Send")}{" "}
          </Button>
        </form>
      </div>
    </div>
  );
}
