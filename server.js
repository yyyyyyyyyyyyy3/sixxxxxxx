const Koa = require('koa');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const Router = require('@koa/router');
const { Resend } = require('resend');
const path = require('path');
require('dotenv').config();

const app = new Koa();
const router = new Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 3000;

app.use(bodyParser());

// Роздача статики з папки public/
app.use(serve(path.join(__dirname, 'public')));

// Ендпоінт POST /api/contact
router.post('/api/contact', async (ctx) => {
    const { name, email, subject, message } = ctx.request.body;

    // Валідація
    if (!name || name.trim().length < 2) {
        ctx.status = 400;
        ctx.body = { error: "Ім'я обов'язкове (мінімум 2 символи)" };
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        ctx.status = 400;
        ctx.body = { error: "Введіть коректну e-mail адресу" };
        return;
    }

    if (!message || message.trim().length < 10) {
        ctx.status = 400;
        ctx.body = { error: "Повідомлення має містити хоча б 10 символів" };
        return;
    }

    const emailSubject = subject && subject.trim() !== "" ? subject : `Нове повідомлення від ${name}`;

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'vitaliimospan@gmail.com',
            subject: emailSubject,
            html: `
                <h3>Нове повідомлення з форми резюме</h3>
                <p><strong>Ім'я:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Повідомлення:</strong></p>
                <p>${message}</p>
            `
        });

        ctx.status = 200;
        ctx.body = { success: true, message: "Лист успішно надіслано!" };
    } catch (error) {
        console.error("Resend Error:", error);
        ctx.status = 500;
        ctx.body = { error: "Помилка при відправці пошти через сервіс" };
    }
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
    console.log(`🚀 Локальний сервер запущено: http://localhost:${PORT}`);
});