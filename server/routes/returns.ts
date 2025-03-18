import { Router } from "express";
import { dbStorage } from "../db-storage";
import { insertReturnSchema } from "@shared/schema";
import { upload } from "../middleware/upload";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// الحصول على جميع المرتجعات
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const returns = await dbStorage.getReturns(req.user!.id);
    res.json(returns);
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المرتجعات" });
  }
});

// إنشاء مرتجع جديد
router.post("/", isAuthenticated, upload.array("attachments"), async (req, res) => {
  try {
    const data = {
      ...req.body,
      userId: req.user!.id,
      attachments: (req.files as Express.Multer.File[])?.map(file => file.filename) || [],
    };

    const validatedData = insertReturnSchema.parse(data);
    const newReturn = await dbStorage.createReturn(validatedData);

    if (!newReturn) {
      return res.status(400).json({ message: "فشل في إنشاء طلب الإرجاع" });
    }

    res.status(201).json(newReturn);
  } catch (error) {
    console.error("Error creating return:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب الإرجاع" });
  }
});

// تحديث حالة المرتجع (للمسؤولين فقط)
router.patch("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const updatedReturn = await dbStorage.updateReturnStatus(
      Number(id),
      status,
      req.user!.id
    );

    if (!updatedReturn) {
      return res.status(404).json({ message: "لم يتم العثور على طلب الإرجاع" });
    }

    res.json(updatedReturn);
  } catch (error) {
    console.error("Error updating return status:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة طلب الإرجاع" });
  }
});

export default router;
