import { pgTable, text, serial, timestamp, boolean, decimal, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  permissions: text("permissions").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  productCode: varchar("product_code", { length: 50 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }).unique(),
  productType: text("product_type").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  productionDate: timestamp("production_date"),
  expiryDate: timestamp("expiry_date"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  priceIqd: decimal("price_iqd", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  isWeightBased: boolean("is_weight_based").notNull().default(false),
  enableDirectWeighing: boolean("enable_direct_weighing").notNull().default(false),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  processedBy: integer("processed_by").references(() => users.id),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
  attachments: text("attachments").array(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const productExpiry = pgTable("product_expiry", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  batchNumber: text("batch_number").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  quantity: integer("quantity").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  quantity: integer("quantity").notNull(),
  priceIqd: decimal("price_iqd", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  finalPriceIqd: decimal("final_price_iqd", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
  isInstallment: boolean("is_installment").notNull().default(false),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerName: text("customer_name").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, modified, cancelled
  paymentMethod: text("payment_method").notNull().default("cash"),
  notes: text("notes"),
  printed: boolean("printed").notNull().default(false),
  originalInvoiceId: integer("original_invoice_id").references(() => invoices.id),
  modificationReason: text("modification_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoiceHistory = pgTable("invoice_history", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  action: text("action").notNull(), // create, modify, cancel
  userId: integer("user_id").notNull().references(() => users.id),
  changes: jsonb("changes").notNull(),
  reason: text("reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  identityNumber: text("identity_number").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }).notNull().default("0"),
  numberOfPayments: integer("number_of_payments").notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  guarantorName: text("guarantor_name"),
  guarantorPhone: text("guarantor_phone"),
  status: text("status").notNull().default("active"),
});

export const installmentPayments = pgTable("installment_payments", {
  id: serial("id").primaryKey(),
  installmentId: integer("installment_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  notes: text("notes"),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  usdToIqd: decimal("usd_to_iqd", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  platforms: text("platforms").array().notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("draft"),
  userId: integer("user_id").notNull(),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campaignAnalytics = pgTable("campaign_analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  platform: text("platform").notNull(),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).notNull().default("0"),
  date: timestamp("date").notNull(),
});

export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(),
  keyType: text("key_type").notNull(),
  keyValue: text("key_value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  reference: text("reference"),
  date: timestamp("date").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
  notes: text("notes"),
});

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  oldQuantity: integer("old_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
  notes: text("notes"),
});

export const inventoryAlerts = pgTable("inventory_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(),
  threshold: integer("threshold").notNull(),
  status: text("status").notNull().default("active"),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const alertNotifications = pgTable("alert_notifications", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull().references(() => inventoryAlerts.id),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  dateRange: jsonb("date_range").notNull(),
  filters: jsonb("filters"),
  data: jsonb("data").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  categoryId: integer("category_id").notNull().references(() => expenseCategories.id),
  userId: integer("user_id").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringPeriod: text("recurring_period"),
  recurringDay: integer("recurring_day"),
  notes: text("notes"),
  attachments: text("attachments").array(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  taxNumber: text("tax_number"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  categories: text("categories").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
});

export const supplierTransactions = pgTable("supplier_transactions", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("completed"),
  notes: text("notes"),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fileStorage = pgTable("file_storage", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  themeName: text("theme_name").notNull(),
  fontName: text("font_name").notNull(),
  fontSize: text("font_size").notNull(),
  appearance: text("appearance").notNull(),
  colors: jsonb("colors").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const systemActivities = pgTable("system_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // login, product_create, sale, etc.
  entityType: text("entity_type").notNull(), // products, sales, expenses, etc.
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, view
  details: jsonb("details").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const activityReports = pgTable("activity_reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dateRange: jsonb("date_range").notNull(),
  filters: jsonb("filters"),
  reportType: text("report_type").notNull(), // daily, weekly, monthly
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    permissions: true,
  })
  .extend({
    username: z.string().min(1, "اسم المستخدم مطلوب"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    fullName: z.string().min(1, "الاسم الكامل مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable(),
    phone: z.string().optional().nullable(),
    role: z.enum(["admin", "staff"]).default("staff"),
    permissions: z.array(z.string()).default([]),
  });

export const insertProductSchema = createInsertSchema(products).extend({
  name: z.string().min(3, "اسم المنتج يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  productCode: z.string().min(1, "رمز المنتج مطلوب")
    .regex(/^[A-Za-z0-9-]+$/, "رمز المنتج يجب أن يحتوي على أحرف وأرقام وشرطات فقط"),
  barcode: z.string().optional()
    .nullable()
    .refine(val => !val || /^[0-9]{8,13}$/.test(val), "الباركود يجب أن يكون رقمًا من 8 إلى 13 خانة"),
  productType: z.string().min(1, "نوع المنتج مطلوب"),
  quantity: z.coerce.number().min(0, "الكمية يجب أن تكون 0 على الأقل"),
  minQuantity: z.coerce.number().min(0, "الحد الأدنى يجب أن يكون 0 على الأقل"),
  productionDate: z.date().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  costPrice: z.coerce.number().min(0, "سعر التكلفة يجب أن يكون أكبر من 0"),
  priceIqd: z.coerce.number().min(0, "سعر البيع يجب أن يكون أكبر من 0"),
  categoryId: z.number().optional().nullable(),
  isWeightBased: z.boolean().default(false),
  enableDirectWeighing: z.boolean().default(false),
  imageUrl: z.string().url("يجب أن يكون رابط صورة صحيح").optional().nullable(),
  thumbnailUrl: z.string().url("يجب أن يكون رابط الصورة المصغرة صحيح").optional().nullable(),
});

export const insertSaleSchema = createInsertSchema(sales)
  .pick({
    productId: true,
    customerId: true,
    quantity: true,
    priceIqd: true,
    discount: true,
    isInstallment: true,
  })
  .extend({
    productId: z.number().min(1, "يجب اختيار منتج"),
    customerId: z.number().min(1, "يجب اختيار عميل"),
    quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    priceIqd: z.number().min(0, "السعر يجب أن يكون أكبر من 0"),
    discount: z.number().min(0, "الخصم يجب أن يكون 0 أو أكثر"),
    isInstallment: z.boolean().default(false),
  });

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).pick({
  usdToIqd: true,
});

export const insertInstallmentSchema = createInsertSchema(installments)
  .omit({ id: true })
  .extend({
    customerName: z.string().min(1, "اسم العميل مطلوب"),
    customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
    identityNumber: z.string().min(1, "رقم الهوية مطلوب"),
    totalAmount: z.number().min(0, "المبلغ الإجمالي يجب أن يكون أكبر من 0"),
    downPayment: z.number().min(0, "الدفعة الأولى يجب أن تكون 0 أو أكثر"),
    numberOfPayments: z.number().min(1, "عدد الأقساط يجب أن يكون 1 على الأقل"),
    nextPaymentDate: z.date(),
    guarantorName: z.string().optional(),
    guarantorPhone: z.string().optional(),
  });

export const insertInstallmentPaymentSchema = createInsertSchema(installmentPayments)
  .omit({ id: true })
  .extend({
    amount: z.number().min(0, "مبلغ الدفعة يجب أن يكون أكبر من 0"),
    notes: z.string().optional(),
  });

export const insertCampaignSchema = createInsertSchema(marketingCampaigns)
  .omit({ id: true, createdAt: true, metrics: true })
  .extend({
    platforms: z.array(z.string()).min(1, "يجب اختيار منصة واحدة على الأقل"),
    budget: z.number().min(0, "الميزانية يجب أن تكون أكبر من 0"),
    startDate: z.date(),
    endDate: z.date().optional(),
  });

export const insertAnalyticsSchema = createInsertSchema(campaignAnalytics)
  .omit({ id: true })
  .extend({
    date: z.date(),
    platform: z.string(),
    impressions: z.number().min(0),
    clicks: z.number().min(0),
    conversions: z.number().min(0),
    spend: z.number().min(0),
  });

export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts)
  .omit({ id: true, createdAt: true })
  .extend({
    platform: z.enum(["facebook", "instagram", "twitter", "linkedin", "snapchat", "tiktok"]),
    accountName: z.string().min(1, "اسم الحساب مطلوب"),
    accessToken: z.string().min(1, "رمز الوصول مطلوب"),
    refreshToken: z.string().optional(),
    expiresAt: z.date().optional(),
  });

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions)
  .omit({ id: true })
  .extend({
    type: z.enum(["in", "out"]),
    quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    reason: z.enum(["sale", "return", "adjustment", "purchase"]),
    reference: z.string().optional(),
    notes: z.string().optional(),
  });

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments)
  .omit({ id: true })
  .extend({
    oldQuantity: z.number().min(0, "الكمية القديمة يجب أن تكون 0 على الأقل"),
    newQuantity: z.number().min(0, "الكمية الجديدة يجب أن تكون 0 على الأقل"),
    reason: z.string().min(1, "سبب التعديل مطلوب"),
    notes: z.string().optional(),
  });

export const insertInventoryAlertSchema = createInsertSchema(inventoryAlerts)
  .omit({ id: true, createdAt: true, updatedAt: true, lastTriggered: true })
  .extend({
    type: z.enum(["low_stock", "inactive", "high_demand"]),
    threshold: z.number().min(0, "قيمة الحد يجب أن تكون 0 أو أكثر"),
    status: z.enum(["active", "inactive"]).default("active"),
  });

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications)
  .omit({ id: true, createdAt: true })
  .extend({
    message: z.string().min(1, "الرسالة مطلوبة"),
  });

export const insertReportSchema = createInsertSchema(reports)
  .omit({ id: true, createdAt: true })
  .extend({
    type: z.enum(["sales", "inventory", "marketing", "financial"]),
    title: z.string().min(1, "عنوان التقرير مطلوب"),
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    filters: z.record(z.unknown()).optional(),
    data: z.record(z.unknown()),
    format: z.enum(["json", "csv", "pdf"]).default("json"),
  });

export const insertSupplierSchema = createInsertSchema(suppliers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, "اسم المورد مطلوب"),
    contactPerson: z.string().min(1, "اسم الشخص المسؤول مطلوب"),
    phone: z.string().min(1, "رقم الهاتف مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable(),
    categories: z.array(z.string()).min(1, "يجب اختيار فئة واحدة على الأقل"),
  });

export const insertSupplierTransactionSchema = createInsertSchema(supplierTransactions)
  .omit({ id: true, createdAt: true })
  .extend({
    amount: z.number().min(0, "المبلغ يجب أن يكون أكبر من 0"),
    date: z.date(),
    type: z.enum(["payment", "refund", "advance", "other"]),
    status: z.enum(["pending", "completed", "cancelled"]).default("completed"),
    attachments: z.array(z.string()).optional(),
  });

export const insertCustomerSchema = createInsertSchema(customers)
  .omit({ id: true, createdAt: true })
  .extend({
    name: z.string().min(1, "اسم العميل مطلوب"),
    phone: z.string().optional(),
    email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable(),
  });

export const insertAppointmentSchema = createInsertSchema(appointments)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(1, "عنوان الموعد مطلوب"),
    description: z.string().optional().nullable(),
    customerId: z.number().int().positive("يجب اختيار عميل").optional().nullable(),
    date: z.coerce.date(),
    duration: z.coerce.number().int().min(1, "مدة الموعد يجب أن تكون 1 دقيقة على الأقل"),
    status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
    notes: z.string().optional().nullable(),
  });

export const insertFileStorageSchema = createInsertSchema(fileStorage)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    filename: z.string().min(1, "اسم الملف مطلوب"),
    contentType: z.string().min(1, "نوع المحتوى مطلوب"),
    size: z.number().min(0, "حجم الملف يجب أن يكون أكبر من 0"),
    data: z.string().min(1, "محتوى الملف مطلوب"),
    userId: z.number().min(1, "معرف المستخدم مطلوب"),
  });

export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    saleId: z.number().min(1, "معرف البيع مطلوب"),
    invoiceNumber: z.string().min(1, "رقم الفاتورة مطلوب"),
    customerName: z.string().min(1, "اسم العميل مطلوب"),
    totalAmount: z.coerce.number().min(0, "المبلغ الإجمالي يجب أن يكون أكبر من 0"),
    discountAmount: z.coerce.number().min(0, "قيمة الخصم يجب أن تكون 0 أو أكثر"),
    finalAmount: z.coerce.number().min(0, "المبلغ النهائي يجب أن يكون أكبر من 0"),
    status: z.enum(["active", "modified", "cancelled"]).default("active"),
    paymentMethod: z.enum(["cash", "card", "transfer"]).default("cash"),
    notes: z.string().optional(),
    originalInvoiceId: z.number().optional(),
    modificationReason: z.string().optional(),
  });

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems)
  .omit({ id: true, createdAt: true })
  .extend({
    invoiceId: z.number().min(1, "معرف الفاتورة مطلوب"),
    productId: z.number().min(1, "معرف المنتج مطلوب"),
    quantity: z.coerce.number().min(0.001, "الكمية يجب أن تكون أكبر من 0"),
    unitPrice: z.coerce.number().min(0, "سعر الوحدة يجب أن يكون أكبر من 0"),
    discount: z.coerce.number().min(0, "قيمة الخصم يجب أن تكون 0 أو أكثر"),
    totalPrice: z.coerce.number().min(0, "السعر الإجمالي يجب أن يكون أكبر من 0"),
  });

export const insertInvoiceHistorySchema = createInsertSchema(invoiceHistory)
  .omit({ id: true, timestamp: true })
  .extend({
    invoiceId: z.number().min(1, "معرف الفاتورة مطلوب"),
    action: z.enum(["create", "modify", "cancel"]),
    changes: z.record(z.unknown()),
    reason: z.string().optional(),
  });

export const insertSystemActivitySchema = createInsertSchema(systemActivities)
  .omit({ id: true, timestamp: true })
  .extend({
    details: z.record(z.unknown()),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  });

export const insertActivityReportSchema = createInsertSchema(activityReports)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    dateRange: z.object({
      startDate: z.date(),
      endDate: z.date(),
    }),
    filters: z.record(z.unknown()).optional(),
    reportType: z.enum(["daily", "weekly", "monthly"]),
    data: z.record(z.unknown()),
  });

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories)
  .omit({ id: true, createdAt: true })
  .extend({
    name: z.string().min(1, "اسم الفئة مطلوب"),
    description: z.string().optional().nullable(),
    budgetAmount: z.coerce.number().min(0, "الميزانية يجب أن تكون 0 على الأقل").optional().nullable(),
  });

export const insertExpenseSchema = createInsertSchema(expenses)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    amount: z.coerce.number().min(0, "المبلغ يجب أن يكون أكبر من0"),
    description: z.string().min(1, "الوصف مطلوب"),
    date: z.coerce.date(),
    categoryId: z.coerce.number().min(1, "يجب اختيار فئة"),
    isRecurring: z.boolean().default(false),    recurringPeriod: z.enum(["monthly", "weekly", "yearly"]).optional(),
    recurringDay: z.coerce.number().min(1).max(31).optional(),
    attachments: z.array(z.string()).optional(),
  });

export const insertUserSettingsSchema = createInsertSchema(userSettings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    themeName: z.string().min(1, "اسم الثيم مطلوب"),
    fontName: z.string().min(1, "اسم الخط مطلوب"),
    fontSize: z.enum(["small", "medium", "large", "xlarge"]),
    appearance: z.enum(["light", "dark", "system"]),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    }),
  });

export const insertReturnSchema = createInsertSchema(returns)
  .omit({ id: true, date: true })
  .extend({
    saleId: z.number().min(1, "يجب اختيار عملية البيع"),
    productId: z.number().min(1, "يجب اختيار المنتج"),
    quantity: z.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    reason: z.string().min(1, "سبب الإرجاع مطلوب"),
    refundAmount: z.number().min(0, "مبلغ الاسترجاع يجب أن يكون 0 أو أكثر"),
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(),
  });

// إضافة جدول تتبع حالات المرتجعات
export const returnStatusHistory = pgTable("return_status_history", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").notNull().references(() => returns.id),
  status: text("status").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  notes: text("notes"),
  date: timestamp("date").notNull().defaultNow(),
});

// إضافة المخطط للتحقق من صحة البيانات
export const insertReturnStatusHistorySchema = createInsertSchema(returnStatusHistory)
  .omit({ id: true })
  .extend({
    status: z.enum(["pending", "approved", "rejected", "processed"]),
    notes: z.string().optional(),
  });

// إضافة نوع البيانات
export type ReturnStatusHistory = typeof returnStatusHistory.$inferSelect;
export type InsertReturnStatusHistory = z.infer<typeof insertReturnStatusHistorySchema>;

export type SystemActivity = typeof systemActivities.$inferSelect;
export type InsertSystemActivity = z.infer<typeof insertSystemActivitySchema>;
export type ActivityReport = typeof activityReports.$inferSelect;
export type InsertActivityReport = z.infer<typeof insertActivityReportSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Installment = typeof installments.$inferSelect;
export type InstallmentPayment = typeof installmentPayments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type InsertInstallmentPayment = z.infer<typeof insertInstallmentPaymentSchema>;
export type Campaign = typeof marketingCampaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignAnalytics = typeof campaignAnalytics.$inferSelect;
export type InsertCampaignAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type InsertSupplierTransaction = z.infer<typeof insertSupplierTransactionSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type FileStorage = typeof fileStorage.$inferSelect;
export type InsertFileStorage = z.infer<typeof insertFileStorageSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type InsertInventoryAlert = z.infer<typeof insertInventoryAlertSchema>;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceHistory = typeof invoiceHistory.$inferSelect;
export type InsertInvoiceHistory = z.infer<typeof insertInvoiceHistorySchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;