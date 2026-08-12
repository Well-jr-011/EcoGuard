import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* 1. TELA DE SENSOR (HOME) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons name="home" size={26} color={focused ? '#22C55E' : '#94A3B8'} />
            </View>
          ),
        }}
      />

      {/* 2. DASHBOARD GERAL (NOVA ABA ADICIONADA) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons name="bar-chart" size={26} color={focused ? '#22C55E' : '#94A3B8'} />
            </View>
          ),
        }}
      />

      {/* 3. HISTÓRICO */}
      <Tabs.Screen
        name="historico"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons name="history" size={26} color={focused ? '#22C55E' : '#94A3B8'} />
            </View>
          ),
        }}
      />

      {/* 4. GUIA IA CENTRAL */}
      <Tabs.Screen
        name="ia"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons name="smart-toy" size={26} color={focused ? '#22C55E' : '#94A3B8'} />
            </View>
          ),
        }}
      />

      {/* 5. CONFIGURAÇÕES */}
      <Tabs.Screen
        name="configuracoes"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons name="settings" size={26} color={focused ? '#22C55E' : '#94A3B8'} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, // Ajuste de altura responsivo
    left: 15,
    right: 15,
    height: 70,
    backgroundColor: '#0F172A',
    borderRadius: 25,
    borderTopWidth: 0,
    paddingBottom: 0,

    // Alinhamento horizontal simétrico adaptado para 5 botões
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    // Sombra premium tridimensional
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },

  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },

  activeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#1E293B', // Caixinha de destaque para o botão ativo
    borderRadius: 14,
  },
});
