/* eslint-env browser */
/* global Babel */
/* eslint-disable import/no-unresolved, import/extensions */

import prettier from 'https://unpkg.com/prettier@2.8.4/esm/standalone.mjs';
import parserBabel from 'https://unpkg.com/prettier@2.8.4/esm/parser-babel.mjs';

import beautifierPlugin from './plugin.mjs';

const input = document.getElementById('input');
const output = document.getElementById('output');

input.addEventListener('input', () => {
  try {
    const babelRes = Babel.transform(input.value, {
      plugins: [
        beautifierPlugin,
      ],
    });

    const prettierRes = prettier.format(babelRes.code, {
      parser: 'babel',
      plugins: [parserBabel],
      singleQuote: true,
    });

    output.value = prettierRes;
  } catch (error) {
    // noop
  }
});
