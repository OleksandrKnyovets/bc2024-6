const { program: prog } = require('commander');     //імпортуємо Commander для роботи з командним рядком
const fs = require('fs');                                                  //для роботи з файловою системою
const path = require('path');                                              //для роботи з шляхами
const express = require('express');                                        //для створення сервера
const multer = require('multer');                                          //для обробки multipart/form-data

// Налаштовуємо параметри командного рядка для хосту, порту та папки кешу
prog
    .option('-h, --host <type>', 'server address')          
    .option('-p, --port <number>', 'server port')           
    .option('-c, --cache <path>', 'cache directory');    
prog.parse(process.argv);  //парсимо аргументи командного рядка

//Отримуємо значення параметрів командного рядка
const { host, port, cache } = prog.opts();

//Ініціалізуємо Express додаток
const app = express();
app.use(express.json());  //Для обробки JSON запитів
app.use(express.urlencoded({ extended: true }));  //Для обробки URL-encoded запитів

//Налаштовуємо multer для обробки тільки текстових полів
const upload = multer();  //Не використовуємо файли, тільки текстові поля

//Функція для формування шляху до нотатки
function getNotePath(name) {
    return path.join(cache, `${name}.txt`);  //Шлях до файлу з нотаткою
}

//Обробка GET-запиту для отримання нотатки
app.get('/notes/:name', (req, res) => {
    const filePath = getNotePath(req.params.name);  //формуємо шлях до файлу
    if (!fs.existsSync(filePath)) return res.status(404).send('Не знайдено');  //перевіряємо наявність файлу
    const noteText = fs.readFileSync(filePath, 'utf8');  //читаємо файл
    res.send(noteText);  //відправляємо текст нотатки у відповідь
});

//обробка PUT-запиту для оновлення нотатки
app.use(express.text());
app.put('/notes/:name', (req, res) => {
    const filePath = getNotePath(req.params.name);                              //Формуємо шлях до файлу
    if (!fs.existsSync(filePath)) return res.status(404).send('Не знайдено');   //Перевіряємо наявність файлу
    console.log(req.body);                                                      //логуємо вміст тіла запиту
    if (!req.body) return res.status(400).send('Відсутній текст нотатки');
    fs.writeFileSync(filePath, req.body);                                       //Записуємо новий текст у файл
    res.send('Нотатка оновлена');                                               //Відправляємо підтвердження
});

//обробка DELETE-запиту для видалення нотатки
app.delete('/notes/:name', (req, res) => {
    const filePath = getNotePath(req.params.name);  // Формуємо шлях до файлу
    if (!fs.existsSync(filePath)) return res.status(404).send('Не знайдено');  // Перевіряємо наявність файлу
    fs.unlinkSync(filePath);  // Видаляємо файл
    res.send('Нотатка видалена');  // Відправляємо підтвердження
});

//обробка GET-запиту для отримання списку всіх нотаток
app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(cache).map(file => {  // Читаємо всі файли в папці кешу
        const name = path.parse(file).name;                             // Отримуємо ім'я файлу без розширення
        const text = fs.readFileSync(path.join(cache, file), 'utf8');   // Читаємо вміст файлу
        return { name, text };  // Повертаємо об'єкт з ім'ям та текстом нотатки
    });
    res.json(notes);  // Відправляємо список нотаток у форматі JSON
});

//обробка POST-запиту для створення нової нотатки
app.post('/write', upload.none(), (req, res) => {  //Використовуємо multer для обробки текстових полів
    const noteName = req.body.note_name;    //Отримуємо назву нотатки з тіла запиту
    const noteText = req.body.note;         //Отримуємо текст нотатки з тіла запиту

    if (!noteName || !noteText) {  //Перевіряємо на наявність усіх необхідних полів
        return res.status(400).send('Відсутня назва або текст примітки');  //Відправляємо помилку, якщо якихось полів не вистачає
    }

    const filePath = getNotePath(noteName);  //Формуємо шлях до файлу

    if (fs.existsSync(filePath)) return res.status(400).send('Нотатка вже існує');  //Перевіряємо, чи не існує вже така нотатка
    
    fs.writeFileSync(filePath, noteText);  //записуємо нову нотатку у файл
    res.status(201).send('Нотатка створена');  //відправляємо підтвердження
});

//підгрузка HTML-форми для створення нотатки
app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));  // Відправляємо HTML форму
});


app.listen(port, host, () => {
    console.log(`Сервер працює на http://${host}:${port}/UploadForm.html`);  // Виводимо повідомлення про запуск сервера
});
