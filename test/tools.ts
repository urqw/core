import test from 'ava';
import {dosColorToHex} from '../src/tools';

test('dosColorToHex', (t) => {
    t.is(dosColorToHex(1), '#0000AA', 'shows proper color in 0..15 range');
    t.is(dosColorToHex(17), '#0000AA', 'shows proper color when above 15');
    t.is(dosColorToHex(NaN), '#000000', 'defaults to black');
});
