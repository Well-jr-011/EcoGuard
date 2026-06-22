import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import openai from '../services/openai';

export default function IAScreen() {

  const [pergunta, setPergunta] =
    useState('');

  const [resposta, setResposta] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  async function responder() {

    if (!pergunta.trim()) {
      setResposta(
        'Digite uma pergunta.'
      );
      return;
    }

    try {

      setCarregando(true);

      const completion =
        await openai.chat.completions.create({

          model: 'gpt-4.1-mini',

          messages: [

            {
              role: 'system',
              content:
                'Você é um especialista em prevenção de incêndios, fumaça, evacuação, sensores MQ e segurança residencial. Responda de forma simples e objetiva.'
            },

            {
              role: 'user',
              content: pergunta
            }

          ]

        });

      setResposta(
        completion.choices[0].message.content ||
        'Nenhuma resposta recebida.'
      );

    } catch (error) {

      console.log(error);

      setResposta(
        'Erro ao consultar a IA. Verifique o console do Expo.'
      );

    } finally {

      setCarregando(false);

    }

  }

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.titulo}>
        🤖 Assistente IA
      </Text>

      <Text style={styles.subtitulo}>
        Pergunte sobre fumaça, incêndios, evacuação e segurança.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex: O que fazer quando há fumaça excessiva?"
        placeholderTextColor="#94A3B8"
        value={pergunta}
        onChangeText={setPergunta}
        multiline
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={responder}
      >

        {
          carregando
            ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            )
            : (
              <Text style={styles.botaoTexto}>
                Perguntar à IA
              </Text>
            )
        }

      </TouchableOpacity>

      <View style={styles.respostaBox}>

        <Text style={styles.respostaTitulo}>
          Resposta
        </Text>

        <Text style={styles.resposta}>
          {
            resposta ||
            'Faça uma pergunta para a IA.'
          }
        </Text>

      </View>

      <View style={styles.infoBox}>

        <Text style={styles.infoTitulo}>
          Exemplos de perguntas:
        </Text>

        <Text style={styles.info}>
          • O que significa uma leitura alta de fumaça?
        </Text>

        <Text style={styles.info}>
          • Como agir em um princípio de incêndio?
        </Text>

        <Text style={styles.info}>
          • Quando devo evacuar o ambiente?
        </Text>

        <Text style={styles.info}>
          • Quais os riscos da inalação de fumaça?
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
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
  },

  respostaBox: {
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
    lineHeight: 24,
  },

  infoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 20,
    marginTop: 25,
    marginBottom: 50,
  },

  infoTitulo: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  info: {
    color: '#CBD5E1',
    fontSize: 15,
    marginBottom: 10,
  },

});