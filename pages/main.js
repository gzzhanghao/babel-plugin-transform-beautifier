/* global Babel */

import * as prettierPluginBabel from 'https://unpkg.com/prettier@3.5.1/plugins/babel.mjs';
import * as prettierPluginEstree from 'https://unpkg.com/prettier@3.5.1/plugins/estree.mjs';
import * as prettier from 'https://unpkg.com/prettier@3.5.1/standalone.mjs';

import beautifierPlugin from './plugin.js';

const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');

async function formatInput() {
  const babelRes = Babel.transform(inputEl.value, {
    plugins: [beautifierPlugin],
  });

  outputEl.value = await prettier.format(babelRes.code, {
    parser: 'babel',
    plugins: [prettierPluginBabel, prettierPluginEstree],
    singleQuote: true,
  });
}

inputEl.value =
  'var Ju=xe((E0,Uu)=>{var Gu=pt(),Kr=Ru(),$u=Gu.process,Vu=Gu.Deno,Wu=$u&&$u.versions||Vu&&Vu.version,Hu=Wu&&Wu.v8,dt,fr;Hu&&(dt=Hu.split("."),fr=dt[0]>0&&dt[0]<4?1:+(dt[0]+dt[1]));!fr&&Kr&&(dt=Kr.match(/Edge\\/(\\d+)/),(!dt||dt[1]>=74)&&(dt=Kr.match(/Chrome\\/(\\d+)/),dt&&(fr=+dt[1])));Uu.exports=fr});';
formatInput();

inputEl.addEventListener('input', formatInput);
