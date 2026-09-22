import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../src/lib/supabase';


// ======================================================
// STORAGE
// ======================================================

const STORAGE = {
  nome: '@EcoGuard:nome',
  telefone: '@EcoGuard:telefone',
  notificacaoApp: '@EcoGuard:notificacaoApp',
};


// ======================================================
// TELA
// ======================================================

export default function Configuracoes() {
  const { width } = useWindowDimensions();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  const [notificacaoApp, setNotificacaoApp] =
    useState(true);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const isDesktop = width >= 900;


  // ====================================================
  // CARREGAR
  // ====================================================

  useEffect(() => {
    carregarDados();
  }, []);


  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        nomeSalvo,
        telefoneSalvo,
        notificacaoSalva,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE.nome),
        AsyncStorage.getItem(STORAGE.telefone),
        AsyncStorage.getItem(
          STORAGE.notificacaoApp
        ),
      ]);

      setNome(nomeSalvo || '');
      setTelefone(telefoneSalvo || '');

      if (notificacaoSalva !== null) {
        setNotificacaoApp(
          notificacaoSalva === 'true'
        );
      }

    } catch (error) {
      console.log(
        'Erro ao carregar configurações:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível carregar suas configurações.'
      );

    } finally {
      setCarregando(false);
    }
  }


  // ====================================================
  // SALVAR
  // ====================================================

  async function salvarConfiguracoes() {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();

    if (!nomeLimpo) {
      Alert.alert(
        'Nome necessário',
        'Digite seu nome para continuar.'
      );
      return;
    }

    if (!telefoneLimpo) {
      Alert.alert(
        'Telefone necessário',
        'Digite um telefone para receber alertas e usar em emergências.'
      );
      return;
    }

    try {
      setSalvando(true);


      // -----------------------------------------------
      // SALVA NO CELULAR
      // -----------------------------------------------

      await Promise.all([
        AsyncStorage.setItem(
          STORAGE.nome,
          nomeLimpo
        ),

        AsyncStorage.setItem(
          STORAGE.telefone,
          telefoneLimpo
        ),

        AsyncStorage.setItem(
          STORAGE.notificacaoApp,
          String(notificacaoApp)
        ),
      ]);


      // -----------------------------------------------
      // TENTA SALVAR NO SUPABASE
      // -----------------------------------------------

      const {
        data: usuarioAtual,
        error: erroUsuario,
      } = await supabase.auth.getUser();


      if (
        !erroUsuario &&
        usuarioAtual?.user
      ) {
        const userId = usuarioAtual.user.id;

        const { data: usuarioExistente } =
          await supabase
            .from('usuarios')
            .select('id')
            .eq('id', userId)
            .maybeSingle();


        if (usuarioExistente) {

          await supabase
            .from('usuarios')
            .update({
              nome: nomeLimpo,
              telefone: telefoneLimpo,
            })
            .eq('id', userId);

        } else {

          await supabase
            .from('usuarios')
            .insert({
              id: userId,
              nome: nomeLimpo,
              telefone: telefoneLimpo,
            });
        }
      }


      Alert.alert(
        'Tudo certo! 🌿',
        'Suas configurações foram salvas.'
      );

    } catch (error) {
      console.log(
        'Erro ao salvar configurações:',
        error
      );

      // Mesmo que o banco falhe,
      // os dados já foram salvos no celular.
      Alert.alert(
        'Configurações salvas',
        'Seus dados foram salvos neste dispositivo.'
      );

    } finally {
      setSalvando(false);
    }
  }


  // ====================================================
  // ALTERAR NOTIFICAÇÕES
  // ====================================================

  async function alterarNotificacoes(
    valor: boolean
  ) {
    try {
      setNotificacaoApp(valor);

      await AsyncStorage.setItem(
        STORAGE.notificacaoApp,
        String(valor)
      );

    } catch (error) {
      console.log(
        'Erro ao salvar preferência:',
        error
      );
    }
  }


  // ====================================================
  // TELEFONE
  // ====================================================

  function formatarTelefone(texto: string) {
    const numeros = texto.replace(/\D/g, '');

    if (numeros.length <= 10) {
      return numeros.replace(
        /^(\d{2})(\d{4})(\d{0,4}).*/,
        '($1) $2-$3'
      );
    }

    return numeros.replace(
      /^(\d{2})(\d{5})(\d{0,4}).*/,
      '($1) $2-$3'
    );
  }


  // ====================================================
  // EMERGÊNCIA
  // ====================================================

  function ligar193() {
    Alert.alert(
      'Emergência',
      'Deseja ligar para os Bombeiros?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Ligar 193',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:193');
          },
        },
      ]
    );
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>

        <View style={styles.loadingIcon}>
          <MaterialIcons
            name="settings"
            size={34}
            color="#22C55E"
          />
        </View>

        <Text style={styles.loadingTitle}>
          EcoGuard
        </Text>

        <Text style={styles.loadingText}>
          Carregando configurações...
        </Text>

        <ActivityIndicator
          size="small"
          color="#22C55E"
          style={{
            marginTop: 18,
          }}
        />

      </View>
    );
  }


  // ====================================================
  // INTERFACE
  // ====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View
          style={[
            styles.content,
            isDesktop && styles.contentDesktop,
          ]}
        >

          {/* ==========================================
              CABEÇALHO
          ========================================== */}

          <LinearGradient
            colors={[
              '#064E3B',
              '#052E16',
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

            <View style={styles.headerIcon}>
              <MaterialIcons
                name="settings"
                size={29}
                color="#86EFAC"
              />
            </View>

            <Text style={styles.headerTitle}>
              Configurações
            </Text>

            <Text style={styles.headerSubtitle}>
              Deixe o EcoGuard do seu jeito
            </Text>

          </LinearGradient>


          {/* ==========================================
              PERFIL
          ========================================== */}

          <View style={styles.sectionHeader}>

            <View style={styles.sectionIcon}>
              <MaterialIcons
                name="person"
                size={20}
                color="#22C55E"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Meu perfil
              </Text>

              <Text style={styles.sectionSubtitle}>
                Informações para os alertas
              </Text>
            </View>

          </View>


          <View style={styles.card}>

            {/* NOME */}

            <View style={styles.inputRow}>

              <View style={styles.inputIcon}>
                <MaterialIcons
                  name="person-outline"
                  size={21}
                  color="#22C55E"
                />
              </View>

              <View style={styles.inputContent}>

                <Text style={styles.inputLabel}>
                  NOME
                </Text>

                <TextInput
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  placeholderTextColor="#475569"
                  style={styles.input}
                  autoCapitalize="words"
                />

              </View>

            </View>


            {/* TELEFONE */}

            <View
              style={[
                styles.inputRow,
                styles.lastInputRow,
              ]}
            >

              <View
                style={[
                  styles.inputIcon,
                  styles.blueIcon,
                ]}
              >
                <MaterialIcons
                  name="phone"
                  size={21}
                  color="#60A5FA"
                />
              </View>

              <View style={styles.inputContent}>

                <Text style={styles.inputLabel}>
                  TELEFONE
                </Text>

                <TextInput
                  value={telefone}
                  onChangeText={(texto) =>
                    setTelefone(
                      formatarTelefone(texto)
                    )
                  }
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#475569"
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

              </View>

            </View>

          </View>


          {/* ==========================================
              ALERTAS
          ========================================== */}

          <View style={styles.sectionHeader}>

            <View
              style={[
                styles.sectionIcon,
                styles.blueSectionIcon,
              ]}
            >
              <MaterialIcons
                name="notifications"
                size={20}
                color="#60A5FA"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Alertas
              </Text>

              <Text style={styles.sectionSubtitle}>
                Controle os avisos do EcoGuard
              </Text>
            </View>

          </View>


          <View style={styles.card}>

            <View style={styles.alertRow}>

              <View style={styles.alertIcon}>
                <MaterialIcons
                  name="notifications-active"
                  size={22}
                  color="#60A5FA"
                />
              </View>

              <View style={styles.alertText}>

                <Text style={styles.alertTitle}>
                  Notificações do aplicativo
                </Text>

                <Text style={styles.alertDescription}>
                  Receba avisos quando houver risco
                </Text>

              </View>

              <Switch
                value={notificacaoApp}
                onValueChange={
                  alterarNotificacoes
                }
                trackColor={{
                  false: '#1E293B',
                  true: '#166534',
                }}
                thumbColor={
                  notificacaoApp
                    ? '#22C55E'
                    : '#64748B'
                }
              />

            </View>

          </View>


          {/* ==========================================
              BOTÃO SALVAR
          ========================================== */}

          <TouchableOpacity
            style={styles.saveWrapper}
            onPress={salvarConfiguracoes}
            disabled={salvando}
            activeOpacity={0.85}
          >

            <LinearGradient
              colors={[
                '#22C55E',
                '#16A34A',
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={styles.saveButton}
            >

              {salvando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={21}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveText}>
                    SALVAR ALTERAÇÕES
                  </Text>
                </>
              )}

            </LinearGradient>

          </TouchableOpacity>


          {/* ==========================================
              EMERGÊNCIA
          ========================================== */}

          <View style={styles.sectionHeader}>

            <View
              style={[
                styles.sectionIcon,
                styles.redSectionIcon,
              ]}
            >
              <MaterialIcons
                name="local-fire-department"
                size={20}
                color="#EF4444"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Emergência
              </Text>

              <Text style={styles.sectionSubtitle}>
                Ação rápida em caso de incêndio
              </Text>
            </View>

          </View>


          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={ligar193}
            activeOpacity={0.85}
          >

            <View style={styles.emergencyIcon}>
              <MaterialIcons
                name="phone"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.emergencyTextContainer}>

              <Text style={styles.emergencyTitle}>
                Bombeiros
              </Text>

              <Text style={styles.emergencyDescription}>
                Ligue imediatamente em caso de incêndio
              </Text>

            </View>

            <View style={styles.numberContainer}>

              <Text style={styles.number}>
                193
              </Text>

              <MaterialIcons
                name="chevron-right"
                size={22}
                color="#EF4444"
              />

            </View>

          </TouchableOpacity>


          {/* ==========================================
              SOBRE
          ========================================== */}

          <View style={styles.aboutCard}>

            <View style={styles.aboutIcon}>
              <MaterialIcons
                name="eco"
                size={22}
                color="#22C55E"
              />
            </View>

            <View style={styles.aboutContent}>

              <Text style={styles.aboutTitle}>
                EcoGuard
              </Text>

              <Text style={styles.aboutText}>
                Monitoramento inteligente para prevenção
                de queimadas e proteção ambiental.
              </Text>

            </View>

          </View>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <Text style={styles.footer}>
            EcoGuard • Monitoramento inteligente
          </Text>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}


// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  scrollContent: {
    paddingBottom: 130,
  },

  scrollDesktop: {
    alignItems: 'center',
  },

  content: {
    width: '100%',
  },

  contentDesktop: {
    maxWidth: 900,
  },


  // ====================================================
  // LOADING
  // ====================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 16,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },


  // ====================================================
  // HEADER
  // ====================================================

  header: {
    paddingTop: 62,
    paddingBottom: 38,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(134,239,172,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  headerSubtitle: {
    color: '#86EFAC',
    fontSize: 13,
    marginTop: 5,
  },


  // ====================================================
  // SEÇÕES
  // ====================================================

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  blueSectionIcon: {
    backgroundColor:
      'rgba(59,130,246,0.10)',
  },

  redSectionIcon: {
    backgroundColor:
      'rgba(239,68,68,0.10)',
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },


  // ====================================================
  // CARD
  // ====================================================

  card: {
    marginHorizontal: 20,
    backgroundColor: '#0B1220',
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#172033',
  },


  // ====================================================
  // INPUTS
  // ====================================================

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#172033',
  },

  lastInputRow: {
    borderBottomWidth: 0,
  },

  inputIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  blueIcon: {
    backgroundColor:
      'rgba(59,130,246,0.10)',
  },

  inputContent: {
    flex: 1,
  },

  inputLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  input: {
    color: '#F8FAFC',
    fontSize: 15,
    paddingVertical: 3,
  },


  // ====================================================
  // ALERTAS
  // ====================================================

  alertRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
  },

  alertIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      'rgba(59,130,246,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  alertText: {
    flex: 1,
  },

  alertTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },

  alertDescription: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },


  // ====================================================
  // SALVAR
  // ====================================================

  saveWrapper: {
    marginHorizontal: 20,
    marginTop: 22,
  },

  saveButton: {
    height: 57,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    elevation: 5,
    shadowColor: '#22C55E',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  // ====================================================
  // EMERGÊNCIA
  // ====================================================

  emergencyCard: {
    marginHorizontal: 20,
    backgroundColor:
      'rgba(127,29,29,0.16)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      'rgba(239,68,68,0.25)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  emergencyTextContainer: {
    flex: 1,
  },

  emergencyTitle: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '900',
  },

  emergencyDescription: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  number: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '900',
  },


  // ====================================================
  // SOBRE
  // ====================================================

  aboutCard: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
  },

  aboutIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aboutContent: {
    flex: 1,
  },

  aboutTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },

  aboutText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },


  // ====================================================
  // FOOTER
  // ====================================================

  footer: {
    color: '#334155',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  },

});