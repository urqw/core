import test from 'ava';
import ConsoleClient from "../src/clients/ConsoleClient"

test('set string value, get string value, btn', (t) => {
    const fixture = `
    :init
    тест="строка"
    pln #тест$
    btn #тест$, тест кнопки
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text.length, 1);
    t.is(client.text[0].text, "строка");

    t.is(client.buttons.length, 1);
    t.is(client.buttons[0].desc, "тест кнопки");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "строка");
});

test('set number value, get number value, btn', (t) => {
    const fixture = `
    :init
    тест=0.5
    тест2=тест+1
    pln #тест2$
    btn #тест2$, тест кнопки
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text.length, 1);
    t.is(client.text[0].text, "1.5");

    t.is(client.buttons.length, 1);
    t.is(client.buttons[0].desc, "тест кнопки");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "1.5");
});

test('if then, & in if', (t) => {
    const fixture = `
    :init
    Пятачок=1
    if Пятачок=1 then p Из дверей вышел поросёнок - друг медвежонка.&btn 26, Осмотреть Пятачка&btn 27, Поговорить с Пятачком
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text.length, 1);
    t.is(client.text[0].text, "Из дверей вышел поросёнок - друг медвежонка.");

    t.is(client.buttons.length, 2);
    t.is(client.buttons[0].desc, "Осмотреть Пятачка");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "26");
    t.is(client.buttons[1].desc, "Поговорить с Пятачком");
    t.is(client.buttons[1].id, 1);
    t.is(client.buttons[1].command, "27");
});

test('if then else, & in else', (t) => {
    const fixture = `
    :init
    Пятачок=1
    if Пятачок=0 then p Ничего. else p Из дверей вышел поросёнок - друг медвежонка.&btn 26, Осмотреть Пятачка&btn 27, Поговорить с Пятачком
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text[0].text, "Из дверей вышел поросёнок - друг медвежонка.");
    t.is(client.buttons[0].desc, "Осмотреть Пятачка");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "26");
    t.is(client.buttons[1].desc, "Поговорить с Пятачком");
    t.is(client.buttons[1].id, 1);
    t.is(client.buttons[1].command, "27");
});

