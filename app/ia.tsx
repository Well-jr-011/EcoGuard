import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  umidadeSolo: number;
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
      'Posso ajudar você a entender as leituras do sistema, ' +
      'fumaça, fogo, temperatura, umidade do solo, riscos ' +
      'de incêndio, prevenção e segurança.\n\n' +
      'Faça sua pergunta abaixo.',
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
  temperatura: number,
  umidadeSolo: number
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
    temperatura >= 40 ||
    umidadeSolo <= 30
  ) {
    return 'ATENÇÃO';
  }

  return 'SEGURO';
}

function gerarResposta(
  perguntaOriginal: string,
  leitura: Leitura | null
): string {
  const pergunta = normalizar(perguntaOriginal);

  const fumaca = leitura?.fumaca ?? null;
  const fogo = leitura?.fogo ?? false;
  const temperatura = leitura?.temperatura ?? null;
  const umidadeSolo = leitura?.umidadeSolo ?? null;

  const status = leitura
    ? leitura.status ||
      calcularStatus(
        leitura.fumaca,
        leitura.fogo,
        leitura.temperatura,
        leitura.umidadeSolo
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
      'umidade do solo, risco de incêndio ou sobre o funcionamento do sistema.'
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
    pergunta.includes('para que voce serve')
  ) {
    return (
      '🤖 ECOGUARD IA\n\n' +
      'Sou o assistente inteligente do EcoGuard.\n\n' +
      'Posso interpretar as leituras do sistema e explicar ' +
      'situações relacionadas a fumaça, fogo, temperatura, ' +
      'umidade do solo, prevenção e segurança.'
    );
  }

  /*
   * SITUAÇÃO ATUAL
   */

  if (
    pergunta.includes('como esta') ||
    pergunta.includes('situacao') ||
    pergunta.includes('status') ||
    pergunta.includes('ambiente')
  ) {
    if (!leitura) {
      return (
        '📡 Não encontrei uma leitura recente.\n\n' +
        'Verifique se os dados estão chegando na tabela "leituras" do Supabase.'
      );
    }

    return (
      '📊 SITUAÇÃO ATUAL\n\n' +
      `Status: ${status}\n\n` +
      `🌫️ Fumaça: ${fumaca}%\n` +
      `🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n` +
      `🌡️ Temperatura: ${temperatura}°C\n` +
      `🌱 Umidade do solo: ${umidadeSolo}%\n\n` +
      (status === 'CRÍTICO'
        ? '🚨 A situação é crítica. Priorize sua segurança.'
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
    pergunta.includes('nivel de fumaca') ||
    pergunta.includes('quantidade de fumaca')
  ) {
    if (fumaca === null) {
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
        ? '🚨 O nível atual é crítico. Afaste-se de fumaça ou fogo e verifique a situação somente se for seguro.'
        : fumaca >= 40
          ? '⚠️ O nível está elevado. Continue monitorando.'
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
      (fumaca !== null
        ? `A leitura atual é ${fumaca}%.`
        : 'Ainda não existe uma leitura disponível.')
    );
  }

  /*
   * FOGO
   */

  if (
    pergunta.includes('fogo') ||
    pergunta.includes('tem fogo') ||
    pergunta.includes('detectou fogo')
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
      '• Ligue para o serviço de emergência apropriado.\n\n' +
      'Em incêndios, ligue para 193.'
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
    if (temperatura === null) {
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
   * UMIDADE
   */

  if (
    pergunta.includes('umidade do solo') ||
    pergunta.includes('umidade solo') ||
    pergunta === 'solo' ||
    pergunta.includes('terra')
  ) {
    if (umidadeSolo === null) {
      return (
        '🌱 Ainda não tenho uma leitura atual da umidade do solo.'
      );
    }

    return (
      '🌱 UMIDADE DO SOLO\n\n' +
      `A leitura atual é ${umidadeSolo}%.\n\n` +
      (umidadeSolo <= 30
        ? '⚠️ A umidade está baixa e contribui para o estado de atenção.'
        : '✅ A umidade está acima do limite de atenção.')
    );
  }

  /*
   * RISCO
   */

  if (
    pergunta.includes('risco') ||
    pergunta.includes('perigo') ||
    pergunta.includes('nivel de risco')
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
      `🌡️ Temperatura: ${temperatura}°C\n` +
      `🌱 Solo: ${umidadeSolo}%`
    );
  }

  /*
   * POR QUE ESTÁ CRÍTICO
   */

  if (
    pergunta.includes('por que esta critico') ||
    pergunta.includes('porque esta critico')
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
      'Os sensores coletam informações do ambiente e essas informações podem ser enviadas para o sistema EcoGuard.\n\n' +
      'O aplicativo utiliza essas leituras para acompanhar condições de risco.'
    );
  }

  /*
   * ARDUINO
   */

  if (
    pergunta.includes('arduino') ||
    pergunta.includes('placa')
  ) {
    return (
      '🔌 ARDUINO\n\n' +
      'O Arduino é responsável pela coleta das informações dos sensores no projeto EcoGuard.\n\n' +
      'Depois que os dados são enviados ao sistema, o aplicativo consegue apresentar as leituras.'
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
      'A tabela "leituras" pode armazenar informações como fumaça, fogo, temperatura, umidade do solo, status e horário.'
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
      'O EcoGuard pode utilizar o Supabase Realtime para receber novas leituras automaticamente.\n\n' +
      'Quando uma nova leitura chega ao banco, as telas podem atualizar os dados.'
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
      'Assim você pode observar como as condições ambientais mudaram ao longo do tempo.'
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
      'O EcoGuard pode abrir o WhatsApp com uma mensagem de alerta preparada.\n\n' +
      'Para isso, é necessário cadastrar corretamente o telefone de emergência nas configurações.'
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
      'As notificações podem informar quando uma condição de risco é identificada.\n\n' +
      'Dependendo do ambiente Expo utilizado, alguns recursos de notificação podem exigir um development build.'
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
      'O EcoGuard pode utilizar alertas sonoros quando uma condição crítica é detectada.\n\n' +
      'O alarme não substitui a comunicação com os serviços de emergência.'
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
      `🌱 Umidade do solo: ${umidadeSolo}%\n` +
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
      '💡 POSSO RESPONDER SOBRE:\n\n' +
      '🌫️ Fumaça\n' +
      '🔥 Fogo e incêndios\n' +
      '🌡️ Temperatura\n' +
      '🌱 Umidade do solo\n' +
      '📊 Status e risco\n' +
      '📡 Sensores\n' +
      '🔌 Arduino\n' +
      '☁️ Supabase\n' +
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
      'Ele combina sensores, armazenamento de dados e uma interface mobile.'
    );
  }

  /*
   * RESPOSTA PADRÃO
   */

  return (
    '🤖 Ainda não encontrei uma resposta específica para essa pergunta.\n\n' +
    'Tente perguntar sobre:\n\n' +
    '🌫️ fumaça\n' +
    '🔥 fogo\n' +
    '🌡️ temperatura\n' +
    '🌱 umidade do solo\n' +
    '📊 risco\n' +
    '📡 sensores\n' +
    '🔌 Arduino\n' +
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
        .select('*')
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
        return null;
      }

      const dados = resultado.data as Record<
        string,
        unknown
      >;

      const fumaca = Number(
        dados.valor_fumaca ??
        dados.fumaca ??
        0
      );

      const fogo = Boolean(
        dados.fogo ?? false
      );

      const temperatura = Number(
        dados.temperatura ?? 0
      );

      const umidadeSolo = Number(
        dados.umidade_solo ??
        dados.umidadeSolo ??
        0
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
        umidadeSolo,
        status:
          statusBanco ||
          calcularStatus(
            fumaca,
            fogo,
            temperatura,
            umidadeSolo
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
    const perguntaLimpa = pergunta.trim();

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
      (anterior: Mensagem[]): Mensagem[] => [
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
        (anterior: Mensagem[]): Mensagem[] => [
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
        (anterior: Mensagem[]): Mensagem[] => [
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
                IA local • sem API paga
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
                Analisando...
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
          EcoGuard IA • respostas locais • sem chave de API
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
    fontWeight: '700',
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