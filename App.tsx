import { View, Text }
from 'react-native';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
      }}
    >
      <Text
        style={{
          color: 'lime',
          fontSize: 40,
          fontWeight: 'bold',
        }}
      >
        ECOGUARD
      </Text>
    </View>
  );
}