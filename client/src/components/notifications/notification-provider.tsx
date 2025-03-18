import { createContext, useContext, useReducer, ReactNode } from "react";

type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "CLEAR_ALL" };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case "REMOVE_NOTIFICATION":
      return {
        notifications: state.notifications.filter((n) => n.id !== action.payload),
        unreadCount: state.unreadCount - (state.notifications.find((n) => n.id === action.payload && !n.read) ? 1 : 0),
      };
    case "MARK_AS_READ":
      return {
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - (state.notifications.find((n) => n.id === action.payload && !n.read) ? 1 : 0),
      };
    case "MARK_ALL_AS_READ":
      return {
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case "CLEAR_ALL":
      return initialState;
    default:
      return state;
  }
}

const NotificationContext = createContext<{
  state: NotificationState;
  dispatch: React.Dispatch<NotificationAction>;
} | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  return (
    <NotificationContext.Provider value={{ state, dispatch }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
