import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../src/lib/supabase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');

interface Leitura {
  id: number | string;
  valor_fumaca: number;
  fogo: boolean;
  temperatura: number;
  umidade_solo: number;
  status: string;
  created_at: string;
}

type Filtro = 'TODOS' | 'CRÍTICO' | 'ATENÇÃO' | 'SEGURO';

export default function Historico() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);

  const [telefoneSalvo, setTelefoneSalvo] = useState('');
  const [nomeSalvo, setNomeSalvo] = useState('');

  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    carregarDados();

    const canal = supabase
      .channel('historico_leituras')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leituras',
        },
        () => {
          carregarLeituras(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  async function carregarDados() {
    await Promise.all([
      carregarLeituras(true),
      carregarDadosUsuario(),
    ]);
  }

  async function carregarDadosUsuario() {
    try {
      const telefone =
        await AsyncStorage.getItem(
          '@EcoGuard:telefone'
        );

      const nome =
        await AsyncStorage.getItem(
          '@EcoGuard:nome'
        );

      setTelefoneSalvo(telefone || '');
      setNomeSalvo(nome || '');
    } catch (error) {
      console.log(
        'Erro ao carregar usuário:',
        error
      );
    }
  }

  async function carregarLeituras(
    mostrarLoading = true
  ) {
    try {
      if (mostrarLoading) {
        setLoading(true);
      } else {
        setAtualizando(true);
      }

      const { data, error } = await supabase
        .from('leituras')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(50);

      if (error) {
        throw error;
      }

      if (data) {
        const dadosTratados: Leitura[] =
          data.map((item: any) => {
            const fumaca = Number(
              item.valor_fumaca ??
                item.fumaca ??
                0
            );

            const fogo = Boolean(
              item.fogo ?? false
            );

            const temperatura = Number(
              item.temperatura ?? 0
            );

            const solo = Number(
              item.umidade_solo ?? 0
            );

            return {
              id: item.id,

              valor_fumaca: fumaca,

              fogo,

              temperatura,

              umidade_solo: solo,

              status:
                item.status ??
                calcularStatus(
                  fumaca,
                  fogo,
                  temperatura,
                  solo
                ),

              created_at:
                item.created_at,
            };
          });

        setLeituras(dadosTratados);
      }
    } catch (error) {
      console.log(
        'Erro ao carregar histórico:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível carregar o histórico.'
      );
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  function calcularStatus(
    fumaca: number,
    fogo: boolean,
    temperatura: number,
    solo: number
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
      temperatura >= 40 ||
      solo <= 30
    ) {
      return 'ATENÇÃO';
    }

    return 'SEGURO';
  }

  function obterCorStatus(status: string) {
    if (status === 'CRÍTICO') {
      return '#EF4444';
    }

    if (status === 'ATENÇÃO') {
      return '#F59E0B';
    }

    return '#22C55E';
  }

  function obterIconeStatus(status: string) {
    if (status === 'CRÍTICO') {
      return 'warning';
    }

    if (status === 'ATENÇÃO') {
      return 'report-problem';
    }

    return 'verified';
  }

  const leiturasFiltradas =
    filtro === 'TODOS'
      ? leituras
      : leituras.filter(
          (item) => item.status === filtro
        );

  const quantidadeCritica = leituras.filter(
    (item) => item.status === 'CRÍTICO'
  ).length;

  const quantidadeAtencao = leituras.filter(
    (item) => item.status === 'ATENÇÃO'
  ).length;

  const quantidadeSegura = leituras.filter(
    (item) => item.status === 'SEGURO'
  ).length;

  const mediaFumaca =
    leituras.length > 0
      ? Math.round(
          leituras.reduce(
            (total, item) =>
              total + item.valor_fumaca,
            0
          ) / leituras.length
        )
      : 0;

  function exportarLaudoWhatsApp() {
    if (!telefoneSalvo) {
      Alert.alert(
        'Contato não configurado',
        'Cadastre um telefone de emergência nas configurações.'
      );

      return;
    }

    if (leituras.length === 0) {
      Alert.alert(
        'Sem dados',
        'Não existem leituras para gerar o laudo.'
      );

      return;
    }

    let relatorio =
      `📋 *LAUDO TÉCNICO ECOGUARD*\n\n` +
      `👤 *Responsável:* ${
        nomeSalvo || 'Usuário'
      }\n\n` +
      `📡 *Sistema:* Monitoramento Ambiental IoT\n` +
      `📊 *Total de registros:* ${leituras.length}\n` +
      `🌫️ *Média de fumaça:* ${mediaFumaca}%\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n`;

    leituras.slice(0, 10).forEach((item) => {
      relatorio +=
        `🕒 ${new Date(
          item.created_at
        ).toLocaleString('pt-BR')}\n\n` +
        `🌫️ Fumaça: ${item.valor_fumaca}%\n` +
        `🔥 Fogo: ${
          item.fogo
            ? 'DETECTADO 🚨'
            : 'Normal'
        }\n` +
        `🌡️ Temperatura: ${item.temperatura}°C\n` +
        `🌱 Umidade do solo: ${item.umidade_solo}%\n` +
        `📊 Status: ${item.status}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n`;
    });

    relatorio +=
      `Relatório gerado automaticamente pelo EcoGuard.`;

    const numero =
      telefoneSalvo.replace(/\D/g, '');

    Linking.openURL(
      `whatsapp://send?phone=55${numero}&text=${encodeURIComponent(
        relatorio
      )}`
    ).catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp.'
      );
    });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingIcon}>
          <MaterialIcons
            name="history"
            size={38}
            color="#22C55E"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Histórico
        </Text>

        <Text style={styles.loadingText}>
          Carregando registros...
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
        colors={[
          '#0F3D2A',
          '#062519',
          '#020617',
        ]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleIcon}>
            <MaterialIcons
              name="history"
              size={25}
              color="#4ADE80"
            />
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() =>
              carregarLeituras(false)
            }
            disabled={atualizando}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="refresh"
              size={21}
              color="#CBD5E1"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          Histórico
        </Text>

        <Text style={styles.subtitle}>
          Acompanhe todas as leituras ambientais
          registradas pelo EcoGuard.
        </Text>
      </LinearGradient>

      {/* RESUMO */}

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>
              Resumo do monitoramento
            </Text>

            <Text style={styles.summarySubtitle}>
              Últimos registros recebidos
            </Text>
          </View>

          {atualizando && (
            <ActivityIndicator
              size="small"
              color="#22C55E"
            />
          )}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {leituras.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Registros
            </Text>
          </View>

          <View
            style={[
              styles.summaryItem,
              styles.summaryBorder,
            ]}
          >
            <Text
              style={[
                styles.summaryNumber,
                {
                  color: '#EF4444',
                },
              ]}
            >
              {quantidadeCritica}
            </Text>

            <Text style={styles.summaryLabel}>
              Críticos
            </Text>
          </View>

          <View
            style={[
              styles.summaryItem,
              styles.summaryBorder,
            ]}
          >
            <Text
              style={[
                styles.summaryNumber,
                {
                  color: '#F59E0B',
                },
              ]}
            >
              {quantidadeAtencao}
            </Text>

            <Text style={styles.summaryLabel}>
              Atenção
            </Text>
          </View>

          <View
            style={[
              styles.summaryItem,
              styles.summaryBorder,
            ]}
          >
            <Text
              style={[
                styles.summaryNumber,
                {
                  color: '#22C55E',
                },
              ]}
            >
              {quantidadeSegura}
            </Text>

            <Text style={styles.summaryLabel}>
              Seguros
            </Text>
          </View>
        </View>
      </View>

      {/* MÉDIA */}

      <View style={styles.averageCard}>
        <View style={styles.averageIcon}>
          <MaterialIcons
            name="cloud"
            size={23}
            color="#38BDF8"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.averageLabel}>
            MÉDIA DE FUMAÇA
          </Text>

          <Text style={styles.averageText}>
            {mediaFumaca}%
          </Text>
        </View>

        <View style={styles.averageRight}>
          <Text style={styles.averageSmall}>
            {mediaFumaca >= 70
              ? 'Nível crítico'
              : mediaFumaca >= 40
              ? 'Requer atenção'
              : 'Dentro do normal'}
          </Text>
        </View>
      </View>

      {/* EXPORTAR */}

      <TouchableOpacity
        onPress={exportarLaudoWhatsApp}
        activeOpacity={0.85}
        style={styles.exportButton}
      >
        <LinearGradient
          colors={[
            '#15803D',
            '#166534',
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0,
          }}
          style={styles.exportGradient}
        >
          <View style={styles.exportIcon}>
            <MaterialIcons
              name="description"
              size={22}
              color="#BBF7D0"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>
              Exportar laudo técnico
            </Text>

            <Text style={styles.exportSubtitle}>
              Enviar relatório pelo WhatsApp
            </Text>
          </View>

          <MaterialIcons
            name="arrow-forward"
            size={21}
            color="#DCFCE7"
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* FILTROS */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Leituras
          </Text>

          <Text style={styles.sectionSubtitle}>
            {leiturasFiltradas.length} registro(s)
            encontrado(s)
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filterContainer
        }
      >
        {(
          [
            'TODOS',
            'CRÍTICO',
            'ATENÇÃO',
            'SEGURO',
          ] as Filtro[]
        ).map((item) => {
          const ativo = filtro === item;

          const cor =
            item === 'CRÍTICO'
              ? '#EF4444'
              : item === 'ATENÇÃO'
              ? '#F59E0B'
              : item === 'SEGURO'
              ? '#22C55E'
              : '#94A3B8';

          return (
            <TouchableOpacity
              key={item}
              onPress={() =>
                setFiltro(item)
              }
              activeOpacity={0.8}
              style={[
                styles.filterButton,
                ativo && {
                  backgroundColor:
                    cor + '18',
                  borderColor: cor,
                },
              ]}
            >
              {item !== 'TODOS' && (
                <View
                  style={[
                    styles.filterDot,
                    {
                      backgroundColor: cor,
                    },
                  ]}
                />
              )}

              <Text
                style={[
                  styles.filterText,
                  ativo && {
                    color: cor,
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LISTA */}

      {leiturasFiltradas.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons
              name="search-off"
              size={30}
              color="#475569"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nenhuma leitura encontrada
          </Text>

          <Text style={styles.emptyText}>
            Não existem registros para o filtro
            selecionado.
          </Text>
        </View>
      ) : (
        leiturasFiltradas.map((item, index) => {
          const cor = obterCorStatus(
            item.status
          );

          return (
            <View
              key={`${item.id}-${index}`}
              style={[
                styles.readingCard,
                {
                  borderLeftColor: cor,
                },
              ]}
            >
              {/* CABEÇALHO */}

              <View style={styles.readingHeader}>
                <View
                  style={[
                    styles.readingIcon,
                    {
                      backgroundColor:
                        cor + '18',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={
                      obterIconeStatus(
                        item.status
                      ) as any
                    }
                    size={23}
                    color={cor}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.readingStatus}>
                    {item.status}
                  </Text>

                  <Text style={styles.readingDate}>
                    {new Date(
                      item.created_at
                    ).toLocaleString('pt-BR')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
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
                      styles.statusBadgeText,
                      {
                        color: cor,
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* SENSORES */}

              <View style={styles.readingSensors}>
                <View style={styles.sensorBox}>
                  <MaterialIcons
                    name="cloud"
                    size={18}
                    color="#38BDF8"
                  />

                  <Text
                    style={styles.sensorBoxLabel}
                  >
                    Fumaça
                  </Text>

                  <Text
                    style={styles.sensorBoxValue}
                  >
                    {item.valor_fumaca}%
                  </Text>
                </View>

                <View style={styles.sensorBox}>
                  <MaterialIcons
                    name="local-fire-department"
                    size={18}
                    color={
                      item.fogo
                        ? '#EF4444'
                        : '#22C55E'
                    }
                  />

                  <Text
                    style={styles.sensorBoxLabel}
                  >
                    Fogo
                  </Text>

                  <Text
                    style={[
                      styles.sensorBoxValue,
                      {
                        color: item.fogo
                          ? '#EF4444'
                          : '#22C55E',
                        fontSize: 13,
                      },
                    ]}
                  >
                    {item.fogo
                      ? 'DETECTADO'
                      : 'NORMAL'}
                  </Text>
                </View>

                <View style={styles.sensorBox}>
                  <MaterialIcons
                    name="thermostat"
                    size={18}
                    color="#F97316"
                  />

                  <Text
                    style={styles.sensorBoxLabel}
                  >
                    Temperatura
                  </Text>

                  <Text
                    style={styles.sensorBoxValue}
                  >
                    {item.temperatura}°C
                  </Text>
                </View>

                <View style={styles.sensorBox}>
                  <MaterialIcons
                    name="water-drop"
                    size={18}
                    color="#22C55E"
                  />

                  <Text
                    style={styles.sensorBoxLabel}
                  >
                    Solo
                  </Text>

                  <Text
                    style={styles.sensorBoxValue}
                  >
                    {item.umidade_solo}%
                  </Text>
                </View>
              </View>

              {/* BARRA DE FUMAÇA */}

              <View style={styles.smokeHeader}>
                <Text style={styles.smokeLabel}>
                  Intensidade da fumaça
                </Text>

                <Text
                  style={[
                    styles.smokeValue,
                    {
                      color: cor,
                    },
                  ]}
                >
                  {item.valor_fumaca}%
                </Text>
              </View>

              <View style={styles.smokeBar}>
                <View
                  style={[
                    styles.smokeProgress,
                    {
                      width: `${Math.min(
                        Math.max(
                          item.valor_fumaca,
                          0
                        ),
                        100
                      )}%`,
                      backgroundColor: cor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })
      )}

      {/* RODAPÉ */}

      <View style={styles.footer}>
        <MaterialIcons
          name="security"
          size={18}
          color="#334155"
        />

        <Text style={styles.footerText}>
          Dados monitorados pelo sistema EcoGuard
        </Text>
      </View>
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

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: '#FFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 16,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  header: {
    width,
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 43,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 1,
    borderColor: '#FFFFFF12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 22,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 340,
  },

  summaryCard: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#0B1220',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#172033',
    padding: 17,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },

  summarySubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
  },

  summaryGrid: {
    flexDirection: 'row',
    marginTop: 18,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#1E293B',
  },

  summaryNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 3,
  },

  averageCard: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#08111F',
    borderWidth: 1,
    borderColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
  },

  averageIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#082F49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  averageLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  averageText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },

  averageRight: {
    marginLeft: 'auto',
  },

  averageSmall: {
    color: '#64748B',
    fontSize: 9,
  },

  exportButton: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 19,
    overflow: 'hidden',
  },

  exportGradient: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  exportIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  exportTitle: {
    color: '#F0FDF4',
    fontSize: 14,
    fontWeight: '900',
  },

  exportSubtitle: {
    color: '#86EFAC',
    fontSize: 10,
    marginTop: 2,
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
  },

  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 2,
    gap: 8,
  },

  filterButton: {
    minHeight: 35,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1220',
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    marginRight: 6,
  },

  filterText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
  },

  readingCard: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#0B1220',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#172033',
    borderLeftWidth: 4,
  },

  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  readingIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  readingStatus: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },

  readingDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    marginRight: 5,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: '900',
  },

  readingSensors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  sensorBox: {
    width: '48.5%',
    minHeight: 76,
    borderRadius: 14,
    backgroundColor: '#050B14',
    borderWidth: 1,
    borderColor: '#111C2C',
    padding: 11,
    marginBottom: 8,
  },

  sensorBoxLabel: {
    color: '#475569',
    fontSize: 9,
    marginTop: 5,
  },

  sensorBoxValue: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },

  smokeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  smokeLabel: {
    color: '#475569',
    fontSize: 9,
  },

  smokeValue: {
    fontSize: 10,
    fontWeight: '900',
  },

  smokeBar: {
    height: 5,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 6,
  },

  smokeProgress: {
    height: '100%',
    borderRadius: 10,
  },

  empty: {
    marginHorizontal: 20,
    marginTop: 15,
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    alignItems: 'center',
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },

  emptyText: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 7,
  },

  footerText: {
    color: '#334155',
    fontSize: 9,
  },
});