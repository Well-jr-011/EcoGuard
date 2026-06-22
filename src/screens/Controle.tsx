import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import Slider
from '@react-native-community/slider';

import { useState }
from 'react';

import { MaterialIcons }
from '@expo/vector-icons';

export default function Controle() {

  const [alarme, setAlarme] =
    useState(false);

  const [irrigacao, setIrrigacao] =
    useState(false);

  const [sensibilidade,
    setSensibilidade] =
    useState(50);

  const [ventilacao,
    setVentilacao] =
    useState(false);

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        Controle Ambiental
      </Text>

      <Text style={styles.subtitle}>
        Central de prevenção de queimadas
      </Text>

      <View style={styles.iconContainer}>
        <MaterialIcons
          name="forest"
          size={80}
          color="#22C55E"
        />
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          Status do Sistema
        </Text>

        <Text style={styles.statusValue}>
          🟢 OPERANDO NORMALMENTE
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.redButton,

          {
            backgroundColor: alarme
              ? '#991B1B'
              : '#DC2626',
          },
        ]}

        onPress={() =>
          setAlarme(!alarme)
        }
      >
        <Text style={styles.buttonText}>
          {alarme
            ? '🔕 Desligar Alarme'
            : '🚨 Ativar Alarme'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.greenButton,

          {
            backgroundColor: irrigacao
              ? '#166534'
              : '#16A34A',
          },
        ]}

        onPress={() =>
          setIrrigacao(!irrigacao)
        }
      >
        <Text style={styles.buttonText}>
          {irrigacao
            ? '💧 Desligar Irrigação'
            : '💧 Ativar Irrigação'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.blueButton,

          {
            backgroundColor: ventilacao
              ? '#1D4ED8'
              : '#2563EB',
          },
        ]}

        onPress={() =>
          setVentilacao(!ventilacao)
        }
      >
        <Text style={styles.buttonText}>
          {ventilacao
            ? '🌬 Desligar Ventilação'
            : '🌬 Ativar Ventilação'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.emergency}
      >
        <Text style={styles.buttonText}>
          🚨 MODO EMERGÊNCIA
        </Text>
      </TouchableOpacity>

      <View style={styles.sliderContainer}>

        <Text style={styles.sliderText}>
          Sensibilidade do Sensor
        </Text>

        <Slider
          minimumValue={0}
          maximumValue={100}

          minimumTrackTintColor="#22C55E"
          maximumTrackTintColor="#475569"

          thumbTintColor="#22C55E"

          value={sensibilidade}

          onValueChange={(value) =>
            setSensibilidade(value)
          }
        />

        <Text style={styles.value}>
          {sensibilidade.toFixed(0)}%
        </Text>

      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Informações do Sistema
        </Text>

        <Text style={styles.infoText}>
          • Sensores ativos: 4
        </Text>

        <Text style={styles.infoText}>
          • Última fumaça detectada: 14:32
        </Text>

        <Text style={styles.infoText}>
          • Área monitorada: 2.4 km²
        </Text>

        <Text style={styles.infoText}>
          • Nível atual de risco: ALTO
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

  title: {
    color: '#22C55E',
    fontSize: 38,
    fontWeight: 'bold',
    marginTop: 60,
  },

  subtitle: {
    color: '#CBD5E1',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 25,
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },

  statusCard: {
    backgroundColor: '#1E293B',
    padding: 22,
    borderRadius: 22,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#334155',
  },

  statusTitle: {
    color: '#CBD5E1',
    fontSize: 18,
  },

  statusValue: {
    color: '#22C55E',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },

  redButton: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  greenButton: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  blueButton: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  emergency: {
    backgroundColor: '#7F1D1D',
    padding: 22,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#EF4444',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sliderContainer: {
    backgroundColor: '#1E293B',
    padding: 22,
    borderRadius: 22,
    marginBottom: 25,
  },

  sliderText: {
    color: '#CBD5E1',
    fontSize: 18,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: '#1E293B',
    padding: 22,
    borderRadius: 22,
    marginBottom: 50,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  infoText: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 10,
  },
});