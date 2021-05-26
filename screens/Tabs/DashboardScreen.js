import React, { Component } from 'react';
import { StyleSheet, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EditScreenInfo from '../../components/EditScreenInfo';
import { View } from '../../components/Themed';
import { Card, Button, Icon, Text, Badge } from 'react-native-elements';
import {NavigationApps,actions,googleMapsTravelModes} from "react-native-navigation-apps";
import Geocoder from 'react-native-geocoding';
import Geofence from 'react-native-expo-geofence';
import * as Location from 'expo-location';
import { Permissions } from 'expo';
import axios from 'axios';

export default class TabOneScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: null,
      allRequest: [],
      fencedRequest: [],
      currentLocation: {
        longitude: 'unknown', //Initial Longitude
        latitude: 'unknown', //Initial Latitude
      },
      loading: true
    }
  }

  componentDidMount = async () => {
    await AsyncStorage.getItem('userId').then(result => {
      result ? this.setState({ userId: result }) : this.props.navigation.navigate('Login');
    })

    await navigator.geolocation.getCurrentPosition(
      //Will give you the current location
      position => {
        const currentLongitude = JSON.stringify(position.coords.longitude);
        //getting the Longitude from the location json

        const currentLatitude = JSON.stringify(position.coords.latitude);
        //getting the Latitude from the location json

        this.setState({ 
          currentLocation: {
            latitude: currentLatitude,
            longitude: currentLongitude
          }
        });

        axios({
          url: 'https://serene-cliffs-80945.herokuapp.com/api',
          method: 'POST',
          data: {
              query: `
                {
                  AllTransactions{
                    _id
                    UserId{
                      FName
                      LName
                      Email
                    }
                    PickAddress
                    DropAddress
                    DropLat
                    DropLong
                    PickLat
                    PickLong
                    HubLocated
                    Notes
                    Status
                  }
                }
              `
          }
        }).then(result => {
            result.data.data.AllTransactions.reverse().map(res => {
              
              var maxDistanceInKM = 10; // 500m distance
              // startPoint - center of perimeter
              // points - array of points
              // maxDistanceInKM - max point distance from startPoint in KM's
              // result - array of points inside the max distance
              var result = Geofence.filterByProximity(this.state.currentLocation, [{latitude: res.PickLat, longitude: res.PickLong}], maxDistanceInKM);
              console.log(result)

              result[0] ? 
                this.setState({
                  allRequest: [...this.state.allRequest, {
                    UserId: res.UserId,
                    DropLat: res.DropLat,
                    DropLong: res.DropLong,
                    DropAddress: res.DropAddress,
                    PickLat: res.PickLat,
                    PickLong: res.PickLong,
                    HubLocated: res.HubLocated,
                    Notes: res.Notes,
                    Status: res.Status,
                    _id: res._id
                  }],
                  loading: false
                })
              : null
            })
        }).catch(err => {
            alert(err)
        })
      },
      error => alert(error.message),
      { enableHighAccuracy: true, timeout: 1000, maximumAge: 1000 }
    );

  }

  _reload = () => {
    this.setState({
      allRequest: [],
      loading: true
    });

    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            {
              AllTransactions{
                _id
                UserId{
                  FName
                  LName
                  Email
                }
                PickAddress
                DropAddress
                DropLat
                DropLong
                PickLat
                PickLong
                HubLocated
                Notes
                Status
              }
            }
          `
      }
    }).then(result => { 
        result.data.data.AllTransactions.reverse().map(res => {
                
          var maxDistanceInKM = 10; // 500m distance
          // startPoint - center of perimeter
          // points - array of points
          // maxDistanceInKM - max point distance from startPoint in KM's
          // result - array of points inside the max distance
          var result = Geofence.filterByProximity(this.state.currentLocation, [{latitude: res.PickLat, longitude: res.PickLong}], maxDistanceInKM);

          result[0] ? 
            this.setState({
              allRequest: [...this.state.allRequest, {
                UserId: res.UserId,
                DropLat: res.DropLat,
                DropLong: res.DropLong,
                DropAddress: res.DropAddress,
                PickLat: res.PickLat,
                PickLong: res.PickLong,
                HubLocated: res.HubLocated,
                Notes: res.Notes,
                Status: res.Status,
                _id: res._id
              }],
              loading: false
            })
          : null
        })
    }).catch(err => {
        alert(err)
    })
  }

  _accept = (id) => {
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            mutation {
              EditStatus(account: "${id}", status: "Accepted", rider: "${this.state.userId}"){
                Status
              }  
            }
          `
      }
    }).then(result => {
        this._reload()
    }).catch(err => {
        alert(err)
    })
  }

  _finishTrip = (id) => {
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            mutation {
              EditStatus(account: "${id}", status: "Completed"){
                Status
              }  
            }
          `
      }
    }).then(result => {
        this._reload()
    }).catch(err => {
        alert(err)
    })
  }

  render () {

    return (
      <View style={styles.container}>
        {
            this.state.loading ? 
              <Card><ActivityIndicator></ActivityIndicator></Card> 
            :
              <View>
                <Button
                  title='refresh'
                  onPress={() => this._reload()}
                />
                <FlatList
                  style={{ paddingBottom: 10 }}
                  data={this.state.allRequest}
                  renderItem={({item}) => 
                      <Card containerStyle={styles.Cards}>
                        <Card.Title><Text h1>{ item.UserId.FName } { item.UserId.LName }</Text> {<Text>{item.Status}</Text>}</Card.Title>
                          <Card.Divider/>
                          {/* <Text style={{marginBottom: 10, color: 'black'}}>{item.HubLocated}</Text> */}
                          {/* <Text style={{marginBottom: 10, color: 'black'}}>{JSON.stringify(item)}</Text> */}
                          <Text h4 style={{ color: 'black'}}>Hub: {item.HubLocated}</Text>
                          <Text h4 style={{ color: 'black'}}>Email: {item.UserId.Email}</Text>
                          <Text h4 style={{ color: 'black'}}>Extra Notes: {item.Notes == "null" ? "No extra notes" : item.Notes}</Text>

                          {item.Status == 'Accepted' ?
                              <Card>
                                <Text style={{marginBottom: 10, color: 'black'}}>{item.PickAddress}</Text>
                                <NavigationApps
                                    iconSize={50}
                                    row
                                    address='some default address to navigate' // address to navigate by for all apps 
                                    waze={{lat: item.PickLat, lon: item.PickLong, action: actions.navigateByAddress}} // specific settings for waze
                                />
                                <Text style={{marginBottom: 10, color: 'black'}}>{item.DropAddress}</Text>
                                <NavigationApps
                                    iconSize={50}
                                    row
                                    address='some default address to navigate' // address to navigate by for all apps 
                                    waze={{address: item.DropAddress, lat: item.DropLat, lon: item.DropLong, action: actions.navigateByAddress}} // specific settings for waze
                                />
                              </Card>
                            :
                              null
                          }

                          {
                            item.Status == 'Pending' ?
                              <Button
                                title='Accept'
                                onPress={() => this._accept(item._id)}
                              />
                              :
                                item.Status == 'Accepted' ?
                                  <Button
                                    title='Finish Trip'
                                    onPress={() => this._finishTrip(item._id)}
                                  />
                                : null
                          }
                      </Card>
                  }
                />
              </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
