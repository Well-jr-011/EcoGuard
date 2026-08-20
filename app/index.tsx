import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';

import { supabase } from '../src/lib/supabase';

const { width } = Dimensions.get('window');

type HistoricoItem = {
  id: string;
  fumaca: number;
  fogo: boolean;
  temperatura: number;
  umidadeSolo: number;
  hora: string;
  status: string;
};

export default function Dashboard() {
  const [fumaca, setFumaca] = useState(0);
  const [fogo, setFogo] = useState(false);
  const [temperatura, setTemperatura] = useState(0);
  const [umidadeSolo, setUmidadeSolo] = useState(0);

  const [status, setStatus] = useState('CONECTANDO');
  const [corStatus, setCorStatus] = useState('#64748B');

  const [loading, setLoading] = useState(true);
  const [arduinoOnline, setArduinoOnline] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState('Aguardando sinal...');

  const [historico, setHistorico] =
    useState<HistoricoItem[]>([]);

  const [somAlarme, setSomAlarme] =
    useState<Audio.Sound | null>(null);

  const [nomeUsuario, setNomeUsuario] =
    useState('Usuário');

  const [telefoneEmergencia, setTelefoneEmergencia] =
    useState('');

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          const nome =
            await AsyncStorage.getItem('@EcoGuard:nome');

          const telefone =
            await AsyncStorage.getItem('@EcoGuard:telefone');

          setNomeUsuario(nome || 'Usuário');
          setTelefoneEmergencia(telefone || '');
        } catch (error) {
          console.log(
            'Erro ao carregar dados:',
            error
          );
        }
      }

      carregarDados();
    }, [])
  );

  async function controlarSirene(
    ligar: boolean
  ) {
    try {
      if (ligar) {
        if (!somAlarme) {
          const { sound } =
            await Audio.Sound.createAsync(
              {
                uri:
                  'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
              },
              {
                shouldPlay: true,
                isLooping: true,
              }
            );

          setSomAlarme(sound);
        } else {
          const statusSom =
            await somAlarme.getStatusAsync();

          if (
            statusSom.isLoaded &&
            !statusSom.isPlaying
          ) {
            await somAlarme.playAsync();
          }
        }
      } else if (somAlarme) {
        const statusSom =
          await somAlarme.getStatusAsync();

        if (
          statusSom.isLoaded &&
          statusSom.isPlaying
        ) {
          await somAlarme.stopAsync();
        }
      }
    } catch (error) {
      console.log(
        'Erro na sirene:',
        error
      );
    }
  }

  async function processarLeitura(
    valorFumaca: number,
    valorFogo: boolean,
    valorTemperatura: number,
    valorSolo: number,
    timestamp: string
  ) {
    const hora =
      new Date(timestamp).toLocaleTimeString(
        'pt-BR'
      );

    let novoStatus = 'SEGURO';
    let novaCor = '#22C55E';

    if (
      valorFogo ||
      valorFumaca >= 70 ||
      valorTemperatura >= 60
    ) {
      novoStatus = 'CRÍTICO';
      novaCor = '#EF4444';

      await controlarSirene(true);
    } else if (
      valorFumaca >= 40 ||
      valorTemperatura >= 40 ||
      valorSolo <= 30
    ) {
      novoStatus = 'ATENÇÃO';
      novaCor = '#F59E0B';

      await controlarSirene(false);
    } else {
      novoStatus = 'SEGURO';
      novaCor = '#22C55E';

      await controlarSirene(false);
    }

    setFumaca(valorFumaca);
    setFogo(valorFogo);
    setTemperatura(valorTemperatura);
    setUmidadeSolo(valorSolo);

    setStatus(novoStatus);
    setCorStatus(novaCor);

    setUltimaAtualizacao(hora);
    setArduinoOnline(true);

    setHistorico((anterior) => {
      const nova: HistoricoItem = {
        id:
          timestamp +
          Math.random()
            .toString(36)
            .substring(2),

        fumaca: valorFumaca,
        fogo: valorFogo,
        temperatura: valorTemperatura,
        umidadeSolo: valorSolo,
        hora,
        status: novoStatus,
      };

      return [nova, ...anterior].slice(0, 5);
    });

    if (novoStatus === 'CRÍTICO') {
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );

        await Notifications.scheduleNotificationAsync(
          {
            content: {
              title:
                '🚨 ALERTA ECOGUARD',

              body:
                `Fumaça: ${valorFumaca}%\n` +
                `Fogo: ${
                  valorFogo
                    ? 'DETECTADO'
                    : 'Não detectado'
                }\n` +
                `Temperatura: ${valorTemperatura}°C`,

              sound: true,
            },

            trigger: null,
          }
        );
      } catch (error) {
        console.log(
          'Notificação indisponível:',
          error
        );
      }
    }
  }

  useEffect(() => {
    let ativo = true;

    async function buscarUltimaLeitura() {
      try {
        const { data, error } =
          await supabase
            .from('leituras')
            .select('*')
            .order('created_at', {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (error) {
          throw error;
        }

        if (data && ativo) {
          await processarLeitura(
            Number(
              data.valor_fumaca ??
              data.fumaca ??
              0
            ),

            Boolean(data.fogo),

            Number(
              data.temperatura ?? 0
            ),

            Number(
              data.umidade_solo ?? 0
            ),

            data.created_at
          );
        }
      } catch (error) {
        console.log(
          'Erro ao buscar leitura:',
          error
        );

        setArduinoOnline(false);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    buscarUltimaLeitura();

    const canal =
      supabase
        .channel('mudancas_leituras')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leituras',
          },
          async (payload) => {
            if (!ativo) return;

            const leitura =
              payload.new as any;

            await processarLeitura(
              Number(
                leitura.valor_fumaca ??
                leitura.fumaca ??
                0
              ),

              Boolean(leitura.fogo),

              Number(
                leitura.temperatura ?? 0
              ),

              Number(
                leitura.umidade_solo ?? 0
              ),

              leitura.created_at
            );
          }
        )
        .subscribe();

    return () => {
      ativo = false;

      supabase.removeChannel(canal);

      if (somAlarme) {
        somAlarme
          .unloadAsync()
          .catch(() => {});
      }
    };
  }, []);

  function abrirWhatsApp() {
    if (!telefoneEmergencia) {
      Alert.alert(
        'Contato não configurado',
        'Cadastre um telefone de emergência nas configurações.'
      );

      return;
    }

    const numero =
      telefoneEmergencia.replace(/\D/g, '');

    const mensagem =
      `🚨 *ALERTA ECOGUARD* 🚨\n\n` +
      `Situação crítica detectada!\n\n` +
      `🌫️ Fumaça: ${fumaca}%\n` +
      `🔥 Fogo: ${
        fogo ? 'DETECTADO' : 'Não detectado'
      }\n` +
      `🌡️ Temperatura: ${temperatura}°C\n` +
      `🌱 Solo: ${umidadeSolo}%\n\n` +
      `👤 Usuário: ${nomeUsuario}\n` +
      `⏰ Horário: ${ultimaAtualizacao}`;

    Linking.openURL(
      `whatsapp://send?phone=55${numero}&text=${encodeURIComponent(
        mensagem
      )}`
    ).catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp.'
      );
    });
  }

  function ligarBombeiros() {
    Linking.openURL('tel:193').catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o telefone.'
      );
    });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingLogo}>
          <MaterialIcons
            name="eco"
            size={42}
            color="#22C55E"
          />
        </View>

        <Text style={styles.loadingBrand}>
          EcoGuard
        </Text>

        <Text style={styles.loadingSubtitle}>
          Sistema inteligente de prevenção
        </Text>

        <ActivityIndicator
          size="small"
          color="#22C55E"
          style={{
            marginTop: 24,
          }}
        />
      </View>
    );
  }

  const critico = status === 'CRÍTICO';
  const atencao = status === 'ATENÇÃO';

  const statusIcon = critico
    ? 'warning'
    : atencao
    ? 'report-problem'
    : 'verified';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 130,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <LinearGradient
        colors={
          critico
            ? [
                '#451A1A',
                '#1A0808',
                '#020617',
              ]
            : atencao
            ? [
                '#422006',
                '#1C1205',
                '#020617',
              ]
            : [
                '#063B25',
                '#031F16',
                '#020617',
              ]
        }
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <MaterialIcons
                name="eco"
                size={22}
                color="#22C55E"
              />
            </View>

            <View>
              <Text style={styles.logo}>
                EcoGuard
              </Text>

              <Text style={styles.logoSub}>
                MONITORAMENTO AMBIENTAL
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.onlineBadge,
              {
                borderColor: arduinoOnline
                  ? '#166534'
                  : '#7F1D1D',
              },
            ]}
          >
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor:
                    arduinoOnline
                      ? '#22C55E'
                      : '#EF4444',
                },
              ]}
            />

            <Text style={styles.onlineText}>
              {arduinoOnline
                ? 'ONLINE'
                : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <Text style={styles.hello}>
          Olá, {nomeUsuario}
        </Text>

        <Text style={styles.headerDescription}>
          Acompanhe a segurança do seu ambiente
          em tempo real.
        </Text>
      </LinearGradient>

      {/* STATUS */}

      <View
        style={[
          styles.mainStatus,
          {
            borderColor: corStatus,
          },
        ]}
      >
        <View style={styles.mainStatusTop}>
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor:
                  corStatus + '18',
              },
            ]}
          >
            <MaterialIcons
              name={statusIcon}
              size={28}
              color={corStatus}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>
              SITUAÇÃO ATUAL
            </Text>

            <Text
              style={[
                styles.mainStatusText,
                {
                  color: corStatus,
                },
              ]}
            >
              {status}
            </Text>
          </View>

          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor:
                  corStatus + '15',
              },
            ]}
          >
            <Text
              style={[
                styles.liveText,
                {
                  color: corStatus,
                },
              ]}
            >
              AO VIVO
            </Text>
          </View>
        </View>

        <View style={styles.smokeCenter}>
          <Text style={styles.smokeValue}>
            {fumaca}
            <Text style={styles.smokePercent}>
              %
            </Text>
          </Text>

          <Text style={styles.smokeDescription}>
            nível de fumaça
          </Text>
        </View>

        <View style={styles.progress}>
          <View
            style={[
              styles.progressValue,
              {
                width: `${Math.min(
                  Math.max(fumaca, 0),
                  100
                )}%`,
                backgroundColor: corStatus,
              },
            ]}
          />
        </View>

        <View style={styles.scale}>
          <Text style={styles.scaleText}>
            Seguro
          </Text>

          <Text style={styles.scaleText}>
            Atenção
          </Text>

          <Text style={styles.scaleText}>
            Crítico
          </Text>
        </View>
      </View>

      {/* SENSORES */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Sensores
          </Text>

          <Text style={styles.sectionSubtitle}>
            Dados recebidos do sistema
          </Text>
        </View>

        <MaterialIcons
          name="sensors"
          size={22}
          color="#334155"
        />
      </View>

      <View style={styles.sensorGrid}>
        <View style={styles.sensorCard}>
          <View
            style={[
              styles.sensorIcon,
              {
                backgroundColor:
                  '#38BDF815',
              },
            ]}
          >
            <MaterialIcons
              name="cloud"
              size={22}
              color="#38BDF8"
            />
          </View>

          <Text style={styles.sensorLabel}>
            Fumaça
          </Text>

          <Text style={styles.sensorNumber}>
            {fumaca}%
          </Text>

          <Text style={styles.sensorStatus}>
            Nível atual
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <View
            style={[
              styles.sensorIcon,
              {
                backgroundColor: fogo
                  ? '#EF444418'
                  : '#22C55E18',
              },
            ]}
          >
            <MaterialIcons
              name="local-fire-department"
              size={22}
              color={
                fogo
                  ? '#EF4444'
                  : '#22C55E'
              }
            />
          </View>

          <Text style={styles.sensorLabel}>
            Fogo
          </Text>

          <Text
            style={[
              styles.sensorNumberSmall,
              {
                color: fogo
                  ? '#EF4444'
                  : '#22C55E',
              },
            ]}
          >
            {fogo
              ? 'DETECTADO'
              : 'NORMAL'}
          </Text>

          <Text style={styles.sensorStatus}>
            Detecção térmica
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <View
            style={[
              styles.sensorIcon,
              {
                backgroundColor:
                  '#F9731618',
              },
            ]}
          >
            <MaterialIcons
              name="thermostat"
              size={22}
              color="#F97316"
            />
          </View>

          <Text style={styles.sensorLabel}>
            Temperatura
          </Text>

          <Text style={styles.sensorNumber}>
            {temperatura}°
          </Text>

          <Text style={styles.sensorStatus}>
            Celsius
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <View
            style={[
              styles.sensorIcon,
              {
                backgroundColor:
                  '#22C55E18',
              },
            ]}
          >
            <MaterialIcons
              name="water-drop"
              size={22}
              color="#22C55E"
            />
          </View>

          <Text style={styles.sensorLabel}>
            Umidade do solo
          </Text>

          <Text style={styles.sensorNumber}>
            {umidadeSolo}%
          </Text>

          <Text style={styles.sensorStatus}>
            Umidade atual
          </Text>
        </View>
      </View>

      {/* ALERTA */}

      {critico && (
        <View style={styles.criticalBox}>
          <View style={styles.criticalIcon}>
            <MaterialIcons
              name="warning"
              size={23}
              color="#EF4444"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.criticalTitle}>
              Atenção imediata
            </Text>

            <Text style={styles.criticalText}>
              O sistema identificou condições
              críticas no ambiente.
            </Text>
          </View>
        </View>
      )}

      {/* WHATSAPP */}

      {critico && (
        <TouchableOpacity
          style={styles.whatsapp}
          onPress={abrirWhatsApp}
          activeOpacity={0.85}
        >
          <View style={styles.whatsappIcon}>
            <MaterialIcons
              name="send"
              size={20}
              color="#FFF"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappTitle}>
              Enviar alerta
            </Text>

            <Text style={styles.whatsappText}>
              Compartilhar situação pelo WhatsApp
            </Text>
          </View>

          <MaterialIcons
            name="arrow-forward"
            size={21}
            color="#FFF"
          />
        </TouchableOpacity>
      )}

      {/* IA */}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/ia')}
        style={styles.aiContainer}
      >
        <LinearGradient
          colors={[
            '#064E3B',
            '#022C22',
          ]}
          style={styles.aiCard}
        >
          <View style={styles.aiIcon}>
            <MaterialIcons
              name="auto-awesome"
              size={25}
              color="#4ADE80"
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.aiTitleRow}>
              <Text style={styles.aiTitle}>
                EcoGuard IA
              </Text>

              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>
                  GRATUITA
                </Text>
              </View>
            </View>

            <Text style={styles.aiDescription}>
              Tire dúvidas sobre segurança,
              prevenção e suas leituras.
            </Text>
          </View>

          <MaterialIcons
            name="chevron-right"
            size={27}
            color="#4ADE80"
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* ÚLTIMO SINAL */}

      <View style={styles.signal}>
        <View style={styles.signalIcon}>
          <MaterialIcons
            name="access-time"
            size={19}
            color="#64748B"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.signalLabel}>
            ÚLTIMA ATUALIZAÇÃO
          </Text>

          <Text style={styles.signalValue}>
            {ultimaAtualizacao}
          </Text>
        </View>

        <View
          style={[
            styles.signalDot,
            {
              backgroundColor:
                arduinoOnline
                  ? '#22C55E'
                  : '#EF4444',
            },
          ]}
        />
      </View>

      {/* HISTÓRICO */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Atividade recente
          </Text>

          <Text style={styles.sectionSubtitle}>
            Últimas leituras recebidas
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push('/historico')
          }
        >
          <Text style={styles.seeAll}>
            Ver tudo
          </Text>
        </TouchableOpacity>
      </View>

      {historico.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons
            name="history"
            size={30}
            color="#334155"
          />

          <Text style={styles.emptyText}>
            Aguardando leituras...
          </Text>
        </View>
      ) : (
        historico.slice(0, 3).map((item) => {
          const cor =
            item.status === 'CRÍTICO'
              ? '#EF4444'
              : item.status === 'ATENÇÃO'
              ? '#F59E0B'
              : '#22C55E';

          return (
            <View
              key={item.id}
              style={styles.historyItem}
            >
              <View
                style={[
                  styles.historyIndicator,
                  {
                    backgroundColor: cor,
                  },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.historyTime}>
                  {item.hora}
                </Text>

                <Text style={styles.historyData}>
                  Fumaça {item.fumaca}% •{' '}
                  {item.temperatura}°C
                </Text>
              </View>

              <View
                style={[
                  styles.historyBadge,
                  {
                    backgroundColor:
                      cor + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.historyBadgeText,
                    {
                      color: cor,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {/* EMERGÊNCIA */}

      <TouchableOpacity
        style={styles.emergency}
        onPress={ligarBombeiros}
        activeOpacity={0.85}
      >
        <View style={styles.emergencyIcon}>
          <MaterialIcons
            name="local-fire-department"
            size={23}
            color="#FCA5A5"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyTitle}>
            EMERGÊNCIA
          </Text>

          <Text style={styles.emergencyText}>
            Corpo de Bombeiros • 193
          </Text>
        </View>

        <View style={styles.callIcon}>
          <MaterialIcons
            name="call"
            size={20}
            color="#FFF"
          />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  loading: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogo: {
    width: 78,
    height: 78,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
  },

  loadingBrand: {
    color: '#FFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 17,
  },

  loadingSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  header: {
    width,
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#052E16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 1,
    borderColor: '#166534',
  },

  logo: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },

  logoSub: {
    color: '#4ADE80',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#02061755',
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    marginRight: 6,
  },

  onlineText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '900',
  },

  hello: {
    color: '#FFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 34,
  },

  headerDescription: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 5,
  },

  mainStatus: {
    marginHorizontal: 20,
    marginTop: -22,
    backgroundColor: '#0B1220',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  mainStatusTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  overline: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  mainStatusText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },

  liveBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  liveText: {
    fontSize: 8,
    fontWeight: '900',
  },

  smokeCenter: {
    alignItems: 'center',
    marginTop: 19,
  },

  smokeValue: {
    color: '#F8FAFC',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -3,
  },

  smokePercent: {
    color: '#64748B',
    fontSize: 23,
    fontWeight: '700',
  },

  smokeDescription: {
    color: '#64748B',
    fontSize: 11,
    marginTop: -5,
  },

  progress: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },

  progressValue: {
    height: '100%',
    borderRadius: 20,
  },

  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  scaleText: {
    color: '#475569',
    fontSize: 9,
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  seeAll: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '800',
  },

  sensorGrid: {
    marginHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  sensorCard: {
    width: '48.3%',
    backgroundColor: '#0B1220',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#172033',
  },

  sensorIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sensorLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
  },

  sensorNumber: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },

  sensorNumberSmall: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 10,
  },

  sensorStatus: {
    color: '#475569',
    fontSize: 9,
    marginTop: 2,
  },

  criticalBox: {
    marginHorizontal: 20,
    marginTop: 5,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#2B0B0B',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
  },

  criticalIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450A0A',
    marginRight: 12,
  },

  criticalTitle: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '900',
  },

  criticalText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  whatsapp: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#16A34A',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  whatsappIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  whatsappTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },

  whatsappText: {
    color: '#DCFCE7',
    fontSize: 10,
    marginTop: 2,
  },

  aiContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#166534',
  },

  aiCard: {
    minHeight: 82,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiTitle: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '900',
  },

  aiTag: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#166534',
  },

  aiTagText: {
    color: '#BBF7D0',
    fontSize: 7,
    fontWeight: '900',
  },

  aiDescription: {
    color: '#86EFAC',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
    paddingRight: 5,
  },

  signal: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 13,
    borderRadius: 17,
    backgroundColor: '#080F1C',
    borderWidth: 1,
    borderColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
  },

  signalIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  signalLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  signalValue: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
  },

  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
  },

  empty: {
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 18,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    alignItems: 'center',
  },

  emptyText: {
    color: '#475569',
    fontSize: 11,
    marginTop: 8,
  },

  historyItem: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 13,
    borderRadius: 17,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyIndicator: {
    width: 4,
    height: 35,
    borderRadius: 10,
    marginRight: 11,
  },

  historyTime: {
    color: '#64748B',
    fontSize: 9,
  },

  historyData: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },

  historyBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },

  emergency: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#250A0A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#450A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  emergencyTitle: {
    color: '#F87171',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emergencyText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  callIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});