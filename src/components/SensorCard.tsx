import {
    View,
    Text,
    StyleSheet,
  } from 'react-native';
  
  interface Props {
    titulo: string;
    valor: string;
  }
  
  export default function SensorCard({
    titulo,
    valor,
  }: Props) {
  
    return (
      <View style={styles.card}>
        <Text style={styles.titulo}>
          {titulo}
        </Text>
  
        <Text style={styles.valor}>
          {valor}
        </Text>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#1E293B',
      padding: 20,
      borderRadius: 18,
      marginBottom: 15,
    },
  
    titulo: {
      color: '#CBD5E1',
      fontSize: 18,
    },
  
    valor: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: 'bold',
      marginTop: 10,
    },
  });