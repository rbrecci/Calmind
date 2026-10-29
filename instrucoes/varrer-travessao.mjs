// Varre os arquivos que ESTA frente criou ou alterou atras dos tres caracteres proibidos
// (U+2014, U+2013 e U+2212). Uso, na raiz do repositorio: node instrucoes/varrer-travessao.mjs
// Saida: "LIMPO" com exit 0, ou a lista arquivo:linha com exit 1. Exit 2 e falha da propria varredura.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'origin/main';
const PROIBIDOS = new RegExp(`[${[0x2014, 0x2013, 0x2212].map((codigo) => String.fromCharCode(codigo)).join('')}]`);
const TEXTO = /\.(md|php|ts|tsx|js|mjs|json|html|css|sql|ps1|txt|yml|yaml|blade\.php)$/i;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
}

try {
  const arquivos = new Set([
    ...git(['diff', '--name-only', '--diff-filter=AM', BASE]),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ]);

  const achados = [];
  for (const arquivo of arquivos) {
    if (!TEXTO.test(arquivo) || !existsSync(arquivo)) continue;
    readFileSync(arquivo, 'utf8').split(/\r?\n/).forEach((linha, i) => {
      if (PROIBIDOS.test(linha)) achados.push(`${arquivo}:${i + 1}: ${linha.trim().slice(0, 100)}`);
    });
  }

  if (achados.length === 0) {
    console.log(`LIMPO (${arquivos.size} arquivos conferidos contra ${BASE})`);
    process.exit(0);
  }
  console.log(achados.join('\n'));
  console.log(`ACHOU ${achados.length} linha(s). Reescreva a frase, nao troque so o caractere.`);
  process.exit(1);
} catch (erro) {
  console.error(`A varredura quebrou: ${erro.message}`);
  process.exit(2);
}
