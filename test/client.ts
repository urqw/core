import test from 'ava';
import ConsoleClient from "../src/clients/ConsoleClient"

test('instr set value', (t) => {
    const fixture = `
    :init
    instr тест=выфаячмсям
    pln #тест$
    btn выфв, тест кнопки
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text[0].text, "выфаячмсям");
    t.is(client.buttons[0].desc, "тест кнопки");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "выфв");
});

test('if then', (t) => {
    const fixture = `
    :init
    Пятачок=1
    if Пятачок=1 then p Из дверей вышел поросёнок - друг медвежонка.#$&btn 26, Осмотреть Пятачка&btn 27, Поговорить с Пятачком
    end
    `;

    const client = ConsoleClient.createGame('test', fixture);

    t.is(client.text[0].text, "Из дверей вышел поросёнок - друг медвежонка. ");
    t.is(client.buttons[0].desc, "Осмотреть Пятачка");
    t.is(client.buttons[0].id, 0);
    t.is(client.buttons[0].command, "26");
    t.is(client.buttons[1].desc, "Поговорить с Пятачком");
    t.is(client.buttons[1].id, 1);
    t.is(client.buttons[1].command, "27");
});
