import React, { Component } from 'react';
import { StyleSheet, View, Image, ScrollView} from 'react-native';
import { Input, Button, Text, Header, Card } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import axios from 'axios';
import { Profiler } from 'react';

class Login extends Component {

  constructor(props) {
      super(props);

      this.state = {
          image: null,
          imageBack: null,
          decalEnable: null,
          toggleCamera: false,
          sending: false,
          userId: null,
          headTitle: null,
          message: null
      }
  }

  async componentDidMount() {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
      const { statusCamera } = await Permissions.askAsync(Permissions.CAMERA)

      await AsyncStorage.getItem('userId').then(result => {
          this.setState({
              userId: result
          })
      })

      await axios({
        url: 'https://serene-cliffs-80945.herokuapp.com/api',
        method: 'POST',
        data: {
            query: `
              {
                Profile(userId: "${this.state.userId}"){
                  Decals
                }  
              }
            `
        }
      }).then(result => {
          this.setState({
            decalEnable: result.data.data.Profile.Decals
          })
      }).catch(err => {
          alert(err)
      })
  }

  componentWillUnmount() {
      this.setState({
          image: null,
          message: ''
      })
  }

  render() {
    const { image, imageBack, decalEnable } = this.state;
  
    return (
      <View style={styles.MainContainer}>
        <Header
          centerComponent={{ text: 'Decals', style: { color: '#fff' } }}
        />
          {decalEnable ?
            <ScrollView>
                <Card>
                  <Text h3>Take a picture of your front and back vehicle with plate no.</Text>
                </Card>

                <Card>
                  <Button 
                      title="Front Photo"
                      type="clear"
                      onPress={this._openCamera}
                  />

                  <View style={styles.containerRow}>
                  {image && <Image source={{ uri: 'data:image/jpg;base64,'+ image }} style={styles.picture} />} 
                  </View>
                </Card>

                <Card>
                  <Button 
                      title="Back Photo"
                      type="clear"
                      onPress={this._openCameraSecond}
                  />

                  <View style={styles.containerRow}>
                  {imageBack && <Image source={{ uri: 'data:image/jpg;base64,'+ imageBack }} style={styles.picture} />} 
                  </View>
                </Card>

                <Button
                    type='outline'
                    title="Submit"
                    onPress={()=>this._submitPost()}
                />
            </ScrollView>
          :
            <Text h3>Contact our agent to enable decals</Text>
          }
      </View>
    );
  }

  _getdate() {
      var d = new Date(),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();
  
      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;
  
      return [year, month, day].join('-');
  }

  _submitPost() {
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            mutation{
              SendDecals(newDecal: {
                Pic1: "${this.state.image}",
                Pic2: "${this.state.imageBack}",
                Date: "${this._getdate()}",
                UserId: "${this.state.userId}"
              }){
                _id
              }
            }
          `
      }
    }).then(result => {
        alert('Decals Sent')
    }).catch(err => {
        alert(err)
    })
  }

  _openCamera = async () => {
      let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4,3],
          base64: true,
          quality: 0
      })

      if (!result.cancelled) {
          this.setState({image: result.base64})
      }    
  }

  _openCameraSecond = async () => {
    let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4,3],
        base64: true,
        quality: 0
    })

    if (!result.cancelled) {
        this.setState({imageBack: result.base64})
    }    
}
}

const styles = StyleSheet.create({
  MainContainer: {
      flex: 1
  },
  ContentContainer: {
      flex: 1,
      justifyContent: 'center'
  },
  containerRow: {
      flexDirection: 'row'
  },
  picture: {
    width: 350,
    height: 300,
    resizeMode: 'cover',
  },
});

export default Login;