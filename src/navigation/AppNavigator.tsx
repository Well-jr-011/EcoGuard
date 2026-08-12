import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🔄 Importações corrigidas com letras minúsculas para bater exatamente com os nomes no seu computador
import Dashboard from '../screens/dashboard';
import Controle from '../screens/controle';
import IAScreen from '../screens/iascreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer> 
      <Stack.Navigator
        screenOptions={{
          headerShown: false, 
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={Dashboard}
        />

        <Stack.Screen
          name="Controle"
          component={Controle}
        />

        <Stack.Screen
          name="IA"
          component={IAScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
