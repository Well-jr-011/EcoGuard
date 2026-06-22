import {
    View,
    Text,
    StyleSheet,
  } from 'react-native';
  
  interface Props {
    alerta: boolean;
  }
  
  export default function AlertBanner({
    alerta,
  }: Props) {
  
    return (
      <View
        style={[
          styles.banner,
  
          {
            backgroundColor: alerta
              ? '#7F1D1D'
              : '#14532D',
          },
        ]}
      >
        <Text style={styles.text}>
          {alerta
            ? '🔥 FUMAÇA DETECTADA'
            : '✅ ÁREA SEGURA'}
        </Text>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    banner: {
      padding: 18,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: 'center',
    },
  
    text: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 18,
    },
  });