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
        tabBarItemStyle: styles.tabItem,

        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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

      {/* LEVANTAMENTO */}
      <Tabs.Screen
        name="levantamento"
        options={{
          title: 'Levantamento',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons
                name="assignment"
                size={26}
                color={focused ? '#22C55E' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />

      {/* HISTÓRICO */}
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
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

      {/* IA */}
      <Tabs.Screen
        name="ia"
        options={{
          title: 'IA',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : styles.icon}>
              <MaterialIcons
                name="smart-toy"
                size={26}
                color={focused ? '#22C55E' : '#94A3B8'}
              />
            </View>
          ),
        }}
      />

      {/* CONFIGURAÇÕES */}
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
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

      {/* DASHBOARD — NÃO APARECE NAS ABAS */}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',

    left: 12,
    right: 12,

    bottom: Platform.OS === 'ios' ? 25 : 18,

    height: 68,

    backgroundColor: '#0F172A',

    borderRadius: 22,

    borderTopWidth: 0,

    paddingHorizontal: 6,
    paddingVertical: 5,

    margin: 0,

    elevation: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  tabItem: {
    flex: 1,

    height: 58,

    alignItems: 'center',
    justifyContent: 'center',

    margin: 0,
    padding: 0,
  },

  icon: {
    width: 48,
    height: 48,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,
  },

  activeIcon: {
    width: 48,
    height: 48,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#1E293B',

    borderRadius: 15,
  },
});