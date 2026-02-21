# Game Design — Double Tap Destiny

## Tema

O jogo explora a hipótese: Cupido precisa dar **dois tiros**. O primeiro alvo entra em *Awaiting Bond* e o segundo tiro define o vínculo. Se o segundo tiro errar ou acertar objetos, o universo tenta “fazer sentido” — gerando vínculos absurdos e eventos cômicos.

## Core Loop

1. Mire e atire: marque o primeiro alvo (AwaitingPair)
2. Atire de novo para formar o par
3. Ganhe pontos por compatibilidade + velocidade + precisão
4. Evite misbinds/rejeições para não subir o Chaos Meter

## Estados

- `Idle`: nenhum primeiro alvo marcado
- `AwaitingPair`: primeiro alvo marcado, timer correndo
- `Bound`: par compatível formado
- `Rejected`: NPCs incompatíveis (evento caótico)
- `Misbound`: pessoa + objeto / vínculos absurdos

## Compatibilidade

Cada NPC tem:

- `personality`
- `hobby`
- `mood`
- `tags`

Regra simples: **2 ou mais** matches => sucesso.

## Chaos Meter

Sobe em:

- misbinds
- rejeições
- errar o segundo tiro

Efeitos:

- NPCs ficam mais agitados
- Paleta “entorta” levemente

Se chegar a 100%: derrota (caos total).

## Cameo

**Gobbo** aparece como NPC especial; ao misbindar com cogumelo, dispara evento único.
