import React, { Component } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Input, Card } from 'react-native-elements';

import axios from 'axios';

class Login extends Component {
    constructor(props){
        super(props);
        this.state = {
            username: '',
            password: '',
            loading: false
        }
    }

    componentDidMount = async () => {
        await AsyncStorage.getItem('userId').then(result => {
          result ? this.props.navigation.navigate('Root') : null
        })
    }

    render() { 
        const { 
            username, 
            password,
            loading
        } = this.state;

        return ( 
            <View style={styles.container}>
                {
                    loading ? 
                        <Card><ActivityIndicator></ActivityIndicator></Card> 
                    : 
                        <View>
                            <Input
                                label="Username"
                                onChangeText={(username) => this.setState({username: username})}
                                placeholder="Username"
                                value={username}
                            />

                            <Input
                                label="Password"
                                onChangeText={(password) => this.setState({password: password})}
                                placeholder="Password"
                                secureTextEntry
                                value={password}
                            />

                            <Button
                                buttonStyle={{backgroundColor: '#e64343'}}
                                title="Login"
                                onPress={this._signin}
                            />
                            <Button
                                type="clear"
                                title="SignUp"
                                onPress={() => this.props.navigation.navigate('Registration')}
                            />
                        </View>
                }
            </View>
        );
    }

    _signin = async () => {
        await this.setState({
            loading: true
        });

        await axios({
            method: 'POST',
            url: 'https://serene-cliffs-80945.herokuapp.com/api',
            data: {
                query: `
                    {
                        login( Username: "${this.state.username}" Password: "${this.state.password}"){
                            userId
                            token
                            tokenExpiration
                            userType
                        }
                    }
                `
            }
        }).then(result => {
            AsyncStorage.setItem('userId', result.data.data.login.userId);
            AsyncStorage.setItem('userType', result.data.data.login.userType);

            this.props.navigation.navigate('Root');
        }).catch(err => {
                this.setState({
                    loading: false
                });
                alert(err)
            }
        );
    }
}
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        margin: 15
    },
    input: {
        borderBottomColor: "black",
        borderBottomWidth: 1
    }
})

export default Login;