import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');


type HistoricoItem = {

  fumaca: number;

  fogo: boolean;

  temperatura: number;

  umidadeSolo: number;

  hora: string;

  status: string;

};



export default function Page() {


  // ==========================
  // LEITURAS DOS SENSORES
  // ==========================


  const [fumaca, setFumaca] =
    useState<number>(0);


  const [fogo, setFogo] =
    useState<boolean>(false);


  const [temperatura, setTemperatura] =
    useState<number>(0);


  const [umidadeSolo, setUmidadeSolo] =
    useState<number>(0);



  // ==========================
  // STATUS GERAL
  // ==========================


  const [status, setStatus] =
    useState<string>('CONECTANDO...');


  const [corStatus, setCorStatus] =
    useState<string>('#94A3B8');



  // ==========================
  // CONTROLE DO APP
  // ==========================


  const [loading, setLoading] =
    useState<boolean>(true);


  const [somAlarme, setSomAlarme] =
    useState<Audio.Sound | null>(null);


  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState<string>('Aguardando sinal...');


  const [historico, setHistorico] =
    useState<HistoricoItem[]>([]);



  const [arduinoOnline, setArduinoOnline] =
    useState<boolean>(false);



  // ==========================
  // DADOS DO USUÁRIO
  // ==========================


  const [nomeUsuario, setNomeUsuario] =
    useState<string>('Usuário');


  const [telefoneEmergencia, setTelefoneEmergencia] =
    useState<string>('');



  useFocusEffect(

    useCallback(() => {


      async function carregarDadosLocais() {


        const nomeSalvo =
          await AsyncStorage.getItem(
            '@EcoGuard:nome'
          );


        const telefoneSalvo =
          await AsyncStorage.getItem(
            '@EcoGuard:telefone'
          );



        setNomeUsuario(
          nomeSalvo || 'Usuário'
        );


        setTelefoneEmergencia(
          telefoneSalvo || ''
        );


      }


      carregarDadosLocais();


    }, [])

  );

// ==========================
// BUSCA DAS LEITURAS
// ==========================

useEffect(() => {


  async function buscarUltimaLeitura() {


    try {


      const { data, error } = await supabase

        .from('leituras')

        .select('*')

        .order('created_at', {
          ascending: false,
        })

        .limit(1)

        .single();



      if (error) {

        throw error;

      }



      if (data) {


        await processarNovaLeitura(

          Number(data.fumaca) || 0,

          Boolean(data.fogo),

          Number(data.temperatura) || 0,

          Number(data.umidade_solo) || 0,

          data.created_at

        );


        setArduinoOnline(true);


      }



    } catch (error) {


      console.log(
        'Erro ao buscar leitura:',
        error
      );


      setArduinoOnline(false);



    } finally {


      setLoading(false);


    }


  }



  buscarUltimaLeitura();




  const canalRealtime = supabase

    .channel('mudancas_leituras')

    .on(

      'postgres_changes' as any,


      {

        event: 'INSERT',

        schema: 'public',

        table: 'leituras',

      },


      async (payload: any) => {


        const novaLeitura =
          payload.new;



        setArduinoOnline(true);



        await processarNovaLeitura(

          Number(novaLeitura.fumaca) || 0,

          Boolean(novaLeitura.fogo),

          Number(novaLeitura.temperatura) || 0,

          Number(novaLeitura.umidade_solo) || 0,

          novaLeitura.created_at

        );


      }


    )

    .subscribe();




  return () => {


    supabase.removeChannel(
      canalRealtime
    );


    if (somAlarme) {


      somAlarme.unloadAsync();


    }


  };



}, []);



// ==========================
// CONTROLE DA SIRENE
// ==========================


async function gerenciarSireneFisica(

  ligar: boolean

) {


  try {


    if (ligar) {



      if (!somAlarme) {



        const { sound } =

          await Audio.Sound.createAsync(


            {

              uri:
              'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',

            },


            {

              shouldPlay: true,

              isLooping: true,

            }


          );



        setSomAlarme(sound);



      } else {



        await somAlarme.playAsync();



      }



    } else {



      if (somAlarme) {



        await somAlarme.stopAsync();



      }


    }



  } catch (e) {


    console.log(

      'Erro ao gerenciar áudio:',

      e

    );


  }


}

// ==========================
// PROCESSAMENTO DAS LEITURAS
// ==========================


async function processarNovaLeitura(

  valorFumaca: number,

  valorFogo: boolean,

  valorTemperatura: number,

  valorSolo: number,

  timestamp: string

) {


  const hora =

    new Date(timestamp)

      .toLocaleTimeString('pt-BR');



  let statusAtual = 'SEGURO';

  let col = '#22C55E';



  // ==========================
  // CÁLCULO DO STATUS GERAL
  // ==========================


  if (

    valorFogo ||

    valorFumaca >= 70 ||

    valorTemperatura >= 60

  ) {


    statusAtual = 'CRÍTICO';

    col = '#EF4444';


    await gerenciarSireneFisica(true);



  }


  else if (


    valorFumaca >= 40 ||

    valorTemperatura >= 40 ||

    valorSolo <= 30


  ) {


    statusAtual = 'ATENÇÃO';

    col = '#F59E0B';


    await gerenciarSireneFisica(false);



  }


  else {


    statusAtual = 'SEGURO';

    col = '#22C55E';


    await gerenciarSireneFisica(false);



  }



  // ==========================
  // ATUALIZA ESTADOS
  // ==========================


  setFumaca(valorFumaca);

  setFogo(valorFogo);

  setTemperatura(valorTemperatura);

  setUmidadeSolo(valorSolo);

  setStatus(statusAtual);

  setCorStatus(col);

  setUltimaAtualizacao(hora);

  setArduinoOnline(true);

// ==========================
// HISTÓRICO DAS ÚLTIMAS LEITURAS
// ==========================


setHistorico((anterior) => [

  {

    fumaca: valorFumaca,

    fogo: valorFogo,

    temperatura: valorTemperatura,

    umidadeSolo: valorSolo,

    hora,

    status: statusAtual,

  },


  ...anterior,


].slice(0, 5));




// ==========================
// NOTIFICAÇÃO
// ==========================


if (statusAtual === 'CRÍTICO') {


  await Haptics.notificationAsync(

    Haptics.NotificationFeedbackType.Error

  );



  await Notifications.scheduleNotificationAsync({


    content: {


      title: '🚨 ALERTA ECOGUARD',


      body:

        `🌫️ Fumaça: ${valorFumaca}% | ` +

        `🔥 Fogo: ${valorFogo ? 'DETECTADO' : 'Não detectado'} | ` +

        `🌡️ Temperatura: ${valorTemperatura}°C | ` +

        `🌱 Solo: ${valorSolo}%`,


      sound: true,


    },


    trigger: null,


  });

// ==========================
// NOTIFICAÇÃO
// ==========================

if (statusAtual === 'CRÍTICO') {


  await Haptics.notificationAsync(

    Haptics.NotificationFeedbackType.Error

  );



  await Notifications.scheduleNotificationAsync({


    content: {


      title: '🚨 ALERTA ECOGUARD',


      body:

        `🌫️ Fumaça: ${valorFumaca}% | ` +

        `🔥 Fogo: ${valorFogo ? 'DETECTADO' : 'Não detectado'} | ` +

        `🌡️ Temperatura: ${valorTemperatura}°C | ` +

        `🌱 Solo: ${valorSolo}%`,


      sound: true,


    },


    trigger: null,


  });


}


} // <-- FECHA processarNovaLeitura AQUI
  // ==========================
  // HISTÓRICO DAS LEITURAS
  // ==========================


  setHistorico((anterior) => [


    {

      fumaca: valorFumaca,

      fogo: valorFogo,

      temperatura: valorTemperatura,

      umidadeSolo: valorSolo,

      hora,

      status: statusAtual,


    },


    ...anterior,


  ].slice(0, 5));




  // ==========================
  // NOTIFICAÇÃO DE ALERTA
  // ==========================


  if (statusAtual === 'CRÍTICO') {


    await Haptics.notificationAsync(

      Haptics.NotificationFeedbackType.Error

    );



    await Notifications.scheduleNotificationAsync({


      content: {


        title: '🚨 ALERTA ECOGUARD',


        body:

          `🌫️ Fumaça: ${valorFumaca}% | ` +

          `🔥 Fogo: ${valorFogo ? 'DETECTADO' : 'Não detectado'} | ` +

          `🌡️ Temperatura: ${valorTemperatura}°C | ` +

          `🌱 Solo: ${valorSolo}%`,


        sound: true,


      },


      trigger: null,


    });


  }


}



// ==========================
// CONTROLE DE CARREGAMENTO
// ==========================


if (loading) {

  

  return (

    <View

      style={[

        styles.container,

        {

          justifyContent: 'center',

          alignItems: 'center',

        },

      ]}

    >


      <ActivityIndicator

        size="large"

        color="#22C55E"

      />


    </View>

  );


}



const isCritico =
  status === 'CRÍTICO';


// ==========================
// ALERTA VIA WHATSAPP
// ==========================

function dispararAlertaZap() {

  if (!telefoneEmergencia) {

    Alert.alert(
      'Telefone não configurado',
      'Cadastre um telefone de emergência.'
    );

    return;

  }


  const numeroLimpo =
    telefoneEmergencia.replace(/\D/g, '');


  const mensagem =
    `🚨 *ALERTA ECOGUARD* 🚨\n\n` +
    `Situação crítica detectada!\n\n` +
    `🌫️ Fumaça: ${fumaca}%\n` +
    `🔥 Fogo: ${fogo ? 'DETECTADO' : 'Não detectado'}\n` +
    `🌡️ Temperatura: ${temperatura}°C\n` +
    `🌱 Umidade Solo: ${umidadeSolo}%\n\n` +
    `👤 Usuário: ${nomeUsuario}\n` +
    `⏰ Horário: ${ultimaAtualizacao}`;


  Linking.openURL(
    `whatsapp://send?phone=55${numeroLimpo}&text=${encodeURIComponent(mensagem)}`
  )
  .catch(() => {

    Alert.alert(
      'Erro',
      'Não foi possível abrir o WhatsApp.'
    );

  });

}


// ==========================
// TELA
// ==========================

return (

  <ScrollView

    style={styles.container}

    contentContainerStyle={{
      paddingBottom: 140,
    }}

    showsVerticalScrollIndicator={false}

  >

    <LinearGradient

      colors={

        isCritico

          ? ['#991B1B', '#7F1D1D', '#030712']

          : ['#15803D', '#166534', '#030712']

      }

      style={styles.headerCard}

    >

      <Text style={styles.logo}>
        EcoGuard
      </Text>


      <Text style={styles.subtitle}>
        Olá, {nomeUsuario}! Sistema ativo.
      </Text>

    </LinearGradient>
    {/* CARD PRINCIPAL - SENSORES */}

    <View style={styles.sensorGrid}>


      <View style={styles.sensorMiniCard}>

        <MaterialIcons
          name="cloud"
          size={30}
          color="#38BDF8"
        />

        <Text style={styles.sensorMiniTitulo}>
          Fumaça
        </Text>

        <Text style={styles.sensorMiniValor}>
          {fumaca}%
        </Text>

      </View>



      <View style={styles.sensorMiniCard}>

        <MaterialIcons
          name={
            fogo
              ? "local-fire-department"
              : "verified"
          }
          size={30}
          color={
            fogo
              ? "#EF4444"
              : "#22C55E"
          }
        />


        <Text style={styles.sensorMiniTitulo}>
          Fogo
        </Text>


        <Text
          style={[
            styles.sensorMiniValor,
            {
              color:
                fogo
                  ? "#EF4444"
                  : "#22C55E",
            },
          ]}
        >

          {fogo ? "DETECTADO" : "NORMAL"}

        </Text>


      </View>




      <View style={styles.sensorMiniCard}>


        <MaterialIcons
          name="device-thermostat"
          size={30}
          color="#F97316"
        />


        <Text style={styles.sensorMiniTitulo}>
          Temperatura
        </Text>


        <Text style={styles.sensorMiniValor}>
          {temperatura}°C
        </Text>


      </View>




      <View style={styles.sensorMiniCard}>


        <MaterialIcons
          name="water-drop"
          size={30}
          color="#22C55E"
        />


        <Text style={styles.sensorMiniTitulo}>
          Umidade Solo
        </Text>


        <Text style={styles.sensorMiniValor}>
          {umidadeSolo}%
        </Text>


      </View>


    </View>

    {isCritico && (

<TouchableOpacity

  style={styles.whatsappButton}

  onPress={dispararAlertaZap}

  activeOpacity={0.8}

>

  <MaterialIcons

    name="send"

    size={22}

    color="#FFF"

  />


  <Text style={styles.buttonTextZap}>

    Disparar Socorro via WhatsApp

  </Text>


</TouchableOpacity>

)}



<View style={styles.updateCard}>


<MaterialIcons

  name="schedule"

  size={18}

  color="#64748B"

/>


<Text style={styles.updateText}>

  Último sinal do Arduino: {ultimaAtualizacao}

</Text>


</View>




<Text style={styles.secaoTitulo}>

Últimas Transmissões

</Text>




{historico.map((item, index) => (


<View

  key={index}

  style={[

    styles.historyRow,

    {

      borderLeftColor:

        item.status === "CRÍTICO"

          ? "#EF4444"

          : item.status === "ATENÇÃO"

          ? "#F59E0B"

          : "#22C55E",

    },

  ]}

>



  <View style={{ flex: 1 }}>


    <Text style={styles.historyValue}>

      🌫️ {item.fumaca}%   🔥 {item.fogo ? "SIM" : "NÃO"}

    </Text>



    <Text style={styles.historySensor}>

      🌡️ {item.temperatura}°C   🌱 {item.umidadeSolo}%

    </Text>



    <Text style={styles.historyTime}>

      {item.hora}

    </Text>



  </View>




  <Text

    style={[

      styles.historyStatus,

      {

        color:

          item.status === "CRÍTICO"

            ? "#EF4444"

            : item.status === "ATENÇÃO"

            ? "#F59E0B"

            : "#22C55E",

      },

    ]}

  >

    {item.status}

  </Text>



</View>


))}





<TouchableOpacity

style={styles.emergencyButton}

onPress={() => Linking.openURL("tel:193")}

activeOpacity={0.8}

>


<MaterialIcons

  name="call"

  size={22}

  color="#FFF"

/>


<Text style={styles.buttonText}>

  LIGAR BOMBEIROS (193)

</Text>


</TouchableOpacity>



</ScrollView>

);

}



const styles = StyleSheet.create({


container: {

flex: 1,

backgroundColor: "#030712",

},


headerCard: {

width,

paddingHorizontal: 20,

paddingTop: 70,

paddingBottom: 35,

borderBottomLeftRadius: 30,

borderBottomRightRadius: 30,

},


logo: {

color: "#FFF",

fontSize: 32,

fontWeight: "800",

},


subtitle: {

color: "#94A3B8",

marginTop: 4,

fontSize: 15,

},


mainCard: {

backgroundColor: "#0F172A",

marginTop: -20,

marginHorizontal: 20,

borderRadius: 24,

padding: 30,

alignItems: "center",

borderWidth: 1,

borderColor: "#1E293B",

overflow: "hidden",

},


respostaLinhaDestaque: {

position: "absolute",

top: 0,

left: 0,

right: 0,

height: 4,

},


sensorGrid: {

flexDirection: "row",

flexWrap: "wrap",

justifyContent: "space-between",

marginTop: 30,

width: "100%",

},


sensorMiniCard: {

width: "48%",

backgroundColor: "#111827",

borderRadius: 18,

paddingVertical: 18,

marginBottom: 12,

alignItems: "center",

borderWidth: 1,

borderColor: "#1E293B",

},


sensorMiniTitulo: {

color: "#94A3B8",

fontSize: 12,

marginTop: 8,

},


sensorMiniValor: {

color: "#FFF",

fontSize: 22,

fontWeight: "bold",

marginTop: 6,

},


whatsappButton: {

backgroundColor: "#25D366",

padding: 16,

borderRadius: 15,

alignItems: "center",

marginHorizontal: 20,

marginTop: 20,

flexDirection: "row",

justifyContent: "center",

},


buttonTextZap: {

color: "#FFF",

fontWeight: "bold",

marginLeft: 8,

fontSize: 16,

},


updateCard: {

marginTop: 20,

flexDirection: "row",

justifyContent: "center",

alignItems: "center",

},


updateText: {

color: "#64748B",

marginLeft: 6,

fontSize: 13,

},


secaoTitulo: {

color: "#64748B",

fontSize: 12,

fontWeight: "bold",

marginHorizontal: 20,

marginTop: 25,

marginBottom: 12,

},


historyRow: {

backgroundColor: "#0F172A",

borderRadius: 16,

padding: 16,

marginHorizontal: 20,

marginBottom: 10,

borderLeftWidth: 4,

flexDirection: "row",

justifyContent: "space-between",

borderColor: "#1E293B",

borderWidth: 1,

},


historyValue: {

color: "#FFF",

fontSize: 15,

fontWeight: "bold",

},


historySensor: {

color: "#CBD5E1",

fontSize: 13,

marginTop: 5,

},


historyTime: {

color: "#64748B",

marginTop: 6,

fontSize: 12,

},


historyStatus: {

fontWeight: "bold",

fontSize: 14,

alignSelf: "center",

},


emergencyButton: {

backgroundColor: "#B91C1C",

padding: 18,

borderRadius: 15,

marginHorizontal: 20,

marginTop: 25,

flexDirection: "row",

justifyContent: "center",

alignItems: "center",

},


buttonText: {

color: "#FFF",

fontWeight: "bold",

marginLeft: 8,

fontSize: 16,

},


});