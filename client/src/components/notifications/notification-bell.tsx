import { Bell } from "lucide-react";
import { useNotifications } from "./notification-provider";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function NotificationBell() {
  const { state, dispatch } = useNotifications();
  const { notifications, unreadCount } = state;

  const handleMarkAsRead = (id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: id });
  };

  const handleMarkAllAsRead = () => {
    dispatch({ type: "MARK_ALL_AS_READ" });
  };

  const handleClearAll = () => {
    dispatch({ type: "CLEAR_ALL" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="الإشعارات"
        >
          <AnimatedIcon
            animation={unreadCount > 0 ? "pulse" : undefined}
            color={unreadCount > 0 ? "#EA4335" : undefined}
          >
            <Bell className="h-5 w-5" />
          </AnimatedIcon>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">الإشعارات</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              تعليم الكل كمقروء
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              حذف الكل
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              لا توجد إشعارات
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.read
                      ? "bg-background"
                      : "bg-muted cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium">{notification.title}</h5>
                    <small className="text-muted-foreground">
                      {format(notification.timestamp, "PP", { locale: ar })}
                    </small>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
