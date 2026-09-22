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

import { MaterialIcons } from '@expo/vector-icons';
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
      'Olá! Eu sou a EcoGuard IA. 🌱\n\n' +
      'Posso ajudar você a interpretar as leituras do sistema, ' +
      'fumaça, fogo, temperatura, riscos de incêndio, prevenção ' +
      'e funcionamento do EcoGuard.\n\n' +
      'Faça uma pergunta ou escolha uma das opções abaixo.',
    hora: obterHora(),
  },
];

const sugestoesPadrao: string[] = [
  'Como está o ambiente?',
  'Qual é o nível de fumaça?',
  'Tem fogo detectado?',
  'O que devo fazer em um incêndio?',
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
    return 'CRÍTICO';
  }

  if (
    fumaca >= 40 ||
    temperatura >= 40
  ) {
    return 'ATENÇÃO';
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
   * SAUDAÇÕES
   */

  if (
    /^(oi|ola|bom dia|boa tarde|boa noite|e ai|ei|hello|hi)\b/.test(
      pergunta
    )
  ) {
    return (
      'Olá! 👋🌱\n\n' +
      'Estou pronta para ajudar com o EcoGuard.\n\n' +
      'Você pode perguntar sobre fumaça, fogo, temperatura, ' +
      'risco de incêndio, prevenção ou funcionamento do sistema.'
    );
  }

  if (
    pergunta.includes('obrigado') ||
    pergunta.includes('obrigada') ||
    pergunta.includes('valeu') ||
    pergunta.includes('agradeco')
  ) {
    return (
      'Por nada! 💚🌱\n\n' +
      'Estou aqui sempre que você precisar.'
    );
  }

  if (
    pergunta.includes('tchau') ||
    pergunta.includes('ate mais') ||
    pergunta.includes('ate logo')
  ) {
    return (
      'Até mais! 👋🌱\n\n' +
      'Continue acompanhando as leituras do EcoGuard e priorize sempre sua segurança.'
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
      '🤖 ECOGUARD IA\n\n' +
      'Sou o assistente inteligente do EcoGuard.\n\n' +
      'Posso interpretar as leituras do sistema e explicar situações ' +
      'relacionadas a fumaça, fogo, temperatura, prevenção e segurança.\n\n' +
      'Neste momento, minhas respostas são baseadas nas regras e dados ' +
      'do próprio sistema.'
    );
  }

  /*
   * SITUAÇÃO ATUAL
   */

  if (
    pergunta.includes('como esta') ||
    pergunta.includes('como esta o') ||
    pergunta.includes('como está') ||
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
        '📡 NÃO HÁ LEITURA DISPONÍVEL\n\n' +
        'Não encontrei uma leitura recente no sistema.\n\n' +
        'Verifique se o ESP8266 está conectado e enviando dados para o Supabase.'
      );
    }

    return (
      '📊 SITUAÇÃO ATUAL\n\n' +
      `Status: ${status}\n\n` +
      `🌫️ Fumaça: ${fumaca}%\n` +
      `🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n` +
      `🌡️ Temperatura: ${temperatura}°C\n\n` +
      (status === 'CRÍTICO'
        ? '🚨 A situação é crítica. Afaste-se da área de risco e priorize sua segurança.'
        : status === 'ATENÇÃO'
          ? '⚠️ Existem condições que precisam de acompanhamento.'
          : '✅ As condições atuais estão dentro da faixa segura.')
    );
  }

  /*
   * FUMAÇA
   */

  if (
    pergunta.includes('fumaca') ||
    pergunta.includes('fumaça') ||
    pergunta.includes('nivel de fumaca') ||
    pergunta.includes('quantidade de fumaca') ||
    pergunta.includes('quanto de fumaca') ||
    pergunta.includes('muita fumaca') ||
    pergunta.includes('tem fumaca')
  ) {
    if (!leitura) {
      return (
        '🌫️ Ainda não tenho uma leitura de fumaça disponível.'
      );
    }

    return (
      '🌫️ LEITURA DE FUMAÇA\n\n' +
      `O sensor está indicando ${fumaca}%.\n\n` +
      '• 0% a 39% → Seguro\n' +
      '• 40% a 69% → Atenção\n' +
      '• 70% ou mais → Crítico\n\n' +
      (fumaca >= 70
        ? '🚨 O nível atual é crítico. Afaste-se de fumaça ou fogo e procure um local seguro.'
        : fumaca >= 40
          ? '⚠️ O nível está elevado. Continue monitorando o ambiente.'
          : '✅ O nível atual está dentro da faixa segura.')
    );
  }

  if (
    pergunta.includes('fumaca critica') ||
    pergunta.includes('quando a fumaca e critica') ||
    pergunta.includes('nivel critico de fumaca')
  ) {
    return (
      '🚨 FUMAÇA CRÍTICA\n\n' +
      'No EcoGuard, uma leitura de 70% ou mais é considerada crítica.\n\n' +
      'Isso não significa automaticamente que existe um incêndio, ' +
      'mas indica uma condição que merece atenção imediata.'
    );
  }

  if (
    pergunta.includes('fumaca alta') ||
    pergunta.includes('fumaca elevada') ||
    pergunta.includes('fumaca aumentando')
  ) {
    return (
      '⚠️ FUMAÇA ELEVADA\n\n' +
      'No EcoGuard:\n\n' +
      '40% ou mais → Atenção\n' +
      '70% ou mais → Crítico\n\n' +
      (!leitura
        ? 'Ainda não existe uma leitura disponível.'
        : `A leitura atual é ${fumaca}%.`)
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
        '🔥 Não consegui consultar uma leitura atual de fogo.'
      );
    }

    return fogo
      ? '🔥 ALERTA: FOGO DETECTADO\n\nAfaste-se da área de risco. Não tente combater um incêndio se isso colocar você em perigo.\n\nEm uma emergência, ligue para 193.'
      : '🔥 O sistema não está registrando fogo neste momento.\n\nIsso não garante que não exista nenhum foco de incêndio, portanto continue atento ao ambiente.';
  }

  /*
   * INCÊNDIO
   */

  if (
    pergunta.includes('incendio') ||
    pergunta.includes('incendio florestal') ||
    pergunta.includes('queimada')
  ) {
    return (
      '🔥 INCÊNDIO OU QUEIMADA\n\n' +
      'Se houver risco para pessoas ou imóveis:\n\n' +
      '1. Afaste-se da área de perigo.\n' +
      '2. Avise outras pessoas próximas.\n' +
      '3. Não entre em locais com muita fumaça.\n' +
      '4. Ligue para os Bombeiros pelo 193.\n' +
      '5. Informe a localização com precisão.'
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
      '🚒 BOMBEIROS\n\n' +
      'No Brasil, o número dos Bombeiros é 193.\n\n' +
      'Em uma emergência, informe o local da ocorrência, ' +
      'o tipo de situação e se existem pessoas em risco.'
    );
  }

  /*
   * EMERGÊNCIA
   */

  if (
    pergunta.includes('emergencia') ||
    pergunta.includes('situacao perigosa') ||
    pergunta.includes('risco imediato')
  ) {
    return (
      '🚨 EMERGÊNCIA\n\n' +
      'Se houver fogo, muita fumaça, explosão ou risco direto à vida:\n\n' +
      '• Afaste-se para um local seguro.\n' +
      '• Não tente investigar de perto.\n' +
      '• Não retorne ao local para buscar objetos.\n' +
      '• Em incêndios, ligue para 193.'
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
        '🌡️ Ainda não existe uma leitura atual de temperatura.'
      );
    }

    return (
      '🌡️ TEMPERATURA\n\n' +
      `A temperatura atual é ${temperatura}°C.\n\n` +
      (temperatura >= 60
        ? '🚨 A temperatura está em nível crítico.'
        : temperatura >= 40
          ? '⚠️ A temperatura está elevada.'
          : '✅ A temperatura está abaixo do limite de atenção.')
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
    pergunta.includes('é perigoso') ||
    pergunta.includes('devo me preocupar') ||
    pergunta.includes('preciso me preocupar')
  ) {
    if (!leitura) {
      return (
        '⚠️ Ainda não tenho dados suficientes para avaliar o risco atual.'
      );
    }

    return (
      '⚠️ AVALIAÇÃO DE RISCO\n\n' +
      `Status: ${status}\n\n` +
      `🌫️ Fumaça: ${fumaca}%\n` +
      `🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n` +
      `🌡️ Temperatura: ${temperatura}°C\n\n` +
      (status === 'CRÍTICO'
        ? '🚨 Existe pelo menos uma condição crítica.'
        : status === 'ATENÇÃO'
          ? '⚠️ Existe pelo menos uma condição de atenção.'
          : '✅ Nenhuma condição crítica ou de atenção foi identificada.')
    );
  }

  /*
   * POR QUE ESTÁ CRÍTICO
   */

  if (
    pergunta.includes('por que esta critico') ||
    pergunta.includes('porque esta critico') ||
    pergunta.includes('por que esta assim')
  ) {
    if (!leitura) {
      return (
        '🚨 O estado crítico pode ocorrer quando existe fogo detectado, ' +
        'fumaça de 70% ou mais ou temperatura de 60°C ou mais.'
      );
    }

    const motivos: string[] = [];

    if (fogo) {
      motivos.push('fogo detectado');
    }

    if (fumaca !== null && fumaca >= 70) {
      motivos.push(`fumaça em ${fumaca}%`);
    }

    if (temperatura !== null && temperatura >= 60) {
      motivos.push(`temperatura em ${temperatura}°C`);
    }

    return (
      `🚨 STATUS: ${status}\n\n` +
      (motivos.length > 0
        ? `Motivo(s): ${motivos.join(', ')}.\n\n`
        : 'A leitura indica uma condição de risco.\n\n') +
      'Priorize sua segurança.'
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
      '🛡️ COMO AGIR EM UMA SITUAÇÃO DE RISCO\n\n' +
      '• Não se aproxime do fogo ou da fumaça.\n' +
      '• Afaste crianças e outras pessoas.\n' +
      '• Não entre em locais com muita fumaça.\n' +
      '• Procure um local seguro.\n' +
      '• Em uma emergência, ligue para 193.'
    );
  }

  /*
   * PREVENÇÃO
   */

  if (
    pergunta.includes('prevenir incendio') ||
    pergunta.includes('prevencao') ||
    pergunta.includes('prevenir queimada')
  ) {
    return (
      '🌳 PREVENÇÃO DE INCÊNDIOS\n\n' +
      '• Evite queimadas.\n' +
      '• Não descarte cigarros em áreas secas.\n' +
      '• Mantenha materiais inflamáveis longe de fontes de calor.\n' +
      '• Monitore áreas de risco.\n' +
      '• Tenha rotas de saída definidas.\n' +
      '• Redobre os cuidados em períodos secos e quentes.'
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
      '📡 SENSORES\n\n' +
      'O EcoGuard utiliza sensores para coletar informações do ambiente.\n\n' +
      'No sistema atual, as principais informações monitoradas são:\n\n' +
      '🌫️ Nível de fumaça\n' +
      '🔥 Detecção de fogo\n' +
      '🌡️ Temperatura\n\n' +
      'Esses dados são enviados para o sistema e apresentados no aplicativo.'
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
      '🔌 ESP8266\n\n' +
      'O ESP8266 funciona como o controlador do sistema de sensores.\n\n' +
      'Ele recebe os dados dos sensores, conecta-se ao Wi-Fi e envia as leituras para o Supabase.\n\n' +
      'Depois disso, o EcoGuard consegue apresentar essas informações no aplicativo.'
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
      '☁️ SUPABASE\n\n' +
      'O Supabase funciona como a camada de armazenamento de dados do EcoGuard.\n\n' +
      'A tabela "leituras" armazena informações como:\n\n' +
      '🌫️ Fumaça\n' +
      '🔥 Fogo\n' +
      '🌡️ Temperatura\n' +
      '📊 Status\n' +
      '🕒 Data e horário'
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
      '⚡ TEMPO REAL\n\n' +
      'O EcoGuard utiliza o Supabase Realtime para acompanhar novas leituras.\n\n' +
      'Quando o ESP8266 envia um novo registro, o aplicativo pode receber essa atualização automaticamente.'
    );
  }

  /*
   * HISTÓRICO
   */

  if (
    pergunta.includes('historico') ||
    pergunta.includes('leituras anteriores')
  ) {
    return (
      '📋 HISTÓRICO\n\n' +
      'A tela Histórico permite acompanhar os registros enviados pelo sistema.\n\n' +
      'Assim você consegue observar como as condições ambientais mudaram ao longo do tempo.'
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
      '📲 WHATSAPP\n\n' +
      'O EcoGuard pode preparar uma mensagem de alerta para ser enviada pelo WhatsApp.\n\n' +
      'Para isso, o telefone de emergência precisa estar cadastrado corretamente nas configurações.'
    );
  }

  /*
   * NOTIFICAÇÕES
   */

  if (
    pergunta.includes('notificacao') ||
    pergunta.includes('alerta do app')
  ) {
    return (
      '🔔 NOTIFICAÇÕES\n\n' +
      'As notificações podem avisar quando uma condição de risco é identificada.\n\n' +
      'Elas funcionam como uma camada adicional de alerta e não substituem os serviços de emergência.'
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
      '🔊 ALARME\n\n' +
      'O EcoGuard pode utilizar um alerta sonoro quando uma condição crítica é detectada.\n\n' +
      'O alarme serve como aviso e não substitui a comunicação com os serviços de emergência.'
    );
  }

  /*
   * EXTINTOR
   */

  if (pergunta.includes('extintor')) {
    return (
      '🧯 EXTINTOR\n\n' +
      'Um extintor deve ser utilizado somente quando o fogo for pequeno, houver uma rota de fuga segura e você souber utilizar o equipamento.\n\n' +
      'Se o fogo estiver crescendo ou houver muita fumaça, abandone o local e chame os Bombeiros.'
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
      '🍳 INCÊNDIO NA COZINHA\n\n' +
      'Nunca jogue água sobre óleo em chamas, pois isso pode espalhar o fogo violentamente.\n\n' +
      'Se não for possível controlar a situação com segurança, saia do local e chame os Bombeiros.'
    );
  }

  /*
   * GÁS
   */

  if (
    pergunta.includes('gas') ||
    pergunta.includes('vazamento')
  ) {
    return (
      '⚠️ VAZAMENTO DE GÁS\n\n' +
      'Evite chamas, faíscas e interruptores elétricos.\n\n' +
      'Afaste-se do local e procure assistência adequada.\n\n' +
      'Se houver risco de incêndio ou explosão, acione os serviços de emergência.'
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
      '🚬 CIGARROS\n\n' +
      'Bitucas podem iniciar incêndios quando descartadas em vegetação ou materiais secos.\n\n' +
      'Apague completamente o cigarro e descarte-o corretamente.'
    );
  }

  /*
   * VENTO
   */

  if (pergunta.includes('vento')) {
    return (
      '💨 VENTO\n\n' +
      'Ventos fortes podem acelerar a propagação de um incêndio e dificultar o controle das chamas.\n\n' +
      'Em uma situação de fogo, mantenha distância e procure uma direção segura.'
    );
  }

  /*
   * CHUVA
   */

  if (pergunta.includes('chuva')) {
    return (
      '🌧️ CHUVA\n\n' +
      'A chuva pode reduzir a secura da vegetação e diminuir algumas condições favoráveis à propagação do fogo.\n\n' +
      'Mesmo assim, uma área em chamas não deve ser considerada automaticamente segura.'
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
      '☀️ TEMPO SECO\n\n' +
      'Períodos secos podem aumentar o risco de propagação de incêndios porque a vegetação perde umidade.\n\n' +
      'Nessas condições, evite fontes de ignição e monitore áreas de risco.'
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
      '🐾 ANIMAIS\n\n' +
      'Em uma emergência, retire animais da área de risco somente se isso puder ser feito com segurança.\n\n' +
      'Não coloque sua vida em perigo tentando resgatar um animal em meio ao fogo ou fumaça intensa.'
    );
  }

  /*
   * CRIANÇAS
   */

  if (
    pergunta.includes('crianca') ||
    pergunta.includes('criancas')
  ) {
    return (
      '👨‍👩‍👧 CRIANÇAS\n\n' +
      'Mantenha crianças e pessoas vulneráveis afastadas da área de risco.\n\n' +
      'Não permita que retornem ao local para buscar objetos.'
    );
  }

  /*
   * SEGURANÇA
   */

  if (
    pergunta.includes('seguranca') ||
    pergunta.includes('posso entrar') ||
    pergunta.includes('entrar no local')
  ) {
    return (
      '🛡️ SEGURANÇA\n\n' +
      'Sua segurança vem antes do equipamento.\n\n' +
      'Se houver fogo ou muita fumaça, não entre no local apenas para verificar o sensor.\n\n' +
      'Afaste-se e aguarde orientação profissional.'
    );
  }

  /*
   * ÚLTIMA LEITURA
   */

  if (
    pergunta.includes('ultima leitura') ||
    pergunta.includes('dados atuais') ||
    pergunta.includes('leitura atual')
  ) {
    if (!leitura) {
      return (
        '📡 Não encontrei uma leitura recente no Supabase.'
      );
    }

    return (
      '📡 ÚLTIMA LEITURA\n\n' +
      `🌫️ Fumaça: ${fumaca}%\n` +
      `🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n` +
      `🌡️ Temperatura: ${temperatura}°C\n` +
      `📊 Status: ${status}\n\n` +
      `🕒 ${new Date(
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
      '💡 POSSO AJUDAR COM:\n\n' +
      '🌫️ Fumaça\n' +
      '🔥 Fogo e incêndios\n' +
      '🌡️ Temperatura\n' +
      '📊 Status e risco\n' +
      '📡 Sensores\n' +
      '🔌 ESP8266\n' +
      '☁️ Supabase\n' +
      '⚡ Tempo real\n' +
      '🚒 Bombeiros e 193\n' +
      '🛡️ Prevenção e segurança'
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
      '🌱 ECOGUARD\n\n' +
      'O EcoGuard é um sistema de monitoramento ambiental desenvolvido para acompanhar condições que podem indicar risco de incêndio.\n\n' +
      'Ele combina sensores, ESP8266, armazenamento de dados e uma interface para acompanhamento das leituras.'
    );
  }

  /*
   * RESPOSTA PADRÃO
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
      return '📡 Ainda não recebi uma leitura recente do ESP8266. Verifique a conexão e o envio para o Supabase.';
    }
    return `📊 ANALISE ATUAL\n\nStatus: ${status}\n🌫️ Fumaça: ${fumaca}%\n🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n🌡️ Temperatura: ${temperatura}°C\n\n${status === 'CRÍTICO' ? '🚨 Existe uma condição crítica. Afaste-se da área de risco e, se necessário, ligue para 193.' : status === 'ATENÇÃO' ? '⚠️ Há uma condição que merece acompanhamento.' : '✅ As leituras estão dentro da faixa segura definida pelo EcoGuard.'}`;
  }

  return (
    '🤖 Ainda não encontrei uma resposta específica para essa pergunta.\n\n' +
    'Tente perguntar sobre:\n\n' +
    '🌫️ fumaça\n' +
    '🔥 fogo\n' +
    '🌡️ temperatura\n' +
    '📊 risco\n' +
    '📡 sensores\n' +
    '🔌 ESP8266\n' +
    '☁️ Supabase\n' +
    '🚒 Bombeiros\n' +
    '🛡️ segurança'
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
      'Como está o ambiente?',
      `A fumaça de ${leituraAtual.fumaca}% é perigosa?`,
      'Por que está assim?',
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
          'Não consegui processar essa pergunta agora. Tente novamente.',
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
          'Conversa limpa. 🌱\n\n' +
          'Pode fazer uma nova pergunta sobre o EcoGuard.',
        hora: obterHora(),
      },
    ]);
  }

  const statusAtual =
    leituraAtual?.status || 'SEGURO';

  const corStatus =
    statusAtual === 'CRÍTICO'
      ? '#EF4444'
      : statusAtual === 'ATENÇÃO'
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
                  Estação 01 • Supabase
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
                FUMAÇA
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
                {leituraAtual.temperatura}°
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
                  : 'NÃO'}
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
              PERGUNTAS RÁPIDAS
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
          EcoGuard IA • análise local • sem chave de API
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