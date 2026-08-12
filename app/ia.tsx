import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Banco de dados expandido com 21 perguntas categorizadas em blocos lógicos
const BANCO_FAQ = [
  // BLOCCO 1: EMERGÊNCIA E SOCORRO
  {
    id: '1',
    pergunta: 'O que fazer em caso de fumaça severa?',
    resposta: 'Mantenha a calma. Saia do ambiente imediatamente abaixado (próximo ao chão), pois o ar limpo fica embaixo. Feche as portas atrás de você para conter o fogo e ligue para o Corpo de Bombeiros (193).',
    categoria: 'EMERGÊNCIA',
    icone: 'local-fire-department',
  },
  {
    id: '2',
    pergunta: 'O que fazer se alguém inalar fumaça tóxica?',
    resposta: 'Leve a pessoa imediatamente para um local aberto com ar fresco. Se ela estiver consciente, ajude-a a sentar para facilitar a respiração. Se houver desmaio, ligue para o SAMU (192) urgente.',
    categoria: 'EMERGÊNCIA',
    icone: 'healing',
  },
  {
    id: '3',
    pergunta: 'Como agir se minhas roupas pegarem fogo?',
    resposta: 'Não corra (correr alimenta as chamas). Pare, deite no chão e role de um lado para o outro cobrindo o rosto com as mãos para sufocar o fogo imediatamente.',
    categoria: 'EMERGÊNCIA',
    icone: 'accessibility',
  },
  {
    id: '4',
    pergunta: 'Como evacuar um prédio comercial em chamas?',
    resposta: 'Siga rigorosamente as placas de saída de emergência. Nunca use elevadores (o risco de falta de energia e confinamento é alto), desça sempre pelas escadas pressurizadas.',
    categoria: 'EMERGÊNCIA',
    icone: 'business',
  },
  {
    id: '5',
    pergunta: 'O que fazer em caso de queimadura na pele?',
    resposta: 'Coloque a área afetada debaixo de água fria corrente por pelo menos 10 minutos. Nunca aplique pasta de dente, manteiga ou gelo. Proteja com um pano limpo e procure socorro.',
    categoria: 'EMERGÊNCIA',
    icone: 'medical-services',
  },

  // BLOCCO 2: COMPREENSÃO DE ALERTAS
  {
    id: '6',
    pergunta: 'O que significa uma leitura acima de 70%?',
    resposta: 'Significa nível CRÍTICO de fumaça ou gases inflamáveis. O alarme do EcoGuard disparará e você deve evacuar o local imediatamente e verificar possíveis focos de incêndio.',
    categoria: 'ALERTAS',
    icone: 'warning',
  },
  {
    id: '7',
    pergunta: 'O que fazer se a leitura estiver em ATENÇÃO (40%)?',
    resposta: 'Verifique se há algo queimando na cozinha, excesso de poeira ou fumaça de cigarro/vela perto do sensor. Ventile o ambiente abrindo portas e janelas para normalizar o ar.',
    categoria: 'ALERTAS',
    icone: 'report-problem',
  },
  {
    id: '8',
    pergunta: 'O nível seguro é de quanto na tela inicial?',
    resposta: 'Qualquer leitura abaixo de 40% é considerada segura. Pequenas variações entre 0% e 15% são comuns devido à umidade, poeira suspensa natural ou vapores de cozinha normais.',
    categoria: 'ALERTAS',
    icone: 'verified',
  },
  {
    id: '9',
    pergunta: 'O aplicativo avisa mesmo com a tela bloqueada?',
    resposta: 'Sim! Graças às notificações integradas com o sistema nativo do smartphone, o EcoGuard dispara o banner visual e a vibração física mesmo se o celular estiver em repouso.',
    categoria: 'ALERTAS',
    icone: 'notifications-active',
  },

  // BLOCCO 3: PREVENÇÃO E COMBATE
  {
    id: '10',
    pergunta: 'Qual o melhor extintor para ter em casa?',
    resposta: 'O extintor do tipo ABC é o mais recomendado para residências, pois ele apaga incêndios em materiais sólidos (madeira, papel), líquidos inflamáveis (gasolina, álcool) e equipamentos elétricos energizados.',
    categoria: 'PREVENÇÃO',
    icone: 'gavel',
  },
  {
    id: '11',
    pergunta: 'Curto-circuito pode ativar o sensor?',
    resposta: 'Sim. Antes mesmo das chamas aparecerem, fios elétricos superaquecidos liberam uma fumaça branca com forte odor plástico. O sensor MQ é altamente sensível a esse tipo de partícula gasosa.',
    categoria: 'PREVENÇÃO',
    icone: 'flash-on',
  },
  {
    id: '12',
    pergunta: 'Como evitar incêndios na cozinha?',
    resposta: 'Nunca deixe panelas no fogo sem supervisão. Mantenha panos de prato e cortinas longe do fogão. Caso uma panela de óleo pegue fogo, nunca jogue água; desligue o fogo e cubra com uma tampa úmida.',
    categoria: 'PREVENÇÃO',
    icone: 'kitchen',
  },
  {
    id: '13',
    pergunta: 'Quais os maiores perigos com benjamins/Tês?',
    resposta: 'Ligar múltiplos aparelhos potentes (como micro-ondas e secadores) no mesmo benjamim causa sobrecarga na fiação, derretimento de plugues e é uma das maiores causas de incêndios residenciais.',
    categoria: 'PREVENÇÃO',
    icone: 'power',
  },
  {
    id: '14',
    pergunta: 'Com que frequência devo revisar a fiação da casa?',
    resposta: 'O recomendado por engenheiros eletricistas é fazer uma inspeção completa nos cabos, disjuntores e tomadas a cada 5 anos para evitar o ressecamento de isolamentos.',
    categoria: 'PREVENÇÃO',
    icone: 'build',
  },

  // BLOCCO 4: HARDWARE E MANUTENÇÃO
  {
    id: '15',
    pergunta: 'Como funciona o sensor MQ do EcoGuard?',
    resposta: 'O sensor MQ possui um filamento interno que se aquece. Quando gases como fumaça ou gás de cozinha entram em contato com ele, a condutividade muda. O Arduino lê essa mudança e envia a porcentagem para o app.',
    categoria: 'HARDWARE',
    icone: 'memory',
  },
  {
    id: '16',
    pergunta: 'O sensor de fumaça precisa de limpeza?',
    resposta: 'Sim. Acúmulo de poeira, teias de aranha ou gordura nas aberturas do sensor podem causar alarmes falsos ou travar as leituras. Limpe o redor do sensor com um pano seco ou ar comprimido uma vez por mês.',
    categoria: 'HARDWARE',
    icone: 'cleaning-services',
  },
  {
    id: '17',
    pergunta: 'O EcoGuard detecta vazamento de gás de cozinha?',
    resposta: 'Sim! Se você estiver usando sensores como o MQ-2 ou MQ-5 no Arduino, eles são excelentes para detectar tanto fumaça quanto vazamentos de gás liquefeito de petróleo (GLP), propano e metano.',
    categoria: 'HARDWARE',
    icone: 'gas-meter',
  },
  {
    id: '18',
    pergunta: 'Onde é o melhor lugar para instalar o sensor?',
    resposta: 'Como a fumaça e os gases quentes sobem rapidamente, o sensor deve ser fixado sempre no teto ou no alto das paredes, preferencialmente em corredores perto dos quartos, salas ou cozinhas.',
    categoria: 'HARDWARE',
    icone: 'roofing',
  },
  {
    id: '19',
    pergunta: 'Qual a distância máxima entre o Arduino e o sensor?',
    resposta: 'Para cabos de sinal sem blindagem, o recomendado é manter o sensor a no máximo 2 metros do Arduino para evitar ruídos elétricos e perda de precisão na leitura analógica.',
    categoria: 'HARDWARE',
    icone: 'settings-ethernet',
  },
  {
    id: '20',
    pergunta: 'Qual placa Arduino é melhor para o EcoGuard?',
    resposta: 'Placas com Wi-Fi nativo, como o ESP32 ou NodeMCU ESP8266, são as melhores para o EcoGuard, pois conseguem se conectar à internet sozinhas para jogar os dados no Supabase.',
    categoria: 'HARDWARE',
    icone: 'developer-board',
  },
  {
    id: '21',
    pergunta: 'O sensor MQ consome muita energia?',
    resposta: 'O sensor MQ consome cerca de 150mA devido à sua resistência de aquecimento interna. Recomenda-se usar uma fonte externa conectada ao Arduino em vez de alimentá-lo apenas por pilhas comuns.',
    categoria: 'HARDWARE',
    icone: 'battery-alert',
  },
];
export default function IA() {
  const [perguntaSelecionada, setPerguntaSelecionada] = useState<string | null>(null);
  const [resposta, setResposta] = useState('');
  const [perguntaTexto, setPerguntaTexto] = useState('');

  function selecionarPergunta(id: string, textoPergunta: string, textoResposta: string) {
    setPerguntaSelecionada(id);
    setPerguntaTexto(textoPergunta);
    setResposta(textoResposta);
  }

  // Agrupa as perguntas por categoria para criar os blocos visuais organizados
  const categorias = ['EMERGÊNCIA', 'ALERTAS', 'PREVENÇÃO', 'HARDWARE'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER EM CARD GRADIENTE */}
      <LinearGradient
        colors={['#15803D', '#166534', '#030712']}
        style={styles.headerCard}
      >
        <View style={styles.aiBadge}>
          <MaterialIcons name="auto-awesome" size={14} color="#22C55E" />
          <Text style={styles.aiBadgeText}>ECOGUARD KNOWLEDGE</Text>
        </View>
        <Text style={styles.titulo}>Guia de Respostas</Text>
        <Text style={styles.subtitulo}>
          Acesse a central de conhecimento organizada em blocos para agir com segurança e prevenção.
        </Text>
      </LinearGradient>

      {/* 🔮 CAIXA DE RESPOSTA ESTILO PREMIUM GLASSMORPHISM */}
      {perguntaSelecionada ? (
        <View style={styles.respostaBox}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.respostaLinhaDestaque}
          />
          <View style={styles.respostaHeader}>
            <MaterialIcons name="smart-toy" size={24} color="#22C55E" />
            <Text style={styles.respostaTitulo}>SUPORTE ECOGUARD</Text>
          </View>
          <Text style={styles.respostaPerguntaAtual}>"{perguntaTexto}"</Text>
          <Text style={styles.respostaText}>{resposta}</Text>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <MaterialIcons name="forum" size={40} color="#475569" />
          <Text style={styles.emptyText}>Toque em qualquer pergunta nos blocos abaixo para abrir a resposta do assistente.</Text>
        </View>
      )}

      {/* RENDERIZAÇÃO DOS BLOCOS SEPARADOS POR CATEGORIA */}
      {categorias.map((categoriaAtual) => {
        // Filtra as perguntas pertencentes a este bloco específico
        const perguntasDoBloco = BANCO_FAQ.filter(f => f.categoria === categoriaAtual);

        return (
          <View key={categoriaAtual} style={styles.blocoContainer}>
            <Text style={[
              styles.secaoTitulo, 
              categoriaAtual === 'EMERGÊNCIA' && { color: '#EF4444' }
            ]}>
              📦 Bloco: {categoriaAtual}
            </Text>

            {perguntasDoBloco.map((item) => {
              const estaAtivo = perguntaSelecionada === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.botaoPergunta, estaAtivo && styles.botaoAtivo]}
                  onPress={() => selecionarPergunta(item.id, item.pergunta, item.resposta)}
                  activeOpacity={0.8}
                >
                  <View style={styles.perguntaEsquerda}>
                    <View style={[styles.iconeCirculo, estaAtivo && styles.iconeCirculoAtivo]}>
                      <MaterialIcons
                        name={item.icone as any}
                        size={20}
                        color={estaAtivo ? '#22C55E' : '#94A3B8'}
                      />
                    </View>
                    <View style={styles.perguntaTextosContainer}>
                      <Text style={[styles.perguntaTexto, estaAtivo && styles.perguntaTextoAtivo]}>
                        {item.pergunta}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={estaAtivo ? '#22C55E' : '#475569'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  headerCard: {
    width: width,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  aiBadgeText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  respostaBox: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#22C55E',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  respostaLinhaDestaque: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  respostaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  respostaTitulo: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  respostaPerguntaAtual: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    fontWeight: '500',
  },
  respostaText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 25,
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  blocoContainer: {
    marginBottom: 20,
  },
  secaoTitulo: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  botaoPergunta: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  botaoAtivo: {
    borderColor: '#22C55E',
    backgroundColor: '#1E293B',
  },
  perguntaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconeCirculo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeCirculoAtivo: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  perguntaTextosContainer: {
    marginLeft: 15,
    flex: 1,
    paddingRight: 10,
  },
  perguntaTexto: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  perguntaTextoAtivo: {
    color: '#22C55E',
  },
});
