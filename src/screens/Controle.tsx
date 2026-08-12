import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

// 🔄 Caminho corrigido para funcionar perfeitamente dentro da pasta src/screens/
import { supabase } from '../lib/supabase';

export default function Controle() {
  const [alarme, setAlarme] = useState(false);
  const [irrigacao, setIrrigacao] = useState(false);
  const [ventilacao, setVentilacao] = useState(false);
  const [sensibilidade, setSensibilidade] = useState(50);
  const [loading, setLoading] = useState(true);

  // 1. Busca o estado atual dos comandos salvos no Supabase assim que a tela abre
  useEffect(() => {
    async function carregarComandoseletronicos() {
      try {
        const { data, error } = await supabase
          .from('controles')
          .select('*')
          .eq('id', 1) // Lê a linha fixa de controle
          .single();

        if (!error && data) {
          setAlarme(data.alarme);
          setIrrigacao(data.irrigacao);
          setVentilacao(data.ventilacao);
          setSensibilidade(data.sensibilidade);
        }
      } catch (err) {
        console.log('Erro ao carregar comandos em nuvem.');
      } finally {
        setLoading(false);
      }
    }
    carregarComandoseletronicos();
  }, []);

  // 📡 2. Função unificada para atualizar a nuvem imediatamente após os cliques
  async function enviarComandoNuvem(chave: string, valor: any) {
    try {
      const { error } = await supabase
        .from('controles')
        .update({ 
          [chave]: valor,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Erro de Conexão', 'Não foi possível sincronizar o comando com a nuvem.');
    }
  }

  // Funções de clique que alteram a tela E salvam no Supabase
  function alternarAlarme() {
    const novoValor = !alarme;
    setAlarme(novoValor);
    enviarComandoNuvem('alarme', novoValor);
  }

  function alternarIrrigacao() {
    const novoValor = !irrigacao;
    setIrrigacao(novoValor);
    enviarComandoNuvem('irrigacao', novoValor);
  }

  function alternarVentilacao() {
    const novoValor = !ventilacao;
    setVentilacao(novoValor);
    enviarComandoNuvem('ventilacao', novoValor);
  }

  function alterarSensibilidade(valor: number) {
    setSensibilidade(valor);
    enviarComandoNuvem('sensibilidade', Math.round(valor));
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Controle Ambiental</Text>
      <Text style={styles.subtitle}>Central de comando ativa em nuvem</Text>

      <View style={styles.iconContainer}>
        <MaterialIcons name="forest" size={80} color="#22C55E" />
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status do Hardware</Text>
        <Text style={[styles.statusValue, { color: alarme || irrigacao || ventilacao ? '#FACC15' : '#22C55E' }]}>
          {alarme || irrigacao || ventilacao ? '⚠️ TRANSMITINDO INTERVENÇÃO' : '🟢 SISTEMA ONLINE EM AGUARDO'}
        </Text>
      </View>

      {/* BOTÃO ALARME */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: alarme ? '#991B1B' : '#DC2626' }]}
        onPress={alternarAlarme}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {alarme ? '🔕 Desligar Alarme Físico' : '🚨 Ativar Alarme Físico'}
        </Text>
      </TouchableOpacity>

      {/* BOTÃO IRRIGAÇÃO */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: irrigacao ? '#166534' : '#16A34A' }]}
        onPress={alternarIrrigacao}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {irrigacao ? '💧 Desligar Aspersores' : '💧 Ativar Irrigação Forçada'}
        </Text>
      </TouchableOpacity>

      {/* BOTÃO VENTILAÇÃO */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: ventilacao ? '#1D4ED8' : '#2563EB' }]}
        onPress={alternarVentilacao}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {ventilacao ? '🌬 Desligar Exaustores' : '🌬 Ativar Ventilação Manual'}
        </Text>
      </TouchableOpacity>

      {/* CONTROLE DE SENSIBILIDADE */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderText}>Sensibilidade do Sensor Arduino</Text>
        <Slider
          minimumValue={10}
          maximumValue={100}
          minimumTrackTintColor="#22C55E"
          maximumTrackTintColor="#475569"
          thumbTintColor="#22C55E"
          value={sensibilidade}
          onSlidingComplete={alterarSensibilidade}
        />
        <Text style={styles.value}>{sensibilidade.toFixed(0)}%</Text>
      </View>

      {/* CARD INFORMATIVO */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Integração IoT EcoGuard</Text>
        <Text style={styles.infoText}>• Conexão ativa com o banco Supabase</Text>
        <Text style={styles.infoText}>• Resposta do hardware estimada em: 2 segundos</Text>
        <Text style={styles.infoText}>• Comandos prontos para acionamento de Relés</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: '#22C55E', fontSize: 34, fontWeight: 'bold', marginTop: 70 },
  subtitle: { color: '#CBD5E1', fontSize: 16, marginTop: 5, marginBottom: 25 },
  iconContainer: { alignItems: 'center', marginBottom: 25 },
  statusCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 22, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  statusTitle: { color: '#CBD5E1', fontSize: 16 },
  statusValue: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  button: { padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  sliderContainer: { backgroundColor: '#1E293B', padding: 22, borderRadius: 22, marginBottom: 25, marginTop: 10 },
  sliderText: { color: '#CBD5E1', fontSize: 16 },
  value: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  infoCard: { backgroundColor: '#1E293B', padding: 22, borderRadius: 22 },
  infoTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  infoText: { color: '#CBD5E1', fontSize: 15, marginBottom: 10 },
});
