import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from 'react';
  
  import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
  } from 'react-native';
  
  import { MaterialIcons } from '@react-native-vector-icons/material-icons';
  import { LinearGradient } from 'expo-linear-gradient';
  
  import { supabase } from '../src/lib/supabase';
  
  // =====================================================
  // TIPOS
  // =====================================================
  
  type Status = 'CRITICO' | 'ATENCAO' | 'SEGURO';
  
  type Leitura = {
    id: number | string;
    sensor_id?: number | string | null;
    valor_fumaca?: number | string | null;
    fogo?: boolean | string | number | null;
    temperatura?: number | string | null;
    umidade?: number | string | null;
    status?: string | null;
    created_at: string;
  };
  
  // =====================================================
  // MESES
  // =====================================================
  
  const MESES = [
    'Janeiro',
    'Fevereiro',
    'MarÃ§o',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  
  // =====================================================
  // FUNÃ‡Ã•ES AUXILIARES
  // =====================================================
  
  function numero(valor: unknown): number {
    const n = Number(valor);
  
    return Number.isFinite(n) ? n : 0;
  }
  
  function fogoDetectado(valor: unknown): boolean {
    return (
      valor === true ||
      valor === 'true' ||
      valor === 1 ||
      valor === '1'
    );
  }
  
  function calcularStatus(leitura: Leitura): Status {
    const fumaca = numero(
      leitura.valor_fumaca
    );
  
    const temperatura = numero(
      leitura.temperatura
    );
  
    const fogo = fogoDetectado(
      leitura.fogo
    );
  
    if (
      fogo ||
      fumaca >= 70 ||
      temperatura >= 60
    ) {
      return 'CRITICO';
    }
  
    if (
      fumaca >= 40 ||
      temperatura >= 40
    ) {
      return 'ATENCAO';
    }
  
    return 'SEGURO';
  }
  
  function formatarData(data: string) {
    const d = new Date(data);
  
    if (Number.isNaN(d.getTime())) {
      return '--/--/----';
    }
  
    return d.toLocaleDateString('pt-BR');
  }
  
  function formatarHora(data: string) {
    const d = new Date(data);
  
    if (Number.isNaN(d.getTime())) {
      return '--:--';
    }
  
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  function nomeStatus(status: Status) {
    if (status === 'CRITICO') {
      return 'CRÃTICO';
    }
  
    if (status === 'ATENCAO') {
      return 'ATENÃ‡ÃƒO';
    }
  
    return 'SEGURO';
  }
  
  function iconeStatus(status: Status) {
    if (status === 'CRITICO') {
      return 'warning';
    }
  
    if (status === 'ATENCAO') {
      return 'priority-high';
    }
  
    return 'check-circle';
  }
  
  function corStatus(status: Status) {
    if (status === 'CRITICO') {
      return '#EF4444';
    }
  
    if (status === 'ATENCAO') {
      return '#F59E0B';
    }
  
    return '#22C55E';
  }
  
  // =====================================================
  // TELA
  // =====================================================
  
  export default function LevantamentoScreen() {
    const { width } = useWindowDimensions();
  
    const isDesktop = width >= 900;
  
    const agora = new Date();
  
    const [mes, setMes] = useState(
      agora.getMonth()
    );
  
    const [ano, setAno] = useState(
      agora.getFullYear()
    );
  
    const [leituras, setLeituras] =
      useState<Leitura[]>([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [erro, setErro] =
      useState<string | null>(null);
  
    // ===================================================
    // CARREGAR LEITURAS
    // ===================================================
  
    const carregarLeituras =
      useCallback(async () => {
        try {
          setLoading(true);
          setErro(null);
  
          const inicio = new Date(
            ano,
            mes,
            1
          );
  
          const fim = new Date(
            ano,
            mes + 1,
            1
          );
  
          const { data, error } =
            await supabase
              .from('leituras')
              .select(`
                id,
                sensor_id,
                valor_fumaca,
                fogo,
                temperatura,
                umidade,
                status,
                created_at
              `)
              .eq('sensor_id', 1)
              .gte(
                'created_at',
                inicio.toISOString()
              )
              .lt(
                'created_at',
                fim.toISOString()
              )
              .order('created_at', {
                ascending: false,
              });
  
          if (error) {
            throw error;
          }
  
          setLeituras(
            (data || []) as Leitura[]
          );
        } catch (error) {
          console.log(
            'Erro ao carregar levantamento:',
            error
          );
  
          setErro(
            'NÃ£o foi possÃ­vel carregar os dados deste mÃªs.'
          );
  
          setLeituras([]);
        } finally {
          setLoading(false);
        }
      }, [mes, ano]);
  
    // ===================================================
    // CARREGAMENTO INICIAL
    // ===================================================
  
    useEffect(() => {
      carregarLeituras();
    }, [carregarLeituras]);
  
    // ===================================================
    // REALTIME
    // ===================================================
  
    useEffect(() => {
      const channel = supabase
        .channel(
          'levantamento_leituras'
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leituras',
            filter: 'sensor_id=eq.1',
          },
          () => {
            carregarLeituras();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, [carregarLeituras]);
  
    // ===================================================
    // NAVEGAÃ‡ÃƒO DE MESES
    // ===================================================
  
    const voltarMes = () => {
      if (mes === 0) {
        setMes(11);
        setAno(ano - 1);
      } else {
        setMes(mes - 1);
      }
    };
  
    const avancarMes = () => {
      if (mes === 11) {
        setMes(0);
        setAno(ano + 1);
      } else {
        setMes(mes + 1);
      }
    };
  
    // ===================================================
    // ESTATÃSTICAS
    // ===================================================
  
    const estatisticas = useMemo(() => {
      let criticos = 0;
      let atencao = 0;
      let seguros = 0;
  
      let somaFumaca = 0;
      let somaTemperatura = 0;
      let somaUmidade = 0;
  
      let maiorTemperatura = 0;
      let maiorFumaca = 0;
  
      leituras.forEach(
        (leitura) => {
          const status =
            calcularStatus(leitura);
  
          if (status === 'CRITICO') {
            criticos++;
          }
  
          if (status === 'ATENCAO') {
            atencao++;
          }
  
          if (status === 'SEGURO') {
            seguros++;
          }
  
          const fumaca = numero(
            leitura.valor_fumaca
          );
  
          const temperatura =
            numero(
              leitura.temperatura
            );
  
          const umidade = numero(
            leitura.umidade
          );
  
          somaFumaca += fumaca;
          somaTemperatura +=
            temperatura;
          somaUmidade += umidade;
  
          maiorTemperatura =
            Math.max(
              maiorTemperatura,
              temperatura
            );
  
          maiorFumaca =
            Math.max(
              maiorFumaca,
              fumaca
            );
        }
      );
  
      const total =
        leituras.length;
  
      return {
        total,
        criticos,
        atencao,
        seguros,
  
        mediaFumaca:
          total > 0
            ? somaFumaca / total
            : 0,
  
        mediaTemperatura:
          total > 0
            ? somaTemperatura /
              total
            : 0,
  
        mediaUmidade:
          total > 0
            ? somaUmidade / total
            : 0,
  
        maiorTemperatura,
        maiorFumaca,
      };
    }, [leituras]);
  
    const percentual = (
      valor: number
    ) => {
      if (
        estatisticas.total === 0
      ) {
        return 0;
      }
  
      return Math.round(
        (valor /
          estatisticas.total) *
          100
      );
    };
  
    // ===================================================
    // RENDER
    // ===================================================
  
    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
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
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.logoArea}>
                <View
                  style={styles.logoIcon}
                >
                  <MaterialIcons
                    name="eco"
                    size={28}
                    color="#4ADE80"
                  />
                </View>
  
                <View>
                  <Text
                    style={styles.logoText}
                  >
                    EcoGuard
                  </Text>
  
                  <Text
                    style={
                      styles.logoSubtext
                    }
                  >
                    ANÃLISE AMBIENTAL
                  </Text>
                </View>
              </View>
  
              <View
                style={
                  styles.activeBadge
                }
              >
                <View
                  style={
                    styles.activeDot
                  }
                />
  
                <Text
                  style={
                    styles.activeText
                  }
                >
                  ESTAÃ‡ÃƒO ATIVA
                </Text>
              </View>
            </View>
  
            <View
              style={
                styles.headerTitleArea
              }
            >
              <Text
                style={styles.headerTitle}
              >
                Levantamento
              </Text>
  
              <Text
                style={
                  styles.headerDescription
                }
              >
                Acompanhe o comportamento
                ambiental da estaÃ§Ã£o ao
                longo do perÃ­odo analisado.
              </Text>
            </View>
          </LinearGradient>
  
          {/* =================================================
              CONTEÃšDO
          ================================================= */}
  
          <View
            style={[
              styles.content,
              isDesktop &&
                styles.contentDesktop,
            ]}
          >
            {/* =================================================
                PERÃODO
            ================================================= */}
  
            <View
              style={
                styles.monthCard
              }
            >
              <View>
                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  PERÃODO ANALISADO
                </Text>
  
                <Text
                  style={
                    styles.monthTitle
                  }
                >
                  {MESES[mes]} {ano}
                </Text>
              </View>
  
              <View
                style={
                  styles.monthButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.monthButton
                  }
                  onPress={
                    voltarMes
                  }
                >
                  <MaterialIcons
                    name="chevron-left"
                    size={25}
                    color="#CBD5E1"
                  />
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={
                    styles.monthButton
                  }
                  onPress={
                    avancarMes
                  }
                >
                  <MaterialIcons
                    name="chevron-right"
                    size={25}
                    color="#CBD5E1"
                  />
                </TouchableOpacity>
              </View>
            </View>
  
            {/* =================================================
                ESTAÃ‡ÃƒO
            ================================================= */}
  
            <View
              style={
                styles.stationCard
              }
            >
              <View
                style={
                  styles.stationIcon
                }
              >
                <MaterialIcons
                  name="sensors"
                  size={24}
                  color="#22C55E"
                />
              </View>
  
              <View
                style={
                  styles.stationInfo
                }
              >
                <Text
                  style={
                    styles.stationName
                  }
                >
                  EstaÃ§Ã£o EcoGuard
                </Text>
  
                <Text
                  style={
                    styles.stationDescription
                  }
                >
                  ESP8266 â€¢ Monitoramento
                  em tempo real
                </Text>
              </View>
  
              <View
                style={
                  styles.uniqueBadge
                }
              >
                <Text
                  style={
                    styles.uniqueText
                  }
                >
                  ESTAÃ‡ÃƒO 01
                </Text>
              </View>
            </View>
  
            {/* =================================================
                LOADING
            ================================================= */}
  
            {loading ? (
              <View
                style={
                  styles.loadingCard
                }
              >
                <View
                  style={
                    styles.loadingIcon
                  }
                >
                  <MaterialIcons
                    name="analytics"
                    size={30}
                    color="#22C55E"
                  />
                </View>
  
                <ActivityIndicator
                  size="small"
                  color="#22C55E"
                />
  
                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Analisando leituras...
                </Text>
              </View>
            ) : erro ? (
              /* =================================================
                 ERRO
              ================================================= */
  
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <MaterialIcons
                    name="cloud-off"
                    size={30}
                    color="#F59E0B"
                  />
                </View>
  
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  NÃ£o foi possÃ­vel carregar
                </Text>
  
                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {erro}
                </Text>
  
                <TouchableOpacity
                  style={
                    styles.retryButton
                  }
                  onPress={
                    carregarLeituras
                  }
                >
                  <MaterialIcons
                    name="refresh"
                    size={18}
                    color="#FFFFFF"
                  />
  
                  <Text
                    style={
                      styles.retryText
                    }
                  >
                    Tentar novamente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* =================================================
                    RESUMO
                ================================================= */}
  
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Resumo do perÃ­odo
                  </Text>
  
                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    VisÃ£o geral das leituras
                    registradas
                  </Text>
                </View>
  
                <View
                  style={
                    styles.statsGrid
                  }
                >
                  <StatCard
                    icon="sensors"
                    title="Leituras"
                    value={String(
                      estatisticas.total
                    )}
                    subtitle="registros"
                    color="#38BDF8"
                  />
  
                  <StatCard
                    icon="warning"
                    title="CrÃ­ticos"
                    value={String(
                      estatisticas.criticos
                    )}
                    subtitle={`${percentual(
                      estatisticas.criticos
                    )}% do perÃ­odo`}
                    color="#EF4444"
                  />
  
                  <StatCard
                    icon="priority-high"
                    title="AtenÃ§Ã£o"
                    value={String(
                      estatisticas.atencao
                    )}
                    subtitle={`${percentual(
                      estatisticas.atencao
                    )}% do perÃ­odo`}
                    color="#F59E0B"
                  />
  
                  <StatCard
                    icon="check-circle"
                    title="Seguros"
                    value={String(
                      estatisticas.seguros
                    )}
                    subtitle={`${percentual(
                      estatisticas.seguros
                    )}% do perÃ­odo`}
                    color="#22C55E"
                  />
                </View>
  
                {/* =================================================
                    INDICADORES
                ================================================= */}
  
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Indicadores ambientais
                  </Text>
  
                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    MÃ©dias e maiores valores
                    registrados
                  </Text>
                </View>
  
                <View
                  style={
                    styles.indicatorGrid
                  }
                >
                  <IndicatorCard
                    icon="air"
                    title="FumaÃ§a mÃ©dia"
                    value={`${estatisticas.mediaFumaca.toFixed(
                      1
                    )}%`}
                    subtitle={`MÃ¡ximo: ${estatisticas.maiorFumaca.toFixed(
                      1
                    )}%`}
                  />
  
                  <IndicatorCard
                    icon="thermostat"
                    title="Temperatura mÃ©dia"
                    value={`${estatisticas.mediaTemperatura.toFixed(
                      1
                    )}Â°C`}
                    subtitle={`MÃ¡xima: ${estatisticas.maiorTemperatura.toFixed(
                      1
                    )}Â°C`}
                  />
  
                  <IndicatorCard
                    icon="water-drop"
                    title="Umidade mÃ©dia"
                    value={`${estatisticas.mediaUmidade.toFixed(
                      1
                    )}%`}
                    subtitle="Umidade registrada"
                  />
                </View>
  
                {/* =================================================
                    DISTRIBUIÃ‡ÃƒO
                ================================================= */}
  
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    SituaÃ§Ã£o das leituras
                  </Text>
  
                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    DistribuiÃ§Ã£o dos nÃ­veis
                    de seguranÃ§a
                  </Text>
                </View>
  
                <View
                  style={
                    styles.distributionCard
                  }
                >
                  <DistributionRow
                    label="Seguro"
                    value={
                      estatisticas.seguros
                    }
                    percentage={percentual(
                      estatisticas.seguros
                    )}
                    color="#22C55E"
                    icon="check-circle"
                  />
  
                  <DistributionRow
                    label="AtenÃ§Ã£o"
                    value={
                      estatisticas.atencao
                    }
                    percentage={percentual(
                      estatisticas.atencao
                    )}
                    color="#F59E0B"
                    icon="priority-high"
                  />
  
                  <DistributionRow
                    label="CrÃ­tico"
                    value={
                      estatisticas.criticos
                    }
                    percentage={percentual(
                      estatisticas.criticos
                    )}
                    color="#EF4444"
                    icon="warning"
                  />
                </View>
  
                {/* =================================================
                    REGISTROS
                ================================================= */}
  
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Registros do perÃ­odo
                  </Text>
  
                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Ãšltimas leituras recebidas
                    pela estaÃ§Ã£o
                  </Text>
                </View>
  
                {leituras.length === 0 ? (
                  <View
                    style={
                      styles.emptyCard
                    }
                  >
                    <View
                      style={
                        styles.emptyIcon
                      }
                    >
                      <MaterialIcons
                        name="event-note"
                        size={30}
                        color="#64748B"
                      />
                    </View>
  
                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      Nenhuma leitura neste mÃªs
                    </Text>
  
                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      Ainda nÃ£o existem
                      registros para{' '}
                      {MESES[mes]} de {ano}.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.readingsList
                    }
                  >
                    {leituras
                      .slice(0, 50)
                      .map(
                        (leitura) => {
                          const status =
                            calcularStatus(
                              leitura
                            );
  
                          const statusColor =
                            corStatus(
                              status
                            );
  
                          const fumaca =
                            numero(
                              leitura.valor_fumaca
                            );
  
                          const temperatura =
                            numero(
                              leitura.temperatura
                            );
  
                          const umidade =
                            numero(
                              leitura.umidade
                            );
  
                          const fogo =
                            fogoDetectado(
                              leitura.fogo
                            );
  
                          return (
                            <View
                              key={String(
                                leitura.id
                              )}
                              style={
                                styles.readingCard
                              }
                            >
                              <View
                                style={[
                                  styles.readingStatusBar,
                                  {
                                    backgroundColor:
                                      statusColor,
                                  },
                                ]}
                              />
  
                              <View
                                style={
                                  styles.readingMain
                                }
                              >
                                <View
                                  style={
                                    styles.readingDate
                                  }
                                >
                                  <View
                                    style={[
                                      styles.readingIcon,
                                      {
                                        backgroundColor:
                                          `${statusColor}18`,
                                      },
                                    ]}
                                  >
                                    <MaterialIcons
                                      name={
                                        iconeStatus(
                                          status
                                        ) as any
                                      }
                                      size={20}
                                      color={
                                        statusColor
                                      }
                                    />
                                  </View>
  
                                  <View>
                                    <Text
                                      style={
                                        styles.readingDateText
                                      }
                                    >
                                      {formatarData(
                                        leitura.created_at
                                      )}
                                    </Text>
  
                                    <Text
                                      style={
                                        styles.readingTime
                                      }
                                    >
                                      {formatarHora(
                                        leitura.created_at
                                      )}
                                    </Text>
                                  </View>
                                </View>
  
                                <View
                                  style={
                                    styles.readingMetrics
                                  }
                                >
                                  <Metric
                                    icon="air"
                                    label="FumaÃ§a"
                                    value={`${fumaca.toFixed(
                                      0
                                    )}%`}
                                  />
  
                                  <Metric
                                    icon="thermostat"
                                    label="Temp."
                                    value={`${temperatura.toFixed(
                                      1
                                    )}Â°C`}
                                  />
  
                                  <Metric
                                    icon="water-drop"
                                    label="Umidade"
                                    value={`${umidade.toFixed(
                                      0
                                    )}%`}
                                  />
                                </View>
  
                                <View
                                  style={
                                    styles.readingRight
                                  }
                                >
                                  <View
                                    style={[
                                      styles.statusBadge,
                                      {
                                        backgroundColor:
                                          `${statusColor}18`,
                                      },
                                    ]}
                                  >
                                    <MaterialIcons
                                      name={
                                        iconeStatus(
                                          status
                                        ) as any
                                      }
                                      size={13}
                                      color={
                                        statusColor
                                      }
                                    />
  
                                    <Text
                                      style={[
                                        styles.statusBadgeText,
                                        {
                                          color:
                                            statusColor,
                                        },
                                      ]}
                                    >
                                      {nomeStatus(
                                        status
                                      )}
                                    </Text>
                                  </View>
  
                                  {fogo && (
                                    <View
                                      style={
                                        styles.fireBadge
                                      }
                                    >
                                      <MaterialIcons
                                        name="local-fire-department"
                                        size={13}
                                        color="#EF4444"
                                      />
  
                                      <Text
                                        style={
                                          styles.fireText
                                        }
                                      >
                                        FOGO
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>
                          );
                        }
                      )}
  
                    {leituras.length >
                      50 && (
                      <Text
                        style={
                          styles.limitText
                        }
                      >
                        Mostrando as 50
                        leituras mais
                        recentes.
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
  
            {/* =================================================
                RODAPÃ‰
            ================================================= */}
  
            <View
              style={styles.footer}
            >
              <MaterialIcons
                name="eco"
                size={17}
                color="#22C55E"
              />
  
              <Text
                style={
                  styles.footerText
                }
              >
                EcoGuard â€¢ PrevenÃ§Ã£o e
                monitoramento de queimadas
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }
  
  // =====================================================
  // CARD DE ESTATÃSTICA
  // =====================================================
  
  function StatCard({
    icon,
    title,
    value,
    subtitle,
    color,
  }: {
    icon: any;
    title: string;
    value: string;
    subtitle: string;
    color: string;
  }) {
    return (
      <View style={styles.statCard}>
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor:
                `${color}18`,
            },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={21}
            color={color}
          />
        </View>
  
        <Text
          style={styles.statTitle}
        >
          {title}
        </Text>
  
        <Text
          style={styles.statValue}
        >
          {value}
        </Text>
  
        <Text
          style={
            styles.statSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    );
  }
  
  // =====================================================
  // INDICADOR
  // =====================================================
  
  function IndicatorCard({
    icon,
    title,
    value,
    subtitle,
  }: {
    icon: any;
    title: string;
    value: string;
    subtitle: string;
  }) {
    return (
      <View
        style={
          styles.indicatorCard
        }
      >
        <View
          style={
            styles.indicatorTop
          }
        >
          <View
            style={
              styles.indicatorIcon
            }
          >
            <MaterialIcons
              name={icon}
              size={20}
              color="#22C55E"
            />
          </View>
  
          <Text
            style={
              styles.indicatorTitle
            }
          >
            {title}
          </Text>
        </View>
  
        <Text
          style={
            styles.indicatorValue
          }
        >
          {value}
        </Text>
  
        <Text
          style={
            styles.indicatorSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    );
  }
  
  // =====================================================
  // DISTRIBUIÃ‡ÃƒO
  // =====================================================
  
  function DistributionRow({
    label,
    value,
    percentage,
    color,
    icon,
  }: {
    label: string;
    value: number;
    percentage: number;
    color: string;
    icon: any;
  }) {
    return (
      <View
        style={
          styles.distributionRow
        }
      >
        <View
          style={
            styles.distributionInfo
          }
        >
          <View
            style={[
              styles.distributionIcon,
              {
                backgroundColor:
                  `${color}18`,
              },
            ]}
          >
            <MaterialIcons
              name={icon}
              size={17}
              color={color}
            />
          </View>
  
          <Text
            style={
              styles.distributionLabel
            }
          >
            {label}
          </Text>
        </View>
  
        <View
          style={
            styles.progressArea
          }
        >
          <View
            style={
              styles.progressBackground
            }
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor:
                    color,
                },
              ]}
            />
          </View>
        </View>
  
        <Text
          style={[
            styles.distributionPercentage,
            {
              color,
            },
          ]}
        >
          {percentage}%
        </Text>
  
        <Text
          style={
            styles.distributionValue
          }
        >
          {value}
        </Text>
      </View>
    );
  }
  
  // =====================================================
  // MÃ‰TRICA
  // =====================================================
  
  function Metric({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) {
    return (
      <View
        style={styles.metric}
      >
        <MaterialIcons
          name={icon}
          size={15}
          color="#64748B"
        />
  
        <View>
          <Text
            style={
              styles.metricLabel
            }
          >
            {label}
          </Text>
  
          <Text
            style={
              styles.metricValue
            }
          >
            {value}
          </Text>
        </View>
      </View>
    );
  }
  
  // =====================================================
  // ESTILOS
  // =====================================================
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#020617',
    },
  
    scrollContent: {
      paddingBottom: 110,
    },
  
    // ===================================================
    // HEADER
    // ===================================================
  
    header: {
      paddingTop:
        Platform.OS === 'ios'
          ? 55
          : 35,
      paddingBottom: 30,
      paddingHorizontal: 22,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
  
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },
  
    logoArea: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    logoIcon: {
      width: 49,
      height: 49,
      borderRadius: 16,
      backgroundColor:
        '#052E16',
      borderWidth: 1,
      borderColor:
        '#166534',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 11,
    },
  
    logoText: {
      color: '#FFFFFF',
      fontSize: 23,
      fontWeight: '900',
    },
  
    logoSubtext: {
      color: '#86EFAC',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.1,
      marginTop: 3,
    },
  
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#052E16',
      borderWidth: 1,
      borderColor:
        '#14532D',
      borderRadius: 11,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
  
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 10,
      backgroundColor:
        '#22C55E',
      marginRight: 6,
    },
  
    activeText: {
      color: '#86EFAC',
      fontSize: 7,
      fontWeight: '900',
    },
  
    headerTitleArea: {
      marginTop: 28,
    },
  
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 29,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
  
    headerDescription: {
      color: '#94A3B8',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 6,
      maxWidth: 650,
    },
  
    // ===================================================
    // CONTENT
    // ===================================================
  
    content: {
      width: '100%',
      paddingHorizontal: 18,
      paddingTop: 18,
    },
  
    contentDesktop: {
      maxWidth: 1100,
      alignSelf: 'center',
      paddingHorizontal: 25,
    },
  
    // ===================================================
    // MÃŠS
    // ===================================================
  
    monthCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      borderWidth: 1,
      borderColor:
        '#1E293B',
      marginBottom: 12,
    },
  
    smallLabel: {
      color: '#475569',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.4,
    },
  
    monthTitle: {
      color: '#F8FAFC',
      fontSize: 21,
      fontWeight: '900',
      marginTop: 4,
    },
  
    monthButtons: {
      flexDirection: 'row',
      gap: 8,
    },
  
    monthButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        '#1E293B',
      alignItems: 'center',
      justifyContent:
        'center',
    },
  
    // ===================================================
    // ESTAÃ‡ÃƒO
    // ===================================================
  
    stationCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 26,
      borderWidth: 1,
      borderColor:
        '#1E293B',
    },
  
    stationIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor:
        '#052E16',
      justifyContent:
        'center',
      alignItems: 'center',
    },
  
    stationInfo: {
      flex: 1,
      marginLeft: 12,
    },
  
    stationName: {
      color: '#F8FAFC',
      fontSize: 14,
      fontWeight: '900',
    },
  
    stationDescription: {
      color: '#64748B',
      fontSize: 10,
      marginTop: 3,
    },
  
    uniqueBadge: {
      backgroundColor:
        '#052E16',
      borderRadius: 9,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
  
    uniqueText: {
      color: '#4ADE80',
      fontSize: 7,
      fontWeight: '900',
    },
  
    // ===================================================
    // SEÃ‡Ã•ES
    // ===================================================
  
    sectionHeader: {
      marginBottom: 13,
      marginTop: 3,
    },
  
    sectionTitle: {
      color: '#F8FAFC',
      fontSize: 19,
      fontWeight: '900',
    },
  
    sectionSubtitle: {
      color: '#64748B',
      fontSize: 10,
      marginTop: 3,
    },
  
    // ===================================================
    // ESTATÃSTICAS
    // ===================================================
  
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 27,
    },
  
    statCard: {
      flex: 1,
      minWidth: 145,
      backgroundColor:
        '#0F172A',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor:
        '#1E293B',
    },
  
    statIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 10,
    },
  
    statTitle: {
      color: '#64748B',
      fontSize: 10,
      fontWeight: '800',
    },
  
    statValue: {
      color: '#F8FAFC',
      fontSize: 27,
      fontWeight: '900',
      marginTop: 2,
    },
  
    statSubtitle: {
      color: '#475569',
      fontSize: 8,
      marginTop: 2,
    },
  
    // ===================================================
    // INDICADORES
    // ===================================================
  
    indicatorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 27,
    },
  
    indicatorCard: {
      flex: 1,
      minWidth: 145,
      backgroundColor:
        '#0F172A',
      borderRadius: 18,
      padding: 17,
      borderWidth: 1,
      borderColor:
        '#1E293B',
    },
  
    indicatorTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    indicatorIcon: {
      width: 35,
      height: 35,
      borderRadius: 11,
      backgroundColor:
        '#052E16',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 9,
    },
  
    indicatorTitle: {
      color: '#94A3B8',
      fontSize: 10,
      fontWeight: '800',
      flex: 1,
    },
  
    indicatorValue: {
      color: '#F8FAFC',
      fontSize: 24,
      fontWeight: '900',
      marginTop: 13,
    },
  
    indicatorSubtitle: {
      color: '#475569',
      fontSize: 8,
      marginTop: 2,
    },
  
    // ===================================================
    // DISTRIBUIÃ‡ÃƒO
    // ===================================================
  
    distributionCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor:
        '#1E293B',
      marginBottom: 27,
    },
  
    distributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 55,
    },
  
    distributionInfo: {
      width: 100,
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    distributionIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 8,
    },
  
    distributionLabel: {
      color: '#CBD5E1',
      fontSize: 10,
      fontWeight: '800',
    },
  
    progressArea: {
      flex: 1,
      marginHorizontal: 12,
    },
  
    progressBackground: {
      height: 7,
      borderRadius: 10,
      backgroundColor:
        '#1E293B',
      overflow: 'hidden',
    },
  
    progressFill: {
      height: 7,
      borderRadius: 10,
    },
  
    distributionPercentage: {
      width: 42,
      fontSize: 10,
      fontWeight: '900',
      textAlign: 'right',
    },
  
    distributionValue: {
      width: 32,
      color: '#64748B',
      fontSize: 9,
      fontWeight: '800',
      textAlign: 'right',
    },
  
    // ===================================================
    // LEITURAS
    // ===================================================
  
    readingsList: {
      gap: 10,
    },
  
    readingCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#1E293B',
      overflow: 'hidden',
    },
  
    readingStatusBar: {
      height: 3,
      width: '100%',
    },
  
    readingMain: {
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    readingDate: {
      width: 130,
      flexDirection: 'row',
      alignItems: 'center',
    },
  
    readingIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 9,
    },
  
    readingDateText: {
      color: '#E2E8F0',
      fontSize: 10,
      fontWeight: '900',
    },
  
    readingTime: {
      color: '#475569',
      fontSize: 8,
      marginTop: 2,
    },
  
    readingMetrics: {
      flex: 1,
      flexDirection: 'row',
      justifyContent:
        'space-around',
    },
  
    metric: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 65,
    },
  
    metricLabel: {
      color: '#475569',
      fontSize: 7,
      marginLeft: 5,
    },
  
    metricValue: {
      color: '#CBD5E1',
      fontSize: 9,
      fontWeight: '900',
      marginLeft: 5,
      marginTop: 1,
    },
  
    readingRight: {
      width: 105,
      alignItems: 'flex-end',
    },
  
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
  
    statusBadgeText: {
      fontSize: 7,
      fontWeight: '900',
      marginLeft: 4,
    },
  
    fireBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },
  
    fireText: {
      color: '#EF4444',
      fontSize: 7,
      fontWeight: '900',
      marginLeft: 3,
    },
  
    // ===================================================
    // ESTADOS
    // ===================================================
  
    loadingCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 20,
      padding: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#1E293B',
    },
  
    loadingIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor:
        '#052E16',
      justifyContent:
        'center',
      alignItems: 'center',
      marginBottom: 15,
    },
  
    loadingText: {
      color: '#64748B',
      fontSize: 11,
      marginTop: 10,
    },
  
    emptyCard: {
      backgroundColor:
        '#0F172A',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#1E293B',
    },
  
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor:
        '#1E293B',
      justifyContent:
        'center',
      alignItems: 'center',
      marginBottom: 13,
    },
  
    emptyTitle: {
      color: '#F8FAFC',
      fontSize: 16,
      fontWeight: '900',
      textAlign: 'center',
    },
  
    emptyText: {
      color: '#64748B',
      fontSize: 10,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 6,
      maxWidth: 400,
    },
  
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#166534',
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginTop: 15,
    },
  
    retryText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
      marginLeft: 6,
    },
  
    limitText: {
      color: '#475569',
      fontSize: 8,
      textAlign: 'center',
      paddingVertical: 8,
    },
  
    // ===================================================
    // RODAPÃ‰
    // ===================================================
  
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 30,
      paddingHorizontal: 10,
    },
  
    footerText: {
      color: '#475569',
      fontSize: 8,
      marginLeft: 5,
      textAlign: 'center',
    },
  });



