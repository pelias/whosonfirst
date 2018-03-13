const tape = require('tape');
const wofIdToPath = require('../../src/wofIdToPath');

tape('wofIdToPath', (t) => {
  t.test('invalid path', (t) => {
    t.deepEqual(wofIdToPath(''), [], 'should be empty');
    t.end();
  });
  t.test('9 digit string', (t) => {
    t.deepEqual(wofIdToPath('123456789'), ['123', '456', '789']);
    t.end();
  });
  t.test('9 digit integer', (t) => {
    t.deepEqual(wofIdToPath(123456789), ['123', '456', '789']);
    t.end();
  });
  t.test('10 digit string', (t) => {
    t.deepEqual(wofIdToPath('1234567890'), ['123', '456', '789', '0']);
    t.end();
  });
  t.test('10 digit integer', (t) => {
    t.deepEqual(wofIdToPath(1234567890), ['123', '456', '789', '0']);
    t.end();
  });
  t.test('1 digit string', (t) => {
    t.deepEqual(wofIdToPath('1'), ['1']);
    t.end();
  });
  t.test('1 digit integer', (t) => {
    t.deepEqual(wofIdToPath(1), ['1']);
    t.end();
  });
  t.test('0 string', (t) => {
    t.deepEqual(wofIdToPath('0'), ['0']);
    t.end();
  });
  t.test('0 integer', (t) => {
    t.deepEqual(wofIdToPath(0), ['0']);
    t.end();
  });
});
