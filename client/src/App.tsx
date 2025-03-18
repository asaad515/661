import { useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import InvoicesPage from "@/pages/InvoicesPage";
import InvoiceDetailsPage from "@/pages/InvoiceDetailsPage";
import InvoicePrint from "@/pages/invoice-print";
import Staff from "@/pages/staff";
import Settings from "@/pages/settings";
import Installments from "@/pages/installments";
import Marketing from "@/pages/marketing";
import Reports from "@/pages/reports";
import Expenses from "@/pages/expenses";
import Suppliers from "@/pages/suppliers";
import Barcodes from "@/pages/barcodes";
import DiscountCodes from "@/pages/discount-codes";
import Customers from "@/pages/customers";
import Appointments from "@/pages/appointments";
import Returns from "@/pages/returns";
import Icons from "@/pages/icons";
import QuickSalesPage from "@/pages/quick-sales";


export default function App() {
  useEffect(() => {
    // تطبيق الإعدادات المحفوظة
    const applyThemeSettings = () => {
      const storedSettings = localStorage.getItem("themeSettings");
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);

        if (settings.theme?.colors) {
          document.documentElement.style.setProperty("--primary-color", settings.theme.colors.primary);
          document.documentElement.style.setProperty("--secondary-color", settings.theme.colors.secondary);
          document.documentElement.style.setProperty("--accent-color", settings.theme.colors.accent);
        }

        if (settings.font?.family) {
          document.documentElement.style.setProperty("--font-family", settings.font.family);
        }

        const fontSizes = {
          small: { base: 14 },
          medium: { base: 16 },
          large: { base: 18 },
          xlarge: { base: 20 }
        };

        document.documentElement.style.setProperty(
          "--font-size-base",
          `${fontSizes[settings.fontSize || "medium"].base}px`
        );

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (settings.appearance === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
          root.classList.add(systemTheme);
        } else {
          root.classList.add(settings.appearance || "light");
        }
      }
    };

    // تطبيق الإعدادات عند بدء التطبيق
    applyThemeSettings();

    // إضافة مستمع لتغييرات النظام إذا كان المظهر مضبوطاً على "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = () => {
      applyThemeSettings();
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/quick-sales" component={QuickSalesPage} />
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/inventory" component={Inventory} />
            <ProtectedRoute path="/sales" component={Sales} />
            <ProtectedRoute path="/invoices" component={InvoicesPage} />
            <ProtectedRoute path="/invoices/:id" component={InvoiceDetailsPage} />
            <ProtectedRoute path="/invoices/:id/print" component={InvoicePrint} />
            <ProtectedRoute path="/staff" component={Staff} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/installments" component={Installments} />
            <ProtectedRoute path="/marketing" component={Marketing} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/expenses" component={Expenses} />
            <ProtectedRoute path="/suppliers" component={Suppliers} />
            <ProtectedRoute path="/barcodes" component={Barcodes} />
            <ProtectedRoute path="/discount-codes" component={DiscountCodes} />
            <ProtectedRoute path="/customers" component={Customers} />
            <ProtectedRoute path="/appointments" component={Appointments} />
            <ProtectedRoute path="/returns" component={Returns} />
            <ProtectedRoute path="/icons" component={Icons} />
            <ProtectedRoute path="/quick-sales" component={QuickSalesPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}