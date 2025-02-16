import * as babel from '@babel/core';
import deindent from 'deindent';

import beautifier from '../src';

function format(str: string) {
  return deindent(str).trim();
}

function t(name: string, input: string) {
  it(name, () => {
    const res = babel.transformSync(format(input), {
      filename: `${name}.js`,
      sourceType: 'unambiguous',
      plugins: [beautifier],
      configFile: false,
    });
    expect(res.code).toMatchSnapshot();
  });
}

describe('beautifier', () => {
  t('declaration', 'var a, b = 1');
  t('declaration full', 'var a = 1, b = 2, c = 3');
  t('declaration empty', 'var a, b, c');
  t('declaration in for', 'for (var a = 1, b = 2;;);');

  t('conditional', 'a ? b : c');
  t('conditional return', '() => { return a ? b : c }');
  t('conditional assign', 'a = b ? c : d');
  t('conditional deep', 'a(b ? c : d)');

  t('for stmt', 'for (;;);');
  t('for block', 'for (;;) {}');

  t('seq', 'a, b, c');
  t('seq return', '() => { return a, b, c }');
  t('seq deep', 'a((b, c, d))');

  t('logical and', 'a && b');
  t('logical or', 'a || b');
  t('logical deep', 'if (a && b);');

  t('unary true', '!0');
  t('unary false', '!1');
  t('unary undefined', 'void 0');
  t('unary void', 'void x()');
  t('unary void return', '() => { return void x() }');
  t('unary void deep', 'a(void b())');

  t('if block', 'if (x) {}');
  t('if else block', 'if (x) {} else {}');
  t('if else logical', 'if (x); else a && b');
  t('if else conditional', 'if (x); else a ? b : c');
  t('if else conditional assign', 'if (x); else a = b ? c : d');
  t('if else conditional assign complex', 'if (x); else a().v = b ? c : d');

  t('template literal', '"a".concat(b).concat(c)');
  t('template literal with tail', '"a".concat(b).concat("c")');
  t('template literal with string', '"a".concat("b").concat("c")');

  t('#3-1', '({ a: async function() { await 0; } })');
  t('#3-2', 'new ({ a: function() {} }).a()');
  t('#3-3', 'export var a, b = 1;');
  t('#3-4', 'for (let i = 0, j; i < 3; i++);');
  t('#3-5', 'let undefined = 1; console.log(void 0);');
  t('#3-6', 'a().b = c() ? d() : e(); // a, c, d');
});
