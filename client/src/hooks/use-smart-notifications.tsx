import { useEffect } from "react";
import { useNotifications } from "@/components/notifications/notification-provider";
import { nanoid } from "nanoid";

export interface NotificationPreference {
  lowStockAlert: boolean;
  lowStockThreshold: number;
  salesAlert: boolean;
  dailySalesReport: boolean;
  customerActivityAlert: boolean;
  systemUpdates: boolean;
}

export function useSmartNotifications(preferences: NotificationPreference) {
  const { dispatch } = useNotifications();

  const addNotification = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error",
    link?: string
  ) => {
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: nanoid(),
        title,
        message,
        type,
        timestamp: new Date(),
        read: false,
        link,
      },
    });
  };

  // مراقبة المخزون المنخفض
  const checkLowStock = async () => {
    if (!preferences.lowStockAlert) return;

    try {
      const response = await fetch("/api/products");
      const products = await response.json();
      
      products.forEach((product: any) => {
        if (product.stock <= preferences.lowStockThreshold) {
          addNotification(
            "تنبيه المخزون",
            `المنتج "${product.name}" منخفض في المخزون (${product.stock} قطعة متبقية)`,
            "warning",
            `/inventory?product=${product.id}`
          );
        }
      });
    } catch (error) {
      console.error("فشل في فحص المخزون:", error);
    }
  };

  // مراقبة المبيعات اليومية
  const checkDailySales = async () => {
    if (!preferences.salesAlert) return;

    try {
      const response = await fetch("/api/sales/daily");
      const { total, count } = await response.json();
      
      addNotification(
        "تقرير المبيعات اليومي",
        `تم إتمام ${count} عملية بيع اليوم بإجمالي ${total} د.ع`,
        "info",
        "/sales"
      );
    } catch (error) {
      console.error("فشل في جلب تقرير المبيعات:", error);
    }
  };

  // مراقبة نشاط العملاء
  const checkCustomerActivity = async () => {
    if (!preferences.customerActivityAlert) return;

    try {
      const response = await fetch("/api/customers/activity");
      const activities = await response.json();
      
      activities.forEach((activity: any) => {
        addNotification(
          "نشاط العملاء",
          `${activity.customerName} ${activity.action}`,
          "info",
          `/customers/${activity.customerId}`
        );
      });
    } catch (error) {
      console.error("فشل في جلب نشاط العملاء:", error);
    }
  };

  useEffect(() => {
    if (preferences.lowStockAlert) {
      checkLowStock();
      const interval = setInterval(checkLowStock, 30 * 60 * 1000); // كل 30 دقيقة
      return () => clearInterval(interval);
    }
  }, [preferences.lowStockAlert, preferences.lowStockThreshold]);

  useEffect(() => {
    if (preferences.dailySalesReport) {
      checkDailySales();
      const interval = setInterval(checkDailySales, 24 * 60 * 60 * 1000); // يومياً
      return () => clearInterval(interval);
    }
  }, [preferences.dailySalesReport]);

  useEffect(() => {
    if (preferences.customerActivityAlert) {
      checkCustomerActivity();
      const interval = setInterval(checkCustomerActivity, 5 * 60 * 1000); // كل 5 دقائق
      return () => clearInterval(interval);
    }
  }, [preferences.customerActivityAlert]);

  return { addNotification };
}
