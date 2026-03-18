import PaymentMethod from "../models/paymentMethod.js";

const assertCanManagePaymentMethod = (paymentMethod, user) => {
  const ownerId =
    typeof paymentMethod.user === "object" && paymentMethod.user !== null
      ? paymentMethod.user._id?.toString()
      : paymentMethod.user?.toString();
  const isOwner = ownerId === user.userId;
  if (!isOwner && user.role !== "admin") {
    const error = new Error("You are not allowed to modify this payment method");
    error.statusCode = 403;
    throw error;
  }
};

async function getPaymentMethods(req, res, next) {
  try {
    const paymentMethods = await PaymentMethod.find({
      isActive: true,
    }).populate("user");
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
}

async function getPaymentMethodById(req, res, next) {
  try {
    const id = req.params.id;
    const paymentMethod = await PaymentMethod.findById(id).populate("user");
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    assertCanManagePaymentMethod(paymentMethod, req.user);
    res.json(paymentMethod);
  } catch (error) {
    next(error);
  }
}

async function getPaymentMethodsByUser(req, res, next) {
  try {
    const userId = req.user.userId;
    const paymentMethods = await PaymentMethod.find({
      user: userId,
      isActive: true,
    }).populate("user");

    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
}

async function createPaymentMethod(req, res, next) {
  try {
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault = false,
    } = req.body;

    const allowedTypes = ["credit_card", "debit_card", "paypal", "bank_transfer"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid payment method type" });
    }

    if (type === "credit_card" || type === "debit_card") {
      if (!cardNumber || !cardHolderName || !expiryDate) {
        return res.status(400).json({
          error: "Card number, card holder name, and expiry date are required for card payments",
        });
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        return res.status(400).json({ error: "Expiry date must be in MM/YY format" });
      }
    } else if (type === "paypal") {
      if (!paypalEmail) {
        return res.status(400).json({ error: "PayPal email is required for PayPal payments" });
      }
    } else if (type === "bank_transfer") {
      if (!bankName || !accountNumber) {
        return res.status(400).json({
          error: "Bank name and account number are required for bank transfers",
        });
      }
    }

    const userId = req.user.userId;

    // Si se marca como default, desmarcar otros métodos default del usuario
    if (isDefault) {
      await PaymentMethod.updateMany({ user: userId, isDefault: true }, { isDefault: false });
    }

    const newPaymentMethod = await PaymentMethod.create({
      user: userId,
      type,
      cardNumber: type === "credit_card" || type === "debit_card" ? cardNumber : undefined,
      cardHolderName: type === "credit_card" || type === "debit_card" ? cardHolderName : undefined,
      expiryDate: type === "credit_card" || type === "debit_card" ? expiryDate : undefined,
      paypalEmail: type === "paypal" ? paypalEmail : undefined,
      bankName: type === "bank_transfer" ? bankName : undefined,
      accountNumber: type === "bank_transfer" ? accountNumber : undefined,
      isDefault: Boolean(isDefault),
      isActive: true,
    });

    await newPaymentMethod.populate("user");
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function updatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    assertCanManagePaymentMethod(paymentMethod, req.user);

    // Campos permitidos para actualizar
    const allowedFields = [
      "cardHolderName",
      "expiryDate",
      "paypalEmail",
      "bankName",
      "accountNumber",
      "isDefault",
      "isActive",
    ];
    const filteredUpdate = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }

    // Validar que al menos un campo sea proporcionado
    if (Object.keys(filteredUpdate).length === 0) {
      return res.status(400).json({
        message: "At least one field must be provided for update",
      });
    }

    // Validaciones específicas según el tipo
    if (paymentMethod.type === "credit_card" || paymentMethod.type === "debit_card") {
      if (
        filteredUpdate.expiryDate &&
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(filteredUpdate.expiryDate)
      ) {
        return res.status(400).json({ error: "Expiry date must be in MM/YY format" });
      }
    } else if (paymentMethod.type === "paypal") {
      if (
        filteredUpdate.paypalEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filteredUpdate.paypalEmail)
      ) {
        return res.status(400).json({ error: "Invalid PayPal email format" });
      }
    }

    // Si se marca como default, desmarcar otros métodos default del usuario
    if (filteredUpdate.isDefault === true) {
      await PaymentMethod.updateMany(
        { user: paymentMethod.user, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(id, filteredUpdate, {
      new: true,
    }).populate("user");

    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function setDefaultPaymentMethod(req, res, next) {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    assertCanManagePaymentMethod(paymentMethod, req.user);

    if (!paymentMethod.isActive) {
      return res.status(400).json({ message: "Cannot set inactive payment method as default" });
    }

    // Desmarcar otros métodos default del usuario
    await PaymentMethod.updateMany(
      { user: paymentMethod.user, isDefault: true },
      { isDefault: false }
    );

    // Marcar este como default
    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { isDefault: true },
      { new: true }
    ).populate("user");

    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function deactivatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    assertCanManagePaymentMethod(paymentMethod, req.user);

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { isActive: false, isDefault: false },
      { new: true }
    ).populate("user");

    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function deletePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    assertCanManagePaymentMethod(paymentMethod, req.user);

    await paymentMethod.deleteOne();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getDefaultPaymentMethod(req, res, next) {
  try {
    const userId = req.user.userId;
    const defaultPaymentMethod = await PaymentMethod.findOne({
      user: userId,
      isDefault: true,
      isActive: true,
    }).populate("user");

    res.json(defaultPaymentMethod || null);
  } catch (error) {
    next(error);
  }
}

export {
    createPaymentMethod,
    deactivatePaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
    getPaymentMethodById,
    getPaymentMethods,
    getPaymentMethodsByUser,
    setDefaultPaymentMethod,
    updatePaymentMethod
};

