import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';

export default function Historico() {
  const [leituras, setLeituras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarLeituras();
  }, []);

  async function carregarLeituras() {
    const { data, error } = await supabase
      .from('leituras')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLeituras(data);
    }

    setLoading(false);
  }

  function corStatus(status: string) {
    if (status === 'CRÍTICO') return '#EF4444';
    if (status === 'ATENÇÃO') return '#F59E0B';
    return '#22C55E';
  }

  function iconeStatus(status: string) {
    if (status === 'CRÍTICO') return 'warning';
    if (status === 'ATENÇÃO') return 'report-problem';
    return 'verified';
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.titulo}>Histórico de Leituras</Text>

      <Text style={styles.subtitulo}>
        Dados registrados no banco
      </Text>

      {leituras.map((item) => (
        <View
          key={item.id}
          style={[
            styles.card,
            { borderLeftColor: corStatus(item.status) },
          ]}
        >
          <MaterialIcons
            name={iconeStatus(item.status) as any}
            size={32}
            color={corStatus(item.status)}
          />

          <View style={styles.info}>
            <Text style={styles.valor}>
              {item.valor_fumaca}%
            </Text>

            <Text style={styles.statusText}>
              {item.status}
            </Text>
          </View>

          <Text style={styles.hora}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },

  titulo: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 70,
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 5,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderLeftWidth: 5,
  },

  info: {
    flex: 1,
    marginLeft: 15,
  },

  valor: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },

  statusText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },

  hora: {
    color: '#CBD5E1',
    fontSize: 12,
    maxWidth: 120,
    textAlign: 'right',
  },
});