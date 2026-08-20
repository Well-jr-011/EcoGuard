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
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../src/lib/supabase';


// ======================================================
// CHAVES DO STORAGE
// ======================================================

const STORAGE = {
  nome: '@EcoGuard:nome',
  telefone: '@EcoGuard:telefone',
  email: '@EcoGuard:email',
  notificacaoApp: '@EcoGuard:notificacaoApp',
  notificacaoEmail: '@EcoGuard:notificacaoEmail',
  notificacaoSms: '@EcoGuard:notificacaoSms',
};


// ======================================================
// TELA
// ======================================================

export default function Configuracoes() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [notificacaoApp, setNotificacaoApp] = useState(true);
  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoSms, setNotificacaoSms] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);


  // ======================================================
  // CARREGAR DADOS
  // ======================================================

  useEffect(() => {
    carregarDados();
  }, []);


  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        nomeSalvo,
        telefoneSalvo,
        emailSalvo,
        appSalvo,
        emailNotificacaoSalvo,
        smsSalvo,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE.nome),
        AsyncStorage.getItem(STORAGE.telefone),
        AsyncStorage.getItem(STORAGE.email),
        AsyncStorage.getItem(STORAGE.notificacaoApp),
        AsyncStorage.getItem(STORAGE.notificacaoEmail),
        AsyncStorage.getItem(STORAGE.notificacaoSms),
      ]);


      if (nomeSalvo !== null) {
        setNome(nomeSalvo);
      }

      if (telefoneSalvo !== null) {
        setTelefone(telefoneSalvo);
      }

      if (emailSalvo !== null) {
        setEmail(emailSalvo);
      }

      if (appSalvo !== null) {
        setNotificacaoApp(appSalvo === 'true');
      }

      if (emailNotificacaoSalvo !== null) {
        setNotificacaoEmail(
          emailNotificacaoSalvo === 'true'
        );
      }

      if (smsSalvo !== null) {
        setNotificacaoSms(
          smsSalvo === 'true'
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


  // ======================================================
  // SALVAR LOCALMENTE
  // ======================================================

  async function salvarLocalmente() {
    await Promise.all([
      AsyncStorage.setItem(
        STORAGE.nome,
        nome.trim()
      ),

      AsyncStorage.setItem(
        STORAGE.telefone,
        telefone.trim()
      ),

      AsyncStorage.setItem(
        STORAGE.email,
        email.trim()
      ),

      AsyncStorage.setItem(
        STORAGE.notificacaoApp,
        String(notificacaoApp)
      ),

      AsyncStorage.setItem(
        STORAGE.notificacaoEmail,
        String(notificacaoEmail)
      ),

      AsyncStorage.setItem(
        STORAGE.notificacaoSms,
        String(notificacaoSms)
      ),
    ]);
  }


  // ======================================================
  // SALVAR CONFIGURAÇÕES
  // ======================================================

  async function salvarConfiguracoes() {

    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();
    const emailLimpo = email.trim().toLowerCase();


    // ------------------------------
    // VALIDAÇÕES
    // ------------------------------

    if (!nomeLimpo) {
      Alert.alert(
        'Nome obrigatório',
        'Digite seu nome completo.'
      );
      return;
    }


    if (!telefoneLimpo) {
      Alert.alert(
        'Telefone obrigatório',
        'Digite um telefone de emergência.'
      );
      return;
    }


    if (!emailLimpo) {
      Alert.alert(
        'E-mail obrigatório',
        'Digite seu e-mail.'
      );
      return;
    }


    if (
      !emailLimpo.includes('@') ||
      !emailLimpo.includes('.')
    ) {
      Alert.alert(
        'E-mail inválido',
        'Digite um endereço de e-mail válido.'
      );
      return;
    }


    try {
      setSalvando(true);


      // ==================================================
      // SALVA PRIMEIRO NO CELULAR
      // ==================================================

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
          STORAGE.email,
          emailLimpo
        ),

        AsyncStorage.setItem(
          STORAGE.notificacaoApp,
          String(notificacaoApp)
        ),

        AsyncStorage.setItem(
          STORAGE.notificacaoEmail,
          String(notificacaoEmail)
        ),

        AsyncStorage.setItem(
          STORAGE.notificacaoSms,
          String(notificacaoSms)
        ),
      ]);


      // ==================================================
      // TENTA SALVAR NO SUPABASE
      // ==================================================

      const { error } = await supabase
        .from('usuarios')
        .insert([
          {
            nome: nomeLimpo,
            email: emailLimpo,
            telefone: telefoneLimpo,
            notificacao_app: notificacaoApp,
            notificacao_email: notificacaoEmail,
            notificacao_sms: notificacaoSms,
          },
        ]);


      // ==================================================
      // SUPABASE DEU ERRO
      // ==================================================

      if (error) {
        console.log(
          'Erro Supabase:',
          error
        );

        // Os dados locais continuam salvos.
        Alert.alert(
          'Salvo no dispositivo',
          'Suas configurações foram salvas neste aparelho. Não foi possível sincronizar com o banco de dados.'
        );

        return;
      }


      // ==================================================
      // SUCESSO COMPLETO
      // ==================================================

      Alert.alert(
        'Tudo certo! 🌿',
        'Perfil e preferências salvos com sucesso.'
      );

    } catch (error) {

      console.log(
        'Erro ao salvar configurações:',
        error
      );

      Alert.alert(
        'Configurações salvas',
        'Os dados foram salvos localmente no dispositivo.'
      );

    } finally {
      setSalvando(false);
    }
  }


  // ======================================================
  // LIMPAR CONFIGURAÇÕES
  // ======================================================

  function limparConfiguracoes() {

    Alert.alert(
      'Limpar configurações',
      'Isso apagará nome, telefone, e-mail e preferências salvas neste aparelho.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Limpar',
          style: 'destructive',

          onPress: async () => {

            try {

              await AsyncStorage.multiRemove([
                STORAGE.nome,
                STORAGE.telefone,
                STORAGE.email,
                STORAGE.notificacaoApp,
                STORAGE.notificacaoEmail,
                STORAGE.notificacaoSms,
              ]);


              setNome('');
              setTelefone('');
              setEmail('');

              setNotificacaoApp(true);
              setNotificacaoEmail(true);
              setNotificacaoSms(false);


              Alert.alert(
                'Configurações limpas',
                'Os dados locais do EcoGuard foram removidos.'
              );

            } catch (error) {

              console.log(
                'Erro ao limpar:',
                error
              );

              Alert.alert(
                'Erro',
                'Não foi possível limpar as configurações.'
              );
            }
          },
        },
      ]
    );
  }


  // ======================================================
  // LOADING
  // ======================================================

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


  // ======================================================
  // INTERFACE
  // ======================================================

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
        contentContainerStyle={{
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

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
              size={28}
              color="#86EFAC"
            />
          </View>

          <Text style={styles.headerTitle}>
            Configurações
          </Text>

          <Text style={styles.headerSubtitle}>
            Personalize seu EcoGuard
          </Text>

        </LinearGradient>


        {/* ============================================= */}
        {/* PERFIL */}
        {/* ============================================= */}

        <View style={styles.sectionHeader}>

          <View style={styles.sectionIcon}>
            <MaterialIcons
              name="person"
              size={19}
              color="#22C55E"
            />
          </View>

          <View>
            <Text style={styles.sectionTitle}>
              Seu perfil
            </Text>

            <Text style={styles.sectionSubtitle}>
              Dados usados nos alertas
            </Text>
          </View>

        </View>


        <View style={styles.card}>

          {/* NOME */}

          <View style={styles.inputContainer}>

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
                placeholder="Seu nome completo"
                placeholderTextColor="#475569"
                style={styles.input}
                autoCapitalize="words"
              />

            </View>

          </View>


          {/* TELEFONE */}

          <View style={styles.inputContainer}>

            <View
              style={[
                styles.inputIcon,
                {
                  backgroundColor:
                    'rgba(59,130,246,0.10)',
                },
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
                TELEFONE DE EMERGÊNCIA
              </Text>

              <TextInput
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(11) 99999-9999"
                placeholderTextColor="#475569"
                style={styles.input}
                keyboardType="phone-pad"
              />

            </View>

          </View>


          {/* EMAIL */}

          <View
            style={[
              styles.inputContainer,
              {
                borderBottomWidth: 0,
                paddingBottom: 0,
              },
            ]}
          >

            <View
              style={[
                styles.inputIcon,
                {
                  backgroundColor:
                    'rgba(168,85,247,0.10)',
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={21}
                color="#C084FC"
              />
            </View>

            <View style={styles.inputContent}>

              <Text style={styles.inputLabel}>
                E-MAIL
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#475569"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

            </View>

          </View>

        </View>


        {/* ============================================= */}
        {/* NOTIFICAÇÕES */}
        {/* ============================================= */}

        <View style={styles.sectionHeader}>

          <View
            style={[
              styles.sectionIcon,
              {
                backgroundColor:
                  'rgba(59,130,246,0.10)',
              },
            ]}
          >
            <MaterialIcons
              name="notifications-none"
              size={20}
              color="#60A5FA"
            />
          </View>

          <View>
            <Text style={styles.sectionTitle}>
              Notificações
            </Text>

            <Text style={styles.sectionSubtitle}>
              Escolha como receber alertas
            </Text>
          </View>

        </View>


        <View style={styles.card}>

          {/* APP */}

          <View style={styles.notificationRow}>

            <View style={styles.notificationIcon}>
              <MaterialIcons
                name="smartphone"
                size={21}
                color="#22C55E"
              />
            </View>

            <View style={styles.notificationText}>

              <Text style={styles.notificationTitle}>
                Notificações no app
              </Text>

              <Text style={styles.notificationDescription}>
                Alertas importantes do EcoGuard
              </Text>

            </View>

            <Switch
              value={notificacaoApp}
              onValueChange={setNotificacaoApp}
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


          {/* EMAIL */}

          <View style={styles.notificationRow}>

            <View
              style={[
                styles.notificationIcon,
                {
                  backgroundColor:
                    'rgba(168,85,247,0.10)',
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={21}
                color="#C084FC"
              />
            </View>

            <View style={styles.notificationText}>

              <Text style={styles.notificationTitle}>
                Alertas por e-mail
              </Text>

              <Text style={styles.notificationDescription}>
                Receba alertas no seu e-mail
              </Text>

            </View>

            <Switch
              value={notificacaoEmail}
              onValueChange={setNotificacaoEmail}
              trackColor={{
                false: '#1E293B',
                true: '#166534',
              }}
              thumbColor={
                notificacaoEmail
                  ? '#22C55E'
                  : '#64748B'
              }
            />

          </View>


          {/* SMS */}

          <View
            style={[
              styles.notificationRow,
              {
                borderBottomWidth: 0,
                paddingBottom: 0,
              },
            ]}
          >

            <View
              style={[
                styles.notificationIcon,
                {
                  backgroundColor:
                    'rgba(245,158,11,0.10)',
                },
              ]}
            >
              <MaterialIcons
                name="sms"
                size={21}
                color="#FBBF24"
              />
            </View>

            <View style={styles.notificationText}>

              <Text style={styles.notificationTitle}>
                SMS
              </Text>

              <Text style={styles.notificationDescription}>
                Alertas via mensagem de texto
              </Text>

            </View>

            <Switch
              value={notificacaoSms}
              onValueChange={setNotificacaoSms}
              trackColor={{
                false: '#1E293B',
                true: '#166534',
              }}
              thumbColor={
                notificacaoSms
                  ? '#22C55E'
                  : '#64748B'
              }
            />

          </View>

        </View>


        {/* ============================================= */}
        {/* BOTÃO SALVAR */}
        {/* ============================================= */}

        <TouchableOpacity
          onPress={salvarConfiguracoes}
          disabled={salvando}
          activeOpacity={0.85}
          style={styles.saveButtonWrapper}
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
                  name="save"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.saveButtonText}>
                  SALVAR CONFIGURAÇÕES
                </Text>
              </>
            )}

          </LinearGradient>

        </TouchableOpacity>


        {/* ============================================= */}
        {/* EMERGÊNCIA */}
        {/* ============================================= */}

        <View style={styles.emergencyCard}>

          <View style={styles.emergencyIcon}>
            <MaterialIcons
              name="local-fire-department"
              size={25}
              color="#EF4444"
            />
          </View>

          <View style={styles.emergencyContent}>

            <Text style={styles.emergencyTitle}>
              Emergência
            </Text>

            <Text style={styles.emergencyText}>
              Em caso de incêndio, ligue para os Bombeiros.
            </Text>

            <Text style={styles.emergencyNumber}>
              193
            </Text>

          </View>

        </View>


        {/* ============================================= */}
        {/* LIMPAR */}
        {/* ============================================= */}

        <TouchableOpacity
          onPress={limparConfiguracoes}
          activeOpacity={0.8}
          style={styles.clearButton}
        >

          <MaterialIcons
            name="delete-outline"
            size={20}
            color="#EF4444"
          />

          <Text style={styles.clearButtonText}>
            LIMPAR DADOS DO DISPOSITIVO
          </Text>

        </TouchableOpacity>


        {/* ============================================= */}
        {/* RODAPÉ */}
        {/* ============================================= */}

        <View style={styles.footer}>

          <MaterialIcons
            name="eco"
            size={18}
            color="#22C55E"
          />

          <Text style={styles.footerText}>
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
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
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
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.18)',
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
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: 'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
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
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#172033',
  },


  // ====================================================
  // INPUT
  // ====================================================

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#172033',
  },

  inputIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  // NOTIFICAÇÕES
  // ====================================================

  notificationRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#172033',
  },

  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  notificationText: {
    flex: 1,
  },

  notificationTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },

  notificationDescription: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
  },


  // ====================================================
  // SALVAR
  // ====================================================

  saveButtonWrapper: {
    marginHorizontal: 20,
    marginTop: 24,
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

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  // ====================================================
  // EMERGÊNCIA
  // ====================================================

  emergencyCard: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(127,29,29,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  emergencyContent: {
    flex: 1,
  },

  emergencyTitle: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '900',
  },

  emergencyText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  emergencyNumber: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },


  // ====================================================
  // LIMPAR
  // ====================================================

  clearButton: {
    marginHorizontal: 20,
    marginTop: 14,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    backgroundColor: 'rgba(239,68,68,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  clearButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 8,
  },


  // ====================================================
  // FOOTER
  // ====================================================

  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 25,
    opacity: 0.7,
  },

  footerText: {
    color: '#475569',
    fontSize: 10,
    marginLeft: 6,
  },

});