
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => (req: any, res: any, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (e: any) {
        return res.status(400).json({ error: e.errors });
    }
};

// --- СХЕМЫ ---

export const FoodLogSchema = z.object({
    food: z.object({
        name: z.string().min(1),
        calories: z.number().nonnegative(),
        protein: z.number().nonnegative().optional(),
        fats: z.number().nonnegative().optional(),
        carbs: z.number().nonnegative().optional(),
        weight_g: z.number().positive().optional(),
        grade: z.enum(['A', 'B', 'C', 'D']).optional()
    }),
    is_image: z.boolean().optional()
});

export const WaterSchema = z.object({
    amount: z.number().int() // Removed .positive() to allow subtraction
});

export const WeightSchema = z.object({
    amount: z.number() // Может быть отрицательным (корректировка)
});

export const GoalSchema = z.object({
    calories: z.number().min(500).max(10000)
});

export const AIChatSchema = z.object({
    message: z.string().min(1),
    history: z.array(z.object({
        role: z.string(),
        content: z.string()
    })).optional()
});

export const AIAnalyzeFoodSchema = z.object({
    imageBase64: z.string().optional(),
    textDescription: z.string().optional()
}).refine(data => data.imageBase64 || data.textDescription, {
    message: "Either imageBase64 or textDescription is required"
});
