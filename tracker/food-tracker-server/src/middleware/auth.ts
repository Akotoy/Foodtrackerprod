
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export const authMiddleware = (req: any, res: any, next: NextFunction) => {
    // 1. Получаем заголовок Authorization
    const authHeader = req.headers.authorization;
    
    // DEV MODE BYPASS (УДАЛИТЬ В ПРОДАКШЕНЕ ЕСЛИ НУЖНА СТРОГАЯ ЗАЩИТА)
    // Позволяет тестировать локально через Postman, передавая "test-id" в заголовке
    if (process.env.NODE_ENV === 'development' && authHeader?.startsWith('test-')) {
        const testId = Number(authHeader.replace('test-', ''));
        if (!isNaN(testId)) {
            req.user = { id: testId, first_name: 'TestUser' };
            return next();
        }
    }

    if (!authHeader || !authHeader.startsWith('tma ')) {
        return res.status(401).json({ error: 'Unauthorized: No TMA header' });
    }

    const initData = authHeader.slice(4); // Убираем "tma "

    try {
        // 2. Парсим строку initData
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        if (!hash) throw new Error('No hash found');

        // 3. Сортируем ключи для валидации
        const dataCheckString = Array.from(urlParams.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // 4. Проверяем подпись (HMAC-SHA256)
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (calculatedHash !== hash) {
            return res.status(403).json({ error: 'Forbidden: Hash mismatch' });
        }

        // 5. Проверяем срок действия (24 часа)
        const authDate = Number(urlParams.get('auth_date'));
        if ((Date.now() / 1000) - authDate > 86400) {
            return res.status(401).json({ error: 'Unauthorized: Session expired' });
        }

        // 6. Достаем данные пользователя
        const userStr = urlParams.get('user');
        if (!userStr) throw new Error('No user data');
        
        const user = JSON.parse(userStr);
        req.user = {
            id: user.id,
            first_name: user.first_name,
            username: user.username,
            language_code: user.language_code
        };

        next();
    } catch (e) {
        console.error("Auth Error:", e);
        return res.status(401).json({ error: 'Unauthorized: Invalid initData' });
    }
};
