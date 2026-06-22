import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { useState } from 'react';

import { MaterialIcons }
from '@expo/vector-icons';

import SensorCard
from '../components/SensorCard';

import AlertBanner
from '../components/AlertBanner';

import { SensorData }
from '../types/arduinoTypes';

export default function Dashboard({
  navigation,
}: any) {

  const [dados] =
    useState<SensorData>({
      temperatura: 38,
      umidade: 20,
      fumaca: true,
      risco: 'ALTO',
      sistemaAtivo: true,
    });

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: dados.fumaca
            ? '#3B0A0A'
            : '#020617',
        },
      ]}
    >

      <Text style={styles.logo}>
        EcoGuard
      </Text>

      <Text style={styles.subtitle}>
        Monitoramento Inteligente
      </Text>

      <Text style={styles.online}>
        🟢 Sensor Online
      </Text>

      <AlertBanner
        alerta={dados.fumaca}
      />

      <View style={styles.iconContainer}>
        <MaterialIcons
          name="local-fire-department"
          size={70}
          color="#EF4444"
        />
      </View>

      <SensorCard
        titulo="🌡 Temperatura"
        valor={`${dados.temperatura}°C`}
      />

      <SensorCard
        titulo="💧 Umidade"
        valor={`${dados.umidade}%`}
      />

      <SensorCard
        titulo="🔥 Risco"
        valor={dados.risco}
      />

      <SensorCard
        titulo="🌬 Qualidade do Ar"
        valor="Ruim"
      />

      <SensorCard
        titulo="📡 Sensores"
        valor="4 Online"
      />

      <View style={styles.history}>
        <Text style={styles.historyTitle}>
          Último Alerta
        </Text>

        <Text style={styles.historyText}>
          Fumaça detectada às 14:32
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('Controle')
        }
      >
        <Text style={styles.buttonText}>
          Abrir Controle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: '#2563EB',
          },
        ]}
        onPress={() =>
          navigation.navigate('IA')
        }
      >
        <Text style={styles.buttonText}>
          🤖 Abrir IA
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  logo: {
    color: '#22C55E',
    fontSize: 38,
    fontWeight: 'bold',
    marginTop: 50,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 18,
    marginBottom: 10,
  },

  online: {
    color: '#22C55E',
    fontSize: 16,
    marginBottom: 20,
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  history: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },

  historyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  historyText: {
    color: '#CBD5E1',
    marginTop: 10,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#16A34A',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});