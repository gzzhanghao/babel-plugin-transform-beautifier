/* eslint-env browser */
/* global Babel */
/* eslint-disable import/no-unresolved, import/extensions */

import prettier from 'https://unpkg.com/prettier@2.8.4/esm/standalone.mjs';
import parserBabel from 'https://unpkg.com/prettier@2.8.4/esm/parser-babel.mjs';

import beautifierPlugin from './plugin.mjs';

const DEFAULT_INPUT = 'import prettier from"https://unpkg.com/prettier@2.8.4/esm/standalone.mjs";import parserBabel from"https://unpkg.com/prettier@2.8.4/esm/parser-babel.mjs";import beautifierPlugin from"./plugin.mjs";const input=document.getElementById("input"),output=document.getElementById("output");input.addEventListener("input",()=>{try{const t=Babel.transform(input.value,{plugins:[beautifierPlugin]}),e=prettier.format(t.code,{parser:"babel",plugins:[parserBabel],singleQuote:!0});output.value=e}catch(t){}});';

const input = document.getElementById('input');
const output = document.getElementById('output');

input.value = DEFAULT_INPUT;

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
