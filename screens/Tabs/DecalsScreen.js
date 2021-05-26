import React, { Component } from 'react';
import { StyleSheet, View, Image, ScrollView} from 'react-native';
import { Input, Button, Text, Header } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

class Login extends Component {

  constructor(props) {
      super(props);

      this.state = {
          image: null,
          imageBack: null,
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
  }

  componentWillUnmount() {
      this.setState({
          image: null,
          message: ''
      })
  }

  render() {
    const { image, imageBack } = this.state;
  
    return (
      <View style={styles.MainContainer}>
        <Header
          centerComponent={{ text: 'Decals', style: { color: '#fff' } }}
        />
          <ScrollView>
            <Text h3>Take a picture of your front vehicle with plate no.</Text>

            <Button 
                title="Front Photo"
                type="clear"
                onPress={this._openCamera}
            />

            <View style={styles.containerRow}>
              {image && <Image source={{ uri: 'data:image/jpg;base64,'+ image }} style={{ width: 400, height: 400 }} />} 
            </View>

            <Button 
                title="Back Photo"
                type="clear"
                onPress={this._openCameraSecond}
            />

            <View style={styles.containerRow}>
              {imageBack && <Image source={{ uri: 'data:image/jpg;base64,'+ imageBack }} style={{ width: 400, height: 400 }} />} 
            </View>

            <Button
                type='outline'
                title="Submit"
                onPress={()=>this._submitPost()}
            />
          </ScrollView>
      </View>
    );
  }

  _submitPost() {
      
  }

  _openCamera = async () => {
      let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4,3],
          base64: true
      })

      if (!result.cancelled) {
          this.setState({image: result.base64})
      }    
  }

  _openCameraSecond = async () => {
    let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4,3],
        base64: true
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
  }
});

export default Login;