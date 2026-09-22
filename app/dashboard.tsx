import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DimensionValue,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

type Leitura = {
  id: number;
  sensor_id: number;
  valor_fumaca: number;
  fogo: boolean;
  temperatura: number;
  umidade: number;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const { width } = useWindowDimensions();

  const isNotebook = width >= 900;
  const isTablet = width >= 600 && width < 900;

  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);
  const [conectado, setConectado] = useState(false);

  const [nomeUsuario, setNomeUsuario] = useState('Usuário');
  const [telefoneEmergencia, setTelefoneEmergencia] = useState('');

  const [sensor1, setSensor1] = useState<Leitura | null>(null);
  const [sensor2, setSensor2] = useState<Leitura | null>(null);

  /*
   * =====================================================
   * DIMENSÕES RESPONSIVAS
   * =====================================================
   */

  const larguraConteudo = isNotebook
    ? 1100
    : isTablet
      ? 760
      : width;

  const paddingHorizontal = isNotebook
    ? 30
    : isTablet
      ? 24
      : 20;

  /*
   * =====================================================
   * CARREGAR LEITURAS
   * =====================================================
   */

  useEffect(() => {
    let montado = true;

    async function carregarLeituras() {
      try {
        setLoading(true);

        const resultado = await supabase
          .from('leituras')
          .select(
            'id,sensor_id,valor_fumaca,fogo,temperatura,umidade,status,created_at'
          )
          .in('sensor_id', [1, 2])
          .order('created_at', {
            ascending: false,
          })
          .limit(100);

        if (resultado.error) {
          console.log(
            'Erro ao carregar leituras:',
            resultado.error
          );
          return;
        }

        if (!montado) {
          return;
        }

        const dados = (resultado.data || []) as Leitura[];

        setLeituras(dados);
        atualizarSensores(dados);

        if (dados.length > 0) {
          setConectado(true);
        }
      } catch (erro) {
        console.log(
          'Erro inesperado ao carregar leituras:',
          erro
        );
      } finally {
        if (montado) {
          setLoading(false);
        }
      }
    }

    carregarLeituras();

    return () => {
      montado = false;
    };
  }, []);

  /*
   * =====================================================
   * ATUALIZAR SENSOR 1 E SENSOR 2
   * =====================================================
   */

  function atualizarSensores(dados: Leitura[]) {
    let primeiroSensor1: Leitura | null = null;
    let primeiroSensor2: Leitura | null = null;

    for (let i = 0; i < dados.length; i++) {
      const leitura = dados[i];

      if (
        Number(leitura.sensor_id) === 1 &&
        primeiroSensor1 === null
      ) {
        primeiroSensor1 = leitura;
      }

      if (
        Number(leitura.sensor_id) === 2 &&
        primeiroSensor2 === null
      ) {
        primeiroSensor2 = leitura;
      }

      if (
        primeiroSensor1 !== null &&
        primeiroSensor2 !== null
      ) {
        break;
      }
    }

    setSensor1(primeiroSensor1);
    setSensor2(primeiroSensor2);
  }

  /*
   * =====================================================
   * REALTIME
   * =====================================================
   */

  useEffect(() => {
    console.log(
      'Iniciando Realtime do Dashboard...'
    );

    const canal = supabase
      .channel('dashboard_leituras')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leituras',
        },
        (payload: { new: Leitura }) => {
          const novaLeitura = payload.new;

          const idSensor = Number(
            novaLeitura.sensor_id
          );

          if (idSensor !== 1 && idSensor !== 2) {
            return;
          }

          console.log(
            'Nova leitura recebida:',
            novaLeitura
          );

          setLeituras((anteriores) => {
            const filtradas = anteriores.filter(
              (item) => item.id !== novaLeitura.id
            );

            return [novaLeitura]
              .concat(filtradas)
              .slice(0, 100);
          });

          if (idSensor === 1) {
            setSensor1(novaLeitura);
          }

          if (idSensor === 2) {
            setSensor2(novaLeitura);
          }

          setConectado(true);
        }
      )
      .subscribe((status: string) => {
        console.log(
          'Status Realtime:',
          status
        );

        if (status === 'SUBSCRIBED') {
          setConectado(true);
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          setConectado(false);
        }
      });

    return () => {
      console.log(
        'Desconectando Realtime...'
      );

      setConectado(false);

      supabase.removeChannel(canal);
    };
  }, []);

  /*
   * =====================================================
   * CARREGAR USUÁRIO
   * =====================================================
   */

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const usuarioAtual =
          await supabase.auth.getUser();

        const usuario =
          usuarioAtual.data.user;

        if (!usuario) {
          return;
        }

        const resultado = await supabase
          .from('usuarios')
          .select('nome,telefone')
          .eq('id', usuario.id)
          .maybeSingle();

        if (resultado.error) {
          console.log(
            'Erro ao carregar usuário:',
            resultado.error
          );
          return;
        }

        if (resultado.data) {
          if (resultado.data.nome) {
            setNomeUsuario(
              resultado.data.nome
            );
          }

          if (resultado.data.telefone) {
            setTelefoneEmergencia(
              resultado.data.telefone
            );
          }
        }
      } catch (erro) {
        console.log(
          'Erro ao carregar usuário:',
          erro
        );
      }
    }

    carregarUsuario();
  }, []);

  /*
   * =====================================================
   * VALORES SENSOR 1
   * =====================================================
   */

  const fumaca1 = Number(
    sensor1?.valor_fumaca ?? 0
  );

  const temperatura1 = Number(
    sensor1?.temperatura ?? 0
  );

  const umidade1 = Number(
    sensor1?.umidade ?? 0
  );

  const fogo1 = Boolean(
    sensor1?.fogo ?? false
  );

  /*
   * =====================================================
   * VALORES SENSOR 2
   * =====================================================
   */

  const fumaca2 = Number(
    sensor2?.valor_fumaca ?? 0
  );

  const temperatura2 = Number(
    sensor2?.temperatura ?? 0
  );

  const umidade2 = Number(
    sensor2?.umidade ?? 0
  );

  const fogo2 = Boolean(
    sensor2?.fogo ?? false
  );

  /*
   * =====================================================
   * RISCOS
   * =====================================================
   */

  const risco1 =
    fogo1 ||
    fumaca1 >= 70 ||
    temperatura1 >= 60;

  const risco2 =
    fogo2 ||
    fumaca2 >= 70 ||
    temperatura2 >= 60;

  const alertaGeral =
    risco1 || risco2;

  /*
   * =====================================================
   * MAIORES VALORES
   * =====================================================
   */

  const maiorFumaca =
    fumaca1 > fumaca2
      ? fumaca1
      : fumaca2;

  const maiorTemperatura =
    temperatura1 > temperatura2
      ? temperatura1
      : temperatura2;

  /*
   * =====================================================
   * STATUS GERAL
   * =====================================================
   */

  let statusGeral = 'SEGURO';
  let corStatus = '#22C55E';

  if (alertaGeral) {
    statusGeral = 'CRÍTICO';
    corStatus = '#EF4444';
  } else if (maiorTemperatura >= 40) {
    statusGeral = 'ATENÇÃO';
    corStatus = '#F59E0B';
  }

  /*
   * =====================================================
   * ÚLTIMA LEITURA
   * =====================================================
   */

  const leituraAtual =
    leituras.length > 0
      ? leituras[0]
      : null;

  /*
   * =====================================================
   * FORMATADORES
   * =====================================================
   */

  function formatarHora(data: string) {
    return new Date(data).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
      }
    );
  }

  /*
   * =====================================================
   * WHATSAPP
   * =====================================================
   */

  function enviarAlertaWhatsApp() {
    if (!telefoneEmergencia) {
      Alert.alert(
        'Contato não configurado',
        'Cadastre um telefone de emergência primeiro.'
      );
      return;
    }

    const numero =
      telefoneEmergencia.replace(
        /\D/g,
        ''
      );

    let horario = '--:--';

    if (leituraAtual) {
      horario = formatarHora(
        leituraAtual.created_at
      );
    }

    const mensagem =
      'ALERTA ECOGUARD\n\n' +
      'Atenção! O sistema detectou uma condição de risco na residência de ' +
      nomeUsuario +
      '.\n\n' +
      'Sensor 1: ' +
      fumaca1 +
      '% de fumaça\n' +
      'Sensor 2: ' +
      fumaca2 +
      '% de fumaça\n' +
      'Maior temperatura: ' +
      maiorTemperatura.toFixed(1) +
      ' °C\n' +
      'Status: ' +
      statusGeral +
      '\n' +
      'Horário: ' +
      horario +
      '\n\n' +
      'Verifique a segurança imediatamente.';

    const url =
      'whatsapp://send?phone=55' +
      numero +
      '&text=' +
      encodeURIComponent(mensagem);

    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp.'
      );
    });
  }

  /*
   * =====================================================
   * EMERGÊNCIA
   * =====================================================
   */

  function ligarEmergencia() {
    Linking.openURL('tel:193').catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível iniciar a chamada para 193.'
      );
    });
  }

  /*
   * =====================================================
   * CARD DO SENSOR
   * =====================================================
   */

  function renderSensorCard(
    numero: number,
    leitura: Leitura | null
  ) {
    const fumaca = Number(
      leitura?.valor_fumaca ?? 0
    );

    const temperatura = Number(
      leitura?.temperatura ?? 0
    );

    const umidade = Number(
      leitura?.umidade ?? 0
    );

    const fogo = Boolean(
      leitura?.fogo ?? false
    );

    const critico =
      fogo ||
      fumaca >= 70 ||
      temperatura >= 60;

    let cor = '#22C55E';

    if (critico) {
      cor = '#EF4444';
    } else if (temperatura >= 40) {
      cor = '#F59E0B';
    }

    let textoStatus = 'NORMAL';

    if (fogo) {
      textoStatus = 'FOGO DETECTADO';
    } else if (critico) {
      textoStatus = 'RISCO CRÍTICO';
    } else if (temperatura >= 40) {
      textoStatus = 'ATENÇÃO';
    }

    return (
      <View
        key={numero}
        style={[
          styles.sensorCard,
          isNotebook && styles.sensorCardNotebook,
          {
            borderColor: critico
              ? '#7F1D1D'
              : '#172033',
          },
        ]}
      >
        <View
          style={[
            styles.sensorIcon,
            {
              backgroundColor:
                cor + '18',
            },
          ]}
        >
          <MaterialIcons
            name={
              fogo
                ? 'local-fire-department'
                : 'sensors'
            }
            size={27}
            color={cor}
          />
        </View>

        <Text style={styles.sensorTitle}>
          SENSOR {numero}
        </Text>

        <Text
          style={[
            styles.sensorSmoke,
            {
              color: cor,
            },
          ]}
        >
          {fumaca.toFixed(0)}%
        </Text>

        <Text style={styles.sensorUnit}>
          nível de fumaça
        </Text>

        <View style={styles.sensorData}>
          <View style={styles.sensorDataRow}>
            <MaterialIcons
              name="thermostat"
              size={19}
              color="#F97316"
            />

            <View>
              <Text style={styles.sensorDataLabel}>
                Temperatura
              </Text>

              <Text style={styles.sensorDataValue}>
                {temperatura.toFixed(1)} °C
              </Text>
            </View>
          </View>

          <View style={styles.sensorDataRow}>
            <MaterialIcons
              name="water-drop"
              size={18}
              color="#60A5FA"
            />

            <View>
              <Text style={styles.sensorDataLabel}>
                Umidade
              </Text>

              <Text
                style={[
                  styles.sensorDataValue,
                  {
                    color: '#60A5FA',
                  },
                ]}
              >
                {umidade.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.sensorDataRow}>
            <MaterialIcons
              name="local-fire-department"
              size={19}
              color={
                fogo
                  ? '#EF4444'
                  : '#64748B'
              }
            />

            <View>
              <Text style={styles.sensorDataLabel}>
                Chama
              </Text>

              <Text
                style={[
                  styles.sensorDataValue,
                  {
                    color: fogo
                      ? '#EF4444'
                      : '#22C55E',
                  },
                ]}
              >
                {fogo
                  ? 'DETECTADA'
                  : 'NORMAL'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sensorStatus,
            {
              backgroundColor:
                cor + '18',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: cor,
              },
            ]}
          />

          <Text
            style={[
              styles.sensorStatusText,
              {
                color: cor,
              },
            ]}
          >
            {textoStatus}
          </Text>
        </View>
      </View>
    );
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#22C55E"
        />

        <Text style={styles.loadingText}>
          Carregando EcoGuard...
        </Text>
      </View>
    );
  }

  /*
   * =====================================================
   * DASHBOARD
   * =====================================================
   */

  const progressoFumaca =
    Math.min(
      Math.max(maiorFumaca, 0),
      100
    );

  const progressoWidth =
    `${progressoFumaca}%` as DimensionValue;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: isNotebook
            ? 60
            : 120,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: larguraConteudo,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        <LinearGradient
          colors={
            alertaGeral
              ? [
                  '#7F1D1D',
                  '#450A0A',
                  '#030712',
                ]
              : [
                  '#15803D',
                  '#166534',
                  '#030712',
                ]
          }
          style={[
            styles.header,
            {
              paddingHorizontal,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerBrand}>
              <Text style={styles.logo}>
                EcoGuard
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Sistema Inteligente de
                Prevenção de Queimadas
              </Text>
            </View>

            <View
              style={[
                styles.onlineBadge,
                {
                  borderColor: conectado
                    ? '#22C55E'
                    : '#EF4444',
                },
              ]}
            >
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor:
                      conectado
                        ? '#22C55E'
                        : '#EF4444',
                  },
                ]}
              />

              <Text
                style={
                  styles.onlineText
                }
              >
                {conectado
                  ? 'ONLINE'
                  : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <Text style={styles.greeting}>
            Olá, {nomeUsuario}
          </Text>

          <Text
            style={
              styles.greetingSubtitle
            }
          >
            Monitoramento dos sensores
            em tempo real.
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.body,
            {
              paddingHorizontal,
            },
          ]}
        >
          <View
            style={[
              styles.statusCard,
              {
                borderColor:
                  corStatus + '55',
              },
            ]}
          >
            <View style={styles.statusHeader}>
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
                  name={
                    statusGeral === 'CRÍTICO'
                      ? 'warning'
                      : statusGeral === 'ATENÇÃO'
                        ? 'priority-high'
                        : 'verified'
                  }
                  size={31}
                  color={corStatus}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.statusLabel
                  }
                >
                  STATUS GERAL
                </Text>

                <Text
                  style={[
                    styles.statusValue,
                    {
                      color: corStatus,
                    },
                  ]}
                >
                  {statusGeral}
                </Text>
              </View>
            </View>

            <View style={styles.smokeArea}>
              <View
                style={
                  styles.smokeNumberContainer
                }
              >
                <Text
                  style={
                    styles.smokeNumber
                  }
                >
                  {maiorFumaca.toFixed(0)}
                </Text>

                <Text
                  style={
                    styles.smokePercent
                  }
                >
                  %
                </Text>
              </View>

              <Text
                style={
                  styles.smokeLabel
                }
              >
                maior nível de fumaça
              </Text>
            </View>

            <View
              style={
                styles.progressBackground
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: progressoWidth,
                    backgroundColor:
                      corStatus,
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.progressLabels
              }
            >
              <Text
                style={
                  styles.progressLabel
                }
              >
                0%
              </Text>

              <Text
                style={
                  styles.progressLabel
                }
              >
                100%
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            MONITORAMENTO DOS SENSORES
          </Text>

          <View
            style={[
              styles.sensorGrid,
              isNotebook &&
                styles.sensorGridNotebook,
            ]}
          >
            {renderSensorCard(
              1,
              sensor1
            )}

            {renderSensorCard(
              2,
              sensor2
            )}
          </View>

          <Text style={styles.sectionTitle}>
            RESUMO DO AMBIENTE
          </Text>

          <View
            style={[
              styles.summaryGrid,
              isNotebook &&
                styles.summaryGridNotebook,
            ]}
          >
            <View
              style={[
                styles.summaryCard,
                isNotebook &&
                  styles.summaryCardNotebook,
              ]}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <MaterialIcons
                  name="thermostat"
                  size={26}
                  color="#F97316"
                />
              </View>

              <Text
                style={
                  styles.summaryTitle
                }
              >
                Temperatura máxima
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {maiorTemperatura.toFixed(
                  1
                )}{' '}
                °C
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                isNotebook &&
                  styles.summaryCardNotebook,
              ]}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <MaterialIcons
                  name="air"
                  size={26}
                  color="#38BDF8"
                />
              </View>

              <Text
                style={
                  styles.summaryTitle
                }
              >
                Fumaça máxima
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {maiorFumaca.toFixed(0)}%
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                isNotebook &&
                  styles.summaryCardNotebook,
              ]}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <MaterialIcons
                  name="sensors"
                  size={26}
                  color="#22C55E"
                />
              </View>

              <Text
                style={
                  styles.summaryTitle
                }
              >
                Sensores ativos
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: '#22C55E',
                  },
                ]}
              >
                6
              </Text>
            </View>
          </View>

          {alertaGeral && (
            <View style={styles.alertBox}>
              <View style={styles.alertIcon}>
                <MaterialIcons
                  name="warning"
                  size={28}
                  color="#EF4444"
                />
              </View>

              <View
                style={
                  styles.alertContent
                }
              >
                <Text
                  style={
                    styles.alertTitle
                  }
                >
                  ALERTA DE SEGURANÇA
                </Text>

                <Text
                  style={
                    styles.alertText
                  }
                >
                  {risco1 && risco2
                    ? 'Os dois sensores identificaram uma condição crítica.'
                    : risco1
                      ? 'O Sensor 1 identificou uma condição crítica.'
                      : 'O Sensor 2 identificou uma condição crítica.'}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={
              styles.whatsappButton
            }
            onPress={
              enviarAlertaWhatsApp
            }
            activeOpacity={0.8}
          >
            <View
              style={
                styles.whatsappIcon
              }
            >
              <MaterialIcons
                name="message"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View
              style={
                styles.buttonContent
              }
            >
              <Text
                style={
                  styles.whatsappTitle
                }
              >
                Enviar alerta pelo WhatsApp
              </Text>

              <Text
                style={
                  styles.whatsappSubtitle
                }
              >
                Compartilhar situação dos
                sensores
              </Text>
            </View>

            <MaterialIcons
              name="arrow-forward"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.aiCard}>
            <LinearGradient
              colors={[
                '#052E16',
                '#064E3B',
                '#052E16',
              ]}
              style={styles.aiGradient}
            >
              <View style={styles.aiIcon}>
                <MaterialIcons
                  name="smart-toy"
                  size={28}
                  color="#22C55E"
                />
              </View>

              <View
                style={styles.aiContent}
              >
                <Text
                  style={styles.aiTitle}
                >
                  EcoGuard IA
                </Text>

                <Text
                  style={styles.aiText}
                >
                  Analise os dados dos dois
                  sensores e receba orientações
                  inteligentes sobre o ambiente.
                </Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={25}
                color="#86EFAC"
              />
            </LinearGradient>
          </View>

          {leituraAtual && (
            <View
              style={
                styles.lastSignal
              }
            >
              <View
                style={
                  styles.signalIcon
                }
              >
                <MaterialIcons
                  name="sensors"
                  size={22}
                  color="#64748B"
                />
              </View>

              <View
                style={
                  styles.signalContent
                }
              >
                <Text
                  style={
                    styles.signalTitle
                  }
                >
                  ÚLTIMO SINAL RECEBIDO
                </Text>

                <Text
                  style={
                    styles.signalText
                  }
                >
                  Sensor{' '}
                  {leituraAtual.sensor_id}
                  {' • '}
                  {formatarHora(
                    leituraAtual.created_at
                  )}
                </Text>
              </View>

              <Text
                style={[
                  styles.signalStatus,
                  {
                    color:
                      leituraAtual.status ===
                      'CRÍTICO'
                        ? '#EF4444'
                        : leituraAtual.status ===
                            'ATENÇÃO'
                          ? '#F59E0B'
                          : '#22C55E',
                  },
                ]}
              >
                {leituraAtual.status}
              </Text>
            </View>
          )}

          <View
            style={
              styles.historyHeader
            }
          >
            <Text
              style={
                styles.sectionTitleNoMargin
              }
            >
              HISTÓRICO RECENTE
            </Text>

            <Text
              style={
                styles.historyCount
              }
            >
              {Math.min(
                leituras.length,
                100
              )}{' '}
              registros
            </Text>
          </View>

          {leituras.length === 0 ? (
            <View
              style={
                styles.emptyHistory
              }
            >
              <MaterialIcons
                name="history"
                size={34}
                color="#334155"
              />

              <Text
                style={
                  styles.emptyHistoryText
                }
              >
                Nenhuma leitura recebida
                ainda.
              </Text>
            </View>
          ) : (
            leituras
              .slice(0, 20)
              .map((dados) => {
                let cor = '#22C55E';

                if (
                  dados.status ===
                  'CRÍTICO'
                ) {
                  cor = '#EF4444';
                } else if (
                  dados.status ===
                  'ATENÇÃO'
                ) {
                  cor = '#F59E0B';
                }

                return (
                  <View
                    key={dados.id}
                    style={[
                      styles.historyCard,
                      {
                        borderLeftColor:
                          cor,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.historyTop
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.historyTime
                          }
                        >
                          {formatarData(
                            dados.created_at
                          )}{' '}
                          •{' '}
                          {formatarHora(
                            dados.created_at
                          )}
                        </Text>

                        <Text
                          style={
                            styles.historyMain
                          }
                        >
                          Sensor{' '}
                          {dados.sensor_id}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.historyStatus,
                          {
                            backgroundColor:
                              cor + '18',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyStatusText,
                            {
                              color: cor,
                            },
                          ]}
                        >
                          {dados.status}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.historyBottom
                      }
                    >
                      <Text
                        style={
                          styles.historyItem
                        }
                      >
                        Fumaça:{' '}
                        {Number(
                          dados.valor_fumaca
                        ).toFixed(0)}
                        %
                      </Text>

                      <Text
                        style={
                          styles.historyItem
                        }
                      >
                        Temperatura:{' '}
                        {Number(
                          dados.temperatura
                        ).toFixed(1)}
                        °C
                      </Text>

                      <Text
                        style={
                          styles.historyItem
                        }
                      >
                        Umidade:{' '}
                        {Number(
                          dados.umidade
                        ).toFixed(1)}
                        %
                      </Text>

                      {dados.fogo && (
                        <Text
                          style={
                            styles.fireText
                          }
                        >
                          FOGO DETECTADO
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
          )}

          <TouchableOpacity
            style={
              styles.emergencyButton
            }
            onPress={
              ligarEmergencia
            }
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="phone"
              size={29}
              color="#FFFFFF"
            />

            <View
              style={
                styles.emergencyContent
              }
            >
              <Text
                style={
                  styles.emergencyTitle
                }
              >
                EMERGÊNCIA
              </Text>

              <Text
                style={
                  styles.emergencyText
                }
              >
                Ligar para o Corpo de
                Bombeiros
              </Text>
            </View>

            <Text
              style={
                styles.emergencyNumber
              }
            >
              193
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

/*
 * =======================================================
 * ESTILOS
 * =======================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  content: {
    flexGrow: 1,
  },

  page: {
    backgroundColor: '#030712',
  },

  body: {
    width: '100%',
  },

  loading: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },

  /*
   * HEADER
   */

  header: {
    paddingTop: 45,
    paddingBottom: 38,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerBrand: {
    flex: 1,
    paddingRight: 15,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#86EFAC',
    fontSize: 11,
    marginTop: 4,
    maxWidth: 280,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    marginRight: 6,
  },

  onlineText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '900',
  },

  greeting: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 30,
  },

  greetingSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 5,
  },

  /*
   * STATUS
   */

  statusCard: {
    backgroundColor: '#0B1220',
    marginTop: -18,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },

  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 57,
    height: 57,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  statusLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },

  smokeArea: {
    alignItems: 'center',
    marginTop: 20,
  },

  smokeNumberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  smokeNumber: {
    color: '#FFFFFF',
    fontSize: 55,
    fontWeight: '900',
  },

  smokePercent: {
    color: '#94A3B8',
    fontSize: 24,
    marginLeft: 3,
  },

  smokeLabel: {
    color: '#64748B',
    fontSize: 12,
  },

  progressBackground: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 20,
  },

  progressFill: {
    height: 8,
    borderRadius: 10,
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  progressLabel: {
    color: '#475569',
    fontSize: 10,
  },

  /*
   * TÍTULOS
   */

  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 28,
    marginBottom: 12,
  },

  sectionTitleNoMargin: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  /*
   * SENSORES
   */

  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sensorGridNotebook: {
    gap: 18,
  },

  sensorCard: {
    width: '48%',
    backgroundColor: '#0B1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },

  sensorCardNotebook: {
    flex: 1,
    width: undefined,
    padding: 20,
  },

  sensorIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sensorTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 11,
  },

  sensorSmoke: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 3,
  },

  sensorUnit: {
    color: '#475569',
    fontSize: 10,
    marginTop: -1,
  },

  sensorData: {
    marginTop: 14,
    gap: 10,
  },

  sensorDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  sensorDataLabel: {
    color: '#64748B',
    fontSize: 9,
  },

  sensorDataValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },

  sensorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 14,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    marginRight: 6,
  },

  sensorStatusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  /*
   * RESUMO
   */

  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  summaryGridNotebook: {
    gap: 18,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#0B1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#172033',
  },

  summaryCardNotebook: {
    padding: 20,
  },

  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryTitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 9,
  },

  summaryValue: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },

  /*
   * ALERTA
   */

  alertBox: {
    marginTop: 14,
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#2B0D0D',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
  },

  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#451A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '900',
  },

  alertText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  /*
   * WHATSAPP
   */

  whatsappButton: {
    marginTop: 13,
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
  },

  whatsappIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  buttonContent: {
    flex: 1,
  },

  whatsappTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  whatsappSubtitle: {
    color: '#DCFCE7',
    fontSize: 10,
    marginTop: 2,
  },

  /*
   * IA
   */

  aiCard: {
    marginTop: 14,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#166534',
  },

  aiGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  aiContent: {
    flex: 1,
  },

  aiTitle: {
    color: '#ECFDF5',
    fontSize: 16,
    fontWeight: '900',
  },

  aiText: {
    color: '#86EFAC',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  /*
   * ÚLTIMO SINAL
   */

  lastSignal: {
    marginTop: 17,
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

  signalContent: {
    flex: 1,
  },

  signalTitle: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
  },

  signalText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },

  signalStatus: {
    fontSize: 9,
    fontWeight: '900',
  },

  /*
   * HISTÓRICO
   */

  historyHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyCount: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  historyCard: {
    marginBottom: 9,
    padding: 14,
    backgroundColor: '#0B1220',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#172033',
    borderLeftWidth: 4,
  },

  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyTime: {
    color: '#64748B',
    fontSize: 9,
    marginBottom: 3,
  },

  historyMain: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },

  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  historyStatusText: {
    fontSize: 9,
    fontWeight: '900',
  },

  historyBottom: {
    marginTop: 10,
  },

  historyItem: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  fireText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
  },

  emptyHistory: {
    backgroundColor: '#0B1220',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#172033',
  },

  emptyHistoryText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
  },

  /*
   * EMERGÊNCIA
   */

  emergencyButton: {
    marginTop: 25,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#991B1B',
    borderWidth: 1,
    borderColor: '#B91C1C',
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyContent: {
    flex: 1,
    marginLeft: 13,
  },

  emergencyTitle: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emergencyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  emergencyNumber: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
});