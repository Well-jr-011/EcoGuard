import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../src/lib/supabase';


const { width } = Dimensions.get('window');


export default function Dashboard() {


  const [loading, setLoading] = useState(true);

  const [nomeMesAtual, setNomeMesAtual] =
    useState('');


  const [mediaFumaca, setMediaFumaca] =
    useState(0);

  const [maiorTemperatura, setMaiorTemperatura] =
    useState(0);

  const [mediaUmidade, setMediaUmidade] =
    useState(0);

  const [deteccoesFogo, setDeteccoesFogo] =
    useState(0);

  const [alertasCriticos, setAlertasCriticos] =
    useState(0);

  const [alertasAtencao, setAlertasAtencao] =
    useState(0);



  useEffect(() => {


    async function carregarMetricas() {


      try {


        const agora = new Date();


        const primeiroDia =
          new Date(
            agora.getFullYear(),
            agora.getMonth(),
            1
          ).toISOString();



        const nomeMes =
          agora.toLocaleString(
            'pt-BR',
            {
              month: 'long'
            }
          );


        setNomeMesAtual(
          nomeMes.toUpperCase()
        );



        const { data, error } =
          await supabase

            .from('leituras')

            .select(
              `
              fumaca,
              fogo,
              temperatura,
              umidade_solo,
              status,
              created_at
              `
            )

            .gte(
              'created_at',
              primeiroDia
            )

            .order(
              'created_at',
              {
                ascending:false
              }
            );




        if (
          !error &&
          data &&
          data.length > 0
        ) {



          let somaFumaca = 0;

          let somaUmidade = 0;

          let maiorTemp = 0;

          let fogoDetectado = 0;

          let criticos = 0;

          let atencao = 0;



          data.forEach((item) => {



            somaFumaca +=
              Number(item.fumaca || 0);



            somaUmidade +=
              Number(item.umidade_solo || 0);



            if(
              Number(item.temperatura || 0)
              >
              maiorTemp
            ){

              maiorTemp =
                Number(item.temperatura);

            }



            if(item.fogo === true){

              fogoDetectado++;

            }



            if(
              item.status === 'CRÍTICO'
            ){

              criticos++;

            }


            else if(
              item.status === 'ATENÇÃO'
            ){

              atencao++;

            }


          });




          setMediaFumaca(
            Math.round(
              somaFumaca / data.length
            )
          );



          setMediaUmidade(
            Math.round(
              somaUmidade / data.length
            )
          );



          setMaiorTemperatura(
            maiorTemp
          );



          setDeteccoesFogo(
            fogoDetectado
          );



          setAlertasCriticos(
            criticos
          );


          setAlertasAtencao(
            atencao
          );



        }


      }


      catch(error){

        console.log(
          'Erro ao carregar dashboard:',
          error
        );

      }


      finally{

        setLoading(false);

      }


    }



    carregarMetricas();


  }, []);




  if(loading){


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
        paddingBottom:140
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

        <Text style={styles.logo}>

          Dashboard EcoGuard

        </Text>


        <Text style={styles.subtitle}>

          Métricas de {nomeMesAtual}

        </Text>


      </LinearGradient>






      <Text style={styles.sectionTitle}>

        Monitoramento mensal

      </Text>






      <View style={styles.grid}>


        <Card

          icon="cloud"

          title="Média Fumaça"

          value={`${mediaFumaca}%`}

        />



        <Card

          icon="local-fire-department"

          title="Detecções de Fogo"

          value={String(deteccoesFogo)}

        />



      </View>






      <View style={styles.grid}>


        <Card

          icon="thermostat"

          title="Maior Temperatura"

          value={`${maiorTemperatura}°C`}

        />



        <Card

          icon="water-drop"

          title="Média Solo"

          value={`${mediaUmidade}%`}

        />



      </View>






      <View style={styles.grid}>


        <Card

          icon="warning"

          title="Alertas Críticos"

          value={String(alertasCriticos)}

        />



        <Card

          icon="report-problem"

          title="Atenção"

          value={String(alertasAtencao)}

        />


      </View>



    </ScrollView>

  );

}



function Card({

  icon,

  title,

  value

}:{

  icon:any;

  title:string;

  value:string;

}){


  return (

    <View style={styles.card}>


      <View style={styles.iconBox}>


        <MaterialIcons

          name={icon}

          size={24}

          color="#22C55E"

        />


      </View>



      <Text style={styles.cardTitle}>

        {title}

      </Text>



      <Text style={styles.cardValue}>

        {value}

      </Text>



    </View>

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

    backgroundColor:'#030712',

  },


  headerCard:{

    width,

    paddingHorizontal:20,

    paddingTop:70,

    paddingBottom:40,

    borderBottomLeftRadius:30,

    borderBottomRightRadius:30,

  },


  logo:{

    color:'#FFF',

    fontSize:32,

    fontWeight:'800',

  },


  subtitle:{

    color:'#94A3B8',

    marginTop:8,

    fontSize:15,

  },


  sectionTitle:{

    color:'#64748B',

    marginHorizontal:20,

    marginTop:25,

    marginBottom:15,

    fontSize:12,

    fontWeight:'bold',

    letterSpacing:1.5,

  },


  grid:{

    flexDirection:'row',

    marginHorizontal:20,

    gap:12,

    marginBottom:12,

  },


  card:{

    flex:1,

    backgroundColor:'#0F172A',

    borderRadius:20,

    padding:18,

    borderWidth:1,

    borderColor:'#1E293B',

  },


  iconBox:{

    width:40,

    height:40,

    borderRadius:12,

    backgroundColor:'#1E293B',

    justifyContent:'center',

    alignItems:'center',

    marginBottom:12,

  },


  cardTitle:{

    color:'#64748B',

    fontSize:12,

    fontWeight:'600',

  },


  cardValue:{

    color:'#FFF',

    fontSize:24,

    fontWeight:'bold',

    marginTop:5,

  },


});