import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import Dashboard
from '../screens/Dashboard';

import Controle
from '../screens/Controle';

import IAScreen
from '../screens/IAScreen';

const Stack =
  createNativeStackNavigator();

export default function AppNavigator() {

  return (
    <NavigationContainer>

      <Stack.Navigator>

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