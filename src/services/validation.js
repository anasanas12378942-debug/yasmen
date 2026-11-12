const { z } = require("zod");

const optionalText = schema => z.preprocess(
  value => typeof value === "string" && !value.trim() ? undefined : value,
  schema.optional()
);

const registerSchema = z.object({
  method: z.enum(["phone", "email"]),
  phone: optionalText(z.string().trim().min(7).max(20)),
  email: optionalText(z.string().trim().email().max(254)),
  identityNumber: z.string().trim().min(5).max(30),
  inviteCode: optionalText(z.string().trim().min(4).max(30)),
  password: z.string().min(12).max(72),
  confirmPassword: z.string().min(12).max(72)
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "كلمتا المرور غير متطابقتين"
    });
  }

  if (data.method === "phone" && !data.phone) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "رقم الهاتف مطلوب"
    });
  }

  if (data.method === "email" && !data.email) {
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: "البريد الإلكتروني مطلوب"
    });
  }
});

const loginSchema = z.object({
  identifier: z.string().trim().min(5).max(254),
  password: z.string().min(1).max(72)
});

const depositSchema = z.object({
  amount: z.number().finite().positive().max(1000000)
});

const withdrawalSchema = z.object({
  amount: z.number().finite().min(100).max(1000000)
});

module.exports = {
  registerSchema,
  loginSchema,
  depositSchema,
  withdrawalSchema
};
