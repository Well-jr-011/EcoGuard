import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../src/lib/supabase';

// =====================================================
// CONFIGURAÇÃO DE CONEXÃO
// =====================================================

// O ESP8266 envia uma leitura a cada 5 segundos.
// Se passarem mais de 15 segundos sem uma nova leitura,
// consideramos que a estação está OFFLINE.
const TEMPO_MAXIMO_OFFLINE = 15000;

// =====================================================
// TIPO DA LEITURA
// =====================================================

interface Leitura {
  id: number | string;
  sensor_id?: number;
  valor_fumaca: number;
  fogo: boolean;
  temperatura: number;
  umidade: number;
  status: string;
  created_at: string;
}

// =====================================================
// HOME
// =====================================================

export default function Home() {
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [ultimaLeitura, setUltimaLeitura] =
    useState<Leitura | null>(null);

  // IMPORTANTE:
  // Este estado representa o ESP8266,
  // não apenas a conexão com o Supabase.
  const [conectado, setConectado] = useState(false);

  const isDesktop = width >= 900;

  // =====================================================
  // INICIALIZAÇÃO + REALTIME
  // =====================================================

  useEffect(() => {
    carregarUltimaLeitura(true);

    const canal = supabase
      .channel('ecoguard_home_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leituras',
          filter: 'sensor_id=eq.1',
        },
        (payload) => {
          console.log(
            '📡 NOVA LEITURA DA ESTAÇÃO:',
            payload.new
          );

          const novaLeitura =
            converterLeitura(payload.new);

          setUltimaLeitura(novaLeitura);

          // AQUI SIM sabemos que o ESP8266
          // acabou de enviar uma leitura.
          setConectado(true);

          setAtualizando(false);
        }
      )
      .subscribe((status) => {
        console.log(
          '📡 Status Realtime:',
          status
        );

        // IMPORTANTE:
        // SUBSCRIBED significa somente que o
        // aplicativo conseguiu se inscrever no
        // Realtime do Supabase.
        //
        // NÃO significa que o ESP8266 está online.
        if (status === 'SUBSCRIBED') {
          console.log(
            '📡 Realtime conectado. Aguardando leitura do ESP8266...'
          );
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          console.log(
            '❌ Realtime indisponível.'
          );
        }
      });

    // ===================================================
    // VERIFICAR SE O ESP8266 PAROU DE ENVIAR
    // ===================================================

    const verificarConexao = setInterval(() => {
      setUltimaLeitura((leituraAtual) => {
        if (!leituraAtual) {
          setConectado(false);
          return leituraAtual;
        }

        const dataLeitura = new Date(
          leituraAtual.created_at
        );

        const tempoDaLeitura =
          dataLeitura.getTime();

        if (
          !Number.isFinite(tempoDaLeitura)
        ) {
          console.log(
            '⚠️ Data da leitura inválida.'
          );

          setConectado(false);

          return leituraAtual;
        }

        const idadeDaLeitura =
          Date.now() - tempoDaLeitura;

        const estaOnline =
          idadeDaLeitura <=
          TEMPO_MAXIMO_OFFLINE;

        setConectado(estaOnline);

        if (!estaOnline) {
          console.log(
            '🔴 ESP8266 considerado OFFLINE.',
            `${Math.round(
              idadeDaLeitura / 1000
            )} segundos sem leitura.`
          );
        }

        return leituraAtual;
      });
    }, 3000);

    // ===================================================
    // LIMPEZA
    // ===================================================

    return () => {
      clearInterval(verificarConexao);
      supabase.removeChannel(canal);
    };
  }, []);

  // =====================================================
  // CARREGAR ÚLTIMA LEITURA
  // =====================================================

  async function carregarUltimaLeitura(
    mostrarLoading = false
  ) {
    try {
      if (mostrarLoading) {
        setLoading(true);
      } else {
        setAtualizando(true);
      }

      const { data, error } = await supabase
        .from('leituras')
        .select(
          `
            id,
            sensor_id,
            valor_fumaca,
            fogo,
            temperatura,
            umidade,
            created_at
          `
        )
        .eq('sensor_id', 1)
        .order('created_at', {
          ascending: false,
        })
        .limit(1);

      if (error) {
        throw error;
      }

      // =================================================
      // NENHUMA LEITURA
      // =================================================

      if (!data || data.length === 0) {
        setUltimaLeitura(null);
        setConectado(false);
        return;
      }

      const leitura =
        converterLeitura(data[0]);

      setUltimaLeitura(leitura);

      // =================================================
      // VERIFICAR A IDADE DA LEITURA
      // =================================================

      const dataLeitura = new Date(
        leitura.created_at
      );

      const tempoDaLeitura =
        dataLeitura.getTime();

      if (
        !Number.isFinite(tempoDaLeitura)
      ) {
        console.log(
          '⚠️ Leitura encontrada, mas a data é inválida.'
        );

        setConectado(false);
        return;
      }

      const idadeDaLeitura =
        Date.now() - tempoDaLeitura;

      const estaOnline =
        idadeDaLeitura <=
        TEMPO_MAXIMO_OFFLINE;

      setConectado(estaOnline);

      console.log(
        '📊 Última leitura:',
        leitura
      );

      console.log(
        '⏱️ Idade da leitura:',
        Math.round(
          idadeDaLeitura / 1000
        ),
        'segundos'
      );

      console.log(
        estaOnline
          ? '🟢 ESP8266 ONLINE'
          : '🔴 ESP8266 OFFLINE'
      );
    } catch (error) {
      console.log(
        '❌ Erro ao carregar leitura:',
        error
      );

      setConectado(false);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  // =====================================================
  // CONVERTER LEITURA
  // =====================================================

  function converterLeitura(
    item: any
  ): Leitura {
    const valorFumaca =
      Number(item.valor_fumaca);

    const valorTemperatura =
      Number(item.temperatura);

    const valorUmidade =
      Number(item.umidade);

    const fumaca =
      Number.isFinite(valorFumaca)
        ? valorFumaca
        : 0;

    const temperatura =
      Number.isFinite(valorTemperatura)
        ? valorTemperatura
        : 0;

    const umidade =
      Number.isFinite(valorUmidade)
        ? valorUmidade
        : 0;

    const fogo =
      item.fogo === true ||
      item.fogo === 'true' ||
      item.fogo === 1 ||
      item.fogo === '1' ||
      item.fogo === 'TRUE';

    const status =
      calcularStatus(
        fumaca,
        temperatura,
        fogo
      );

    return {
      id: item.id,
      sensor_id: Number(
        item.sensor_id ?? 1
      ),
      valor_fumaca: fumaca,
      fogo,
      temperatura,
      umidade,
      status,
      created_at:
        item.created_at,
    };
  }

  // =====================================================
  // CALCULAR STATUS
  // =====================================================

  function calcularStatus(
    fumaca: number,
    temperatura: number,
    fogo: boolean
  ) {
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

  // =====================================================
  // STATUS VISUAL
  // =====================================================

  // Se não existe leitura, NÃO mostramos SEGURO.
  const statusAtual =
    ultimaLeitura?.status ??
    'SEM LEITURA';

  const corStatus =
    obterCorStatus(statusAtual);

  const iconeStatus =
    obterIconeStatus(statusAtual);

  // =====================================================
  // CARREGAMENTO
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingIcon}>
          <MaterialIcons
            name="eco"
            size={42}
            color="#22C55E"
          />
        </View>

        <Text style={styles.loadingTitle}>
          EcoGuard
        </Text>

        <Text style={styles.loadingText}>
          Conectando ao monitoramento...
        </Text>

        <ActivityIndicator
          size="small"
          color="#22C55E"
          style={{
            marginTop: 20,
          }}
        />
      </View>
    );
  }

  // =====================================================
  // HOME
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 145,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.content,
          isDesktop &&
            styles.contentDesktop,
        ]}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <LinearGradient
          colors={[
            '#0D3B27',
            '#082A1D',
            '#030712',
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.headerCard}
        >
          <View style={styles.headerTop}>
            <View style={styles.logoArea}>
              <View style={styles.logoIcon}>
                <MaterialIcons
                  name="eco"
                  size={29}
                  color="#4ADE80"
                />
              </View>

              <View>
                <Text style={styles.logo}>
                  EcoGuard
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  Prevenção de queimadas
                </Text>
              </View>
            </View>

            {atualizando && (
              <ActivityIndicator
                size="small"
                color="#4ADE80"
              />
            )}
          </View>

          {/* =================================================
              CONEXÃO REAL DO ESP8266
          ================================================= */}

          <View
            style={[
              styles.connectionBadge,
              {
                backgroundColor:
                  conectado
                    ? '#052E16'
                    : '#3F1111',

                borderColor:
                  conectado
                    ? '#166534'
                    : '#7F1D1D',
              },
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor:
                    conectado
                      ? '#22C55E'
                      : '#EF4444',
                },
              ]}
            />

            <Text
              style={[
                styles.connectionText,
                {
                  color:
                    conectado
                      ? '#86EFAC'
                      : '#FCA5A5',
                },
              ]}
            >
              {conectado
                ? 'SISTEMA ONLINE'
                : 'SISTEMA OFFLINE'}
            </Text>
          </View>
        </LinearGradient>

        {/* =================================================
            STATUS PRINCIPAL
        ================================================= */}

        <View style={styles.section}>
          <View
            style={styles.sectionHeader}
          >
            <View>
              <Text
                style={styles.sectionLabel}
              >
                MONITORAMENTO
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                Status do ambiente
              </Text>
            </View>

            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor:
                    corStatus + '18',

                  borderColor:
                    corStatus + '40',
                },
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor:
                      corStatus,
                  },
                ]}
              />

              <Text
                style={[
                  styles.liveText,
                  {
                    color:
                      corStatus,
                  },
                ]}
              >
                {ultimaLeitura
                  ? 'AO VIVO'
                  : 'SEM DADOS'}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={[
              corStatus + '25',
              '#0B1220',
              '#0B1220',
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={[
              styles.statusCard,
              {
                borderColor:
                  corStatus + '65',
              },
            ]}
          >
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor:
                    corStatus + '15',

                  borderColor:
                    corStatus + '55',
                },
              ]}
            >
              <MaterialIcons
                name={
                  iconeStatus as any
                }
                size={46}
                color={corStatus}
              />
            </View>

            <View
              style={styles.statusContent}
            >
              <Text
                style={styles.statusSmallLabel}
              >
                SITUAÇÃO ATUAL
              </Text>

              <Text
                style={[
                  styles.statusValue,
                  {
                    color:
                      corStatus,
                  },
                ]}
              >
                {statusAtual}
              </Text>

              <Text
                style={
                  styles.statusDescription
                }
              >
                {obterDescricaoStatus(
                  statusAtual
                )}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* =================================================
            ALERTA DE FOGO
        ================================================= */}

        {ultimaLeitura?.fogo && (
          <View style={styles.fireAlert}>
            <View
              style={styles.fireAlertIcon}
            >
              <MaterialIcons
                name="local-fire-department"
                size={28}
                color="#EF4444"
              />
            </View>

            <View
              style={
                styles.fireAlertContent
              }
            >
              <Text
                style={
                  styles.fireAlertTitle
                }
              >
                FOGO DETECTADO
              </Text>

              <Text
                style={
                  styles.fireAlertText
                }
              >
                O sensor identificou uma
                possível chama no ambiente
                monitorado.
              </Text>
            </View>
          </View>
        )}

        {/* =================================================
            LEITURAS
        ================================================= */}

        <View style={styles.section}>
          <View
            style={styles.sectionHeader}
          >
            <View>
              <Text
                style={styles.sectionLabel}
              >
                SENSORES
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                Leitura em tempo real
              </Text>
            </View>

            <View
              style={styles.stationMiniBadge}
            >
              <MaterialIcons
                name="sensors"
                size={14}
                color="#4ADE80"
              />

              <Text
                style={
                  styles.stationMiniText
                }
              >
                ESTAÇÃO 01
              </Text>
            </View>
          </View>

          {ultimaLeitura ? (
            <View
              style={[
                styles.sensorGrid,
                isDesktop &&
                  styles.sensorGridDesktop,
              ]}
            >
              {/* FUMAÇA */}

              <SensorCard
                icon="cloud"
                title="Fumaça"
                value={`${formatarNumero(
                  ultimaLeitura.valor_fumaca
                )}%`}
                description="Nível detectado"
                color={
                  ultimaLeitura
                    .valor_fumaca >= 70
                    ? '#EF4444'
                    : ultimaLeitura
                        .valor_fumaca >= 40
                    ? '#F59E0B'
                    : '#38BDF8'
                }
                progress={Math.min(
                  Math.max(
                    ultimaLeitura.valor_fumaca,
                    0
                  ),
                  100
                )}
              />

              {/* TEMPERATURA */}

              <SensorCard
                icon="thermostat"
                title="Temperatura"
                value={`${formatarNumero(
                  ultimaLeitura.temperatura
                )}°C`}
                description="Temperatura atual"
                color={
                  ultimaLeitura
                    .temperatura >= 60
                    ? '#EF4444'
                    : ultimaLeitura
                        .temperatura >= 40
                    ? '#F59E0B'
                    : '#F97316'
                }
                progress={Math.min(
                  Math.max(
                    (ultimaLeitura
                      .temperatura /
                      80) *
                      100,
                    0
                  ),
                  100
                )}
              />

              {/* UMIDADE */}

              <SensorCard
                icon="water-drop"
                title="Umidade"
                value={`${formatarNumero(
                  ultimaLeitura.umidade
                )}%`}
                description="Umidade do ambiente"
                color="#60A5FA"
                progress={Math.min(
                  Math.max(
                    ultimaLeitura.umidade,
                    0
                  ),
                  100
                )}
              />

              {/* FOGO */}

              <SensorCard
                icon="local-fire-department"
                title="Fogo"
                value={
                  ultimaLeitura.fogo
                    ? 'DETECTADO'
                    : 'NORMAL'
                }
                description={
                  ultimaLeitura.fogo
                    ? 'Atenção imediata'
                    : 'Nenhuma chama detectada'
                }
                color={
                  ultimaLeitura.fogo
                    ? '#EF4444'
                    : '#22C55E'
                }
                valueSmall
                fire={
                  ultimaLeitura.fogo
                }
                progress={
                  ultimaLeitura.fogo
                    ? 100
                    : 0
                }
              />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View
                style={styles.emptyIcon}
              >
                <MaterialIcons
                  name="sensors-off"
                  size={38}
                  color="#475569"
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Nenhuma leitura encontrada
              </Text>

              <Text
                style={styles.emptyText}
              >
                O ESP8266 ainda não enviou
                dados para o EcoGuard.
              </Text>
            </View>
          )}
        </View>

        {/* =================================================
            ÚLTIMA ATUALIZAÇÃO
        ================================================= */}

        {ultimaLeitura && (
          <View
            style={styles.updateCard}
          >
            <View
              style={styles.updateIcon}
            >
              <MaterialIcons
                name="update"
                size={22}
                color="#22C55E"
              />
            </View>

            <View
              style={styles.updateContent}
            >
              <Text
                style={styles.updateTitle}
              >
                Última leitura recebida
              </Text>

              <Text
                style={styles.updateDate}
              >
                {formatarData(
                  ultimaLeitura.created_at
                )}
              </Text>
            </View>

            <View
              style={[
                styles.connectedSmall,
                {
                  backgroundColor:
                    conectado
                      ? '#052E16'
                      : '#3F1111',
                },
              ]}
            >
              <View
                style={[
                  styles.connectedSmallDot,
                  {
                    backgroundColor:
                      conectado
                        ? '#22C55E'
                        : '#EF4444',
                  },
                ]}
              />

              <Text
                style={[
                  styles.connectedSmallText,
                  {
                    color:
                      conectado
                        ? '#4ADE80'
                        : '#FCA5A5',
                  },
                ]}
              >
                {conectado
                  ? 'CONECTADO'
                  : 'OFFLINE'}
              </Text>
            </View>
          </View>
        )}

        {/* =================================================
            RODAPÉ INFORMATIVO
        ================================================= */}

        <View
          style={styles.footerInfo}
        >
          <MaterialIcons
            name="security"
            size={19}
            color="#22C55E"
          />

          <Text
            style={styles.footerText}
          >
            O EcoGuard monitora continuamente
            as condições ambientais da estação.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// =====================================================
// CARD DOS SENSORES
// =====================================================

function SensorCard({
  icon,
  title,
  value,
  description,
  color,
  progress,
  valueSmall = false,
  fire = false,
}: {
  icon: string;
  title: string;
  value: string;
  description: string;
  color: string;
  progress: number;
  valueSmall?: boolean;
  fire?: boolean;
}) {
  return (
    <View
      style={[
        styles.sensorCard,
        {
          borderColor: fire
            ? '#EF444460'
            : color + '30',
        },
      ]}
    >
      <View
        style={styles.sensorHeader}
      >
        <View
          style={[
            styles.sensorIcon,
            {
              backgroundColor:
                color + '16',
            },
          ]}
        >
          <MaterialIcons
            name={icon as any}
            size={27}
            color={color}
          />
        </View>

        {fire && (
          <View
            style={styles.dangerDot}
          >
            <View
              style={
                styles.dangerDotInner
              }
            />
          </View>
        )}
      </View>

      <Text
        style={styles.sensorTitle}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.sensorValue,
          valueSmall &&
            styles.sensorValueSmall,
          {
            color: fire
              ? '#EF4444'
              : '#FFFFFF',
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.sensorDescription
        }
      >
        {description}
      </Text>

      <View
        style={
          styles.progressBackground
        }
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(
                3,
                Math.min(
                  progress,
                  100
                )
              )}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

// =====================================================
// FORMATAÇÃO
// =====================================================

function formatarNumero(
  valor: number
) {
  if (!Number.isFinite(valor)) {
    return '0';
  }

  if (Number.isInteger(valor)) {
    return String(valor);
  }

  return valor.toFixed(1);
}

function formatarData(
  data: string
) {
  const dataConvertida =
    new Date(data);

  if (
    !Number.isFinite(
      dataConvertida.getTime()
    )
  ) {
    return 'Data indisponível';
  }

  return dataConvertida.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  );
}

// =====================================================
// STATUS
// =====================================================

function obterCorStatus(
  status: string
) {
  if (
    status === 'CRÍTICO' ||
    status === 'CRITICO'
  ) {
    return '#EF4444';
  }

  if (
    status === 'ATENÇÃO' ||
    status === 'ATENCAO'
  ) {
    return '#F59E0B';
  }

  if (
    status === 'SEM LEITURA'
  ) {
    return '#64748B';
  }

  return '#22C55E';
}

function obterIconeStatus(
  status: string
) {
  if (
    status === 'CRÍTICO' ||
    status === 'CRITICO'
  ) {
    return 'warning';
  }

  if (
    status === 'ATENÇÃO' ||
    status === 'ATENCAO'
  ) {
    return 'report-problem';
  }

  if (
    status === 'SEM LEITURA'
  ) {
    return 'sensors-off';
  }

  return 'verified';
}

function obterDescricaoStatus(
  status: string
) {
  if (
    status === 'CRÍTICO' ||
    status === 'CRITICO'
  ) {
    return 'Foi identificado um risco crítico. Verifique o ambiente imediatamente.';
  }

  if (
    status === 'ATENÇÃO' ||
    status === 'ATENCAO'
  ) {
    return 'Os sensores identificaram condições que merecem atenção.';
  }

  if (
    status === 'SEM LEITURA'
  ) {
    return 'Ainda não foi recebida nenhuma leitura da estação de monitoramento.';
  }

  return 'As condições monitoradas estão dentro dos níveis seguros.';
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  content: {
    width: '100%',
  },

  contentDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
  },

  // ===================================================
  // LOADING
  // ===================================================

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030712',
    padding: 20,
  },

  loadingIcon: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 18,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },

  // ===================================================
  // HEADER
  // ===================================================

  headerCard: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 25,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: '#86A99A',
    fontSize: 11,
    marginTop: 3,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 19,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    marginRight: 7,
  },

  connectionText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // ===================================================
  // SEÇÕES
  // ===================================================

  section: {
    marginHorizontal: 20,
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    marginRight: 5,
  },

  liveText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusCard: {
    minHeight: 154,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  statusIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  statusContent: {
    flex: 1,
  },

  statusSmallLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  statusValue: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },

  statusDescription: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 500,
  },

  // ===================================================
  // ALERTA DE FOGO
  // ===================================================

  fireAlert: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#2A0D0D',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
  },

  fireAlertIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#450A0A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  fireAlertContent: {
    flex: 1,
  },

  fireAlertTitle: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  fireAlertText: {
    color: '#FCA5A5',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  // ===================================================
  // SENSORES
  // ===================================================

  stationMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#14532D',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  stationMiniText: {
    color: '#4ADE80',
    fontSize: 7,
    fontWeight: '900',
    marginLeft: 4,
  },

  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  sensorGridDesktop: {
    gap: 12,
  },

  sensorCard: {
    width: '48.5%',
    minHeight: 190,
    backgroundColor: '#0B1220',
    borderRadius: 21,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sensorIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dangerDot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#450A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dangerDotInner: {
    width: 5,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },

  sensorTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 13,
  },

  sensorValue: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 2,
  },

  sensorValueSmall: {
    fontSize: 17,
    marginTop: 8,
  },

  sensorDescription: {
    color: '#475569',
    fontSize: 9,
    marginTop: 5,
  },

  progressBackground: {
    height: 4,
    backgroundColor: '#172033',
    borderRadius: 10,
    marginTop: 14,
    overflow: 'hidden',
  },

  progressFill: {
    height: 4,
    borderRadius: 10,
  },

  // ===================================================
  // SEM LEITURA
  // ===================================================

  emptyCard: {
    minHeight: 190,
    backgroundColor: '#0B1220',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#172033',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 6,
    maxWidth: 300,
  },

  // ===================================================
  // ATUALIZAÇÃO
  // ===================================================

  updateCard: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
  },

  updateIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#052E16',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  updateContent: {
    flex: 1,
  },

  updateTitle: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },

  updateDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 4,
  },

  connectedSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },

  connectedSmallDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    marginRight: 5,
  },

  connectedSmallText: {
    fontSize: 7,
    fontWeight: '900',
  },

  // ===================================================
  // RODAPÉ
  // ===================================================

  footerInfo: {
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerText: {
    flex: 1,
    color: '#475569',
    fontSize: 9,
    lineHeight: 14,
    marginLeft: 8,
  },
});