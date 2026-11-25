# Gera as ilustracoes do app em SVG, no estilo do logo: muda, folhas e mao, verde-salvia e lilas
# suaves sobre fundo claro, sem contorno pesado e sem texto. Rodar: python gerar.py
# O PNG do app (app/assets/images/illustrations) sai de cada SVG renderizado no navegador com fundo
# transparente, no dobro do tamanho (720 x 520).
from pathlib import Path

AQUI = Path(__file__).parent

# Cores tiradas do logo (lilas no alto, menta embaixo, salvia nas folhas) e da paleta (tons claros).
SALVIA, SALVIA_ESCURA, MENTA, LILAS = '#B4C9AC', '#97B48F', '#A3CDBB', '#CFAAD6'
LILAS_CLARO, MENTA_CLARA, CINZA, CINZA_CLARO = '#EBD9EF', '#D3EAE0', '#D9D9D9', '#EEEEEE'

DEFS = f'''<defs>
  <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F7F0F9"/><stop offset="1" stop-color="#EEF6F1"/>
  </linearGradient>
  <linearGradient id="marca" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{LILAS}"/><stop offset="1" stop-color="{MENTA}"/>
  </linearGradient>
  <linearGradient id="marcaH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{MENTA}"/><stop offset="1" stop-color="{LILAS}"/>
  </linearGradient>
  <linearGradient id="folha" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#C6D8BE"/><stop offset="1" stop-color="{SALVIA_ESCURA}"/>
  </linearGradient>
  <linearGradient id="lilas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{LILAS_CLARO}"/><stop offset="1" stop-color="#D9B9E0"/>
  </linearGradient>
  <linearGradient id="menta" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{MENTA_CLARA}"/><stop offset="1" stop-color="#B5D9C9"/>
  </linearGradient>
</defs>'''

FUNDO = ('<path d="M58 150 C40 92 92 38 162 44 C226 50 252 30 294 68 C334 106 324 182 272 206 '
         'C220 230 122 236 86 206 C70 192 64 172 58 150 Z" fill="url(#fundo)"/>')


def sombra(cx, cy, rx):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{rx * 0.12:.1f}" fill="#1C1C1C" opacity="0.06"/>'


def muda(x, y, escala=1.0):
    # Base do caule em (x, y). Mesmo desenho do logo: caule curvo, folha grande a direita, menor a esquerda.
    return f'''<g transform="translate({x} {y}) scale({escala})">
    <path d="M0 0 C0 -18 1 -32 7 -46" stroke="{SALVIA_ESCURA}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M7 -44 C9 -62 22 -74 40 -76 C38 -58 26 -46 7 -44 Z" fill="url(#folha)"/>
    <path d="M3 -28 C-4 -40 -18 -44 -30 -42 C-24 -30 -12 -24 3 -28 Z" fill="#C6D8BE"/>
  </g>'''


def folha_solta(x, y, angulo, escala=1.0, cor='#C6D8BE'):
    return (f'<path transform="translate({x} {y}) rotate({angulo}) scale({escala})" '
            f'd="M0 0 C4 -12 14 -18 26 -18 C22 -6 12 0 0 0 Z" fill="{cor}"/>')


def svg(corpo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260">'
            f'{DEFS}{FUNDO}{corpo}</svg>\n')


CHECK = 'stroke="#FFFFFF" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"'

ILUSTRACOES = {
    # Conversa vazia: dois baloes, um de cada cor de lado, e a muda nascendo entre eles.
    'conversa': f'''{sombra(180, 222, 110)}
  <rect x="70" y="64" width="150" height="92" rx="30" fill="url(#menta)"/>
  <path d="M98 150 L88 182 L128 154 Z" fill="#B5D9C9"/>
  <circle cx="115" cy="110" r="7" fill="#FFFFFF"/><circle cx="145" cy="110" r="7" fill="#FFFFFF"/><circle cx="175" cy="110" r="7" fill="#FFFFFF"/>
  <rect x="166" y="118" width="124" height="74" rx="28" fill="url(#lilas)"/>
  <path d="M262 186 L280 210 L244 190 Z" fill="#D9B9E0"/>
  <rect x="190" y="142" width="78" height="9" rx="4.5" fill="#FFFFFF"/><rect x="190" y="159" width="50" height="9" rx="4.5" fill="#FFFFFF"/>
  {muda(50, 216, 0.8)}''',

    # Sem tarefas: prancheta com duas feitas e uma livre, e a muda no vaso ao lado.
    'tarefas': f'''{sombra(200, 224, 105)}
  <rect x="112" y="46" width="136" height="174" rx="20" fill="#FFFFFF" stroke="{CINZA_CLARO}" stroke-width="3"/>
  <rect x="150" y="34" width="60" height="26" rx="11" fill="url(#marcaH)"/>
  <circle cx="144" cy="96" r="12" fill="{MENTA}"/><path d="M138 96 L142.5 100.5 L150 92" {CHECK}/>
  <rect x="166" y="91" width="62" height="10" rx="5" fill="{CINZA_CLARO}"/>
  <circle cx="144" cy="136" r="12" fill="{MENTA}"/><path d="M138 136 L142.5 140.5 L150 132" {CHECK}/>
  <rect x="166" y="131" width="50" height="10" rx="5" fill="{CINZA_CLARO}"/>
  <circle cx="144" cy="176" r="11" fill="#FFFFFF" stroke="{CINZA}" stroke-width="3"/>
  <rect x="166" y="171" width="56" height="10" rx="5" fill="{CINZA_CLARO}"/>
  <path d="M262 184 L310 184 L302 222 L270 222 Z" fill="url(#lilas)"/>
  <rect x="257" y="176" width="58" height="13" rx="6.5" fill="{LILAS}"/>
  {muda(284, 178, 1.15)}''',

    # Sem consultas: pagina de calendario com o dia marcado e folhas ao pe.
    'agenda': f'''{sombra(184, 222, 108)}
  <rect x="96" y="60" width="172" height="152" rx="22" fill="#FFFFFF" stroke="{CINZA_CLARO}" stroke-width="3"/>
  <path d="M96 82 C96 70 106 60 118 60 L246 60 C258 60 268 70 268 82 L268 102 L96 102 Z" fill="url(#marcaH)"/>
  <rect x="134" y="44" width="11" height="30" rx="5.5" fill="#BDBDBD"/><rect x="219" y="44" width="11" height="30" rx="5.5" fill="#BDBDBD"/>
  ''' + ''.join(
        f'<rect x="{116 + c * 34}" y="{118 + r * 30}" width="20" height="18" rx="6" fill="{CINZA_CLARO}"/>'
        for r in range(3) for c in range(4) if not (r == 1 and c == 2)) + f'''
  <circle cx="194" cy="157" r="15" fill="{MENTA}"/><path d="M187 157 L192 162 L201 152" {CHECK}/>
  {folha_solta(70, 214, -150, 1.2)}{folha_solta(84, 216, -115, 0.9, SALVIA)}{muda(292, 214, 0.9)}''',

    # Sem notificacoes: sino em repouso sob a lua, sem nada chamando atencao.
    'notificacoes': f'''{sombra(180, 222, 90)}
  <path d="M262 52 A28 28 0 1 0 290 86 A22 22 0 1 1 262 52 Z" fill="{LILAS}"/>
  <circle cx="110" cy="62" r="3.5" fill="{LILAS}"/><circle cx="240" cy="120" r="3" fill="{MENTA}"/><circle cx="96" cy="120" r="2.5" fill="{MENTA}"/>
  <circle cx="180" cy="64" r="9" fill="#D9B9E0"/>
  <path d="M180 70 C150 70 132 94 132 124 L132 154 L118 176 L242 176 L228 154 L228 124 C228 94 210 70 180 70 Z" fill="url(#lilas)"/>
  <ellipse cx="180" cy="188" rx="17" ry="11" fill="{MENTA}"/>
  <path d="M150 104 C152 92 160 86 168 84" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>
  {folha_solta(116, 214, -150, 1.2)}{folha_solta(242, 214, -30, 1.2, SALVIA)}''',

    # Sem relatos: caderno aberto, lapis e uma folha marcando a pagina.
    'relatos': f'''{sombra(180, 220, 120)}
  <path d="M64 96 Q128 78 180 98 Q232 78 296 96 L296 210 Q232 192 180 212 Q128 192 64 210 Z" fill="url(#marca)" opacity="0.55"/>
  <path d="M72 90 Q130 74 180 94 L180 202 Q130 184 72 198 Z" fill="#FFFFFF"/>
  <path d="M180 94 Q230 74 288 90 L288 198 Q230 184 180 202 Z" fill="#FFFFFF"/>
  <path d="M180 94 L180 202" stroke="{CINZA}" stroke-width="2"/>
  ''' + ''.join(
        f'<path d="M92 {118 + i * 18} Q130 {108 + i * 18} 166 {120 + i * 18}" stroke="{CINZA_CLARO}" stroke-width="5" fill="none" stroke-linecap="round"/>'
        for i in range(4)) + ''.join(
        f'<path d="M196 {120 + i * 18} Q230 {108 + i * 18} 268 {120 + i * 18}" stroke="{CINZA_CLARO}" stroke-width="5" fill="none" stroke-linecap="round"/>'
        for i in range(3)) + f'''
  <g transform="translate(214 196) rotate(-38)">
    <rect x="0" y="-7" width="78" height="14" rx="4" fill="{MENTA}"/><rect x="66" y="-7" width="12" height="14" rx="3" fill="{LILAS}"/>
    <path d="M0 -7 L-16 0 L0 7 Z" fill="#F3E3C8"/><path d="M-11 -2.2 L-16 0 L-11 2.2 Z" fill="#606060"/>
  </g>
  <path d="M180 92 C178 76 186 64 198 60 C200 74 192 86 180 92 Z" fill="url(#folha)"/>''',

    # Psicologo sem pacientes: maos em concha segurando a muda, o mesmo gesto do logo.
    'pacientes': f'''{sombra(180, 224, 100)}
  <path d="M92 150 C108 196 150 212 180 212 C210 212 252 196 268 150 C270 140 258 136 252 146 C238 172 210 184 180 184 C150 184 122 172 108 146 C102 136 90 140 92 150 Z" fill="url(#menta)"/>
  <ellipse cx="180" cy="168" rx="58" ry="14" fill="#CDB8A2"/>
  <ellipse cx="180" cy="164" rx="50" ry="9" fill="#DCC9B4"/>
  {muda(176, 164, 1.6)}
  {folha_solta(98, 96, -20, 0.9, LILAS_CLARO)}{folha_solta(262, 84, 20, 0.8, LILAS)}''',

    # Paciente sem vinculo: o vaso com a muda crescendo, sob um sol suave.
    'boas-vindas': f'''<circle cx="180" cy="128" r="74" fill="{LILAS_CLARO}" opacity="0.7"/>
  <circle cx="180" cy="128" r="50" fill="{LILAS_CLARO}"/>
  {sombra(180, 226, 80)}
  <path d="M142 174 L218 174 L206 224 L154 224 Z" fill="url(#marca)"/>
  <rect x="134" y="162" width="92" height="18" rx="9" fill="{LILAS}"/>
  {muda(178, 164, 1.9)}
  {folha_solta(96, 150, -40, 1.0, SALVIA)}{folha_solta(258, 118, 30, 0.9)}{folha_solta(272, 180, 10, 0.7, LILAS)}''',

    # Pedido pendente: ampulheta com a areia caindo devagar, e a folha ao lado.
    'aguardando': f'''{sombra(180, 224, 80)}
  <rect x="128" y="44" width="104" height="16" rx="8" fill="{LILAS}"/>
  <rect x="128" y="200" width="104" height="16" rx="8" fill="{LILAS}"/>
  <path d="M142 60 L218 60 C218 96 192 112 186 130 C192 148 218 164 218 200 L142 200 C142 164 168 148 174 130 C168 112 142 96 142 60 Z" fill="#FFFFFF" stroke="{CINZA_CLARO}" stroke-width="3"/>
  <path d="M156 84 L204 84 C198 100 186 110 180 116 C174 110 162 100 156 84 Z" fill="url(#menta)"/>
  <path d="M180 120 L180 182" stroke="#B5D9C9" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>
  <path d="M150 198 C156 178 170 170 180 170 C190 170 204 178 210 198 Z" fill="url(#menta)"/>
  {muda(258, 218, 1.0)}{folha_solta(92, 120, -30, 1.0, LILAS_CLARO)}''',
}

for nome, corpo in ILUSTRACOES.items():
    (AQUI / f'{nome}.svg').write_text(svg(corpo), encoding='utf-8', newline='\n')
print(', '.join(ILUSTRACOES))
