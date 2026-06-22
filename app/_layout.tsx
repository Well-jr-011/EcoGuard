import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons
                name="home"
                size={26}
                color={focused ? '#22C55E' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="historico"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons
                name="history"
                size={26}
                color={focused ? '#22C55E' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />

      {/* BOTÃO CENTRAL PREMIUM */}
      <Tabs.Screen
        name="ia"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.aiButton}>
              <MaterialIcons name="smart-toy" size={30} color="#fff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="configuracoes"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons
                name="settings"
                size={26}
                color={focused ? '#22C55E' : '#94A3B8'}
              />
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
    bottom: 20,
    left: 20,
    right: 20,
    height: 75,
    backgroundColor: '#0F172A',
    borderRadius: 30,

    // sombra premium
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,

    borderTopWidth: 0,
  },

  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },

  activeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 15,
  },

  aiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',

    // efeito flutuante
    marginBottom: 25,
    shadowColor: '#22C55E',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
});