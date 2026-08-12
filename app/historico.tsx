import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../src/lib/supabase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';


const { width } = Dimensions.get('window');


interface Leitura {
  id: number;
  valor_fumaca: number;
  fogo: boolean;
  temperatura: number;
  umidade_solo: number;
  status: string;
  created_at: string;
}



export default function Historico() {


  const [leituras, setLeituras] =
    useState<Leitura[]>([]);


  const [loading, setLoading] =
    useState(true);


  const [telefoneSalvo, setTelefoneSalvo] =
    useState('');


  const [nomeSalvo, setNomeSalvo] =
    useState('');



  useEffect(() => {

    carregarLeituras();

    carregarDadosUsuario();

  }, []);




  async function carregarDadosUsuario() {

    const telefone =
      await AsyncStorage.getItem(
        '@EcoGuard:telefone'
      );


    const nome =
      await AsyncStorage.getItem(
        '@EcoGuard:nome'
      );


    if (telefone)
      setTelefoneSalvo(telefone);


    if (nome)
      setNomeSalvo(nome);

  }





  async function carregarLeituras() {


    const { data, error } =
      await supabase
        .from('leituras')
        .select('*')
        .order(
          'created_at',
          {
            ascending:false
          }
        )
        .limit(30);



    if (!error && data) {


      const dadosTratados =
        data.map((item:any)=>({

          id:item.id,

          valor_fumaca:
            item.valor_fumaca ??
            item.fumaca ??
            0,


          fogo:
            item.fogo ??
            false,


          temperatura:
            item.temperatura ??
            0,


          umidade_solo:
            item.umidade_solo ??
            0,


          status:
            item.status ??
            calcularStatus(
              item.valor_fumaca ?? 0,
              item.fogo ?? false,
              item.temperatura ?? 0,
              item.umidade_solo ?? 0
            ),


          created_at:
            item.created_at

        }));


      setLeituras(
        dadosTratados
      );

    }


    setLoading(false);

  }






  function calcularStatus(
    fumaca:number,
    fogo:boolean,
    temperatura:number,
    solo:number
  ){


    if(
      fogo ||
      fumaca >=70 ||
      temperatura >=60
    ){

      return 'CRÍTICO';

    }


    if(
      fumaca >=40 ||
      temperatura >=40 ||
      solo <=30
    ){

      return 'ATENÇÃO';

    }


    return 'SEGURO';

  }





  function corStatus(
    status:string
  ){


    if(status==='CRÍTICO')
      return '#EF4444';


    if(status==='ATENÇÃO')
      return '#F59E0B';


    return '#22C55E';

  }






  function exportarLaudoWhatsApp(){


    if(!telefoneSalvo){


      Alert.alert(
        'Telefone não configurado',
        'Cadastre um número de emergência nas configurações.'
      );


      return;

    }



    if(leituras.length===0){


      Alert.alert(
        'Sem dados',
        'Não existem leituras para gerar o laudo.'
      );


      return;

    }




    let relatorio =
`📋 *LAUDO TÉCNICO ECOGUARD*

👤 Responsável:
${nomeSalvo || 'Usuário'}

📡 Sistema:
Monitoramento Ambiental IoT

--------------------------------

`;



    leituras
      .slice(0,7)
      .forEach((item)=>{


        relatorio +=

`🕒 ${new Date(
item.created_at
).toLocaleString('pt-BR')}

🌫️ Fumaça:
${item.valor_fumaca}%

🔥 Fogo:
${item.fogo ? 'DETECTADO 🚨':'Normal'}

🌡️ Temperatura:
${item.temperatura}°C

🌱 Umidade Solo:
${item.umidade_solo}%

📊 Status:
${item.status}

--------------------------------

`;

      });



    relatorio +=

`Relatório gerado automaticamente pelo aplicativo EcoGuard.`;



    const numero =
      telefoneSalvo.replace(
        /\D/g,
        ''
      );



    Linking.openURL(

`whatsapp://send?phone=55${numero}&text=${encodeURIComponent(relatorio)}`

    )
    .catch(()=>{


      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp.'
      );


    });


  }

  if (loading) {

    return (

      <View style={styles.loading}>

        <ActivityIndicator
          size="large"
          color="#22C55E"
        />

      </View>

    );

  }



  return (

    <ScrollView

      style={styles.container}

      contentContainerStyle={{
        paddingBottom:120
      }}

      showsVerticalScrollIndicator={false}

    >


      <LinearGradient

        colors={[
          '#1E293B',
          '#0F172A',
          '#030712'
        ]}

        style={styles.headerCard}

      >

        <Text style={styles.titulo}>
          Histórico Ambiental
        </Text>


        <Text style={styles.subtitulo}>
          Registros completos dos sensores EcoGuard
        </Text>


      </LinearGradient>





      <TouchableOpacity

        onPress={exportarLaudoWhatsApp}

        activeOpacity={0.8}

        style={styles.exportContainer}

      >


        <LinearGradient

          colors={[
            '#FACC15',
            '#EAB308'
          ]}

          style={styles.exportButton}

        >


          <MaterialIcons

            name="description"

            size={22}

            color="#030712"

          />


          <Text style={styles.exportText}>

            Exportar Laudo Técnico WhatsApp

          </Text>


        </LinearGradient>


      </TouchableOpacity>





      <Text style={styles.secaoTitulo}>

        Últimas Leituras ({leituras.length})

      </Text>






      {
        leituras.map((item)=>(


          <View

            key={item.id}

            style={[
              styles.card,
              {
                borderLeftColor:
                  corStatus(item.status)
              }
            ]}

          >



            <View style={styles.cardHeader}>


              <View

                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                    corStatus(item.status)+'20'
                  }
                ]}

              >


                <MaterialIcons

                  name={
                    item.status === 'CRÍTICO'
                    ?
                    'warning'
                    :
                    item.status === 'ATENÇÃO'
                    ?
                    'report-problem'
                    :
                    'verified'
                  }

                  size={24}

                  color={
                    corStatus(item.status)
                  }

                />


              </View>




              <View style={styles.info}>


                <Text style={styles.statusText}>

                  {item.status}

                </Text>


                <Text style={styles.dataText}>

                  {
                    new Date(
                      item.created_at
                    )
                    .toLocaleString(
                      'pt-BR'
                    )
                  }

                </Text>


              </View>


            </View>





            <View style={styles.sensorGrid}>


              <View style={styles.sensorItem}>

                <MaterialIcons

                  name="cloud"

                  size={20}

                  color="#38BDF8"

                />

                <Text style={styles.sensorLabel}>
                  Fumaça
                </Text>

                <Text style={styles.sensorValue}>
                  {item.valor_fumaca}%
                </Text>

              </View>





              <View style={styles.sensorItem}>


                <MaterialIcons

                  name="local-fire-department"

                  size={20}

                  color="#EF4444"

                />


                <Text style={styles.sensorLabel}>
                  Fogo
                </Text>


                <Text style={styles.sensorValue}>

                  {
                    item.fogo
                    ?
                    'SIM'
                    :
                    'NÃO'
                  }

                </Text>


              </View>






              <View style={styles.sensorItem}>


                <MaterialIcons

                  name="thermostat"

                  size={20}

                  color="#F97316"

                />


                <Text style={styles.sensorLabel}>
                  Temperatura
                </Text>


                <Text style={styles.sensorValue}>

                  {item.temperatura}°C

                </Text>


              </View>






              <View style={styles.sensorItem}>


                <MaterialIcons

                  name="water-drop"

                  size={20}

                  color="#22C55E"

                />


                <Text style={styles.sensorLabel}>
                  Solo
                </Text>


                <Text style={styles.sensorValue}>

                  {item.umidade_solo}%

                </Text>


              </View>


            </View>


          </View>


        ))

      }


    </ScrollView>

  );

}



const styles = StyleSheet.create({


  container:{
    flex:1,
    backgroundColor:'#030712',
  },



  loading:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#030712'
  },



  headerCard:{

    width,

    paddingHorizontal:20,

    paddingTop:70,

    paddingBottom:35,

    borderBottomLeftRadius:30,

    borderBottomRightRadius:30,

  },



  titulo:{

    color:'#FFF',

    fontSize:32,

    fontWeight:'800',

  },



  subtitulo:{

    color:'#94A3B8',

    fontSize:15,

    marginTop:5,

  },



  exportContainer:{

    marginHorizontal:20,

    marginTop:-20,

    marginBottom:25,

  },



  exportButton:{

    padding:16,

    borderRadius:15,

    flexDirection:'row',

    alignItems:'center',

    justifyContent:'center',

  },



  exportText:{

    color:'#030712',

    fontSize:15,

    fontWeight:'bold',

    marginLeft:8,

  },



  secaoTitulo:{

    color:'#64748B',

    fontSize:12,

    fontWeight:'bold',

    letterSpacing:1.5,

    marginHorizontal:20,

    marginBottom:15,

  },



  card:{


    backgroundColor:'#0F172A',

    borderRadius:20,

    padding:18,

    marginHorizontal:20,

    marginBottom:14,

    borderWidth:1,

    borderColor:'#1E293B',

    borderLeftWidth:4,

  },



  cardHeader:{

    flexDirection:'row',

    alignItems:'center',

    marginBottom:15,

  },



  iconBox:{

    width:42,

    height:42,

    borderRadius:12,

    alignItems:'center',

    justifyContent:'center',

  },



  info:{

    marginLeft:12,

  },



  statusText:{

    color:'#FFF',

    fontSize:16,

    fontWeight:'bold',

  },



  dataText:{

    color:'#64748B',

    fontSize:12,

    marginTop:3,

  },



  sensorGrid:{

    flexDirection:'row',

    flexWrap:'wrap',

    justifyContent:'space-between',

  },



  sensorItem:{

    width:'48%',

    backgroundColor:'#020617',

    borderRadius:14,

    padding:12,

    marginBottom:10,

  },



  sensorLabel:{

    color:'#64748B',

    fontSize:11,

    marginTop:5,

  },



  sensorValue:{

    color:'#FFF',

    fontSize:18,

    fontWeight:'bold',

    marginTop:2,

  },


});