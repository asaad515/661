import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PrintTemplateProps {
  type: "invoice" | "report";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  pageSize?: "A4" | "A5" | "Letter";
}

const pageSizes = {
  A4: "w-[210mm] h-[297mm]",
  A5: "w-[148mm] h-[210mm]",
  Letter: "w-[216mm] h-[279mm]",
};

export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(
  (
    {
      type,
      title,
      subtitle,
      children,
      className,
      showLogo = true,
      showHeader = true,
      showFooter = true,
      pageSize = "A4",
    },
    ref
  ) => {
    const date = new Date().toLocaleDateString("ar-SA");

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white p-8 mx-auto",
          pageSizes[pageSize],
          className
        )}
      >
        {showHeader && (
          <div className="flex justify-between items-start mb-8 border-b pb-4">
            {showLogo && (
              <div className="w-32 h-16 bg-muted/20 flex items-center justify-center rounded">
                شعار الشركة
              </div>
            )}
            <div className="text-left">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                تاريخ الطباعة: {date}
              </p>
            </div>
          </div>
        )}

        <div className="min-h-[200mm]">{children}</div>

        {showFooter && (
          <footer className="mt-8 pt-4 border-t text-sm text-muted-foreground text-center">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          </footer>
        )}
      </div>
    );
  }
);

PrintTemplate.displayName = "PrintTemplate";
