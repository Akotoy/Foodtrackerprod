
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 200, // Лимит 200 запросов с одного IP
    message: { error: "Too many requests, please try again later." }
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 20, // 20 запросов к AI в час
    message: { error: "AI request limit reached. Please wait." }
});
