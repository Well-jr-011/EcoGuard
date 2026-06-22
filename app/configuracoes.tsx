import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';

import { supabase } from '../src/lib/supabase';

export default function Configuracoes() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [notificacaoApp, setNotificacaoApp] = useState(true);
  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoSms, setNotificacaoSms] = useState(false);

  async function salvarUsuario() {
    if (!nome || !telefone || !email) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('*')
      .or(
        `nome.eq.${nome},email.eq.${email},telefone.eq.${telefone}`
      );

    if (usuarioExistente && usuarioExistente.length > 0) {
      Alert.alert(
        'Erro',
        'Nome, email ou telefone já cadastrados.'
      );
      return;
    }

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

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    Alert.alert('Sucesso', 'Usuário cadastrado com sucesso.');

    setNome('');
    setTelefone('');
    setEmail('');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Configurações</Text>

      <Text style={styles.subtitulo}>Cadastro do usuário</Text>

      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Nome de usuário"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <TextInput
        value={telefone}
        onChangeText={setTelefone}
        placeholder="Telefone"
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Notificações</Text>

        <View style={styles.linha}>
          <Text style={styles.texto}>Notificações no App</Text>
          <Switch
            value={notificacaoApp}
            onValueChange={setNotificacaoApp}
          />
        </View>

        <View style={styles.linha}>
          <Text style={styles.texto}>Notificações por Email</Text>
          <Switch
            value={notificacaoEmail}
            onValueChange={setNotificacaoEmail}
          />
        </View>

        <View style={styles.linha}>
          <Text style={styles.texto}>Notificações por SMS</Text>
          <Switch
            value={notificacaoSms}
            onValueChange={setNotificacaoSms}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.botao}
        onPress={salvarUsuario}
        activeOpacity={0.8}
      >
        <Text style={styles.botaoTexto}>SALVAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },

  titulo: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 70,
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#1E293B',
    color: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    fontSize: 16,
  },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    marginBottom: 20,
  },

  cardTitulo: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  texto: {
    color: '#FFF',
    fontSize: 16,
  },

  botao: {
    backgroundColor: '#22C55E',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 50,
  },

  botaoTexto: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});