import { User, InsertUser, Product, Sale, ExchangeRate, Installment, InstallmentPayment,
  Campaign, InsertCampaign, CampaignAnalytics, InsertCampaignAnalytics,
  SocialMediaAccount, ApiKey, InsertApiKey,
  InventoryTransaction, InsertInventoryTransaction,
  ExpenseCategory, InsertExpenseCategory, Expense, InsertExpense,
  Supplier, InsertSupplier, SupplierTransaction, InsertSupplierTransaction,
  Customer, InsertCustomer, Appointment, InsertAppointment,
  FileStorage, InsertFileStorage, Invoice, InsertInvoice } from "@shared/schema";
import { InsertSystemActivity, SystemActivity, InsertActivityReport, ActivityReport } from "./activity-types"; // Assuming these types are defined elsewhere

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, update: Partial<User>): Promise<User>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  getSales(): Promise<Sale[]>;
  createSale(sale: {
    productId: number;
    quantity: number;
    priceIqd: string;
    userId: number;
    isInstallment: boolean;
    date: Date;
    customerName?: string;
  }): Promise<Sale>;
  getCurrentExchangeRate(): Promise<ExchangeRate>;
  setExchangeRate(rate: number): Promise<ExchangeRate>;
  getInstallments(): Promise<Installment[]>;
  getInstallment(id: number): Promise<Installment | undefined>;
  createInstallment(installment: Installment): Promise<Installment>;
  updateInstallment(id: number, update: Partial<Installment>): Promise<Installment>;
  getInstallmentPayments(installmentId: number): Promise<InstallmentPayment[]>;
  createInstallmentPayment(payment: InstallmentPayment): Promise<InstallmentPayment>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, update: Partial<Campaign>): Promise<Campaign>;
  getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics[]>;
  createCampaignAnalytics(analytics: InsertCampaignAnalytics): Promise<CampaignAnalytics>;
  getSocialMediaAccounts(userId: number): Promise<SocialMediaAccount[]>;
  createSocialMediaAccount(account: SocialMediaAccount): Promise<SocialMediaAccount>;
  deleteSocialMediaAccount(id: number): Promise<void>;
  setApiKeys(userId: number, keys: Record<string, any>): Promise<void>;
  getApiKeys(userId: number): Promise<Record<string, any> | null>;
  migrateLocalStorageToDb(userId: number, keys: Record<string, any>): Promise<void>;
  getInventoryTransactions(): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getExpenseCategories(userId: number): Promise<ExpenseCategory[]>;
  getExpenseCategory(id: number): Promise<ExpenseCategory | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: number, update: Partial<ExpenseCategory>): Promise<ExpenseCategory>;
  deleteExpenseCategory(id: number): Promise<void>;
  getExpenses(userId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, update: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getSuppliers(userId: number): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, update: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  getSupplierTransactions(supplierId: number): Promise<SupplierTransaction[]>;
  createSupplierTransaction(transaction: InsertSupplierTransaction): Promise<SupplierTransaction>;
  searchCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerSales(customerId: number): Promise<Sale[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerAppointments(customerId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, update: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  deleteProduct(id: number): Promise<void>;
  deleteCustomer(id: number): Promise<void>;
  saveFile(file: InsertFileStorage): Promise<FileStorage>;
  getFileById(id: number): Promise<FileStorage | undefined>;
  getUserFiles(userId: number): Promise<FileStorage[]>;
  deleteFile(id: number): Promise<void>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  updateInvoicePrintStatus(id: number, printed: boolean): Promise<Invoice>;
  searchProducts(query: string): Promise<Product[]>;

  // Analytics Methods
  getAnalyticsSales(): Promise<{
    date: string;
    amount: number;
  }[]>;

  getAnalyticsCustomers(): Promise<{
    name: string;
    value: number;
  }[]>;

  getAnalyticsProducts(): Promise<{
    name: string;
    sales: number;
  }[]>;

  // Activity Logging Methods
  logSystemActivity(activity: InsertSystemActivity): Promise<SystemActivity>;
  getSystemActivities(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    activityType?: string;
    entityType?: string;
  }): Promise<SystemActivity[]>;

  // Report Generation Methods
  generateActivityReport(report: InsertActivityReport): Promise<ActivityReport>;
  getActivityReport(id: number): Promise<ActivityReport | undefined>;
  getActivityReports(userId: number): Promise<ActivityReport[]>;

  // Advanced Analytics Methods
  getDetailedSalesReport(dateRange: { start: Date; end: Date }): Promise<{
    totalSales: number;
    totalRevenue: string;
    productsSold: {
      productId: number;
      name: string;
      quantity: number;
      revenue: string;
    }[];
    dailyStats: {
      date: string;
      sales: number;
      revenue: string;
    }[];
  }>;

  getInventoryReport(dateRange: { start: Date; end: Date }): Promise<{
    totalProducts: number;
    lowStock: {
      productId: number;
      name: string;
      currentStock: number;
      minRequired: number;
    }[];
    movements: {
      date: string;
      type: string;
      quantity: number;
      productId: number;
      productName: string;
    }[];
  }>;

  getFinancialReport(dateRange: { start: Date; end: Date }): Promise<{
    revenue: string;
    expenses: string;
    profit: string;
    topExpenses: {
      category: string;
      amount: string;
    }[];
    dailyBalance: {
      date: string;
      revenue: string;
      expenses: string;
      balance: string;
    }[];
  }>;

  getUserActivityReport(dateRange: { start: Date; end: Date }): Promise<{
    totalUsers: number;
    activeUsers: number;
    userActivities: {
      userId: number;
      username: string;
      activityCount: number;
      lastActive: Date;
    }[];
    activityBreakdown: {
      activityType: string;
      count: number;
    }[];
  }>;
}