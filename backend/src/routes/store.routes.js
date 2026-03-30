const express = require("express");
const prisma = require("../config/db");
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    return res.status(200).json({ success: true, store });
  } catch (error) {
    console.error("[GetStoreById Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
