import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { MaterialIcons } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Page() {
  const [fumaca, setFumaca] = useState(35);

  const [historico, setHistorico] = useState<
    { valor: number; hora: string; status: string }[]
  >([]);

  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState(new Date().toLocaleTimeString());

  useEffect(() => {
    async function pedirPermissao() {
      if (Device.isDevice) {
        const { status } =
          await Notifications.getPermissionsAsync();

        let finalStatus = status;

        if (status !== 'granted') {
          const { status: newStatus } =
            await Notifications.requestPermissionsAsync();

          finalStatus = newStatus;
        }

        if (finalStatus !== 'granted') {
          alert('Permissão para notificações negada.');
        }
      }
    }

    pedirPermissao();

    const intervalo = setInterval(async () => {
      const valorSensor = Math.floor(Math.random() * 100);
      const hora = new Date().toLocaleTimeString();

      let statusAtual = 'SEGURO';

      if (valorSensor >= 70) statusAtual = 'CRÍTICO';
      else if (valorSensor >= 40) statusAtual = 'ATENÇÃO';

      setFumaca(valorSensor);
      setUltimaAtualizacao(hora);

      setHistorico((anterior) => [
        { valor: valorSensor, hora, status: statusAtual },
        ...anterior,
      ].slice(0, 5));

      await supabase.from('leituras').insert([
        {
          valor_fumaca: valorSensor,
          status: statusAtual,
        },
      ]);

      if (valorSensor >= 70) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 EcoGuard',
            body: `Nível crítico detectado (${valorSensor}%)`,
            sound: true,
          },
          trigger: null as any,
        });
      }
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  function ligar193() {
    Linking.openURL('tel:193');
  }

  let status = 'SEGURO';
  let corStatus = '#22C55E';

  if (fumaca >= 70) {
    status = 'CRÍTICO';
    corStatus = '#EF4444';
  } else if (fumaca >= 40) {
    status = 'ATENÇÃO';
    corStatus = '#F59E0B';
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>EcoGuard</Text>
        <Text style={styles.subtitle}>Monitoramento de Fumaça</Text>
      </View>

      {/* CARD PRINCIPAL */}
      <View style={styles.mainCard}>
        <MaterialIcons name="sensors" size={55} color={corStatus} />

        <Text style={styles.sensorLabel}>LEITURA ATUAL</Text>
        <Text style={styles.sensorValue}>{fumaca}</Text>
        <Text style={styles.percent}>%</Text>

        <Text style={[styles.status, { color: corStatus }]}>
          {status}
        </Text>
      </View>

      {/* ATUALIZAÇÃO */}
      <View style={styles.updateCard}>
        <MaterialIcons name="schedule" size={22} color="#94A3B8" />
        <Text style={styles.updateText}>
          Atualizado às {ultimaAtualizacao}
        </Text>
      </View>

      {/* HISTÓRICO */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Últimas Leituras</Text>

        {historico.map((item, index) => (
          <View key={index} style={styles.historyRow}>
            <Text style={styles.historyTime}>{item.hora}</Text>
            <Text style={styles.historyValue}>{item.valor}%</Text>
            <Text
              style={[
                styles.historyStatus,
                {
                  color:
                    item.status === 'CRÍTICO'
                      ? '#EF4444'
                      : item.status === 'ATENÇÃO'
                      ? '#F59E0B'
                      : '#22C55E',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        ))}
      </View>

      {/* BOTÃO EMERGÊNCIA */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={ligar193}
      >
        <MaterialIcons name="call" size={24} color="#FFF" />
        <Text style={styles.buttonText}>193 Emergência</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  content: {
    padding: 20,
    paddingBottom: 140, // 👈 ISSO resolve o botão escondido
  },

  header: {
    marginTop: 60,
  },

  logo: {
    color: '#22C55E',
    fontSize: 40,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#94A3B8',
    marginTop: 4,
  },

  mainCard: {
    backgroundColor: '#1E293B',
    marginTop: 30,
    borderRadius: 30,
    padding: 35,
    alignItems: 'center',
  },

  sensorLabel: {
    color: '#94A3B8',
    marginTop: 10,
  },

  sensorValue: {
    color: '#FFF',
    fontSize: 90,
    fontWeight: 'bold',
  },

  percent: {
    color: '#94A3B8',
  },

  status: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },

  updateCard: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  updateText: {
    color: '#FFF',
    marginLeft: 10,
  },

  legendCard: {
    marginTop: 20,
  },

  legendTitle: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
  },

  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },

  historyTime: { color: '#94A3B8' },
  historyValue: { color: '#FFF' },
  historyStatus: { fontWeight: 'bold' },

  emergencyButton: {
    backgroundColor: '#B91C1C',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 5,
  },
});