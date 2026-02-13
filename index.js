const { Telegraf, session, Markup } = require('telegraf');
const fs = require('fs');

// Tokeni Heroku panelindən təyin edəcəyik
const BOT_TOKEN = process.env.BOT_TOKEN; 
const DATA_FILE = 'data.json';

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const mainKeyboard = Markup.keyboard([['🚗 Maşın əlavə et']]).resize();

bot.start((ctx) => ctx.reply('Xoş gəlmisiniz! Maşın əlavə etmək üçün düyməyə basın.', mainKeyboard));

bot.hears('🚗 Maşın əlavə et', (ctx) => {
    ctx.session = { step: 'brand' };
    ctx.reply('Maşın markasını daxil edin:');
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const step = ctx.session?.step;

    if (step) {
        if (step === 'brand') {
            ctx.session.brand = text;
            ctx.session.step = 'plate';
            return ctx.reply('Dövlət qeydiyyat nişanını daxil edin:');
        } else if (step === 'plate') {
            ctx.session.plate = text.toUpperCase();
            ctx.session.step = 'phone';
            return ctx.reply('Sürücünün mobil nömrəsini daxil edin:');
        } else if (step === 'phone') {
            ctx.session.phone = text;
            ctx.session.step = 'warehouse';
            return ctx.reply('Anbar nömrəsini daxil edin:');
        } else if (step === 'warehouse') {
            const data = JSON.parse(fs.readFileSync(DATA_FILE));
            data.push({
                brand: ctx.session.brand,
                plate: ctx.session.plate,
                phone: ctx.session.phone,
                warehouse: text
            });
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            ctx.session = {};
            return ctx.reply('Məlumatlar uğurla yadda saxlanıldı!', mainKeyboard);
        }
    }

    const db = JSON.parse(fs.readFileSync(DATA_FILE));
    const warehouseCars = db.filter(c => c.warehouse === text);
    if (warehouseCars.length > 0) {
        let res = `📦 Anbar ${text}:\n` + warehouseCars.map(c => `- ${c.brand}: ${c.plate}`).join('\n');
        return ctx.reply(res);
    }

    const car = db.find(c => c.plate === text.toUpperCase() || c.phone === text);
    if (car) return ctx.reply(`🚗 ${car.brand}\n🔢 ${car.plate}\n📞 ${car.phone}\n🏠 Anbar: ${car.warehouse}`);

    if(!step) ctx.reply('Məlumat tapılmadı.');
});

// Heroku üçün lazım olan boş port dinləyicisi
bot.launch();
console.log("Bot start olundu...");
