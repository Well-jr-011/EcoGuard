import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Configuracoes() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [notificacaoApp, setNotificacaoApp] = useState(true);
  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoSms, setNotificacaoSms] = useState(false);

  useEffect(() => {
    carregarDadosSalvos();
  }, []);

  async function carregarDadosSalvos() {
    try {
      const nomeSalvo = await AsyncStorage.getItem('@EcoGuard:nome');
      const telSalvo = await AsyncStorage.getItem('@EcoGuard:telefone');
      const emailSalvo = await AsyncStorage.getItem('@EcoGuard:email');

      if (nomeSalvo) setNome(nomeSalvo);
      if (telSalvo) setTelefone(telSalvo);
      if (emailSalvo) setEmail(emailSalvo);
    } catch (e) {
      console.log('Erro ao carregar dados locais');
    }
  }

  async function salvarUsuario() {
    if (!nome || !telefone || !email) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      setCarregando(true);
      await AsyncStorage.setItem('@EcoGuard:nome', nome);
      await AsyncStorage.setItem('@EcoGuard:telefone', telefone);
      await AsyncStorage.setItem('@EcoGuard:email', email);

      const { error } = await supabase.from('usuarios').insert([
        {
          nome,
          email,
          telefone,
          notificacao_app: notificacaoApp,
          notificacao_email: notificacaoEmail,
          notificacao_sms: notificacaoSms,
        },
      ]);

      if (error) throw error;
      Alert.alert('Sucesso', 'Perfil e preferências salvos com sucesso!');
    } catch (error: any) {
      Alert.alert('Sucesso', 'Perfil atualizado localmente no dispositivo!');
    } finally {
      setCarregando(false);
    }
  }

  async function descartarAlteracoes() {
    Alert.alert(
      'Limpar Configurações',
      'Tem certeza de que deseja apagar todos os dados inseridos e redefinir o app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@EcoGuard:nome');
              await AsyncStorage.removeItem('@EcoGuard:telefone');
              await AsyncStorage.removeItem('@EcoGuard:email');
              
              setNome('');
              setTelefone('');
              setEmail('');
              setNotificacaoApp(true);
              setNotificacaoEmail(true);
              setNotificacaoSms(false);
              
              Alert.alert('Limpo', 'Dados descartados localmente.');
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível limpar a memória.');
            }
          }
        }
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#334155', '#1E293B', '#030712']} style={styles.headerCard}>
        <Text style={styles.titulo}>Configurações</Text>
        <Text style={styles.subtitulo}>Gerenciamento de perfil e canais de alerta</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="person" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput value={nome} onChangeText={setNome} placeholder="Seu nome completo" placeholderTextColor="#64748B" style={styles.input} />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="phone" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput value={telefone} onChangeText={setTelefone} placeholder="Telefone de segurança" placeholderTextColor="#64748B" keyboardType="phone-pad" style={styles.input} />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail principal" placeholderTextColor="#64748B" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        </View>
      </View>

      <View style={styles.card}>
        <LinearGradient colors={['#22C55E', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.respostaLinhaDestaque} />
        <Text style={styles.cardTitulo}>Canais de Notificação</Text>
        
        <View style={styles.linha}>
          <Text style={styles.texto}>Notificações no App</Text>
          <Switch value={notificacaoApp} onValueChange={setNotificacaoApp} trackColor={{ false: '#1E293B', true: '#22C55E' }} thumbColor="#FFF" />
        </View>
        <View style={styles.linha}>
          <Text style={styles.texto}>Alertas por E-mail</Text>
          <Switch value={notificacaoEmail} onValueChange={setNotificacaoEmail} trackColor={{ false: '#1E293B', true: '#22C55E' }} thumbColor="#FFF" />
        </View>
        <View style={styles.linha}>
          <Text style={styles.texto}>Disparo de SMS</Text>
          <Switch value={notificacaoSms} onValueChange={setNotificacaoSms} trackColor={{ false: '#1E293B', true: '#22C55E' }} thumbColor="#FFF" />
        </View>
      </View>

      <TouchableOpacity onPress={salvarUsuario} disabled={carregando} activeOpacity={0.8} style={{ marginHorizontal: 20, marginBottom: 15 }}>
        <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.botao}>
          {carregando ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.botaoTexto}>GRAVAR ALTERAÇÕES</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={descartarAlteracoes} activeOpacity={0.8} style={styles.botaoDescarte}>
        <MaterialIcons name="delete-sweep" size={20} color="#EF4444" />
        <Text style={styles.botaoDescarteTexto}>DESCARTAR E LIMPAR DADOS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  headerCard: { width: width, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 35, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  titulo: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  subtitulo: { color: '#94A3B8', fontSize: 15, marginTop: 4 },
  formContainer: { marginTop: -20, marginHorizontal: 20, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', paddingVertical: 14, fontSize: 16 },
  card: { backgroundColor: '#0F172A', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 25, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  respostaLinhaDestaque: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardTitulo: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  texto: { color: '#CBD5E1', fontSize: 15, fontWeight: '500' },
  botao: { padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: '#22C55E', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  botaoTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  botaoDescarte: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 50,
  },
  botaoDescarteTexto: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
