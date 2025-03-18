import { InvoiceHistory } from "@shared/schema";
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@/components/ui/timeline";
import { FileEdit, FilePlus, XCircle } from "lucide-react";

interface InvoiceHistoryListProps {
  history: InvoiceHistory[];
}

export function InvoiceHistoryList({ history }: InvoiceHistoryListProps) {
  return (
    <Timeline>
      {history.map((item) => (
        <TimelineItem key={item.id}>
          <TimelineOppositeContent>
            {new Date(item.timestamp).toLocaleString("ar-IQ")}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot
              variant={
                item.action === "create"
                  ? "filled"
                  : item.action === "modify"
                  ? "outlined"
                  : "warning"
              }
            >
              {item.action === "create" ? (
                <FilePlus className="h-4 w-4" />
              ) : item.action === "modify" ? (
                <FileEdit className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <div className="mb-2">
              {item.action === "create"
                ? "إنشاء الفاتورة"
                : item.action === "modify"
                ? "تعديل الفاتورة"
                : "إلغاء الفاتورة"}
            </div>
            {item.reason && <div className="text-sm text-muted-foreground">{item.reason}</div>}
            {item.changes && (
              <pre className="mt-2 p-2 bg-muted rounded-md text-sm">
                {JSON.stringify(item.changes, null, 2)}
              </pre>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
