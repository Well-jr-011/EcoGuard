import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../src/lib/supabase';

type TipoMensagem = 'usuario' | 'ia';

type Mensagem = {
  id: string;
  tipo: TipoMensagem;
  texto: string;
  hora: string;
};

type Leitura = {
  fumaca: number;
  fogo: boolean;
  temperatura: number;
  status: string;
  created_at: string;
};

const obterHora = (): string => {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const criarId = (): string => {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

const normalizar = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const mensagensIniciais: Mensagem[] = [
  {
    id: 'boas-vindas',
    tipo: 'ia',
    texto:
      'OlÃ¡! Eu sou a EcoGuard IA. ðŸŒ±\n\n' +
      'Posso ajudar vocÃª a interpretar as leituras do sistema, ' +
      'fumaÃ§a, fogo, temperatura, riscos de incÃªndio, prevenÃ§Ã£o ' +
      'e funcionamento do EcoGuard.\n\n' +
      'FaÃ§a uma pergunta ou escolha uma das opÃ§Ãµes abaixo.',
    hora: obterHora(),
  },
];

const sugestoesPadrao: string[] = [
  'Como estÃ¡ o ambiente?',
  'Qual Ã© o nÃ­vel de fumaÃ§a?',
  'Tem fogo detectado?',
  'O que devo fazer em um incÃªndio?',
];

function calcularStatus(
  fumaca: number,
  fogo: boolean,
  temperatura: number
): string {
  if (
    fogo ||
    fumaca >= 70 ||
    temperatura >= 60
  ) {
    return 'CRÃTICO';
  }

  if (
    fumaca >= 40 ||
    temperatura >= 40
  ) {
    return 'ATENÃ‡ÃƒO';
  }

  return 'SEGURO';
}

function interpretarFogo(valor: unknown): boolean {
  return (
    valor === true ||
    valor === 1 ||
    valor === '1' ||
    valor === 'true' ||
    valor === 'TRUE'
  );
}

function gerarResposta(
  perguntaOriginal: string,
  leitura: Leitura | null
): string {
  const pergunta = normalizar(perguntaOriginal);

  const fumaca = leitura?.fumaca ?? 0;
  const fogo = leitura?.fogo ?? false;
  const temperatura = leitura?.temperatura ?? 0;

  const status = leitura
    ? calcularStatus(
        leitura.fumaca,
        leitura.fogo,
        leitura.temperatura
      )
    : null;

  /*
   * SAUDAÃ‡Ã•ES
   */

  if (
    /^(oi|ola|bom dia|boa tarde|boa noite|e ai|ei|hello|hi)\b/.test(
      pergunta
    )
  ) {
    return (
      'OlÃ¡! ðŸ‘‹ðŸŒ±\n\n' +
      'Estou pronta para ajudar com o EcoGuard.\n\n' +
      'VocÃª pode perguntar sobre fumaÃ§a, fogo, temperatura, ' +
      'risco de incÃªndio, prevenÃ§Ã£o ou funcionamento do sistema.'
    );
  }

  if (
    pergunta.includes('obrigado') ||
    pergunta.includes('obrigada') ||
    pergunta.includes('valeu') ||
    pergunta.includes('agradeco')
  ) {
    return (
      'Por nada! ðŸ’šðŸŒ±\n\n' +
      'Estou aqui sempre que vocÃª precisar.'
    );
  }

  if (
    pergunta.includes('tchau') ||
    pergunta.includes('ate mais') ||
    pergunta.includes('ate logo')
  ) {
    return (
      'AtÃ© mais! ðŸ‘‹ðŸŒ±\n\n' +
      'Continue acompanhando as leituras do EcoGuard e priorize sempre sua seguranÃ§a.'
    );
  }

  /*
   * SOBRE A IA
   */

  if (
    pergunta.includes('quem e voce') ||
    pergunta.includes('o que voce faz') ||
    pergunta.includes('para que voce serve') ||
    pergunta.includes('o que voce e')
  ) {
    return (
      'ðŸ¤– ECOGUARD IA\n\n' +
      'Sou o assistente inteligente do EcoGuard.\n\n' +
      'Posso interpretar as leituras do sistema e explicar situaÃ§Ãµes ' +
      'relacionadas a fumaÃ§a, fogo, temperatura, prevenÃ§Ã£o e seguranÃ§a.\n\n' +
      'Neste momento, minhas respostas sÃ£o baseadas nas regras e dados ' +
      'do prÃ³prio sistema.'
    );
  }

  /*
   * SITUAÃ‡ÃƒO ATUAL
   */

  if (
    pergunta.includes('como esta') ||
    pergunta.includes('como esta o') ||
    pergunta.includes('como estÃ¡') ||
    pergunta.includes('situacao') ||
    pergunta.includes('situacao atual') ||
    pergunta.includes('status') ||
    pergunta.includes('ambiente') ||
    pergunta.includes('condicao') ||
    pergunta.includes('condicoes') ||
    pergunta.includes('estado atual') ||
    pergunta.includes('esta tudo bem') ||
    pergunta.includes('esta tudo certo') ||
    pergunta.includes('esta seguro') ||
    pergunta.includes('esta segura')
  ) {
    if (!leitura) {
      return (
        'ðŸ“¡ NÃƒO HÃ LEITURA DISPONÃVEL\n\n' +
        'NÃ£o encontrei uma leitura recente no sistema.\n\n' +
        'Verifique se o ESP8266 estÃ¡ conectado e enviando dados para o Supabase.'
      );
    }

    return (
      'ðŸ“Š SITUAÃ‡ÃƒO ATUAL\n\n' +
      `Status: ${status}\n\n` +
      `ðŸŒ«ï¸ FumaÃ§a: ${fumaca}%\n` +
      `ðŸ”¥ Fogo: ${fogo ? 'DETECTADO' : 'NÃ£o detectado'}\n` +
      `ðŸŒ¡ï¸ Temperatura: ${temperatura}Â°C\n\n` +
      (status === 'CRÃTICO'
        ? 'ðŸš¨ A situaÃ§Ã£o Ã© crÃ­tica. Afaste-se da Ã¡rea de risco e priorize sua seguranÃ§a.'
        : status === 'ATENÃ‡ÃƒO'
          ? 'âš ï¸ Existem condiÃ§Ãµes que precisam de acompanhamento.'
          : 'âœ… As condiÃ§Ãµes atuais estÃ£o dentro da faixa segura.')
    );
  }

  /*
   * FUMAÃ‡A
   */

  if (
    pergunta.includes('fumaca') ||
    pergunta.includes('fumaÃ§a') ||
    pergunta.includes('nivel de fumaca') ||
    pergunta.includes('quantidade de fumaca') ||
    pergunta.includes('quanto de fumaca') ||
    pergunta.includes('muita fumaca') ||
    pergunta.includes('tem fumaca')
  ) {
    if (!leitura) {
      return (
        'ðŸŒ«ï¸ Ainda nÃ£o tenho uma leitura de fumaÃ§a disponÃ­vel.'
      );
    }

    return (
      'ðŸŒ«ï¸ LEITURA DE FUMAÃ‡A\n\n' +
      `O sensor estÃ¡ indicando ${fumaca}%.\n\n` +
      'â€¢ 0% a 39% â†’ Seguro\n' +
      'â€¢ 40% a 69% â†’ AtenÃ§Ã£o\n' +
      'â€¢ 70% ou mais â†’ CrÃ­tico\n\n' +
      (fumaca >= 70
        ? 'ðŸš¨ O nÃ­vel atual Ã© crÃ­tico. Afaste-se de fumaÃ§a ou fogo e procure um local seguro.'
        : fumaca >= 40
          ? 'âš ï¸ O nÃ­vel estÃ¡ elevado. Continue monitorando o ambiente.'
          : 'âœ… O nÃ­vel atual estÃ¡ dentro da faixa segura.')
    );
  }

  if (
    pergunta.includes('fumaca critica') ||
    pergunta.includes('quando a fumaca e critica') ||
    pergunta.includes('nivel critico de fumaca')
  ) {
    return (
      'ðŸš¨ FUMAÃ‡A CRÃTICA\n\n' +
      'No EcoGuard, uma leitura de 70% ou mais Ã© considerada crÃ­tica.\n\n' +
      'Isso nÃ£o significa automaticamente que existe um incÃªndio, ' +
      'mas indica uma condiÃ§Ã£o que merece atenÃ§Ã£o imediata.'
    );
  }

  if (
    pergunta.includes('fumaca alta') ||
    pergunta.includes('fumaca elevada') ||
    pergunta.includes('fumaca aumentando')
  ) {
    return (
      'âš ï¸ FUMAÃ‡A ELEVADA\n\n' +
      'No EcoGuard:\n\n' +
      '40% ou mais â†’ AtenÃ§Ã£o\n' +
      '70% ou mais â†’ CrÃ­tico\n\n' +
      (!leitura
        ? 'Ainda nÃ£o existe uma leitura disponÃ­vel.'
        : `A leitura atual Ã© ${fumaca}%.`)
    );
  }

  /*
   * FOGO
   */

  if (
    pergunta.includes('fogo') ||
    pergunta.includes('tem fogo') ||
    pergunta.includes('detectou fogo') ||
    pergunta.includes('chama') ||
    pergunta.includes('tem chama') ||
    pergunta.includes('chamas')
  ) {
    if (!leitura) {
      return (
        'ðŸ”¥ NÃ£o consegui consultar uma leitura atual de fogo.'
      );
    }

    return fogo
      ? 'ðŸ”¥ ALERTA: FOGO DETECTADO\n\nAfaste-se da Ã¡rea de risco. NÃ£o tente combater um incÃªndio se isso colocar vocÃª em perigo.\n\nEm uma emergÃªncia, ligue para 193.'
      : 'ðŸ”¥ O sistema nÃ£o estÃ¡ registrando fogo neste momento.\n\nIsso nÃ£o garante que nÃ£o exista nenhum foco de incÃªndio, portanto continue atento ao ambiente.';
  }

  /*
   * INCÃŠNDIO
   */

  if (
    pergunta.includes('incendio') ||
    pergunta.includes('incendio florestal') ||
    pergunta.includes('queimada')
  ) {
    return (
      'ðŸ”¥ INCÃŠNDIO OU QUEIMADA\n\n' +
      'Se houver risco para pessoas ou imÃ³veis:\n\n' +
      '1. Afaste-se da Ã¡rea de perigo.\n' +
      '2. Avise outras pessoas prÃ³ximas.\n' +
      '3. NÃ£o entre em locais com muita fumaÃ§a.\n' +
      '4. Ligue para os Bombeiros pelo 193.\n' +
      '5. Informe a localizaÃ§Ã£o com precisÃ£o.'
    );
  }

  /*
   * BOMBEIROS
   */

  if (
    pergunta.includes('bombeiro') ||
    pergunta.includes('193') ||
    pergunta.includes('ligar para bombeiro')
  ) {
    return (
      'ðŸš’ BOMBEIROS\n\n' +
      'No Brasil, o nÃºmero dos Bombeiros Ã© 193.\n\n' +
      'Em uma emergÃªncia, informe o local da ocorrÃªncia, ' +
      'o tipo de situaÃ§Ã£o e se existem pessoas em risco.'
    );
  }

  /*
   * EMERGÃŠNCIA
   */

  if (
    pergunta.includes('emergencia') ||
    pergunta.includes('situacao perigosa') ||
    pergunta.includes('risco imediato')
  ) {
    return (
      'ðŸš¨ EMERGÃŠNCIA\n\n' +
      'Se houver fogo, muita fumaÃ§a, explosÃ£o ou risco direto Ã  vida:\n\n' +
      'â€¢ Afaste-se para um local seguro.\n' +
      'â€¢ NÃ£o tente investigar de perto.\n' +
      'â€¢ NÃ£o retorne ao local para buscar objetos.\n' +
      'â€¢ Em incÃªndios, ligue para 193.'
    );
  }

  /*
   * TEMPERATURA
   */

  if (
    pergunta.includes('temperatura') ||
    pergunta.includes('calor') ||
    pergunta.includes('quente')
  ) {
    if (!leitura) {
      return (
        'ðŸŒ¡ï¸ Ainda nÃ£o existe uma leitura atual de temperatura.'
      );
    }

    return (
      'ðŸŒ¡ï¸ TEMPERATURA\n\n' +
      `A temperatura atual Ã© ${temperatura}Â°C.\n\n` +
      (temperatura >= 60
        ? 'ðŸš¨ A temperatura estÃ¡ em nÃ­vel crÃ­tico.'
        : temperatura >= 40
          ? 'âš ï¸ A temperatura estÃ¡ elevada.'
          : 'âœ… A temperatura estÃ¡ abaixo do limite de atenÃ§Ã£o.')
    );
  }

  /*
   * RISCO
   */

  if (
    pergunta.includes('risco') ||
    pergunta.includes('perigo') ||
    pergunta.includes('nivel de risco') ||
    pergunta.includes('corre risco') ||
    pergunta.includes('e perigoso') ||
    pergunta.includes('Ã© perigoso') ||
    pergunta.includes('devo me preocupar') ||
    pergunta.includes('preciso me preocupar')
  ) {
    if (!leitura) {
      return (
        'âš ï¸ Ainda nÃ£o tenho dados suficientes para avaliar o risco atual.'
      );
    }

    return (
      'âš ï¸ AVALIAÃ‡ÃƒO DE RISCO\n\n' +
      `Status: ${status}\n\n` +
      `ðŸŒ«ï¸ FumaÃ§a: ${fumaca}%\n` +
      `ðŸ”¥ Fogo: ${fogo ? 'DETECTADO' : 'NÃ£o detectado'}\n` +
      `ðŸŒ¡ï¸ Temperatura: ${temperatura}Â°C\n\n` +
      (status === 'CRÃTICO'
        ? 'ðŸš¨ Existe pelo menos uma condiÃ§Ã£o crÃ­tica.'
        : status === 'ATENÃ‡ÃƒO'
          ? 'âš ï¸ Existe pelo menos uma condiÃ§Ã£o de atenÃ§Ã£o.'
          : 'âœ… Nenhuma condiÃ§Ã£o crÃ­tica ou de atenÃ§Ã£o foi identificada.')
    );
  }

  /*
   * POR QUE ESTÃ CRÃTICO
   */

  if (
    pergunta.includes('por que esta critico') ||
    pergunta.includes('porque esta critico') ||
    pergunta.includes('por que esta assim')
  ) {
    if (!leitura) {
      return (
        'ðŸš¨ O estado crÃ­tico pode ocorrer quando existe fogo detectado, ' +
        'fumaÃ§a de 70% ou mais ou temperatura de 60Â°C ou mais.'
      );
    }

    const motivos: string[] = [];

    if (fogo) {
      motivos.push('fogo detectado');
    }

    if (fumaca !== null && fumaca >= 70) {
      motivos.push(`fumaÃ§a em ${fumaca}%`);
    }

    if (temperatura !== null && temperatura >= 60) {
      motivos.push(`temperatura em ${temperatura}Â°C`);
    }

    return (
      `ðŸš¨ STATUS: ${status}\n\n` +
      (motivos.length > 0
        ? `Motivo(s): ${motivos.join(', ')}.\n\n`
        : 'A leitura indica uma condiÃ§Ã£o de risco.\n\n') +
      'Priorize sua seguranÃ§a.'
    );
  }

  /*
   * O QUE FAZER
   */

  if (
    pergunta.includes('o que fazer') ||
    pergunta.includes('como agir') ||
    pergunta.includes('como devo agir')
  ) {
    return (
      'ðŸ›¡ï¸ COMO AGIR EM UMA SITUAÃ‡ÃƒO DE RISCO\n\n' +
      'â€¢ NÃ£o se aproxime do fogo ou da fumaÃ§a.\n' +
      'â€¢ Afaste crianÃ§as e outras pessoas.\n' +
      'â€¢ NÃ£o entre em locais com muita fumaÃ§a.\n' +
      'â€¢ Procure um local seguro.\n' +
      'â€¢ Em uma emergÃªncia, ligue para 193.'
    );
  }

  /*
   * PREVENÃ‡ÃƒO
   */

  if (
    pergunta.includes('prevenir incendio') ||
    pergunta.includes('prevencao') ||
    pergunta.includes('prevenir queimada')
  ) {
    return (
      'ðŸŒ³ PREVENÃ‡ÃƒO DE INCÃŠNDIOS\n\n' +
      'â€¢ Evite queimadas.\n' +
      'â€¢ NÃ£o descarte cigarros em Ã¡reas secas.\n' +
      'â€¢ Mantenha materiais inflamÃ¡veis longe de fontes de calor.\n' +
      'â€¢ Monitore Ã¡reas de risco.\n' +
      'â€¢ Tenha rotas de saÃ­da definidas.\n' +
      'â€¢ Redobre os cuidados em perÃ­odos secos e quentes.'
    );
  }

  /*
   * SENSOR
   */

  if (
    pergunta.includes('sensor') ||
    pergunta.includes('sensores')
  ) {
    return (
      'ðŸ“¡ SENSORES\n\n' +
      'O EcoGuard utiliza sensores para coletar informaÃ§Ãµes do ambiente.\n\n' +
      'No sistema atual, as principais informaÃ§Ãµes monitoradas sÃ£o:\n\n' +
      'ðŸŒ«ï¸ NÃ­vel de fumaÃ§a\n' +
      'ðŸ”¥ DetecÃ§Ã£o de fogo\n' +
      'ðŸŒ¡ï¸ Temperatura\n\n' +
      'Esses dados sÃ£o enviados para o sistema e apresentados no aplicativo.'
    );
  }

  /*
   * ARDUINO / ESP8266
   */

  if (
    pergunta.includes('arduino') ||
    pergunta.includes('esp8266') ||
    pergunta.includes('placa')
  ) {
    return (
      'ðŸ”Œ ESP8266\n\n' +
      'O ESP8266 funciona como o controlador do sistema de sensores.\n\n' +
      'Ele recebe os dados dos sensores, conecta-se ao Wi-Fi e envia as leituras para o Supabase.\n\n' +
      'Depois disso, o EcoGuard consegue apresentar essas informaÃ§Ãµes no aplicativo.'
    );
  }

  /*
   * SUPABASE
   */

  if (
    pergunta.includes('supabase') ||
    pergunta.includes('banco de dados')
  ) {
    return (
      'â˜ï¸ SUPABASE\n\n' +
      'O Supabase funciona como a camada de armazenamento de dados do EcoGuard.\n\n' +
      'A tabela "leituras" armazena informaÃ§Ãµes como:\n\n' +
      'ðŸŒ«ï¸ FumaÃ§a\n' +
      'ðŸ”¥ Fogo\n' +
      'ðŸŒ¡ï¸ Temperatura\n' +
      'ðŸ“Š Status\n' +
      'ðŸ•’ Data e horÃ¡rio'
    );
  }

  /*
   * TEMPO REAL
   */

  if (
    pergunta.includes('tempo real') ||
    pergunta.includes('real time') ||
    pergunta.includes('atualiza')
  ) {
    return (
      'âš¡ TEMPO REAL\n\n' +
      'O EcoGuard utiliza o Supabase Realtime para acompanhar novas leituras.\n\n' +
      'Quando o ESP8266 envia um novo registro, o aplicativo pode receber essa atualizaÃ§Ã£o automaticamente.'
    );
  }

  /*
   * HISTÃ“RICO
   */

  if (
    pergunta.includes('historico') ||
    pergunta.includes('leituras anteriores')
  ) {
    return (
      'ðŸ“‹ HISTÃ“RICO\n\n' +
      'A tela HistÃ³rico permite acompanhar os registros enviados pelo sistema.\n\n' +
      'Assim vocÃª consegue observar como as condiÃ§Ãµes ambientais mudaram ao longo do tempo.'
    );
  }

  /*
   * WHATSAPP
   */

  if (
    pergunta.includes('whatsapp') ||
    pergunta.includes('mandar alerta')
  ) {
    return (
      'ðŸ“² WHATSAPP\n\n' +
      'O EcoGuard pode preparar uma mensagem de alerta para ser enviada pelo WhatsApp.\n\n' +
      'Para isso, o telefone de emergÃªncia precisa estar cadastrado corretamente nas configuraÃ§Ãµes.'
    );
  }

  /*
   * NOTIFICAÃ‡Ã•ES
   */

  if (
    pergunta.includes('notificacao') ||
    pergunta.includes('alerta do app')
  ) {
    return (
      'ðŸ”” NOTIFICAÃ‡Ã•ES\n\n' +
      'As notificaÃ§Ãµes podem avisar quando uma condiÃ§Ã£o de risco Ã© identificada.\n\n' +
      'Elas funcionam como uma camada adicional de alerta e nÃ£o substituem os serviÃ§os de emergÃªncia.'
    );
  }

  /*
   * ALARME
   */

  if (
    pergunta.includes('alarme') ||
    pergunta.includes('sirene')
  ) {
    return (
      'ðŸ”Š ALARME\n\n' +
      'O EcoGuard pode utilizar um alerta sonoro quando uma condiÃ§Ã£o crÃ­tica Ã© detectada.\n\n' +
      'O alarme serve como aviso e nÃ£o substitui a comunicaÃ§Ã£o com os serviÃ§os de emergÃªncia.'
    );
  }

  /*
   * EXTINTOR
   */

  if (pergunta.includes('extintor')) {
    return (
      'ðŸ§¯ EXTINTOR\n\n' +
      'Um extintor deve ser utilizado somente quando o fogo for pequeno, houver uma rota de fuga segura e vocÃª souber utilizar o equipamento.\n\n' +
      'Se o fogo estiver crescendo ou houver muita fumaÃ§a, abandone o local e chame os Bombeiros.'
    );
  }

  /*
   * COZINHA
   */

  if (
    pergunta.includes('cozinha') ||
    pergunta.includes('panela') ||
    pergunta.includes('oleo')
  ) {
    return (
      'ðŸ³ INCÃŠNDIO NA COZINHA\n\n' +
      'Nunca jogue Ã¡gua sobre Ã³leo em chamas, pois isso pode espalhar o fogo violentamente.\n\n' +
      'Se nÃ£o for possÃ­vel controlar a situaÃ§Ã£o com seguranÃ§a, saia do local e chame os Bombeiros.'
    );
  }

  /*
   * GÃS
   */

  if (
    pergunta.includes('gas') ||
    pergunta.includes('vazamento')
  ) {
    return (
      'âš ï¸ VAZAMENTO DE GÃS\n\n' +
      'Evite chamas, faÃ­scas e interruptores elÃ©tricos.\n\n' +
      'Afaste-se do local e procure assistÃªncia adequada.\n\n' +
      'Se houver risco de incÃªndio ou explosÃ£o, acione os serviÃ§os de emergÃªncia.'
    );
  }

  /*
   * CIGARRO
   */

  if (
    pergunta.includes('cigarro') ||
    pergunta.includes('bituca')
  ) {
    return (
      'ðŸš¬ CIGARROS\n\n' +
      'Bitucas podem iniciar incÃªndios quando descartadas em vegetaÃ§Ã£o ou materiais secos.\n\n' +
      'Apague completamente o cigarro e descarte-o corretamente.'
    );
  }

  /*
   * VENTO
   */

  if (pergunta.includes('vento')) {
    return (
      'ðŸ’¨ VENTO\n\n' +
      'Ventos fortes podem acelerar a propagaÃ§Ã£o de um incÃªndio e dificultar o controle das chamas.\n\n' +
      'Em uma situaÃ§Ã£o de fogo, mantenha distÃ¢ncia e procure uma direÃ§Ã£o segura.'
    );
  }

  /*
   * CHUVA
   */

  if (pergunta.includes('chuva')) {
    return (
      'ðŸŒ§ï¸ CHUVA\n\n' +
      'A chuva pode reduzir a secura da vegetaÃ§Ã£o e diminuir algumas condiÃ§Ãµes favorÃ¡veis Ã  propagaÃ§Ã£o do fogo.\n\n' +
      'Mesmo assim, uma Ã¡rea em chamas nÃ£o deve ser considerada automaticamente segura.'
    );
  }

  /*
   * SECA
   */

  if (
    pergunta.includes('seca') ||
    pergunta.includes('tempo seco')
  ) {
    return (
      'â˜€ï¸ TEMPO SECO\n\n' +
      'PerÃ­odos secos podem aumentar o risco de propagaÃ§Ã£o de incÃªndios porque a vegetaÃ§Ã£o perde umidade.\n\n' +
      'Nessas condiÃ§Ãµes, evite fontes de igniÃ§Ã£o e monitore Ã¡reas de risco.'
    );
  }

  /*
   * ANIMAIS
   */

  if (
    pergunta.includes('animal') ||
    pergunta.includes('animais') ||
    pergunta.includes('pet')
  ) {
    return (
      'ðŸ¾ ANIMAIS\n\n' +
      'Em uma emergÃªncia, retire animais da Ã¡rea de risco somente se isso puder ser feito com seguranÃ§a.\n\n' +
      'NÃ£o coloque sua vida em perigo tentando resgatar um animal em meio ao fogo ou fumaÃ§a intensa.'
    );
  }

  /*
   * CRIANÃ‡AS
   */

  if (
    pergunta.includes('crianca') ||
    pergunta.includes('criancas')
  ) {
    return (
      'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ CRIANÃ‡AS\n\n' +
      'Mantenha crianÃ§as e pessoas vulnerÃ¡veis afastadas da Ã¡rea de risco.\n\n' +
      'NÃ£o permita que retornem ao local para buscar objetos.'
    );
  }

  /*
   * SEGURANÃ‡A
   */

  if (
    pergunta.includes('seguranca') ||
    pergunta.includes('posso entrar') ||
    pergunta.includes('entrar no local')
  ) {
    return (
      'ðŸ›¡ï¸ SEGURANÃ‡A\n\n' +
      'Sua seguranÃ§a vem antes do equipamento.\n\n' +
      'Se houver fogo ou muita fumaÃ§a, nÃ£o entre no local apenas para verificar o sensor.\n\n' +
      'Afaste-se e aguarde orientaÃ§Ã£o profissional.'
    );
  }

  /*
   * ÃšLTIMA LEITURA
   */

  if (
    pergunta.includes('ultima leitura') ||
    pergunta.includes('dados atuais') ||
    pergunta.includes('leitura atual')
  ) {
    if (!leitura) {
      return (
        'ðŸ“¡ NÃ£o encontrei uma leitura recente no Supabase.'
      );
    }

    return (
      'ðŸ“¡ ÃšLTIMA LEITURA\n\n' +
      `ðŸŒ«ï¸ FumaÃ§a: ${fumaca}%\n` +
      `ðŸ”¥ Fogo: ${fogo ? 'DETECTADO' : 'NÃ£o detectado'}\n` +
      `ðŸŒ¡ï¸ Temperatura: ${temperatura}Â°C\n` +
      `ðŸ“Š Status: ${status}\n\n` +
      `ðŸ•’ ${new Date(
        leitura.created_at
      ).toLocaleString('pt-BR')}`
    );
  }

  /*
   * AJUDA
   */

  if (
    pergunta.includes('ajuda') ||
    pergunta.includes('comandos') ||
    pergunta.includes('perguntas')
  ) {
    return (
      'ðŸ’¡ POSSO AJUDAR COM:\n\n' +
      'ðŸŒ«ï¸ FumaÃ§a\n' +
      'ðŸ”¥ Fogo e incÃªndios\n' +
      'ðŸŒ¡ï¸ Temperatura\n' +
      'ðŸ“Š Status e risco\n' +
      'ðŸ“¡ Sensores\n' +
      'ðŸ”Œ ESP8266\n' +
      'â˜ï¸ Supabase\n' +
      'âš¡ Tempo real\n' +
      'ðŸš’ Bombeiros e 193\n' +
      'ðŸ›¡ï¸ PrevenÃ§Ã£o e seguranÃ§a'
    );
  }

  /*
   * ECOGUARD
   */

  if (
    pergunta.includes('ecoguard') ||
    pergunta.includes('aplicativo') ||
    pergunta === 'app'
  ) {
    return (
      'ðŸŒ± ECOGUARD\n\n' +
      'O EcoGuard Ã© um sistema de monitoramento ambiental desenvolvido para acompanhar condiÃ§Ãµes que podem indicar risco de incÃªndio.\n\n' +
      'Ele combina sensores, ESP8266, armazenamento de dados e uma interface para acompanhamento das leituras.'
    );
  }

  /*
   * RESPOSTA PADRÃƒO
   */

  if (
    pergunta.includes('bom') ||
    pergunta.includes('normal') ||
    pergunta.includes('seguro') ||
    pergunta.includes('tranquilo') ||
    pergunta.includes('preocup') ||
    pergunta.includes('agora')
  ) {
    if (!leitura) {
      return 'ðŸ“¡ Ainda nÃ£o recebi uma leitura recente do ESP8266. Verifique a conexÃ£o e o envio para o Supabase.';
    }
    return `ðŸ“Š ANALISE ATUAL\n\nStatus: ${status}\nðŸŒ«ï¸ FumaÃ§a: ${fumaca}%\nðŸ”¥ Fogo: ${fogo ? 'DETECTADO' : 'NÃ£o detectado'}\nðŸŒ¡ï¸ Temperatura: ${temperatura}Â°C\n\n${status === 'CRÃTICO' ? 'ðŸš¨ Existe uma condiÃ§Ã£o crÃ­tica. Afaste-se da Ã¡rea de risco e, se necessÃ¡rio, ligue para 193.' : status === 'ATENÃ‡ÃƒO' ? 'âš ï¸ HÃ¡ uma condiÃ§Ã£o que merece acompanhamento.' : 'âœ… As leituras estÃ£o dentro da faixa segura definida pelo EcoGuard.'}`;
  }

  return (
    'ðŸ¤– Ainda nÃ£o encontrei uma resposta especÃ­fica para essa pergunta.\n\n' +
    'Tente perguntar sobre:\n\n' +
    'ðŸŒ«ï¸ fumaÃ§a\n' +
    'ðŸ”¥ fogo\n' +
    'ðŸŒ¡ï¸ temperatura\n' +
    'ðŸ“Š risco\n' +
    'ðŸ“¡ sensores\n' +
    'ðŸ”Œ ESP8266\n' +
    'â˜ï¸ Supabase\n' +
    'ðŸš’ Bombeiros\n' +
    'ðŸ›¡ï¸ seguranÃ§a'
  );
}

export default function EcoGuardIA() {
  const [mensagens, setMensagens] =
    useState<Mensagem[]>(mensagensIniciais);

  const [texto, setTexto] = useState<string>('');

  const [carregando, setCarregando] =
    useState<boolean>(false);

  const [leituraAtual, setLeituraAtual] =
    useState<Leitura | null>(null);

  const scrollRef =
    useRef<ScrollView | null>(null);

  const sugestoes = useMemo<string[]>(() => {
    if (!leituraAtual) {
      return sugestoesPadrao;
    }

    return [
      'Como estÃ¡ o ambiente?',
      `A fumaÃ§a de ${leituraAtual.fumaca}% Ã© perigosa?`,
      'Por que estÃ¡ assim?',
      'O que devo fazer agora?',
    ];
  }, [leituraAtual]);

  useEffect(() => {
    buscarUltimaLeitura();
  }, []);

  async function buscarUltimaLeitura(): Promise<Leitura | null> {
    try {
      const resultado = await supabase
        .from('leituras')
        .select(
          'valor_fumaca, fogo, temperatura, status, created_at'
        )
        .eq('sensor_id', 1)
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (resultado.error) {
        console.log(
          'EcoGuard IA - erro Supabase:',
          resultado.error
        );

        return null;
      }

      if (!resultado.data) {
        setLeituraAtual(null);
        return null;
      }

      const dados =
        resultado.data as Record<
          string,
          unknown
        >;

      const fumaca = Number(
        dados.valor_fumaca ?? 0
      );

      const fogo = interpretarFogo(
        dados.fogo
      );

      const temperatura = Number(
        dados.temperatura ?? 0
      );

      const statusBanco =
        typeof dados.status === 'string'
          ? dados.status
          : '';

      const createdAt =
        typeof dados.created_at === 'string'
          ? dados.created_at
          : new Date().toISOString();

      const leitura: Leitura = {
        fumaca,
        fogo,
        temperatura,
        status:
          statusBanco ||
          calcularStatus(
            fumaca,
            fogo,
            temperatura
          ),
        created_at: createdAt,
      };

      setLeituraAtual(leitura);

      return leitura;
    } catch (error) {
      console.log(
        'EcoGuard IA - erro inesperado:',
        error
      );

      return null;
    }
  }

  async function perguntarIA(
    pergunta: string
  ): Promise<void> {
    const perguntaLimpa =
      pergunta.trim();

    if (
      !perguntaLimpa ||
      carregando
    ) {
      return;
    }

    const mensagemUsuario: Mensagem = {
      id: criarId(),
      tipo: 'usuario',
      texto: perguntaLimpa,
      hora: obterHora(),
    };

    setMensagens(
      (
        anterior: Mensagem[]
      ): Mensagem[] => [
        ...anterior,
        mensagemUsuario,
      ]
    );

    setTexto('');
    setCarregando(true);

    try {
      const leitura =
        await buscarUltimaLeitura();

      const resposta =
        gerarResposta(
          perguntaLimpa,
          leitura
        );

      const mensagemIA: Mensagem = {
        id: criarId(),
        tipo: 'ia',
        texto: resposta,
        hora: obterHora(),
      };

      setMensagens(
        (
          anterior: Mensagem[]
        ): Mensagem[] => [
          ...anterior,
          mensagemIA,
        ]
      );

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (error) {
      console.log(
        'EcoGuard IA - erro:',
        error
      );

      const mensagemErro: Mensagem = {
        id: criarId(),
        tipo: 'ia',
        texto:
          'NÃ£o consegui processar essa pergunta agora. Tente novamente.',
        hora: obterHora(),
      };

      setMensagens(
        (
          anterior: Mensagem[]
        ): Mensagem[] => [
          ...anterior,
          mensagemErro,
        ]
      );
    } finally {
      setCarregando(false);
    }
  }

  function enviarMensagem(): void {
    if (!texto.trim()) {
      return;
    }

    perguntarIA(texto);
  }

  function usarSugestao(
    sugestao: string
  ): void {
    if (carregando) {
      return;
    }

    perguntarIA(sugestao);
  }

  function limparConversa(): void {
    setMensagens([
      {
        id: criarId(),
        tipo: 'ia',
        texto:
          'Conversa limpa. ðŸŒ±\n\n' +
          'Pode fazer uma nova pergunta sobre o EcoGuard.',
        hora: obterHora(),
      },
    ]);
  }

  const statusAtual =
    leituraAtual?.status || 'SEGURO';

  const corStatus =
    statusAtual === 'CRÃTICO'
      ? '#EF4444'
      : statusAtual === 'ATENÃ‡ÃƒO'
        ? '#F59E0B'
        : '#22C55E';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === 'ios'
          ? 90
          : 0
      }
    >
      <LinearGradient
        colors={[
          '#052E16',
          '#064E3B',
          '#020617',
        ]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <MaterialIcons
              name="auto-awesome"
              size={28}
              color="#86EFAC"
            />
          </View>

          <View style={styles.headerTexts}>
            <Text style={styles.title}>
              EcoGuard IA
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                ASSISTENTE LOCAL
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={limparConversa}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="delete-outline"
              size={22}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerDescription}>
          Assistente ambiental do EcoGuard
        </Text>
      </LinearGradient>

      {leituraAtual && (
        <View style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <View style={styles.liveTitleArea}>
              <View
                style={[
                  styles.liveIcon,
                  {
                    backgroundColor:
                      `${corStatus}18`,
                  },
                ]}
              >
                <MaterialIcons
                  name="sensors"
                  size={19}
                  color={corStatus}
                />
              </View>

              <View>
                <Text style={styles.liveTitle}>
                  LEITURA ATUAL
                </Text>

                <Text style={styles.liveSubtitle}>
                  EstaÃ§Ã£o 01 â€¢ Supabase
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    `${corStatus}18`,
                  borderColor:
                    `${corStatus}35`,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      corStatus,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: corStatus,
                  },
                ]}
              >
                {statusAtual}
              </Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <MaterialIcons
                name="cloud"
                size={17}
                color="#94A3B8"
              />

              <Text style={styles.metricValue}>
                {leituraAtual.fumaca}%
              </Text>

              <Text style={styles.metricLabel}>
                FUMAÃ‡A
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metric}>
              <MaterialIcons
                name="thermostat"
                size={17}
                color="#94A3B8"
              />

              <Text style={styles.metricValue}>
                {leituraAtual.temperatura}Â°
              </Text>

              <Text style={styles.metricLabel}>
                TEMPERATURA
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metric}>
              <MaterialIcons
                name="local-fire-department"
                size={17}
                color={
                  leituraAtual.fogo
                    ? '#EF4444'
                    : '#94A3B8'
                }
              />

              <Text
                style={[
                  styles.metricValue,
                  leituraAtual.fogo &&
                    styles.fireDetected,
                ]}
              >
                {leituraAtual.fogo
                  ? 'SIM'
                  : 'NÃƒO'}
              </Text>

              <Text style={styles.metricLabel}>
                FOGO
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={
          styles.chatContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({
            animated: true,
          });
        }}
      >
        {mensagens.map(
          (mensagem: Mensagem) => {
            const ehUsuario =
              mensagem.tipo ===
              'usuario';

            return (
              <View
                key={mensagem.id}
                style={[
                  styles.messageRow,
                  ehUsuario
                    ? styles.messageRowUser
                    : styles.messageRowIA,
                ]}
              >
                {!ehUsuario && (
                  <View
                    style={styles.avatarIA}
                  >
                    <MaterialIcons
                      name="auto-awesome"
                      size={17}
                      color="#22C55E"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    ehUsuario
                      ? styles.userBubble
                      : styles.iaBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      ehUsuario
                        ? styles.userText
                        : styles.iaText,
                    ]}
                  >
                    {mensagem.texto}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      ehUsuario
                        ? styles.userTime
                        : styles.iaTime,
                    ]}
                  >
                    {mensagem.hora}
                  </Text>
                </View>
              </View>
            );
          }
        )}

        {carregando && (
          <View
            style={[
              styles.messageRow,
              styles.messageRowIA,
            ]}
          >
            <View style={styles.avatarIA}>
              <MaterialIcons
                name="auto-awesome"
                size={17}
                color="#22C55E"
              />
            </View>

            <View
              style={[
                styles.messageBubble,
                styles.iaBubble,
                styles.loadingBubble,
              ]}
            >
              <ActivityIndicator
                size="small"
                color="#22C55E"
              />

              <Text
                style={styles.typingText}
              >
                Analisando leitura...
              </Text>
            </View>
          </View>
        )}

        {!carregando && (
          <View
            style={styles.suggestionsArea}
          >
            <Text
              style={
                styles.suggestionsTitle
              }
            >
              PERGUNTAS RÃPIDAS
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.suggestionsScroll
              }
            >
              {sugestoes.map(
                (sugestao: string) => (
                  <TouchableOpacity
                    key={sugestao}
                    style={
                      styles.suggestion
                    }
                    onPress={() =>
                      usarSugestao(
                        sugestao
                      )
                    }
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name="chat-bubble-outline"
                      size={14}
                      color="#22C55E"
                    />

                    <Text
                      style={
                        styles.suggestionText
                      }
                    >
                      {sugestao}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      <View style={styles.inputArea}>
        <View
          style={styles.inputContainer}
        >
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Pergunte sobre o EcoGuard..."
            placeholderTextColor="#64748B"
            style={styles.input}
            multiline
            maxLength={500}
            editable={!carregando}
          />

          <TouchableOpacity
            onPress={enviarMensagem}
            disabled={
              !texto.trim() ||
              carregando
            }
            style={[
              styles.sendButton,
              {
                opacity:
                  !texto.trim() ||
                  carregando
                    ? 0.35
                    : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-upward"
              size={22}
              color="#020617"
            />
          </TouchableOpacity>
        </View>

        <Text
          style={styles.footerText}
        >
          EcoGuard IA â€¢ anÃ¡lise local â€¢ sem chave de API
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor:
      'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(134,239,172,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTexts: {
    flex: 1,
    marginLeft: 13,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },

  onlineText: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  clearButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  headerDescription: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 16,
  },

  liveCard: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
  },

  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  liveTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  liveIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  liveTitle: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  liveSubtitle: {
    color: '#475569',
    fontSize: 9,
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    marginRight: 5,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  metric: {
    flex: 1,
    alignItems: 'center',
  },

  metricValue: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  metricLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },

  fireDetected: {
    color: '#EF4444',
  },

  metricDivider: {
    width: 1,
    height: 31,
    backgroundColor: '#1E293B',
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 10,
  },

  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 14,
  },

  messageRowIA: {
    justifyContent: 'flex-start',
  },

  messageRowUser: {
    justifyContent: 'flex-end',
  },

  avatarIA: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 3,
  },

  messageBubble: {
    maxWidth: '82%',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 9,
  },

  iaBubble: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    borderTopLeftRadius: 6,
  },

  userBubble: {
    backgroundColor: '#166534',
    borderWidth: 1,
    borderColor: '#15803D',
    borderTopRightRadius: 6,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },

  iaText: {
    color: '#D1FAE5',
  },

  userText: {
    color: '#F0FDF4',
  },

  messageTime: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  iaTime: {
    color: '#475569',
  },

  userTime: {
    color: '#86EFAC',
  },

  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  typingText: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 8,
  },

  suggestionsArea: {
    marginTop: 6,
    marginBottom: 4,
  },

  suggestionsTitle: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginLeft: 40,
    marginBottom: 9,
  },

  suggestionsScroll: {
    paddingLeft: 40,
    paddingRight: 10,
  },

  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080F1C',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginRight: 8,
  },

  suggestionText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },

  bottomSpace: {
    height: 8,
  },

  inputArea: {
    backgroundColor: '#030712',
    borderTopWidth: 1,
    borderTopColor: '#172033',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom:
      Platform.OS === 'ios'
        ? 18
        : 10,
  },

  inputContainer: {
    minHeight: 52,
    maxHeight: 125,
    borderRadius: 19,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 15,
    paddingRight: 7,
    paddingVertical: 7,
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 105,
    paddingTop: 8,
    paddingBottom: 8,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  footerText: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 9,
    marginTop: 7,
  },
});



