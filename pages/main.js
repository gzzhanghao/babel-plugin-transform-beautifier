/* eslint-env browser */
/* global Babel */
/* eslint-disable import/no-unresolved, import/extensions */

import prettier from 'https://unpkg.com/prettier@2.8.4/esm/standalone.mjs';
import parserBabel from 'https://unpkg.com/prettier@2.8.4/esm/parser-babel.mjs';

import beautifierPlugin from './plugin.mjs';

const input = document.getElementById('input');
const output = document.getElementById('output');

function formatInput() {
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
}

input.value = 'var Ju=xe((E0,Uu)=>{var Gu=pt(),Kr=Ru(),$u=Gu.process,Vu=Gu.Deno,Wu=$u&&$u.versions||Vu&&Vu.version,Hu=Wu&&Wu.v8,dt,fr;Hu&&(dt=Hu.split("."),fr=dt[0]>0&&dt[0]<4?1:+(dt[0]+dt[1]));!fr&&Kr&&(dt=Kr.match(/Edge\\/(\\d+)/),(!dt||dt[1]>=74)&&(dt=Kr.match(/Chrome\\/(\\d+)/),dt&&(fr=+dt[1])));Uu.exports=fr});';
formatInput();

input.addEventListener('input', formatInput);
