import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  users, products, sales, exchangeRates, expenseCategories, fileStorage,
  customers, installments, installmentPayments, marketingCampaigns,
  campaignAnalytics, socialMediaAccounts, apiKeys, inventoryTransactions,
  expenses, suppliers, supplierTransactions, appointments, returns, returnStatusHistory
} from "@shared/schema";
import type {
  User, InsertUser, Product, Sale, ExchangeRate, ExpenseCategory,
  FileStorage, InsertFileStorage, Customer, InsertCustomer, Installment,
  InstallmentPayment, Campaign, InsertCampaign, CampaignAnalytics,
  InsertCampaignAnalytics, SocialMediaAccount, InsertSocialMediaAccount,
  ApiKey, InsertApiKey, InventoryTransaction, InsertInventoryTransaction,
  Expense, InsertExpense, Supplier, InsertSupplier, SupplierTransaction,
  InsertSupplierTransaction, Appointment, InsertAppointment, Return, InsertReturn, ReturnStatusHistory
} from "@shared/schema";

export class DatabaseStorage {
  // حفظ مستخدم جديد في قاعدة البيانات
  async saveNewUser(user: InsertUser): Promise<User | null> {
    try {
      const [savedUser] = await db
        .insert(users)
        .values({
          ...user,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          lastLoginAt: null,
        })
        .returning();
      return savedUser;
    } catch (error) {
      console.error("خطأ في حفظ المستخدم في قاعدة البيانات:", error);
      return null;
    }
  }

  // البحث عن مستخدم باسم المستخدم
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("خطأ في البحث عن المستخدم في قاعدة البيانات:", error);
      return undefined;
    }
  }

  // الحصول على مستخدم بواسطة المعرف
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("خطأ في البحث عن المستخدم في قاعدة البيانات:", error);
      return undefined;
    }
  }

  // إضافة منتج جديد
  async createProduct(product: Product): Promise<Product | null> {
    try {
      const [savedProduct] = await db
        .insert(products)
        .values(product)
        .returning();
      return savedProduct;
    } catch (error) {
      console.error("خطأ في حفظ المنتج في قاعدة البيانات:", error);
      return null;
    }
  }

  // الحصول على جميع المنتجات
  async getProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products);
    } catch (error) {
      console.error("خطأ في جلب المنتجات من قاعدة البيانات:", error);
      return [];
    }
  }

  // إنشاء منتج جديد
  async createProduct(data: any): Promise<Product> {
    try {
      if (!data.name || !data.productCode) {
        throw new Error("اسم المنتج ورمز المنتج مطلوبان");
      }
      
      console.log("Creating product with data:", data);
      const [product] = await db
        .insert(products)
        .values({
          name: data.name,
          description: data.description || "",
          productCode: data.productCode,
          barcode: data.barcode || null,
          productType: data.productType || "regular",
          quantity: Number(data.quantity) || 0,
          minQuantity: Number(data.minQuantity) || 0,
          costPrice: data.costPrice?.toString() || "0",
          priceIqd: data.priceIqd?.toString() || "0",
          categoryId: data.categoryId || null,
          stock: Number(data.stock) || 0,
          imageUrl: data.imageUrl || null,
          thumbnailUrl: data.thumbnailUrl || null,
          isWeightBased: Boolean(data.isWeightBased),
          enableDirectWeighing: Boolean(data.enableDirectWeighing),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log("Created product:", product);
      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // حذف منتج
  async deleteProduct(id: number): Promise<void> {
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (error) {
      console.error("خطأ في حذف المنتج من قاعدة البيانات:", error);
      throw error;
    }
  }

  // إضافة فئة مصروفات جديدة
  async createExpenseCategory(data: {
    name: string;
    description?: string | null;
    budgetAmount?: number | null;
    userId: number;
  }): Promise<ExpenseCategory> {
    try {
      console.log("Creating expense category with data:", data);
      const [category] = await db
        .insert(expenseCategories)
        .values({
          name: data.name,
          description: data.description,
          budgetAmount: data.budgetAmount?.toString(),
          userId: data.userId,
          createdAt: new Date(),
        })
        .returning();

      console.log("Created expense category:", category);
      return category;
    } catch (error) {
      console.error("خطأ في إنشاء فئة المصروفات:", error);
      throw error;
    }
  }

  // الحصول على فئات المصروفات
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    try {
      return await db.select().from(expenseCategories);
    } catch (error) {
      console.error("خطأ في جلب فئات المصروفات:", error);
      return [];
    }
  }

  // إضافة عملية بيع
  async createSale(sale: Sale): Promise<Sale | null> {
    try {
      const [savedSale] = await db
        .insert(sales)
        .values(sale)
        .returning();
      return savedSale;
    } catch (error) {
      console.error("خطأ في حفظ عملية البيع في قاعدة البيانات:", error);
      return null;
    }
  }

  // الحصول على جميع المبيعات
  async getSales(): Promise<Sale[]> {
    try {
      return await db.select().from(sales);
    } catch (error) {
      console.error("خطأ في جلب المبيعات من قاعدة البيانات:", error);
      return [];
    }
  }

  // الحصول على مبيعات عميل معين
  async getCustomerSales(customerId: number): Promise<Sale[]> {
    try {
      return await db
        .select()
        .from(sales)
        .where(eq(sales.customerId, customerId));
    } catch (error) {
      console.error("خطأ في جلب مبيعات العميل من قاعدة البيانات:", error);
      return [];
    }
  }

  // الحصول على سعر الصرف الحالي
  async getCurrentExchangeRate(): Promise<ExchangeRate | null> {
    try {
      const [rate] = await db
        .select()
        .from(exchangeRates)
        .orderBy(desc(exchangeRates.date))
        .limit(1);
      return rate;
    } catch (error) {
      console.error("خطأ في جلب سعر الصرف من قاعدة البيانات:", error);
      return null;
    }
  }

  // تعيين سعر الصرف
  async setExchangeRate(rate: number): Promise<ExchangeRate | null> {
    try {
      const [newRate] = await db
        .insert(exchangeRates)
        .values({
          usdToIqd: rate.toString(),
          date: new Date()
        })
        .returning();
      return newRate;
    } catch (error) {
      console.error("خطأ في حفظ سعر الصرف في قاعدة البيانات:", error);
      return null;
    }
  }

  // حفظ ملف جديد
  async saveFile(file: InsertFileStorage): Promise<FileStorage> {
    try {
      console.log("Saving file:", file.filename);
      const [savedFile] = await db
        .insert(fileStorage)
        .values({
          filename: file.filename,
          contentType: file.contentType,
          size: file.size,
          data: file.data,
          userId: file.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log("File saved successfully:", savedFile.id);
      return savedFile;
    } catch (error) {
      console.error("خطأ في حفظ الملف:", error);
      throw error;
    }
  }

  // الحصول على ملف بواسطة المعرف
  async getFileById(id: number): Promise<FileStorage | undefined> {
    try {
      const [file] = await db
        .select()
        .from(fileStorage)
        .where(eq(fileStorage.id, id));
      return file;
    } catch (error) {
      console.error("خطأ في جلب الملف:", error);
      return undefined;
    }
  }

  // الحصول على جميع ملفات المستخدم
  async getUserFiles(userId: number): Promise<FileStorage[]> {
    try {
      return await db
        .select()
        .from(fileStorage)
        .where(eq(fileStorage.userId, userId));
    } catch (error) {
      console.error("خطأ في جلب ملفات المستخدم:", error);
      return [];
    }
  }

  // حذف ملف
  async deleteFile(id: number): Promise<void> {
    try {
      await db
        .delete(fileStorage)
        .where(eq(fileStorage.id, id));
    } catch (error) {
      console.error("خطأ في حذف الملف:", error);
      throw error;
    }
  }

  // البحث عن العملاء
  async searchCustomers(search?: string): Promise<Customer[]> {
    try {
      if (!search) {
        return await db.select().from(customers);
      }

      const searchLower = `%${search.toLowerCase()}%`;
      return await db
        .select()
        .from(customers)
        .where(
          sql`LOWER(${customers.name}) LIKE ${searchLower} OR 
              LOWER(${customers.phone}) LIKE ${searchLower} OR 
              LOWER(${customers.email}) LIKE ${searchLower}`
        );
    } catch (error) {
      console.error("خطأ في البحث عن العملاء:", error);
      return [];
    }
  }

  // الحصول على عميل بواسطة المعرف
  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id));
      return customer;
    } catch (error) {
      console.error("خطأ في البحث عن العميل:", error);
      return undefined;
    }
  }

  // إنشاء عميل جديد
  async createCustomer(customer: InsertCustomer): Promise<Customer | null> {
    try {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          ...customer,
          createdAt: new Date(),
        })
        .returning();
      return newCustomer;
    } catch (error) {
      console.error("خطأ في إنشاء العميل:", error);
      return null;
    }
  }

  // Installments
  async getInstallments(): Promise<Installment[]> {
    try {
      return await db.select().from(installments);
    } catch (error) {
      console.error("خطأ في جلب التقسيط:", error);
      return [];
    }
  }

  async getInstallment(id: number): Promise<Installment | undefined> {
    try {
      const [installment] = await db
        .select()
        .from(installments)
        .where(eq(installments.id, id));
      return installment;
    } catch (error) {
      console.error("خطأ في جلب التقسيط:", error);
      return undefined;
    }
  }

  async createInstallment(installment: Installment): Promise<Installment> {
    try {
      const [newInstallment] = await db
        .insert(installments)
        .values(installment)
        .returning();
      return newInstallment;
    } catch (error) {
      console.error("خطأ في إنشاء التقسيط:", error);
      throw error;
    }
  }

  async updateInstallment(id: number, update: Partial<Installment>): Promise<Installment> {
    try {
      const [updatedInstallment] = await db
        .update(installments)
        .set(update)
        .where(eq(installments.id, id))
        .returning();
      return updatedInstallment;
    } catch (error) {
      console.error("خطأ في تحديث التقسيط:", error);
      throw error;
    }
  }

  // Installment Payments
  async getInstallmentPayments(installmentId: number): Promise<InstallmentPayment[]> {
    try {
      return await db
        .select()
        .from(installmentPayments)
        .where(eq(installmentPayments.installmentId, installmentId));
    } catch (error) {
      console.error("خطأ في جلب دفعات التقسيط:", error);
      return [];
    }
  }

  async createInstallmentPayment(payment: InstallmentPayment): Promise<InstallmentPayment> {
    try {
      const [newPayment] = await db
        .insert(installmentPayments)
        .values(payment)
        .returning();
      return newPayment;
    } catch (error) {
      console.error("خطأ في إنشاء دفعة التقسيط:", error);
      throw error;
    }
  }

  // Marketing Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    try {
      return await db.select().from(marketingCampaigns);
    } catch (error) {
      console.error("خطأ في جلب الحملات:", error);
      return [];
    }
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    try {
      const [campaign] = await db
        .select()
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.id, id));
      return campaign;
    } catch (error) {
      console.error("خطأ في جلب الحملة:", error);
      return undefined;
    }
  }

  async createCampaign(campaign: InsertCampaign[]): Promise<Campaign> {
    try {
      const [newCampaign] = await db
        .insert(marketingCampaigns)
        .values(campaign)
        .returning();
      return newCampaign;
    } catch (error) {
      console.error("خطأ في إنشاء الحملة:", error);
      throw error;
    }
  }

  async updateCampaign(id: number, update: Partial<Campaign>): Promise<Campaign> {
    try {
      const [updatedCampaign] = await db
        .update(marketingCampaigns)
        .set(update)
        .where(eq(marketingCampaigns.id, id))
        .returning();
      return updatedCampaign;
    } catch (error) {
      console.error("خطأ في تحديث الحملة:", error);
      throw error;
    }
  }

  // Campaign Analytics
  async getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics[]> {
    try {
      return await db
        .select()
        .from(campaignAnalytics)
        .where(eq(campaignAnalytics.campaignId, campaignId));
    } catch (error) {
      console.error("خطأ في جلب تحليلات الحملة:", error);
      return [];
    }
  }

  async createCampaignAnalytics(analytics: InsertCampaignAnalytics[]): Promise<CampaignAnalytics> {
    try {
      const [newAnalytics] = await db
        .insert(campaignAnalytics)
        .values(analytics)
        .returning();
      return newAnalytics;
    } catch (error) {
      console.error("خطأ في إنشاء تحليلات الحملة:", error);
      throw error;
    }
  }

  // Social Media Accounts
  async getSocialMediaAccounts(userId: number): Promise<SocialMediaAccount[]> {
    try {
      return await db
        .select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.userId, userId));
    } catch (error) {
      console.error("خطأ في جلب حسابات التواصل الاجتماعي:", error);
      return [];
    }
  }

  async createSocialMediaAccount(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      const [newAccount] = await db
        .insert(socialMediaAccounts)
        .values(account)
        .returning();
      return newAccount;
    } catch (error) {
      console.error("خطأ في إنشاء حساب التواصل الاجتماعي:", error);
      throw error;
    }
  }

  async deleteSocialMediaAccount(id: number): Promise<void> {
    try {
      await db
        .delete(socialMediaAccounts)
        .where(eq(socialMediaAccounts.id, id));
    } catch (error) {
      console.error("خطأ في حذف حساب التواصل الاجتماعي:", error);
      throw error;
    }
  }

  // API Keys
  async setApiKeys(userId: number, keys: Record<string, any>): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Delete existing keys
        await tx
          .delete(apiKeys)
          .where(eq(apiKeys.userId, userId));

        // Insert new keys
        const keyEntries = Object.entries(keys).map(([platform, value]) => ({
          userId,
          platform,
          keyType: 'api',
          keyValue: JSON.stringify(value),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        if (keyEntries.length > 0) {
          await tx.insert(apiKeys).values(keyEntries);
        }
      });
    } catch (error) {
      console.error("خطأ في حفظ مفاتيح API:", error);
      throw error;
    }
  }

  async getApiKeys(userId: number): Promise<Record<string, any> | null> {
    try {
      const userKeys = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId));

      if (userKeys.length === 0) return null;

      return userKeys.reduce((acc, key) => ({
        ...acc,
        [key.platform]: JSON.parse(key.keyValue)
      }), {});
    } catch (error) {
      console.error("خطأ في جلب مفاتيح API:", error);
      return null;
    }
  }

  // Inventory Transactions
  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    try {
      return await db.select().from(inventoryTransactions);
    } catch (error) {
      console.error("خطأ في جلب حركات المخزون:", error);
      return [];
    }
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    try {
      const [newTransaction] = await db
        .insert(inventoryTransactions)
        .values(transaction)
        .returning();
      return newTransaction;
    } catch (error) {
      console.error("خطأ في إنشاء حركة المخزون:", error);
      throw error;
    }
  }

  // Expenses
  async getExpenses(userId: number): Promise<Expense[]> {
    try {
      return await db
        .select()
        .from(expenses)
        .where(eq(expenses.userId, userId));
    } catch (error) {
      console.error("خطأ في جلب المصروفات:", error);
      return [];
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, id));
      return expense;
    } catch (error) {
      console.error("خطأ في جلب المصروف:", error);
      return undefined;
    }
  }

  async createExpense(expense: InsertExpense[]): Promise<Expense> {
    try {
      const [newExpense] = await db
        .insert(expenses)
        .values(expense)
        .returning();
      return newExpense;
    } catch (error) {
      console.error("خطأ في إنشاء المصروف:", error);
      throw error;
    }
  }

  async updateExpense(id: number, update: Partial<Expense>): Promise<Expense> {
    try {
      const [updatedExpense] = await db
        .update(expenses)
        .set(update)
        .where(eq(expenses.id, id))
        .returning();
      return updatedExpense;
    } catch (error) {
      console.error("خطأ في تحديث المصروف:", error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    try {
      await db
        .delete(expenses)
        .where(eq(expenses.id, id));
    } catch (error) {
      console.error("خطأ في حذف المصروف:", error);
      throw error;
    }
  }

  // Suppliers
  async getSuppliers(userId: number): Promise<Supplier[]> {
    try {
      return await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.userId, userId));
    } catch (error) {
      console.error("خطأ في جلب الموردين:", error);
      return [];
    }
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    try {
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, id));
      return supplier;
    } catch (error) {
      console.error("خطأ في جلب المورد:", error);
      return undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      const [newSupplier] = await db
        .insert(suppliers)
        .values(supplier)
        .returning();
      return newSupplier;
    } catch (error) {
      console.error("خطأ في إنشاء المورد:", error);
      throw error;
    }
  }

  async updateSupplier(id: number, update: Partial<Supplier>): Promise<Supplier> {
    try {
      const [updatedSupplier] = await db
        .update(suppliers)
        .set(update)
        .where(eq(suppliers.id, id))
        .returning();
      return updatedSupplier;
    } catch (error) {
      console.error("خطأ في تحديث المورد:", error);
      throw error;
    }
  }

  async deleteSupplier(id: number): Promise<void> {
    try {
      await db
        .delete(suppliers)
        .where(eq(suppliers.id, id));
    } catch (error) {
      console.error("خطأ في حذف المورد:", error);
      throw error;
    }
  }

  // Supplier Transactions
  async getSupplierTransactions(supplierId: number): Promise<SupplierTransaction[]> {
    try {
      return await db
        .select()
        .from(supplierTransactions)
        .where(eq(supplierTransactions.supplierId, supplierId));
    } catch (error) {
      console.error("خطأ في جلب معاملات المورد:", error);
      return [];
    }
  }

  async createSupplierTransaction(transaction: InsertSupplierTransaction[]): Promise<SupplierTransaction> {
    try {
      const [newTransaction] = await db
        .insert(supplierTransactions)
        .values(transaction)
        .returning();
      return newTransaction;
    } catch (error) {
      console.error("خطأ في إنشاء معاملة المورد:", error);
      throw error;
    }
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      console.log("Fetching all appointments");
      const results = await db
        .select()
        .from(appointments)
        .orderBy(desc(appointments.date));

      console.log(`Retrieved ${results.length} appointments`);
      return results;
    } catch (error) {
      console.error("Error in getAppointments:", error);
      return [];
    }
  }

  async getCustomerAppointments(customerId: number): Promise<Appointment[]> {
    try {
      console.log(`Fetching appointments for customer ${customerId}`);
      if (customerId === 0) {
        return this.getAppointments();
      }
      return await db
        .select()
        .from(appointments)
        .where(eq(appointments.customerId, customerId))
        .orderBy(desc(appointments.date));
    } catch (error) {
      console.error("خطأ في جلب المواعيد:", error);
      return [];
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      console.log("Creating appointment with data:", appointment);

      // Validate required fields
      if (!appointment.title || !appointment.date || !appointment.duration) {
        throw new Error("Missing required fields");
      }

      const [newAppointment] = await db
        .insert(appointments)
        .values({
          ...appointment,
          status: appointment.status || "scheduled",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log("Created appointment successfully:", newAppointment);
      return newAppointment;
    } catch (error) {
      console.error("Error in createAppointment:", error);
      throw error;
    }
  }

  async updateAppointment(id: number, update: Partial<Appointment>): Promise<Appointment> {
    try {
      console.log(`Updating appointment ${id} with data:`, update);
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          ...update,
          updatedAt: new Date()
        })
        .where(eq(appointments.id, id))
        .returning();

      console.log("Updated appointment:", updatedAppointment);
      return updatedAppointment;
    } catch (error) {
      console.error("خطأ في تحديث الموعد:", error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    try {
      console.log(`Deleting appointment ${id}`);
      await db
        .delete(appointments)
        .where(eq(appointments.id, id));
      console.log(`Successfully deleted appointment ${id}`);
    } catch (error) {
      console.error("خطأ في حذف الموعد:", error);
      throw error;
    }
  }

  // Analytics Methods
  async getAnalyticsSales(): Promise<{ date: string; amount: number; }[]> {
    try {
      const results = await db.execute(sql`
        SELECT 
          DATE(date) as date,
          SUM(CAST(price_iqd AS DECIMAL)) as amount
        FROM sales
        GROUP BY DATE(date)
        ORDER BY date DESC
        LIMIT 30
      `);

      return results.rows.map(row => ({
        date: String(row.date),
        amount: Number(row.amount)
      }));
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      return [];
    }
  }

  async getAnalyticsCustomers(): Promise<{ name: string; value: number; }[]> {
    try {
      const results = await db.execute(sql`
        SELECT 
          c.name,
          COUNT(s.id) as value
        FROM customers c
        LEFT JOIN sales s ON s.customer_id = c.id
        GROUP BY c.id, c.name
        ORDER BY value DESC
        LIMIT 10
      `);

      return results.rows.map(row => ({
        name: String(row.name),
        value: Number(row.value)
      }));
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      return [];
    }
  }

  async getAnalyticsProducts(): Promise<{ name: string; sales: number; }[]> {
    try {
      const results = await db.execute(sql`
        SELECT 
          p.name,
          SUM(s.quantity) as sales
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY sales DESC
        LIMIT 10
      `);

      return results.rows.map(row => ({
        name: String(row.name),
        sales: Number(row.sales)
      }));
    } catch (error) {
      console.error("Error fetching product analytics:", error);
      return [];
    }
  }

  // إضافة عملية إرجاع جديدة
  async createReturn(returnData: InsertReturn): Promise<Return | null> {
    try {
      console.log("Creating return with data:", returnData);

      // بدء المعاملة
      return await db.transaction(async (tx) => {
        // 1. إنشاء طلب الإرجاع
        const [savedReturn] = await tx
          .insert(returns)
          .values({
            ...returnData,
            date: new Date(),
            status: "pending"
          })
          .returning();

        if (!savedReturn) {
          throw new Error("فشل في إنشاء طلب الإرجاع");
        }

        // 2. تحديث المخزون تلقائياً
        const [inventoryUpdate] = await tx
          .insert(inventoryTransactions)
          .values({
            productId: returnData.productId,
            type: "in",
            quantity: returnData.quantity,
            reason: "return",
            reference: `return_${savedReturn.id}`,
            date: new Date(),
            userId: returnData.userId,
            notes: `Return #${savedReturn.id} - ${returnData.reason}`
          })
          .returning();

        if (!inventoryUpdate) {
          throw new Error("فشل في تحديث المخزون");
        }

        // 3. إنشاء أول حالة في تاريخ التتبع
        const [statusHistory] = await tx
          .insert(returnStatusHistory)
          .values({
            returnId: savedReturn.id,
            status: "pending",
            userId: returnData.userId,
            notes: "تم إنشاء طلب الإرجاع",
            date: new Date()
          })
          .returning();

        if (!statusHistory) {
          throw new Error("فشل في إنشاء تاريخ الحالة");
        }

        return savedReturn;
      });
    } catch (error) {
      console.error("خطأ في إنشاء عملية الإرجاع:", error);
      return null;
    }
  }

  // الحصول على عمليات الإرجاع للمستخدم
  async getReturns(userId: number): Promise<Return[]> {
    try {
      return await db
        .select()
        .from(returns)
        .where(eq(returns.userId, userId))
        .orderBy(desc(returns.date));
    } catch (error) {
      console.error("خطأ في جلب عمليات الإرجاع:", error);
      return [];
    }
  }

  // تحديث حالة عملية الإرجاع
  async updateReturnStatus(
    id: number, 
    status: string, 
    processedBy: number,
    notes?: string
  ): Promise<Return | null> {
    try {
      return await db.transaction(async (tx) => {
        // 1. تحديث حالة المرتجع
        const [updatedReturn] = await tx
          .update(returns)
          .set({
            status,
            processedBy,
            updatedAt: new Date()
          })
          .where(eq(returns.id, id))
          .returning();

        if (!updatedReturn) {
          throw new Error("فشل في تحديث حالة الإرجاع");
        }

        // 2. إضافة إلى تاريخ التتبع
        const [statusHistory] = await tx
          .insert(returnStatusHistory)
          .values({
            returnId: id,
            status,
            userId: processedBy,
            notes: notes || `تم تحديث الحالة إلى ${status}`,
            date: new Date()
          })
          .returning();

        if (!statusHistory) {
          throw new Error("فشل في تحديث تاريخ الحالة");
        }

        return updatedReturn;
      });
    } catch (error) {
      console.error("خطأ في تحديث حالة الإرجاع:", error);
      return null;
    }
  }

  // الحصول على تاريخ حالات المرتجع
  async getReturnStatusHistory(returnId: number): Promise<ReturnStatusHistory[]> {
    try {
      return await db
        .select()
        .from(returnStatusHistory)
        .where(eq(returnStatusHistory.returnId, returnId))
        .orderBy(desc(returnStatusHistory.date));
    } catch (error) {
      console.error("خطأ في جلب تاريخ حالات المرتجع:", error);
      return [];
    }
  }
}

export const dbStorage = new DatabaseStorage();