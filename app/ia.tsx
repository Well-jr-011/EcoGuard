import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function IA() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');

  function responder() {
    if (!pergunta.trim()) return;

    setResposta(
      'Resposta de teste da IA. Na próxima etapa vamos conectar à OpenAI para responder perguntas reais sobre fumaça e segurança.'
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>🤖 Assistente IA</Text>

      <Text style={styles.subtitulo}>
        Pergunte sobre fumaça, incêndios e segurança.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Digite sua pergunta..."
        placeholderTextColor="#94A3B8"
        value={pergunta}
        onChangeText={setPergunta}
        multiline
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={responder}
        activeOpacity={0.8}
      >
        <Text style={styles.botaoTexto}>
          Perguntar à IA
        </Text>
      </TouchableOpacity>

      <View style={styles.box}>
        <Text style={styles.respostaTitulo}>
          Resposta:
        </Text>

        <Text style={styles.resposta}>
          {resposta || 'Nenhuma pergunta enviada.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  titulo: {
    color: '#22C55E',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 30,
  },

  subtitulo: {
    color: '#CBD5E1',
    marginTop: 10,
    marginBottom: 25,
  },

  input: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  botao: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },

  box: {
    backgroundColor: '#1E293B',
    borderRadius: 15,
    padding: 20,
    marginTop: 25,
  },

  respostaTitulo: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  resposta: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});